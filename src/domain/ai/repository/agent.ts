import { z } from "zod";
import { agent, agentInputEvent, agentOutputEvent, agentToolCallResultEvent } from "@llamaindex/workflow";
import { openai } from "@llamaindex/openai";
import { tool } from "llamaindex";
import HttpClient from "@/clients/http/HttpClient";


const httpClient = new HttpClient({
    baseUrl: process.env.DATA_API_URL,
    headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DATA_API_TOKEN}`,
    },
});

enum EcosystemEnum {
    near = "NEAR",
    openbuild = "OpenBuild",
    starknet = "Starknet",
    all = "ALL",
}

function matchEcosystem(ecosystem: string): string {
    const lower = ecosystem.toLowerCase();
    const EcosystemKeys = Object.keys(EcosystemEnum) as (keyof typeof EcosystemEnum)[];
    const isValidKey = EcosystemKeys.includes(lower as keyof typeof EcosystemEnum);

    if (isValidKey) {
        return EcosystemEnum[lower as keyof typeof EcosystemEnum];
    } else {
        return EcosystemEnum.all;
    }
}


async function countRepositories({ ecosystem = "all" }: { ecosystem?: string } = {}): Promise<any> {
    const ecoName = matchEcosystem(ecosystem);
    const res = await httpClient.get("/v1/repos/total", { params: { eco_name: ecoName } });
    return res.data;
}

async function countContributors(
    { ecosystem = "all", scope = "all" }: { ecosystem?: string; scope?: string } = {}
): Promise<any> {
    const ecoName = matchEcosystem(ecosystem);
    const scopeParam = scope.toLowerCase() === "core" ? "Core" : "ALL";
    const res = await httpClient.get("/v1/actors/total", {
        params: { eco_name: ecoName, scope: scopeParam },
    });
    return res.data;
}

async function countEcosystemAmount(): Promise<any> {
    const res = await httpClient.get("/v1/ecosystems/total");
    return res.data;
}

async function countRecentContributors(
    { ecosystem = "all", period = "week" }: { ecosystem?: string; period?: string } = {}
): Promise<any> {
    const ecoName = matchEcosystem(ecosystem);
    const periodParam = period.toLowerCase() === "month" ? "month" : "week";
    const res = await httpClient.get("/v1/actors/total/date", {
        params: { eco_name: ecoName, period: periodParam },
    });
    return res.data;
}

async function rankEcosystems(): Promise<any> {
    const res = await httpClient.get("/v1/ecosystems/top");
    return res.data;
}

async function rankRepositories({ ecosystem = "all" }: { ecosystem?: string } = {}): Promise<any> {
    const ecoName = matchEcosystem(ecosystem);
    const res = await httpClient.get("/v1/repos/top", { params: { eco_name: ecoName } });
    return res.data;
}

async function rankContributors({ ecosystem = "all" }: { ecosystem?: string } = {}): Promise<any> {
    const ecoName = matchEcosystem(ecosystem);
    const res = await httpClient.get("/v1/actors/top", { params: { eco_name: ecoName } });
    return res.data;
}

const countRepositoriesTool = tool(countRepositories, {
    name: "countRepositories",
    description: "Count the total number of repositories in a specified ecosystem.",
    parameters: z.object({
        ecosystem: z.string({
            description: "The ecosystem to query. Valid options are ['NEAR', 'OpenBuild', 'Starknet', 'all'].",
        }),
    }),
});

const countContributorsTool = tool(countContributors, {
    name: "countContributors",
    description: "Count the total number of contributors in a specified ecosystem and scope.",
    parameters: z.object({
        ecosystem: z.string({
            description: "The ecosystem to query. Valid options are ['NEAR', 'OpenBuild', 'Starknet', 'all'].",
        }),
        scope: z.string({
            description: "The scope of contributors to count. Valid options are ['core', 'all']."
        }),
    }),
});

const countEcosystemAmountTool = tool(countEcosystemAmount, {
    name: "countEcosystemAmount",
    description: "Count the total number of ecosystems.",
    parameters: z.object({}),
});

const countRecentContributorsTool = tool(countRecentContributors, {
    name: "countRecentContributors",
    description: "Count recent contributors in a specified ecosystem and time period.",
    parameters: z.object({
        ecosystem: z.string({
            description: "The ecosystem to query. Valid options are ['NEAR', 'OpenBuild', 'Starknet', 'all'].",
        }),
        period: z.string({
            description: "The time period to consider. Valid options are ['week', 'month']."
        }),
    }),
});

const rankEcosystemsTool = tool(rankEcosystems, {
    name: "rankEcosystems",
    description: "Rank ecosystems based on some criteria.",
    parameters: z.object({}),
});

const rankRepositoriesTool = tool(rankRepositories, {
    name: "rankRepositories",
    description: "Rank repositories within a specified ecosystem.",
    parameters: z.object({
        ecosystem: z.string({
            description: "The ecosystem to query. Valid options are ['NEAR', 'OpenBuild', 'Starknet', 'all'].",
        }),
    }),
});

const rankContributorsTool = tool(rankContributors, {
    name: "rankContributors",
    description: "Rank contributors within a specified ecosystem.",
    parameters: z.object({
        ecosystem: z.string({
            description: "The ecosystem to query. Valid options are ['NEAR', 'OpenBuild', 'Starknet', 'all'].",
        }),
    }),
});

const llm = openai({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
    model: "gpt-4o-mini",
});

const tools = [
    countRepositoriesTool,
    countContributorsTool,
    countEcosystemAmountTool,
    countRecentContributorsTool,
    rankEcosystemsTool,
    rankRepositoriesTool,
    rankContributorsTool,
];

const myAgent = agent({ llm: llm, tools: tools });

async function chatWithAgent(query: string) {
    // const stream = myAgent.runStream(query);
    // for await (const event of stream) {
    //     if (agentInputEvent.include(event)) {
    //         console.log("LLM INPUT:", event.data.input);
    //     } else if (agentOutputEvent.include(event)) {
    //         console.log("LLM OUTPUT:", event.data.response);
    //     } else if (agentToolCallResultEvent.include(event)) {
    //         console.log("TOOL CALL NAME:", event.data.toolName, ', KWARGS:', event.data.toolKwargs, ', RESULT:', event.data.toolOutput.result);
    //     }
    // }
    const result = await myAgent.run(query);
    return result.data;
}

export { chatWithAgent };

import dotenv from "dotenv";
import { z } from "zod";
import { agent, agentInputEvent, agentOutputEvent, agentToolCallResultEvent } from "@llamaindex/workflow";
import { openai } from "@llamaindex/openai";
import { tool } from "llamaindex";

dotenv.config();

enum EcosystemEnum {
    near = "NEAR",
    openbuild = "OpenBuild",
    starknet = "Starknet",
    all = "ALL",
}

function matchEcosystem(ecosystem: string): string {
    const lower = ecosystem.toLowerCase();
    Object.entries(EcosystemEnum).forEach(([key, value]) => {
        if (key === lower) {
            return value;
        }
    });
    return EcosystemEnum.all;
}

const options = {
    method: "GET",
    headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DATA_API_TOKEN}`,
    },
};

async function countRepositories({ ecosystem = "all" }: { ecosystem?: string } = {}): Promise<any> {
    const ecoName = matchEcosystem(ecosystem);
    const url = `https://api.web3insights.app/v1/repos/total?eco_name=${ecoName}`;
    const response = await fetch(url, options);
    return await response.json();
}

async function countContributors(
    { ecosystem = "all", scope = "all" }: { ecosystem?: string; scope?: string } = {}
): Promise<any> {
    const ecoName = matchEcosystem(ecosystem);
    const scopeParam = scope.toLowerCase() === "core" ? "Core" : "ALL";
    const url = `https://api.web3insights.app/v1/actors/total?eco_name=${ecoName}&scope=${scopeParam}`;
    const response = await fetch(url, options);
    return await response.json();
}

async function countEcosystemAmount(): Promise<any> {
    const url = `https://api.web3insights.app/v1/ecosystems/total`;
    const response = await fetch(url, options);
    return await response.json();
}

async function countRecentContributors(
    { ecosystem = "all", period = "week" }: { ecosystem?: string; period?: string } = {}
): Promise<any> {
    const ecoName = matchEcosystem(ecosystem);
    const periodParam = period.toLowerCase() === "month" ? "month" : "week";
    const url = `https://api.web3insights.app/v1/actors/total/date?eco_name=${ecoName}&period=${periodParam}`;
    const response = await fetch(url, options);
    return await response.json();
}

async function rankEcosystems(): Promise<any> {
    const url = `https://api.web3insights.app/v1/ecosystems/top`;
    const response = await fetch(url, options);
    return await response.json();
}

async function rankRepositories({ ecosystem = "all" }: { ecosystem?: string } = {}): Promise<any> {
    const ecoName = matchEcosystem(ecosystem);
    const url = `https://api.web3insights.app/v1/repos/top?eco_name=${ecoName}`;
    const response = await fetch(url, options);
    return await response.json();
}

async function rankContributors({ ecosystem = "all" }: { ecosystem?: string } = {}): Promise<any> {
    const ecoName = matchEcosystem(ecosystem);
    const url = `https://api.web3insights.app/v1/actors/top?eco_name=${ecoName}`;
    const response = await fetch(url, options);
    return await response.json();
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
    model: 'gpt-4o-mini',
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

async function main() {
    const testQueries = [
        "How many repositories are in the NEAR ecosystem?",
        "What's the total number of contributors in Starknet with core scope?",
        "How many ecosystems are currently tracked?",
        "Show repository rankings for OpenBuild.",
        "Who are the top contributors in NEAR?",
        "Count recent contributors in Starknet over the last month.",
        "List the top 5 ecosystems by activity.",
    ];

    for (const query of testQueries) {
        const stream = myAgent.runStream(query);
        for await (const event of stream) {
            if (agentInputEvent.include(event)) {
                console.log("LLM INPUT:", event.data.input);
            } else if (agentOutputEvent.include(event)) {
                console.log("LLM OUTPUT:", event.data.response);
            } else if (agentToolCallResultEvent.include(event)) {
                console.log("TOOL CALL NAME:", event.data.toolName, ', KWARGS:', event.data.toolKwargs, ', RESULT:', event.data.toolOutput.result);
            }
        }
    }
}

main().catch(console.error);

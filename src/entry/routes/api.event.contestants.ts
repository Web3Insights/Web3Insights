import { type LoaderFunctionArgs, type ActionFunctionArgs, json } from "@remix-run/node";

import { fetchCurrentUser } from "~/auth/repository";
import { canManageEvents } from "~/auth/helper";
import { fetchList, insertOne } from "~/event/repository";

async function protectedLoader(args: LoaderFunctionArgs) {
  const res = await fetchCurrentUser(args.request);
  
  if (!canManageEvents(res.data)) {
    return json({ success: false, message: "Access denied", code: "404" }, { status: 404 });
  }

  const url = new URL(args.request.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const result = await fetchList(args.request, params);
  
  return json(result, { status: Number(result.code) });
}

async function protectedAction(args: ActionFunctionArgs) {
  const res = await fetchCurrentUser(args.request);
  
  if (!canManageEvents(res.data)) {
    return json({ success: false, message: "Access denied", code: "404" }, { status: 404 });
  }

  const data = await args.request.json();
  const result = await insertOne(args.request, data);
  
  return json(result, { status: Number(result.code) });
}

export { protectedLoader as loader, protectedAction as action };

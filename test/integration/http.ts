import type { TestUser } from "./users";

type RouteHandler = (req: never, ctx: never) => Promise<Response>;

type CallRouteOptions = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  user?: TestUser;
  body?: unknown;
  params?: Record<string, string>;
};

export type RouteResult = {
  status: number;
  json: Record<string, unknown> | null;
};

export async function callRoute(
  handler: RouteHandler,
  { method, path, user, body, params = {} }: CallRouteOptions,
): Promise<RouteResult> {
  const headers = new Headers({ "content-type": "application/json" });
  if (user) headers.set("cookie", user.cookie);
  const req = new Request(`http://localhost:3000${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const call = handler as unknown as (
    req: Request,
    ctx: { params: Promise<Record<string, string>> },
  ) => Promise<Response>;
  const res = await call(req, { params: Promise.resolve(params) });
  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  return { status: res.status, json };
}

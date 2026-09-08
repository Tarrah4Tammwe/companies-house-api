import type { NextRequest } from "next/server";
import { jsonError } from "./http";
import { isAuthorized } from "./origin-lock";

export function unauthorizedIfLocked(req: NextRequest) {
  if (isAuthorized(req.headers)) return null;
  return jsonError("Unauthorized.", 401);
}

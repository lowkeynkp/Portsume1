import { createHmac, timingSafeEqual } from "node:crypto";
import { config } from "../config/index.js";
import { uid } from "./ids.js";

export interface SessionClaims {
  sub: string; // user id
  email: string;
  name: string;
  provider: string;
  iat: number;
  exp: number;
  jti: string;
}

const SEP = ".";

function base64url(buf: Buffer): string {
  return buf.toString("base64url");
}

function sign(payload: string): string {
  return createHmac("sha256", config.sessionSecret).update(payload).digest("base64url");
}

export function issueSession(claims: Omit<SessionClaims, "iat" | "exp" | "jti">): string {
  const now = Math.floor(Date.now() / 1000);
  const full: SessionClaims = { ...claims, iat: now, exp: now + 60 * 60 * 24 * 30, jti: uid() };
  const body = base64url(Buffer.from(JSON.stringify(full)));
  return `${body}${SEP}${sign(body)}`;
}

export function verifySession(token: string): SessionClaims | null {
  const [body, sig] = token.split(SEP);
  if (!body || !sig) return null;
  const expected = sign(body);
  const actual = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (actual.length !== expBuf.length || !timingSafeEqual(actual, expBuf)) return null;
  try {
    const claims = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionClaims;
    if (claims.exp < Math.floor(Date.now() / 1000)) return null;
    return claims;
  } catch {
    return null;
  }
}

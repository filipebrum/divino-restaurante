import crypto from "crypto";
import { cookies, headers } from "next/headers";

const SESSION_COOKIE_NAME = "divino_staff_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 dias

function getSessionSecret(): string {
  return (
    process.env.AUTH_SECRET ||
    "divino-restaurante-local-dev-secret-change-in-production"
  );
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, expectedHex] = storedHash.split(":");
  if (!salt || !expectedHex) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

export interface StaffSession {
  userId: string;
  name: string;
  email: string;
  role: string;
  exp: number;
}

function signPayload(encodedPayload: string): string {
  return crypto
    .createHmac("sha256", getSessionSecret())
    .update(encodedPayload)
    .digest("base64url");
}

export function createSessionToken(
  user: Omit<StaffSession, "exp">
): string {
  const payload: StaffSession = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url"
  );
  const signature = signPayload(encoded);
  return `${encoded}.${signature}`;
}

export function verifySessionToken(
  token: string | undefined
): StaffSession | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encoded, signature] = parts;
  const expectedSig = signPayload(encoded);
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSig);
  if (
    sigBuf.length !== expBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expBuf)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as StaffSession;
    if (!parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function getStaffSession(): Promise<StaffSession | null> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const fromCookie = verifySessionToken(cookieToken);
  if (fromCookie) return fromCookie;

  const h = await headers();

  // Header customizado que atravessa proxies reversos intacto
  const customToken = h.get("x-divino-token")?.trim();
  if (customToken) {
    const fromCustom = verifySessionToken(customToken);
    if (fromCustom) return fromCustom;
  }

  // Fallback padrão via Authorization: Bearer
  const authHeader = h.get("authorization") ?? "";
  if (authHeader.startsWith("Bearer ")) {
    const bearerToken = authHeader.slice(7).trim();
    return verifySessionToken(bearerToken);
  }

  return null;
}

async function isHttpsRequest(): Promise<boolean> {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "";
  const origin = h.get("origin") ?? "";
  const referer = h.get("referer") ?? "";
  return (
    proto.includes("https") ||
    origin.startsWith("https://") ||
    referer.startsWith("https://")
  );
}

export async function setStaffSessionCookie(
  user: Omit<StaffSession, "exp">
): Promise<string> {
  const cookieStore = await cookies();
  const token = createSessionToken(user);
  const https = await isHttpsRequest();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: https ? "none" : "lax",
    secure: https,
    partitioned: https ? true : undefined,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });

  return token;
}

export async function clearStaffSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  const https = await isHttpsRequest();

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: https ? "none" : "lax",
    secure: https,
    partitioned: https ? true : undefined,
    path: "/",
    maxAge: 0,
  });
}

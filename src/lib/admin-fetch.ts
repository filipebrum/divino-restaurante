const STORAGE_KEY = "divino_staff_token";
const USER_STORAGE_KEY = "divino_staff_user";

export interface ClientStaffUser {
  name: string;
  role: string;
}

// Mantém token e usuário em memória para funcionar mesmo em iframes sem cookies e sem sessionStorage
let memoryToken: string | null = null;
let memoryUser: ClientStaffUser | null = null;

export function saveClientSession(token: string, user?: ClientStaffUser) {
  memoryToken = token;
  if (user) memoryUser = user;
  try {
    sessionStorage.setItem(STORAGE_KEY, token);
    if (user) {
      sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    }
  } catch {
    // Ignora se o iframe bloquear sessionStorage
  }
}

export function saveClientAuthToken(token: string) {
  saveClientSession(token);
}

export function getClientAuthToken(): string | null {
  if (memoryToken) return memoryToken;
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      memoryToken = stored;
      return stored;
    }
  } catch {
    // Ignora
  }
  return null;
}

export function getClientUser(): ClientStaffUser | null {
  if (memoryUser) return memoryUser;
  try {
    const raw = sessionStorage.getItem(USER_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ClientStaffUser;
      if (parsed?.name && parsed?.role) {
        memoryUser = parsed;
        return parsed;
      }
    }
  } catch {
    // Ignora
  }
  return null;
}

export function clearClientAuthToken() {
  memoryToken = null;
  memoryUser = null;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(USER_STORAGE_KEY);
  } catch {
    // Ignora
  }
}

export function adminFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const token = getClientAuthToken();
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set("X-Divino-Token", token);
    if (!headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }
  return fetch(input, {
    ...init,
    headers,
    credentials: "same-origin",
  });
}

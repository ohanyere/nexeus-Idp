export type AuthMode = "mock" | "github";

export function getAuthMode(): AuthMode {
  return process.env.NEXT_PUBLIC_AUTH_MODE === "mock" ? "mock" : "github";
}

export function isMockAuthMode() {
  return getAuthMode() === "mock";
}

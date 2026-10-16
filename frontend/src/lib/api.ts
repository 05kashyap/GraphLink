export type FieldErrors = Record<string, string[]>;

export class ApiError extends Error {
  status: number;
  fields: FieldErrors;

  constructor(status: number, message: string, fields: FieldErrors = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

function getCookie(name: string): string | null {
  const match = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

async function ensureCsrf(): Promise<string> {
  let token = getCookie("csrftoken");
  if (!token) {
    await fetch("/api/auth/csrf", { credentials: "include" });
    token = getCookie("csrftoken");
  }
  return token ?? "";
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
}

/** Turn DRF / Django form error payloads into one message plus per-field errors. */
function parseError(status: number, payload: unknown): ApiError {
  if (payload && typeof payload === "object") {
    const data = payload as Record<string, unknown>;
    if (typeof data.detail === "string") return new ApiError(status, data.detail);
    const fields: FieldErrors = {};
    for (const [key, value] of Object.entries(data)) {
      fields[key] = Array.isArray(value) ? value.map(String) : [String(value)];
    }
    const general = fields.__all__ ?? fields.non_field_errors;
    return new ApiError(status, general?.[0] ?? "Please check the highlighted fields.", fields);
  }
  return new ApiError(status, status >= 500 ? "Something went wrong on our side." : "Request failed.");
}

export async function api<T>(path: string, { method = "GET", body }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  let payload: BodyInit | undefined;

  if (method !== "GET") headers["X-CSRFToken"] = await ensureCsrf();
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const response = await fetch(`/api/${path}`, { method, headers, body: payload, credentials: "include" });
  if (response.status === 204) return undefined as T;

  const data = await response.json().catch(() => null);
  if (!response.ok) throw parseError(response.status, data);
  return data as T;
}

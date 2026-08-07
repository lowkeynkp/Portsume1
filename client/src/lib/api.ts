import type {
  ApiEnvelope,
  ApiResponse,
  AuthSession,
  AuthUser,
  PipelineJob,
  Portfolio,
  PublishedSite,
  Theme,
  UploadedFileMeta,
} from "@portsume/shared";

const BASE = import.meta.env.VITE_API_BASE ?? "";

let token: string | null = localStorage.getItem("portsume_token");

export function setToken(next: string | null): void {
  token = next;
  if (next) localStorage.setItem("portsume_token", next);
  else localStorage.removeItem("portsume_token");
}

export function getToken(): string | null {
  return token;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<ApiEnvelope<T>> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${BASE}/v1${path}`, { ...init, headers });
  const body = (await res.json().catch(() => null)) as ApiResponse<T> | null;
  if (!body || !body.ok) {
    const message = body && !body.ok ? body.error.message : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return body;
}

async function requestText(path: string): Promise<string> {
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${BASE}/v1${path}`, { headers });
  if (!res.ok) throw new Error(`Preview request failed (${res.status})`);
  return res.text();
}

export interface UploadResult {
  job: PipelineJob;
}

export const api = {
  auth: {
    demo: () => request<AuthSession>("/auth/demo", { method: "POST" }),
    session: (body: { email: string; name?: string; provider?: string }) =>
      request<AuthSession>("/auth/session", { method: "POST", body: JSON.stringify(body) }),
    me: () => request<{ user: AuthUser }>("/auth/me"),
  },

  uploads: {
    resume: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return request<UploadResult>("/uploads/resume", { method: "POST", body: form });
    },
    job: (id: string) => request<{ job: PipelineJob }>(`/uploads/jobs/${id}`),
    jobs: () => request<{ jobs: PipelineJob[] }>("/uploads/jobs"),
    files: () => request<{ files: UploadedFileMeta[] }>("/uploads/files"),
  },

  portfolios: {
    list: () => request<{ portfolios: Portfolio[] }>("/portfolios"),
    get: (id: string) => request<{ portfolio: Portfolio }>(`/portfolios/${id}`),
    update: (id: string, patch: Partial<Portfolio>) =>
      request<{ portfolio: Portfolio }>(`/portfolios/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    preview: (id: string, theme?: string) =>
      requestText(`/portfolios/${id}/preview${theme ? `?theme=${encodeURIComponent(theme)}` : ""}`),
    publish: (id: string) =>
      request<{ site: PublishedSite; portfolio: Portfolio }>(`/portfolios/${id}/publish`, { method: "POST" }),
    unpublish: (id: string) => request<{ portfolio: Portfolio }>(`/portfolios/${id}/unpublish`, { method: "POST" }),
  },

  themes: {
    list: () => request<{ themes: Theme[] }>("/themes"),
  },

  analytics: {
    overview: () => request<{ overview: Record<string, number> }>("/analytics/overview"),
  },
};

export function publicPortfolioUrl(slug: string): string {
  return `${BASE}/p/${slug}`;
}

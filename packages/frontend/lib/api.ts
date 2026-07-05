import type {
  Project,
  GameScore,
  CreateProjectInput,
  UpdateProjectInput,
  CreateScoreInput,
  UploadUrlResponse,
  ImageStatusResponse,
} from "@/types/schema";

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    const msg =
      body && typeof body === "object" && "message" in body
        ? (body as { message: string }).message
        : `Request failed with status ${status}`;
    super(msg);
    this.name = "ApiError";
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const API_BASE = "/api";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body);
  }
  return await res.json();
}

async function authFetch<T>(
  path: string,
  token: string,
  options?: RequestInit,
): Promise<T> {
  return apiFetch<T>(path, {
    ...options,
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
}

// ---------------------------------------------------------------------------
// Projects — public reads
// ---------------------------------------------------------------------------

export async function getProjects(): Promise<Project[]> {
  return apiFetch<Project[]>("/projects");
}

export async function getProject(id: string): Promise<Project> {
  return apiFetch<Project>(`/projects/${id}`);
}

// ---------------------------------------------------------------------------
// Projects — authenticated mutations
// ---------------------------------------------------------------------------

export async function createProject(
  token: string,
  input: CreateProjectInput,
): Promise<Project> {
  return authFetch<Project>("/projects", token, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateProject(
  token: string,
  id: string,
  input: UpdateProjectInput,
): Promise<Project> {
  return authFetch<Project>(`/projects/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteProject(
  token: string,
  id: string,
): Promise<void> {
  await authFetch<void>(`/projects/${id}`, token, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------

export async function getLeaderboard(): Promise<GameScore[]> {
  return apiFetch<GameScore[]>("/leaderboard");
}

export async function submitScore(input: CreateScoreInput): Promise<GameScore> {
  return apiFetch<GameScore>("/leaderboard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

export async function getUploadUrl(
  token: string,
  projectId: string,
  fileExtension: string,
): Promise<UploadUrlResponse> {
  return authFetch<UploadUrlResponse>("/images/upload-url", token, {
    method: "POST",
    body: JSON.stringify({ projectId, fileExtension }),
  });
}

export async function getImageStatus(
  token: string,
  projectId: string,
): Promise<ImageStatusResponse> {
  return authFetch<ImageStatusResponse>(`/images/status/${projectId}`, token);
}

// ---------------------------------------------------------------------------
// Image URL builder
// ---------------------------------------------------------------------------

export function getProjectImageUrl(
  projectId: string,
  variant: "thumbnail" | "optimised" | "original" = "thumbnail",
  index?: number,
): string {
  const suffix = index != null && index > 0 ? `-${index}` : "";
  return `/images/${projectId}/${variant}${suffix}.jpg`;
}

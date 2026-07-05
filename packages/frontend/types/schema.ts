// ---------------------------------------------------------------------------
// Project
// ---------------------------------------------------------------------------

export type ProjectStatus = "published" | "draft";

export interface Project {
  readonly id: string;
  name: string;
  desc: string | null;
  skills: string[];
  githubUrl: string | null;
  demoUrl: string | null;
  isFeatured: boolean;
  status: ProjectStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateProjectInput {
  id: string;
  name: string;
  skills: string[];
  desc?: string | null;
  githubUrl?: string | null;
  demoUrl?: string | null;
}

export interface UpdateProjectInput {
  name?: string | null;
  desc?: string | null;
  skills?: string[];
  githubUrl?: string | null;
  demoUrl?: string | null;
  isFeatured?: boolean;
  status?: ProjectStatus;
}

// ---------------------------------------------------------------------------
// Game Score (Leaderboard)
// ---------------------------------------------------------------------------

export interface GameScore {
  readonly id: string;
  playerName: string;
  score: string;
  multiplier: string;
  finalScore: string;
  game: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateScoreInput {
  playerName: string;
  score: string;
  multiplier: string;
  finalScore: string;
  game?: string | null;
  signature: string;
}

// ---------------------------------------------------------------------------
// Image Upload
// ---------------------------------------------------------------------------

export interface UploadUrlResponse {
  uploadUrl: string;
  projectId: string;
  key: string;
}

export interface ImageStatusResponse {
  projectId: string;
  imageProcessed: boolean;
}

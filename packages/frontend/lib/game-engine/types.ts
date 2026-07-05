// ---------------------------------------------------------------------------
// Game config — all speeds are in pixels-per-frame at 60fps (1 dt unit)
// ---------------------------------------------------------------------------

export const GAME_CONFIG = {
  GROUND_RATIO: 0.85,
  INITIAL_GAME_SPEED: 7,
  SPEED_INCREMENT: 0.0015,
  GRAVITY: 0.6,
  MIN_ASPECT_RATIO: 1.0,
  MAX_ASPECT_RATIO: 2.5,
  MIN_WIDTH: 300,
  MIN_HEIGHT: 200,
} as const;

export const UI_CONFIG = {
  UI_ELEMENTS_HEIGHT: 80,
} as const;

export const PLAYER_CONFIG = {
  WIDTH: 40,
  HEIGHT: 62,
  X_POSITION: 50,
  JUMP_STRENGTH: -15,
} as const;

export const OBSTACLE_CONFIG = {
  COLOR: "#f87171",
  COLOR_DARK: "#dc2626",
  MIN_WIDTH: 20,
  MAX_WIDTH: 60,
  MIN_HEIGHT: 30,
  MAX_HEIGHT: 80,
  FLOAT_MIN_HEIGHT: 40,
  FLOAT_MAX_HEIGHT: 90,
  BASE_SPAWN_INTERVAL: 180,
  MIN_SPAWN_INTERVAL: 80,
  DIFFICULTY_RAMP_FRAMES: 3600,
} as const;

export const DIFFICULTY_CONFIG = {
  MAX_DIFFICULTY: 1,
  FLOAT_CHANCE_MIN: 0,
  FLOAT_CHANCE_MAX: 0.3,
  TALL_CHANCE_MIN: 0,
  TALL_CHANCE_MAX: 0.4,
  WIDE_CHANCE_MIN: 0.1,
  WIDE_CHANCE_MAX: 0.5,
} as const;

export const COIN_CONFIG = {
  WIDTH: 16,
  HEIGHT: 16,
  SPAWN_INTERVAL: 150,
  COLOR: "#4ADE80",
  COLOR_DARK: "#22C55E",
  SPIN_SPEED: 0.05,
  MULTIPLIER: 0.1,
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ObstacleType = "ground" | "floating" | "tall" | "wide";

export interface ObstacleSpawnConfig {
  type: ObstacleType;
  width: number;
  height: number;
  y: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type EngineState = "idle" | "playing" | "gameOver";

export interface GameState {
  engineState: EngineState;
  score: number;
  coins: number;
  finalScore: number;
  playerY: number;
}

export type GameEventType = "state" | "score" | "coins" | "gameOver" | "playerMove";

export interface GameEvent {
  type: GameEventType;
  payload: number | EngineState;
}

export type GameEventCallback = (event: GameEvent) => void;

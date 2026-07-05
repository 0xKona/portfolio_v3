import { Player } from "./player";
import { Obstacle } from "./obstacle";
import { Coin } from "./coin";
import {
  GAME_CONFIG,
  OBSTACLE_CONFIG,
  DIFFICULTY_CONFIG,
  COIN_CONFIG,
  PLAYER_CONFIG,
  EngineState,
  GameEventCallback,
  ObstacleSpawnConfig,
  ObstacleType,
  Bounds,
} from "./types";

const TARGET_FRAME_MS = 1000 / 60; // 16.67ms per frame at 60fps

export class GameEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  private width: number = 400;
  private height: number = 300;
  private groundHeight: number = 255;

  private player: Player;
  private obstacles: Obstacle[] = [];
  private coins: Coin[] = [];

  private gameSpeed: number = GAME_CONFIG.INITIAL_GAME_SPEED;
  private frameCount: number = 0;
  private score: number = 0;
  private coinCount: number = 0;

  private state: EngineState = "idle";
  private generation: number = 0;
  private lastTimestamp: number = 0;

  // Spawn tracking (in dt-normalized frames)
  private lastObstacleSpawn: number = 0;
  private lastCoinSpawn: number = 0;

  private eventCallback: GameEventCallback | null = null;

  constructor() {
    this.player = new Player(this.groundHeight);
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.width = canvas.width;
    this.height = canvas.height;
    this.groundHeight = Math.floor(this.height * GAME_CONFIG.GROUND_RATIO);
    this.player.setGroundLevel(this.groundHeight);
  }

  onEvent(callback: GameEventCallback): void {
    this.eventCallback = callback;
  }

  start(): void {
    this.reset();
    this.state = "playing";
    this.generation++;
    this.lastTimestamp = 0;
    this.emit("state", "playing");
    this.scheduleLoop();
  }

  stop(): void {
    this.state = "idle";
    this.generation++;
    this.emit("state", "idle");
  }

  jump(): void {
    if (this.state === "playing") {
      this.player.jump();
    }
  }

  getState(): EngineState {
    return this.state;
  }

  destroy(): void {
    this.state = "idle";
    this.generation++;
    this.canvas = null;
    this.ctx = null;
    this.eventCallback = null;
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private reset(): void {
    this.player.reset();
    this.obstacles = [];
    this.coins = [];
    this.gameSpeed = GAME_CONFIG.INITIAL_GAME_SPEED;
    this.frameCount = 0;
    this.score = 0;
    this.coinCount = 0;
    this.lastObstacleSpawn = 0;
    this.lastCoinSpawn = 0;
  }

  private emit(type: "state", payload: EngineState): void;
  private emit(type: "score" | "coins" | "gameOver" | "playerMove", payload: number): void;
  private emit(type: string, payload: number | EngineState): void {
    this.eventCallback?.({ type: type as never, payload: payload as never });
  }

  private scheduleLoop(): void {
    const gen = this.generation;
    const loop = (timestamp: number): void => {
      // Stale generation — abort
      if (gen !== this.generation || this.state !== "playing") return;

      // Calculate delta-time normalized to 60fps
      const dt = this.lastTimestamp
        ? Math.min((timestamp - this.lastTimestamp) / TARGET_FRAME_MS, 3) // cap at 3x to prevent spiral
        : 1;
      this.lastTimestamp = timestamp;

      this.update(dt);
      this.render();

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  // ---------------------------------------------------------------------------
  // Update
  // ---------------------------------------------------------------------------

  private update(dt: number): void {
    this.frameCount += dt;

    this.player.update(dt);
    this.emit("playerMove", this.player.getY());

    // Update obstacles
    this.obstacles = this.obstacles.filter((obs) => {
      obs.update(this.gameSpeed, dt);
      const points = obs.checkPassed(PLAYER_CONFIG.X_POSITION);
      if (points > 0) this.addScore(points);
      return obs.isActive();
    });

    // Update coins
    this.coins = this.coins.filter((coin) => {
      coin.update(this.gameSpeed, dt);
      return coin.isActive();
    });

    this.spawnEntities();
    this.checkCollisions();
    this.gameSpeed += GAME_CONFIG.SPEED_INCREMENT * dt;
  }

  // ---------------------------------------------------------------------------
  // Spawning
  // ---------------------------------------------------------------------------

  private spawnEntities(): void {
    const difficulty = this.getDifficulty();
    const spawnInterval = this.getObstacleSpawnInterval(difficulty);

    if (this.frameCount - this.lastObstacleSpawn >= spawnInterval) {
      const config = this.generateObstacleConfig(difficulty);
      this.obstacles.push(new Obstacle(config, this.width));
      this.lastObstacleSpawn = this.frameCount;
    }

    if (this.frameCount - this.lastCoinSpawn >= COIN_CONFIG.SPAWN_INTERVAL) {
      const pos = this.findSafeCoinPosition();
      if (pos) {
        this.coins.push(new Coin(this.width, pos.y));
        this.lastCoinSpawn = this.frameCount;
      }
    }
  }

  private getDifficulty(): number {
    return Math.min(this.frameCount / OBSTACLE_CONFIG.DIFFICULTY_RAMP_FRAMES, DIFFICULTY_CONFIG.MAX_DIFFICULTY);
  }

  private getObstacleSpawnInterval(difficulty: number): number {
    const range = OBSTACLE_CONFIG.BASE_SPAWN_INTERVAL - OBSTACLE_CONFIG.MIN_SPAWN_INTERVAL;
    return OBSTACLE_CONFIG.BASE_SPAWN_INTERVAL - range * difficulty;
  }

  private generateObstacleConfig(difficulty: number): ObstacleSpawnConfig {
    const type = this.pickObstacleType(difficulty);
    let width: number, height: number, y: number;

    switch (type) {
      case "tall":
        width = this.rand(OBSTACLE_CONFIG.MIN_WIDTH, OBSTACLE_CONFIG.MIN_WIDTH + 15);
        height = this.rand(OBSTACLE_CONFIG.MAX_HEIGHT - 10, OBSTACLE_CONFIG.MAX_HEIGHT);
        y = this.groundHeight - height;
        break;
      case "wide":
        width = this.rand(OBSTACLE_CONFIG.MAX_WIDTH - 15, OBSTACLE_CONFIG.MAX_WIDTH);
        height = this.rand(OBSTACLE_CONFIG.MIN_HEIGHT, OBSTACLE_CONFIG.MIN_HEIGHT + 20);
        y = this.groundHeight - height;
        break;
      case "floating": {
        width = this.rand(OBSTACLE_CONFIG.MIN_WIDTH, OBSTACLE_CONFIG.MIN_WIDTH + 20);
        height = this.rand(OBSTACLE_CONFIG.FLOAT_MIN_HEIGHT, OBSTACLE_CONFIG.FLOAT_MAX_HEIGHT);
        const maxY = this.groundHeight - PLAYER_CONFIG.HEIGHT - 15;
        const minY = this.groundHeight - height - 80;
        y = this.rand(Math.max(50, minY), maxY - height);
        break;
      }
      default: {
        const scale = 0.5 + difficulty * 0.5;
        width = this.rand(OBSTACLE_CONFIG.MIN_WIDTH, OBSTACLE_CONFIG.MIN_WIDTH + (OBSTACLE_CONFIG.MAX_WIDTH - OBSTACLE_CONFIG.MIN_WIDTH) * scale);
        height = this.rand(OBSTACLE_CONFIG.MIN_HEIGHT, OBSTACLE_CONFIG.MIN_HEIGHT + (OBSTACLE_CONFIG.MAX_HEIGHT - OBSTACLE_CONFIG.MIN_HEIGHT) * scale);
        y = this.groundHeight - height;
        break;
      }
    }

    return { type, width, height, y };
  }

  private pickObstacleType(difficulty: number): ObstacleType {
    const floatChance = this.lerp(DIFFICULTY_CONFIG.FLOAT_CHANCE_MIN, DIFFICULTY_CONFIG.FLOAT_CHANCE_MAX, difficulty);
    const tallChance = this.lerp(DIFFICULTY_CONFIG.TALL_CHANCE_MIN, DIFFICULTY_CONFIG.TALL_CHANCE_MAX, difficulty);
    const wideChance = this.lerp(DIFFICULTY_CONFIG.WIDE_CHANCE_MIN, DIFFICULTY_CONFIG.WIDE_CHANCE_MAX, difficulty);

    const roll = Math.random();
    let c = 0;
    c += floatChance; if (roll < c) return "floating";
    c += tallChance; if (roll < c) return "tall";
    c += wideChance; if (roll < c) return "wide";
    return "ground";
  }

  private findSafeCoinPosition(): { y: number } | null {
    const buffer = 60;
    const nearby = this.obstacles
      .filter((o) => o.getBounds().x > this.width - 200)
      .map((o) => o.getBounds());

    for (let i = 0; i < 5; i++) {
      const coinY = this.groundHeight - COIN_CONFIG.HEIGHT - 30 - Math.random() * 100;
      const coinBounds: Bounds = {
        x: this.width - buffer,
        y: coinY - buffer,
        width: COIN_CONFIG.WIDTH + buffer * 2,
        height: COIN_CONFIG.HEIGHT + buffer * 2,
      };

      let safe = true;
      for (const ob of nearby) {
        if (this.overlaps(coinBounds, ob)) { safe = false; break; }
      }
      if (safe) return { y: coinY };
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // Collision
  // ---------------------------------------------------------------------------

  private checkCollisions(): void {
    const pb = this.player.getBounds();

    for (const obs of this.obstacles) {
      if (this.overlaps(pb, obs.getBounds())) {
        this.handleGameOver();
        return;
      }
    }

    for (const coin of this.coins) {
      if (!coin.isCollected() && this.overlaps(pb, coin.getBounds())) {
        coin.collect();
        this.coinCount++;
        this.emit("coins", this.coinCount);
      }
    }
  }

  private handleGameOver(): void {
    this.state = "gameOver";
    this.generation++;
    const finalScore = Math.floor(this.score * (1 + this.coinCount * COIN_CONFIG.MULTIPLIER));
    this.emit("gameOver", finalScore);
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  private render(): void {
    if (!this.ctx) return;

    // Clear
    this.ctx.fillStyle = "#000000";
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Ground line
    this.ctx.strokeStyle = "#404040";
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.groundHeight);
    this.ctx.lineTo(this.width, this.groundHeight);
    this.ctx.stroke();

    // Entities
    for (const obs of this.obstacles) obs.render(this.ctx);
    for (const coin of this.coins) coin.render(this.ctx);
  }

  // ---------------------------------------------------------------------------
  // Scoring
  // ---------------------------------------------------------------------------

  private addScore(points: number): void {
    this.score += points;
    this.emit("score", this.score);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private overlaps(a: Bounds, b: Bounds): boolean {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }

  private lerp(min: number, max: number, t: number): number {
    return min + (max - min) * t;
  }

  private rand(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }
}

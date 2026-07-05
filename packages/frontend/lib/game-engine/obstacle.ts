import { OBSTACLE_CONFIG, ObstacleSpawnConfig, ObstacleType, Bounds } from "./types";

export class Obstacle {
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private active: boolean = true;
  private passed: boolean = false;
  private type: ObstacleType;

  constructor(config: ObstacleSpawnConfig, canvasWidth: number) {
    this.x = canvasWidth;
    this.y = config.y;
    this.width = config.width;
    this.height = config.height;
    this.type = config.type;
  }

  update(gameSpeed: number, dt: number): void {
    this.x -= gameSpeed * dt;
    if (this.x < -this.width) {
      this.active = false;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = OBSTACLE_CONFIG.COLOR;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    ctx.strokeStyle = OBSTACLE_CONFIG.COLOR_DARK;
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.width, this.height);

    // Inner horizontal lines for texture
    ctx.lineWidth = 1;
    const spacing = 12;
    for (let i = spacing; i < this.height; i += spacing) {
      ctx.beginPath();
      ctx.moveTo(this.x + 2, this.y + i);
      ctx.lineTo(this.x + this.width - 2, this.y + i);
      ctx.stroke();
    }
  }

  checkPassed(playerX: number): number {
    if (!this.passed && this.x + this.width < playerX) {
      this.passed = true;
      return 10;
    }
    return 0;
  }

  isActive(): boolean {
    return this.active;
  }

  getType(): ObstacleType {
    return this.type;
  }

  getBounds(): Bounds {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }
}

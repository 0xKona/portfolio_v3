import { COIN_CONFIG, Bounds } from "./types";

export class Coin {
  private x: number;
  private y: number;
  private width: number = COIN_CONFIG.WIDTH;
  private height: number = COIN_CONFIG.HEIGHT;
  private active: boolean = true;
  private collected: boolean = false;
  private animationFrame: number = 0;

  constructor(canvasWidth: number, coinY: number) {
    this.x = canvasWidth;
    this.y = coinY;
  }

  update(gameSpeed: number, dt: number): void {
    this.x -= gameSpeed * dt;
    this.animationFrame += dt;
    if (this.x < -this.width) {
      this.active = false;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.collected) return;

    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;

    const spinPhase = this.animationFrame * COIN_CONFIG.SPIN_SPEED;
    const scaleX = Math.cos(spinPhase);
    const absScaleX = Math.abs(scaleX);

    const apparentWidth = Math.max(2, this.width * absScaleX);
    const halfW = apparentWidth / 2;
    const halfH = this.height / 2;

    const color = scaleX > 0 ? COIN_CONFIG.COLOR : COIN_CONFIG.COLOR_DARK;

    ctx.fillStyle = color;
    ctx.fillRect(cx - halfW, cy - halfH, apparentWidth, this.height);

    ctx.strokeStyle = "#166534";
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - halfW, cy - halfH, apparentWidth, this.height);

    if (apparentWidth > 6) {
      ctx.strokeStyle = "#166534";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy - halfH + 3);
      ctx.lineTo(cx, cy + halfH - 3);
      ctx.stroke();
    }
  }

  collect(): void {
    this.collected = true;
    this.active = false;
  }

  isCollected(): boolean {
    return this.collected;
  }

  isActive(): boolean {
    return this.active;
  }

  getBounds(): Bounds {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }
}

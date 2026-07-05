import { GAME_CONFIG, PLAYER_CONFIG, Bounds } from "./types";

export class Player {
  private x: number = PLAYER_CONFIG.X_POSITION;
  private y: number;
  private width: number = PLAYER_CONFIG.WIDTH;
  private height: number = PLAYER_CONFIG.HEIGHT;
  private velocityY: number = 0;
  private isJumping: boolean = false;
  private groundY: number;

  constructor(groundHeight: number) {
    this.groundY = groundHeight - PLAYER_CONFIG.HEIGHT;
    this.y = this.groundY;
  }

  setGroundLevel(groundHeight: number): void {
    this.groundY = groundHeight - PLAYER_CONFIG.HEIGHT;
    if (!this.isJumping) {
      this.y = this.groundY;
    }
  }

  update(dt: number): void {
    this.velocityY += GAME_CONFIG.GRAVITY * dt;
    this.y += this.velocityY * dt;

    if (this.y >= this.groundY) {
      this.y = this.groundY;
      this.velocityY = 0;
      this.isJumping = false;
    }
  }

  jump(): boolean {
    if (!this.isJumping && this.y >= this.groundY) {
      this.velocityY = PLAYER_CONFIG.JUMP_STRENGTH;
      this.isJumping = true;
      return true;
    }
    return false;
  }

  reset(): void {
    this.y = this.groundY;
    this.velocityY = 0;
    this.isJumping = false;
  }

  getY(): number {
    return this.y;
  }

  getBounds(): Bounds {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }
}

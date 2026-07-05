"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { GameEngine } from "@/lib/game-engine/engine";
import {
  GAME_CONFIG,
  PLAYER_CONFIG,
  UI_CONFIG,
  COIN_CONFIG,
  type EngineState,
} from "@/lib/game-engine/types";
import { GameOver } from "./game-over";

function calculateDimensions(containerW: number, containerH: number) {
  const availH = containerH - UI_CONFIG.UI_ELEMENTS_HEIGHT;
  const availW = containerW - 16;

  const aspect = Math.max(
    GAME_CONFIG.MIN_ASPECT_RATIO,
    Math.min(GAME_CONFIG.MAX_ASPECT_RATIO, availW / availH),
  );

  let width: number, height: number;
  if (availW / availH > aspect) {
    height = Math.max(GAME_CONFIG.MIN_HEIGHT, availH);
    width = Math.floor(height * aspect);
  } else {
    width = Math.max(GAME_CONFIG.MIN_WIDTH, availW);
    height = Math.floor(width / aspect);
  }

  return { width, height, groundHeight: Math.floor(height * GAME_CONFIG.GROUND_RATIO) };
}

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const playerRef = useRef<HTMLImageElement>(null);

  const [dims, setDims] = useState({ width: 400, height: 300, groundHeight: 255 });
  const [engineState, setEngineState] = useState<EngineState>("idle");
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [finalScore, setFinalScore] = useState(0);

  // Resize observer
  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      const d = calculateDimensions(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight,
      );
      setDims(d);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Initialize engine
  useEffect(() => {
    const engine = new GameEngine();
    engineRef.current = engine;

    engine.onEvent((event) => {
      switch (event.type) {
        case "state":
          setEngineState(event.payload as EngineState);
          break;
        case "score":
          setScore(event.payload as number);
          break;
        case "coins":
          setCoins(event.payload as number);
          break;
        case "gameOver":
          setFinalScore(event.payload as number);
          setEngineState("gameOver");
          break;
        case "playerMove":
          if (playerRef.current) {
            playerRef.current.style.top = `${event.payload as number}px`;
          }
          break;
      }
    });

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Re-init canvas when dimensions change
  useEffect(() => {
    if (canvasRef.current && engineRef.current) {
      engineRef.current.init(canvasRef.current);
    }
  }, [dims]);

  const startGame = useCallback(() => {
    setScore(0);
    setCoins(0);
    setFinalScore(0);
    engineRef.current?.start();
  }, []);

  const resetToMenu = useCallback(() => {
    engineRef.current?.stop();
    setScore(0);
    setCoins(0);
    setFinalScore(0);
    setEngineState("idle");
  }, []);

  const handleInteraction = useCallback(() => {
    if (engineState === "gameOver") return;
    if (engineState === "idle") {
      startGame();
    } else {
      engineRef.current?.jump();
    }
  }, [engineState, startGame]);

  // Keyboard input
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        if (engineState === "playing") {
          engineRef.current?.jump();
        } else if (engineState === "idle") {
          startGame();
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [engineState, startGame]);

  const multiplier = (1 + coins * COIN_CONFIG.MULTIPLIER).toFixed(1);

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center justify-center gap-2 md:gap-4 p-2 md:p-4 w-full h-full"
    >
      {/* HUD */}
      <div className="flex gap-4 md:gap-8 font-mono text-sm md:text-lg">
        <div className="text-neutral-300">
          <span className="hidden sm:inline">SCORE: </span>
          <span className="sm:hidden">S:</span>
          {score.toString().padStart(6, "0")}
        </div>
        <div className="text-green-400">
          <span className="hidden sm:inline">COINS: </span>
          <span className="sm:hidden">C:</span>
          {coins.toString().padStart(3, "0")}{" "}
          <span className="text-neutral-500 text-xs md:text-base">
            ({multiplier}x)
          </span>
        </div>
      </div>

      {/* Canvas container */}
      <div
        className="relative border border-neutral-700 overflow-hidden touch-none"
        style={{ width: dims.width, height: dims.height }}
        onClick={handleInteraction}
        onTouchStart={(e) => {
          e.preventDefault();
          handleInteraction();
        }}
      >
        <canvas
          ref={canvasRef}
          width={dims.width}
          height={dims.height}
          className="bg-black cursor-pointer absolute top-0 left-0"
        />

        {/* Player sprite — positioned via ref for zero-lag */}
        {engineState === "playing" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={playerRef}
            src="/running.gif"
            alt="Player"
            width={PLAYER_CONFIG.WIDTH}
            height={PLAYER_CONFIG.HEIGHT}
            className="absolute pointer-events-none"
            style={{
              left: `${PLAYER_CONFIG.X_POSITION}px`,
              top: `${dims.groundHeight - PLAYER_CONFIG.HEIGHT}px`,
              mixBlendMode: "lighten",
            }}
          />
        )}

        {/* Start menu */}
        {engineState === "idle" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center font-mono">
              <p className="text-neutral-400 text-sm mb-2">
                <span className="hidden md:inline">Press SPACE or click to start</span>
                <span className="md:hidden">Tap to start</span>
              </p>
              <p className="text-neutral-600 text-xs px-4">
                Jump over obstacles, collect coins for multiplier
              </p>
            </div>
          </div>
        )}

        {/* Game over overlay */}
        {engineState === "gameOver" && (
          <GameOver
            score={score}
            coins={coins}
            finalScore={finalScore}
            onReset={resetToMenu}
          />
        )}
      </div>

      {/* Controls hint */}
      <div className="font-mono text-neutral-600 text-xs text-center">
        <p className="hidden md:block">SPACE / ↑ to jump • ESC to close</p>
        <p className="md:hidden">Tap to jump</p>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { getLeaderboard, submitScore } from "@/lib/api";
import { signScore } from "@/lib/game-engine/hmac";
import type { GameScore } from "@/types/schema";
import { COIN_CONFIG } from "@/lib/game-engine/types";

interface GameOverProps {
  score: number;
  coins: number;
  finalScore: number;
  onReset: () => void;
}

export function GameOver({ score, coins, finalScore, onReset }: GameOverProps) {
  const [scores, setScores] = useState<GameScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playerName, setPlayerName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    getLeaderboard()
      .then(setScores)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const topScores = [...scores]
    .sort((a, b) => parseInt(b.finalScore) - parseInt(a.finalScore))
    .slice(0, 5);

  const multiplier = (1 + coins * COIN_CONFIG.MULTIPLIER).toFixed(1);

  const formatRelativeTime = (dateString: string): string => {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleSubmit = useCallback(async () => {
    const name = playerName.trim();
    if (!name || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const payload = {
        playerName: name,
        score: score.toString(),
        multiplier,
        finalScore: finalScore.toString(),
      };
      const signature = await signScore(payload);
      await submitScore({ ...payload, signature });
      setHasSubmitted(true);
      setPlayerName("");
      // Refresh leaderboard to show the new score
      const updated = await getLeaderboard();
      setScores(updated);
    } catch (err) {
      console.error("Failed to submit score:", err);
    } finally {
      setIsSubmitting(false);
    }
  }, [playerName, score, multiplier, finalScore, isSubmitting]);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 font-mono overflow-hidden">
      <p className="text-red-400 text-xl md:text-2xl mb-3">GAME OVER</p>

      {/* Score summary */}
      <div className="text-center mb-2">
        <p className="text-green-400 text-lg md:text-xl leading-tight">
          SCORE: {finalScore}
        </p>
        <p className="text-neutral-500 text-xs">
          {score} × {multiplier}
        </p>
      </div>

      {/* Scoreboard */}
      <div className="w-full max-w-70 md:max-w-xs mb-3 px-2">
        <p className="text-cyan-400 text-xs mb-1 text-center">TOP SCORES</p>
        <div className="bg-black border border-neutral-700 p-1.5 md:p-2 max-h-24 md:max-h-32 overflow-y-auto">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center text-[10px] md:text-xs gap-2 mb-1">
                <span className="text-neutral-700 w-4">{i + 1}.</span>
                <span className="flex-1 h-3 bg-neutral-800 animate-pulse" />
                <span className="w-12 h-3 bg-neutral-800 animate-pulse" />
                <span className="w-10 h-3 bg-neutral-800 animate-pulse" />
              </div>
            ))
          ) : topScores.length > 0 ? (
            topScores.map((s, i) => (
              <div key={s.id} className="flex justify-between items-center text-[10px] md:text-xs text-neutral-300 leading-tight mb-1 gap-2">
                <span className="text-neutral-500 w-4">{i + 1}.</span>
                <span className="flex-1 truncate">{s.playerName}</span>
                <span className="text-green-400 text-right whitespace-nowrap">{s.finalScore}</span>
                <span className="text-neutral-600 text-[8px] text-right whitespace-nowrap w-10">
                  {s.createdAt ? formatRelativeTime(s.createdAt) : "—"}
                </span>
              </div>
            ))
          ) : (
            <p className="text-neutral-500 text-[10px] md:text-xs text-center py-2">
              No scores yet — be the first!
            </p>
          )}
        </div>
      </div>

      {/* Submit form */}
      <div className="w-full max-w-70 md:max-w-xs px-2 mb-3">
        {hasSubmitted ? (
          <p className="text-green-400 text-xs text-center py-3 border border-neutral-700 bg-black">
            Score submitted!
          </p>
        ) : (
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))}
            placeholder="Enter name (alphanumeric)"
            className="w-full bg-black border border-neutral-700 text-neutral-300 px-2 py-1.5 text-xs font-mono"
            maxLength={20}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter" && playerName.trim()) handleSubmit();
            }}
          />
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-2 w-full max-w-70 md:max-w-xs px-2">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !playerName.trim() || hasSubmitted}
          className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-black px-2 py-1.5 text-xs font-mono"
        >
          {isSubmitting ? "sending..." : "submit"}
        </button>
        <button
          onClick={onReset}
          className="flex-1 border border-neutral-600 hover:border-neutral-400 text-neutral-400 hover:text-neutral-300 px-2 py-1.5 text-xs font-mono"
        >
          play again
        </button>
      </div>
    </div>
  );
}

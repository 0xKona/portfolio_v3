import useSWR from "swr";
import { getLeaderboard } from "@/lib/api";
import type { GameScore } from "@/types/schema";

export function useLeaderboard() {
  return useSWR<GameScore[]>("leaderboard", getLeaderboard);
}

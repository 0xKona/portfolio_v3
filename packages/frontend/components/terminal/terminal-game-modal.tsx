"use client";

import { useTerminal } from "./terminal-provider";
import { GameModal } from "@/components/game/game-modal";

export function TerminalGameModal() {
  const { isGameOpen, closeGame } = useTerminal();

  return <GameModal isOpen={isGameOpen} onClose={closeGame} />;
}

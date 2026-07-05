"use client";

import { useState } from "react";
import { TerminalButton } from "@/components/ui/button";
import { GameModal } from "./game-modal";
import { CONTENT } from "@/lib/constants/content";

interface GameTriggerProps {
  className?: string;
}

export function GameTrigger({ className = "" }: GameTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <TerminalButton
        variant="primary"
        prefix={CONTENT.landing.gameTrigger.prefix}
        onClick={() => setIsOpen(true)}
        className={className}
      >
        {CONTENT.landing.gameTrigger.label}
      </TerminalButton>

      <GameModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

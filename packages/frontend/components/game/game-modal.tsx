"use client";

import { useEffect } from "react";
import { PixelClose } from "@/components/ui/icons";
import { GameCanvas } from "./game-canvas";

interface GameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GameModal({ isOpen, onClose }: GameModalProps) {
  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 md:bg-black/90"
      onClick={onClose}
    >
      <div
        className="relative bg-black w-full h-full md:h-auto md:min-h-[70%] md:max-w-4xl md:border md:border-green-400 md:mx-4 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 md:p-4 md:pb-2 border-b border-neutral-700 shrink-0">
          <div className="font-mono text-green-400 text-xs md:text-sm">
            <span className="text-neutral-500">$</span> ./play --game platformer
          </div>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-red-400 transition-colors p-1"
            aria-label="Close game"
          >
            <PixelClose size={20} />
          </button>
        </div>

        {/* Game */}
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          <GameCanvas />
        </div>

        {/* Footer */}
        <div className="p-2 md:p-3 border-t border-neutral-700 text-center shrink-0">
          <p className="font-mono text-neutral-600 text-[10px] md:text-xs">
            <span className="hidden md:inline">ESC to close • SPACE/↑ to jump</span>
            <span className="md:hidden">Tap to jump • Swipe down to close</span>
          </p>
        </div>
      </div>
    </div>
  );
}

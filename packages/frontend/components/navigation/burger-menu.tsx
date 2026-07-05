"use client";

import { PixelBurger, PixelClose } from "@/components/ui/icons";

interface BurgerMenuProps {
  isOpen: boolean;
  onClick: () => void;
}

export function BurgerMenu({ isOpen, onClick }: BurgerMenuProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isOpen ? "Close menu" : "Open menu"}
      aria-expanded={isOpen}
      className="md:hidden text-neutral-400 hover:text-cyan-400 transition-colors p-2"
    >
      {isOpen ? <PixelClose size={20} /> : <PixelBurger size={20} />}
    </button>
  );
}

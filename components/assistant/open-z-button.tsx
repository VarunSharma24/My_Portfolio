"use client";
import { Sparkles } from "lucide-react";
export function OpenZButton() {
  return (
    <button
      className="button button-primary"
      onClick={() => window.dispatchEvent(new Event("open-z-assistant"))}
    >
      Talk to Z <Sparkles size={16} />
    </button>
  );
}

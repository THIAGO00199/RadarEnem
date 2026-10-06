"use client";
import { useEffect, useRef } from "react";

export function useAccessibleMenu(open: boolean, close: () => void) {
  const sidebar = useRef<HTMLElement>(null);
  const onClose = useRef(close);
  onClose.current = close;

  useEffect(() => {
    if (!open) return;
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () =>
      Array.from(
        sidebar.current?.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled])",
        ) || [],
      ).filter((node) => node.getClientRects().length);
    const frame = requestAnimationFrame(() => focusable()[0]?.focus());
    function keyboard(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose.current();
        return;
      }
      if (event.key !== "Tab") return;
      const nodes = focusable(),
        first = nodes[0],
        last = nodes[nodes.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", keyboard);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", keyboard);
      previous?.focus();
    };
  }, [open]);
  return sidebar;
}

type ShortcutHandler = (e: KeyboardEvent) => void;

interface ShortcutRegistration {
  combo: string; // e.g., "Ctrl+S", "Ctrl+Shift+E"
  handler: ShortcutHandler;
}

const registry: ShortcutRegistration[] = [];
let isListening = false;

function normalizeCombo(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push("Ctrl");
  if (e.shiftKey) parts.push("Shift");
  if (e.altKey) parts.push("Alt");

  let key = e.key;
  if (key === " ") key = "Space";
  if (key === "Escape") key = "Escape";
  if (key.length === 1) key = key.toUpperCase();

  parts.push(key);
  return parts.join("+");
}

function handleGlobalKeyDown(e: KeyboardEvent) {
  const activeCombo = normalizeCombo(e);
  for (const reg of registry) {
    if (reg.combo.toLowerCase() === activeCombo.toLowerCase()) {
      e.preventDefault();
      reg.handler(e);
      return;
    }
  }
}

export function registerShortcut(combo: string, handler: ShortcutHandler) {
  registry.push({ combo, handler });
  if (!isListening && typeof window !== "undefined") {
    window.addEventListener("keydown", handleGlobalKeyDown);
    isListening = true;
  }
}

export function unregisterShortcut(combo: string) {
  const idx = registry.findIndex((r) => r.combo.toLowerCase() === combo.toLowerCase());
  if (idx !== -1) {
    registry.splice(idx, 1);
  }
  if (registry.length === 0 && isListening && typeof window !== "undefined") {
    window.removeEventListener("keydown", handleGlobalKeyDown);
    isListening = false;
  }
}

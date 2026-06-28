export const COLORS = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  bold: "\x1b[1m",
} as const;

type Color = keyof typeof COLORS;

const NO_COLOR =
  process.env.NO_COLOR !== undefined || process.env.CI === "true" || !process.stdout.isTTY;

function getWidth(): number {
  const fallback = 92;

  if (!process.stdout.isTTY) return fallback;

  const cols = process.stdout.columns ?? fallback;

  // clamp to avoid insane layouts
  return Math.max(60, Math.min(cols, 140));
}

export function c(text: string, color: Color): string {
  if (NO_COLOR) return text;
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

export function hr(char = "─", len?: number): string {
  const width = len ?? getWidth();
  return char.repeat(width);
}

export function label(name: string, value: string): void {
  const width = 24;

  const left = name.length > width - 1 ? name.slice(0, width - 2) + "…" : name;

  console.log(`${c(left.padEnd(width), "cyan")}${value}`);
}

export function section(title: string): void {
  const total = getWidth();
  const text = ` ${title} `;

  const left = Math.floor((total - text.length) / 2);
  const right = total - text.length - left;

  const line = `${hr("═", left)}${text}${hr("═", right)}`;

  console.log(`\n${c(line, "bold")}`);
}

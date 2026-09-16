export const palettes = {
  night: {
    id: "night",
    name: "Night",
    bg: "#0B1220",
    panel: "#111827",
    text: "#F4EFE4",
    muted: "#94A3B8",
    accent: "#E8A24A",
    border: "#334155",
  },
  paper: {
    id: "paper",
    name: "Paper",
    bg: "#F4EFE4",
    panel: "#EDE6D8",
    text: "#1A1714",
    muted: "#6B6258",
    accent: "#B57920",
    border: "#D4CBBA",
  },
  ink: {
    id: "ink",
    name: "Ink",
    bg: "#4A3340",
    panel: "#5A3F4E",
    text: "#F7EFE8",
    muted: "#C9B8BE",
    accent: "#D4B07A",
    border: "#6B4D5C",
  },
} as const;

export type PaletteId = keyof typeof palettes;

export function getPalette(id?: string | null) {
  if (id && id in palettes) return palettes[id as PaletteId];
  return palettes.night;
}
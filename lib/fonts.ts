export const fonts = {
  clean: {
    id: "clean",
    name: "Clean",
    sample: "People teaching people",
    family: "var(--font-sans), ui-sans-serif, system-ui, sans-serif",
  },
  classic: {
    id: "classic",
    name: "Classic",
    sample: "People teaching people",
    family: "var(--font-classic), Georgia, \"Times New Roman\", serif",
  },
  book: {
    id: "book",
    name: "Book",
    sample: "People teaching people",
    family: "var(--font-book), Georgia, serif",
  },
  modern: {
    id: "modern",
    name: "Modern",
    sample: "People teaching people",
    family: "var(--font-modern), ui-sans-serif, sans-serif",
  },
  human: {
    id: "human",
    name: "Human",
    sample: "People teaching people",
    family: "var(--font-human), ui-sans-serif, sans-serif",
  },
} as const;

export type FontId = keyof typeof fonts;

export function getFont(id?: string | null) {
  if (id && id in fonts) return fonts[id as FontId];
  return fonts.clean;
}

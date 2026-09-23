export interface TitleFontOption {
  id: string;
  label: string;
  cssVar: string;
  italic: boolean;
}

export const TITLE_FONTS: TitleFontOption[] = [
  { id: "cormorant", label: "Cormorant", cssVar: "var(--font-display)", italic: true },
  { id: "playfair", label: "Playfair Display", cssVar: "var(--font-playfair)", italic: true },
  { id: "greatvibes", label: "Great Vibes", cssVar: "var(--font-greatvibes)", italic: false },
  { id: "ebgaramond", label: "EB Garamond", cssVar: "var(--font-ebgaramond)", italic: true },
];

export function getTitleFont(id: string): TitleFontOption {
  return TITLE_FONTS.find((f) => f.id === id) ?? TITLE_FONTS[0];
}

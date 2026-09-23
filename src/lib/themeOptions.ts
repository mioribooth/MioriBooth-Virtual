export interface ThemeOption {
  id: "BURGUNDY" | "SKY_BLUE";
  label: string;
  gradientFrom: string;
  gradientTo: string;
  accent: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "BURGUNDY",
    label: "Burgundy",
    gradientFrom: "#9c2a45",
    gradientTo: "#2f0512",
    accent: "#d9bd8a",
  },
  {
    id: "SKY_BLUE",
    label: "Sky Blue",
    gradientFrom: "#3d8fc4",
    gradientTo: "#0b3550",
    accent: "#d9bd8a",
  },
];

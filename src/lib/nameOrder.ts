export type NameOrder = "GROOM_FIRST" | "BRIDE_FIRST";

/** Balikin [nama pertama, nama kedua] sesuai preferensi admin. */
export function orderNames(
  groomName: string,
  brideName: string,
  nameOrder: string
): [string, string] {
  return nameOrder === "BRIDE_FIRST" ? [brideName, groomName] : [groomName, brideName];
}

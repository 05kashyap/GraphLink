// Categorical palette for communities, in a fixed order validated for
// colour-vision deficiency on light and dark surfaces. Communities are sorted
// largest first, so the biggest groups get the most distinct colours; the
// long tail (usually singletons) shares a neutral grey.
const LIGHT = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"];
const DARK = ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300", "#9085e9", "#e66767"];
const OTHER = { light: "#a1a1aa", dark: "#71717a" };

export const PALETTE_SIZE = LIGHT.length;

export function communityColor(community: number | null | undefined, dark: boolean): string {
  if (community == null || community < 0 || community >= PALETTE_SIZE) {
    return dark ? OTHER.dark : OTHER.light;
  }
  return (dark ? DARK : LIGHT)[community];
}

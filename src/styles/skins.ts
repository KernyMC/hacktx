import type { Skin } from "./theme";

// One skin per pet, keyed by pet id (see SPEC.md roster).
export const skins: Record<string, Skin> = {
  mochi: {
    outline: "#3a2340", panel: "#fde4ec", panelLight: "#fff5f8", panelDark: "#f2b8cb",
    button: "#ff8fb3", buttonLight: "#ffc2d6", buttonDark: "#d65f8a",
    text: "#3a2340", buttonText: "#3a2340", accent: "#7fd36b", accentShine: "#c8f5a8", screen: "#f7c6d6",
  },
  pip: {
    outline: "#3d2a14", panel: "#fff3c4", panelLight: "#fffbe6", panelDark: "#f2d47a",
    button: "#f5a623", buttonLight: "#ffc95c", buttonDark: "#c27a12",
    text: "#3d2a14", buttonText: "#3d2a14", accent: "#e8702a", accentShine: "#ffb36b", screen: "#a9cf5c",
  },
  nib: {
    outline: "#2a1f1a", panel: "#efe2cc", panelLight: "#fbf3e4", panelDark: "#cdb595",
    button: "#c8443c", buttonLight: "#e86b5f", buttonDark: "#8f2a24",
    text: "#2a1f1a", buttonText: "#fbf3e4", accent: "#7bb661", accentShine: "#b6e08f", screen: "#4a3b2c",
  },
  clover: {
    outline: "#2b3a24", panel: "#eef7e0", panelLight: "#fbfff3", panelDark: "#c4dea3",
    button: "#79c25a", buttonLight: "#a6e07f", buttonDark: "#4c8a37",
    text: "#2b3a24", buttonText: "#2b3a24", accent: "#f7a1c4", accentShine: "#ffd1e3", screen: "#8cc46a",
  },
  puddle: {
    outline: "#16323a", panel: "#dff4ef", panelLight: "#f4fffc", panelDark: "#a9d9cf",
    button: "#2f9e93", buttonLight: "#5fd0c3", buttonDark: "#1d6b64",
    text: "#16323a", buttonText: "#f4fffc", accent: "#8ad14b", accentShine: "#c6f08f", screen: "#2c6f86",
  },
  sprout: {
    outline: "#3b2417", panel: "#f6e7c1", panelLight: "#fff6dc", panelDark: "#d9a066",
    button: "#a0603a", buttonLight: "#d9a066", buttonDark: "#6b3e26",
    text: "#3b2417", buttonText: "#fff6dc", accent: "#f4c542", accentShine: "#fff3a8", screen: "#8a5232",
  },
  lumi: {
    outline: "#120f26", panel: "#2e2a5c", panelLight: "#a99be0", panelDark: "#1d1b3a",
    button: "#5b4b9a", buttonLight: "#a99be0", buttonDark: "#2e2a5c",
    text: "#f8f4ff", buttonText: "#f8f4ff", accent: "#ffb38a", accentShine: "#ffd6a5", screen: "#1d1b3a",
  },
  ember: {
    outline: "#140606", panel: "#5a2a1e", panelLight: "#c8643a", panelDark: "#331512",
    button: "#e8562a", buttonLight: "#ff8a4c", buttonDark: "#9c2c12",
    text: "#ffe8cf", buttonText: "#fff1de", accent: "#ffc23d", accentShine: "#fff09a", screen: "#3a1a14",
  },
  marina: {
    outline: "#14284a", panel: "#d8f3ff", panelLight: "#f2fbff", panelDark: "#9fd6ee",
    button: "#ff8fb8", buttonLight: "#ffc2d9", buttonDark: "#d05a8a",
    text: "#14284a", buttonText: "#14284a", accent: "#3fc7d8", accentShine: "#a6f1f7", screen: "#1f5f9e",
  },
  aurora: {
    outline: "#2b1d4a", panel: "#fff8e6", panelLight: "#ffffff", panelDark: "#f1d9a6",
    button: "#8a6cff", buttonLight: "#c1b0ff", buttonDark: "#5a3fc9",
    text: "#2b1d4a", buttonText: "#ffffff", accent: "#f4c542", accentShine: "#fff3a8", screen: "#9fb4f0",
  },
};

import { Platform } from "react-native";
export const colors = {
  bg: "#15101F",
  card: "#241B31",
  ink: "#FAF1FA",
  muted: "#C1B5CF",
  line: "#4A385B",
  gold: "#E8C8A0",
  goldDeep: "#E8C8A0",
  red: "#E8C8A0",
  redSoft: "#302239",
  green: "#A8D7CB",
  wealth: "#E8C8A0",
  love: "#EDB5D3",
};
export const space = (n: number) => n * 4;
export const radius = 12;
export const maxWidth = 740;
export const fonts = {
  display: Platform.select({
    ios: "Georgia",
    android: "serif",
    default: 'Georgia, "Times New Roman", serif',
  }),
};

import { COLORS } from "../styles/theme";

const tintColorLight = COLORS.primary;
const tintColorDark = COLORS.primary;

export default {
  light: {
    text: COLORS.black,
    background: COLORS.white,
    tint: tintColorLight,
    tabIconDefault: COLORS.darkMuted,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: COLORS.white,
    background: COLORS.darkBackground,
    tint: tintColorDark,
    tabIconDefault: COLORS.darkMuted,
    tabIconSelected: tintColorDark,
  },
};

import { StyleSheet } from 'react-native';
import { color, font, type } from './tokens';

// Shared text styles so every screen sets typography the same way the CSS
// did (letter-spacing on headings, muted color via one shared token).
export const text = StyleSheet.create({
  h2: { fontFamily: font.heading, fontSize: type.h2, color: color.text, letterSpacing: -0.4 },
  h4: { fontFamily: font.heading, fontSize: type.h4, color: color.text, letterSpacing: -0.3 },
  h5: { fontFamily: font.heading, fontSize: type.h5, color: color.text },
  body: { fontFamily: font.body, fontSize: type.body, color: color.text },
  muted: { fontFamily: font.body, fontSize: 13, color: 'rgba(233,233,237,0.55)' },
  eyebrow: {
    fontFamily: font.body,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: color.accent,
  },
  label: {
    fontFamily: font.body,
    fontSize: 12,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    color: 'rgba(233,233,237,0.6)',
  },
});

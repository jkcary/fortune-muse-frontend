import { Platform } from 'react-native';

export const colors = {
  bg: '#FFF8EC',
  card: '#FFFFFF',
  ink: '#2B2118',
  muted: '#7A6A58',
  line: '#EADFCB',
  gold: '#D4A017',
  goldDeep: '#A87A00',
  red: '#B8322A',
  redSoft: '#F7E1DC',
  green: '#2F7D4F',
  wealth: '#D4A017',
  love: '#D2557A',
};

export const space = (n: number) => n * 4;
export const radius = 14;
export const maxWidth = 560;

export const fonts = {
  display: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, "Times New Roman", serif' }),
};

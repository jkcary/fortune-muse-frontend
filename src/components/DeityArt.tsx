import Svg, { Circle, Ellipse, G, Path, Rect, Text as SvgText } from 'react-native-svg';

/** Original deity characters drawn in code (placeholder until the final illustrations land). */
export function DeityArt({ theme, size = 120 }: { theme: string; size?: number }) {
  const face = (cx: number, cy: number) => (
    <G>
      <Path d={`M${cx - 14} ${cy} Q${cx - 10} ${cy - 5} ${cx - 6} ${cy}`} stroke="#3A2A12" strokeWidth="3" fill="none" strokeLinecap="round" />
      <Path d={`M${cx + 6} ${cy} Q${cx + 10} ${cy - 5} ${cx + 14} ${cy}`} stroke="#3A2A12" strokeWidth="3" fill="none" strokeLinecap="round" />
      <Path d={`M${cx - 8} ${cy + 10} Q${cx} ${cy + 18} ${cx + 8} ${cy + 10}`} stroke="#3A2A12" strokeWidth="3" fill="none" strokeLinecap="round" />
      <Circle cx={cx - 18} cy={cy + 8} r="4" fill="#FF8FA3" opacity={0.5} />
      <Circle cx={cx + 18} cy={cy + 8} r="4" fill="#FF8FA3" opacity={0.5} />
    </G>
  );
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" accessibilityRole="image">
      {theme === 'ingot' && (
        <G>
          <Ellipse cx="60" cy="96" rx="40" ry="6" fill="#000" opacity={0.08} />
          <Path d="M12 58 Q14 92 60 94 Q106 92 108 58 Q90 70 60 70 Q30 70 12 58 Z" fill="#E0A800" />
          <Ellipse cx="60" cy="56" rx="30" ry="22" fill="#F5C518" />
          <Path d="M12 58 Q30 70 60 70 Q90 70 108 58" stroke="#B8860B" strokeWidth="2" fill="none" />
          {face(60, 54)}
          <Path d="M44 34 Q60 20 76 34" stroke="#FFF3B0" strokeWidth="3" fill="none" opacity={0.8} />
        </G>
      )}
      {theme === 'nugget' && (
        <G>
          <Ellipse cx="60" cy="100" rx="34" ry="6" fill="#000" opacity={0.08} />
          <Path d="M26 70 Q18 40 44 28 Q60 16 80 26 Q104 36 98 64 Q102 92 70 96 Q36 100 26 70 Z" fill="#FFC94D" />
          <Path d="M40 40 Q48 32 58 34" stroke="#FFF3B0" strokeWidth="4" fill="none" strokeLinecap="round" />
          <Circle cx="84" cy="44" r="3" fill="#FFF3B0" />
          {face(62, 60)}
          <Path d="M30 30 L34 22 L38 30 L46 32 L38 35 L34 42 L31 35 L22 32 Z" fill="#FFE27A" />
        </G>
      )}
      {theme === 'greenback' && (
        <G>
          <Ellipse cx="60" cy="102" rx="38" ry="5" fill="#000" opacity={0.08} />
          <Rect x="14" y="30" width="92" height="64" rx="8" fill="#5DBB84" />
          <Rect x="20" y="36" width="80" height="52" rx="5" fill="none" stroke="#1E6B43" strokeWidth="2" />
          <Circle cx="60" cy="62" r="20" fill="#A8E0BD" />
          {face(60, 58)}
          <SvgText x="26" y="50" fontSize="11" fontWeight="bold" fill="#1E6B43">$</SvgText>
          <SvgText x="88" y="84" fontSize="11" fontWeight="bold" fill="#1E6B43">$</SvgText>
          <Path d="M40 30 Q60 14 80 30" fill="#2B2118" />
          <Rect x="36" y="27" width="48" height="5" rx="2" fill="#2B2118" />
        </G>
      )}
    </Svg>
  );
}

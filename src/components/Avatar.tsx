import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import type { AvatarData, Mood } from '@/lib/api';

const PALETTES: Record<string, { body: string; dark: string }> = {
  gold: { body: '#F2C14E', dark: '#B8860B' }, jade: { body: '#7FC8A9', dark: '#3E8E6E' },
  coral: { body: '#F48B7B', dark: '#C0503F' }, sky: { body: '#8EC5FF', dark: '#4A7FC0' },
  plum: { body: '#B48BD6', dark: '#7A4FA0' }, mint: { body: '#A8E6CF', dark: '#5BAA8A' },
  peach: { body: '#FFC3A0', dark: '#D98A5F' }, ink: { body: '#6B6F80', dark: '#3A3D4A' },
};
const BACKGROUNDS: Record<string, string> = {
  sunrise: '#FFE3B3', clouds: '#E3F0FF', bamboo: '#DFF2D8', night: '#2E3359', confetti: '#FFE0EC', plain: '#F3EDE3', 'bg-lantern': '#5A1E1E',
};

function Ears({ base, c }: { base: string; c: { body: string; dark: string } }) {
  switch (base) {
    case 'fox': return <G><Path d="M30 38 L36 12 L50 32 Z" fill={c.body} /><Path d="M90 38 L84 12 L70 32 Z" fill={c.body} /></G>;
    case 'cat': return <G><Path d="M32 40 L34 18 L50 32 Z" fill={c.body} /><Path d="M88 40 L86 18 L70 32 Z" fill={c.body} /></G>;
    case 'panda': return <G><Circle cx="36" cy="32" r="11" fill="#2B2118" /><Circle cx="84" cy="32" r="11" fill="#2B2118" /></G>;
    case 'rabbit': return <G><Ellipse cx="45" cy="18" rx="7" ry="20" fill={c.body} /><Ellipse cx="75" cy="18" rx="7" ry="20" fill={c.body} /></G>;
    case 'owl': return <G><Path d="M34 36 L38 16 L50 30 Z" fill={c.dark} /><Path d="M86 36 L82 16 L70 30 Z" fill={c.dark} /></G>;
    case 'koi': return <G><Path d="M60 22 Q70 8 82 20 Q72 24 60 30 Z" fill={c.dark} /></G>;
    default: return null;
  }
}

function Face({ mood }: { mood: Mood }) {
  const eye = '#2B2118';
  const eyes = mood === 'happy'
    ? <G><Path d="M44 62 Q48 56 52 62" stroke={eye} strokeWidth="3" fill="none" strokeLinecap="round" /><Path d="M68 62 Q72 56 76 62" stroke={eye} strokeWidth="3" fill="none" strokeLinecap="round" /></G>
    : mood === 'surprised'
      ? <G><Circle cx="48" cy="60" r="5" fill={eye} /><Circle cx="72" cy="60" r="5" fill={eye} /></G>
      : <G><Circle cx="48" cy="60" r="3.5" fill={eye} /><Circle cx="72" cy="60" r="3.5" fill={eye} /></G>;
  const mouth: Record<Mood, string> = {
    happy: 'M50 74 Q60 84 70 74', calm: 'M52 76 Q60 80 68 76', low: 'M52 80 Q60 74 68 80',
    surprised: 'M56 78 Q60 72 64 78 Q60 84 56 78', hopeful: 'M52 75 Q60 82 68 75',
  };
  return (
    <G>
      {eyes}
      {mood === 'hopeful' && <G><Circle cx="50" cy="58" r="1.2" fill="#fff" /><Circle cx="74" cy="58" r="1.2" fill="#fff" /></G>}
      <Path d={mouth[mood]} stroke={eye} strokeWidth="3" fill={mood === 'surprised' ? eye : 'none'} strokeLinecap="round" />
      <Circle cx="40" cy="70" r="5" fill="#FF8FA3" opacity={0.45} />
      <Circle cx="80" cy="70" r="5" fill="#FF8FA3" opacity={0.45} />
      {mood === 'low' && <Path d="M80 58 Q82 64 80 66 Q78 64 80 58" fill="#7FB3FF" />}
    </G>
  );
}

function Accessory({ name }: { name: string }) {
  switch (name) {
    case 'scarf': return <Path d="M36 88 Q60 100 84 88 L86 96 Q60 108 34 96 Z" fill="#B8322A" />;
    case 'flower': return <G><Circle cx="84" cy="36" r="6" fill="#FF8FA3" /><Circle cx="84" cy="36" r="2.5" fill="#FFD166" /></G>;
    case 'bow': return <G><Path d="M50 32 L60 38 L50 44 Z M70 32 L60 38 L70 44 Z" fill="#D2557A" /><Circle cx="60" cy="38" r="3" fill="#A83A5E" /></G>;
    case 'headphones': return <G><Path d="M30 60 Q30 24 60 24 Q90 24 90 60" stroke="#2B2118" strokeWidth="4" fill="none" /><Rect x="24" y="54" width="10" height="16" rx="4" fill="#2B2118" /><Rect x="86" y="54" width="10" height="16" rx="4" fill="#2B2118" /></G>;
    case 'star-pin': return <Path d="M84 30 L86.5 36 L93 36 L88 40 L90 46 L84 42.5 L78 46 L80 40 L75 36 L81.5 36 Z" fill="#FFD166" />;
    case 'hat-red': return <G><Rect x="40" y="18" width="40" height="18" rx="4" fill="#C8102E" /><Rect x="34" y="34" width="52" height="5" rx="2" fill="#9E0B22" /><Rect x="55" y="22" width="10" height="8" fill="#FFD166" /></G>;
    case 'glasses-gold': return <G stroke="#C8961E" strokeWidth="2.5" fill="none"><Circle cx="48" cy="60" r="9" /><Circle cx="72" cy="60" r="9" /><Path d="M57 60 L63 60" /></G>;
    default: return null;
  }
}

/** Dynamic avatar (plan §M2): gently floats, and its face follows the user's mood. */
export function Avatar({ avatar, size = 96, still }: { avatar: AvatarData; size?: number; still?: boolean }) {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (still) return;
    const speed = avatar.mood === 'low' ? 2600 : avatar.mood === 'happy' || avatar.mood === 'surprised' ? 1100 : 1800;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(y, { toValue: -4, duration: speed, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(y, { toValue: 0, duration: speed, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [avatar.mood, still, y]);

  const c = PALETTES[avatar.customization.palette] ?? PALETTES.gold;
  const bg = BACKGROUNDS[avatar.customization.background] ?? BACKGROUNDS.plain;
  const base = avatar.baseId;
  return (
    <Animated.View style={{ transform: [{ translateY: y }] }} accessibilityRole="image" accessibilityLabel={`${base} avatar, feeling ${avatar.mood}`}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        <Circle cx="60" cy="60" r="58" fill={bg} />
        {avatar.customization.background === 'bg-lantern' && <G><Ellipse cx="22" cy="28" rx="8" ry="10" fill="#E8432E" /><Ellipse cx="100" cy="24" rx="7" ry="9" fill="#E8432E" /></G>}
        <Ears base={base} c={c} />
        <Ellipse cx="60" cy="66" rx="32" ry="30" fill={c.body} />
        {base === 'panda' && <G><Ellipse cx="48" cy="60" rx="8" ry="9" fill="#2B2118" opacity={0.85} /><Ellipse cx="72" cy="60" rx="8" ry="9" fill="#2B2118" opacity={0.85} /></G>}
        {base === 'fox' && <Path d="M38 74 Q60 100 82 74 Q60 86 38 74" fill="#fff" opacity={0.7} />}
        {base === 'owl' && <G><Circle cx="48" cy="60" r="10" fill="#fff" opacity={0.6} /><Circle cx="72" cy="60" r="10" fill="#fff" opacity={0.6} /></G>}
        <Face mood={base === 'panda' && avatar.mood !== 'happy' ? avatar.mood : avatar.mood} />
        <Accessory name={avatar.customization.accessory} />
      </Svg>
    </Animated.View>
  );
}

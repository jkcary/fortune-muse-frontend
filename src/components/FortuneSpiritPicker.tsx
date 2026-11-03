import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { DeityArt } from '@/components/DeityArt';
import type { Deity } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { fonts } from '@/lib/theme';

const nativeDriver = Platform.OS !== 'web';
const INK = '#30233B';
const FILL = { position: 'absolute' as const, top: 0, right: 0, bottom: 0, left: 0 };
const PALETTES: Record<string, { accent: string; pale: string; suit: string }> = {
  ingot: { accent: '#B67B19', pale: '#FFF0CE', suit: '♦' },
  'gold-bar': { accent: '#B87520', pale: '#FBE9C9', suit: '♠' },
  nugget: { accent: '#B87520', pale: '#FBE9C9', suit: '♠' },
  dollar: { accent: '#28715A', pale: '#E2F2E8', suit: '♣' },
  greenback: { accent: '#28715A', pale: '#E2F2E8', suit: '♣' },
  heart: { accent: '#C54C65', pale: '#FCE2E8', suit: '♥' },
  'love-letter': { accent: '#9173B4', pale: '#EFE5F8', suit: '♥' },
  'heart-flame': { accent: '#CE7952', pale: '#FDEBD9', suit: '♥' },
};

export function FortuneSpiritPicker({ deities, selectedId, onSelect }: {
  deities: Deity[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [reduceMotion, setReduceMotion] = useState(true);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => { if (active) setReduceMotion(value); });
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => { active = false; listener.remove(); };
  }, []);

  return (
    <View style={s.deck}>
      {deities.map((deity, index) => (
        <SpiritCard key={deity.id} deity={deity} index={index} selected={deity.id === selectedId}
          reduceMotion={reduceMotion} onSelect={() => onSelect(deity.id)} />
      ))}
    </View>
  );
}

function SpiritCard({ deity, index, selected, reduceMotion, onSelect }: {
  deity: Deity; index: number; selected: boolean; reduceMotion: boolean; onSelect: () => void;
}) {
  const t = useT();
  const palette = PALETTES[deity.theme] ?? PALETTES.ingot;
  const [width, setWidth] = useState(120);
  const [hovered, setHovered] = useState(false);
  const selection = useRef(new Animated.Value(selected ? 1 : 0)).current;
  const press = useRef(new Animated.Value(1)).current;
  const tilt = useRef(new Animated.Value(0)).current;
  const burst = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduceMotion) {
      selection.setValue(selected ? 1 : 0);
      press.setValue(1);
      tilt.setValue(0);
      burst.setValue(1);
      return;
    }
    const animation = Animated.spring(selection, {
      toValue: selected ? 1 : 0, tension: 105, friction: 8, useNativeDriver: nativeDriver,
    });
    animation.start();
    return () => animation.stop();
  }, [selected, reduceMotion, selection, press, tilt, burst]);

  useEffect(() => () => {
    selection.stopAnimation(); press.stopAnimation(); tilt.stopAnimation(); burst.stopAnimation();
  }, [selection, press, tilt, burst]);

  const animatePress = (down: boolean) => {
    if (reduceMotion) return;
    Animated.spring(press, { toValue: down ? 0.96 : 1, tension: 180, friction: 9, useNativeDriver: nativeDriver }).start();
  };

  const choose = () => {
    onSelect();
    if (reduceMotion) return;
    burst.stopAnimation();
    tilt.stopAnimation();
    burst.setValue(0);
    tilt.setValue(0);
    const direction = index % 2 ? -1 : 1;
    Animated.parallel([
      Animated.timing(burst, { toValue: 1, duration: 780, easing: Easing.out(Easing.cubic), useNativeDriver: nativeDriver }),
      Animated.sequence([
        Animated.timing(tilt, { toValue: direction, duration: 110, useNativeDriver: nativeDriver }),
        Animated.spring(tilt, { toValue: 0, tension: 150, friction: 5, useNativeDriver: nativeDriver }),
      ]),
    ]).start();
  };

  return (
    <Animated.View style={[s.slot, {
      zIndex: selected ? 2 : 1,
      transform: [
        { perspective: 700 },
        { translateY: selection.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
        { scale: Animated.multiply(press, selection.interpolate({ inputRange: [0, 1], outputRange: [1, 1.025] })) },
        { rotateZ: tilt.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-4deg', '0deg', '4deg'] }) },
        { rotateY: tilt.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-10deg', '0deg', '10deg'] }) },
      ],
    }]}>
      <Pressable
        testID={`spirit-card-${deity.id}`}
        accessibilityRole="button"
        accessibilityLabel={t(deity.name)}
        accessibilityState={{ selected }}
        aria-pressed={selected}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        onPress={choose}
        onPressIn={() => animatePress(true)}
        onPressOut={() => animatePress(false)}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        style={[s.card, {
          borderColor: selected ? palette.accent : hovered ? '#BBA889' : '#E4D8C5',
          backgroundColor: selected ? '#FFFCF3' : '#FFFDF9',
          boxShadow: selected ? `0px 10px 22px ${palette.accent}30, 0px 2px 5px #30233B12` : '0px 3px 6px #30233B0C',
        }]}
      >
        <View pointerEvents="none" style={[s.frame, { borderColor: selected ? `${palette.accent}70` : '#EDE4D5' }]} />
        <View pointerEvents="none" style={[s.corner, s.cornerTop]}>
          <Text style={[s.rank, { color: palette.accent }]}>A</Text>
          <Text style={[s.suit, { color: palette.accent }]}>{palette.suit}</Text>
        </View>
        <Text pointerEvents="none" style={s.monogram}>FM</Text>
        <View pointerEvents="none" style={[s.corner, s.cornerBottom]}>
          <Text style={[s.rank, { color: palette.accent }]}>A</Text>
          <Text style={[s.suit, { color: palette.accent }]}>{palette.suit}</Text>
        </View>

        <View pointerEvents="none" style={s.portrait}>
          <View style={[s.halo, { width: width * 0.68, height: width * 0.68, backgroundColor: palette.pale }]} />
          <View style={[s.orbit, { width: width * 0.80, height: width * 0.80, borderColor: `${palette.accent}40` }]} />
          <DeityArt theme={deity.theme} size={width * (width < 130 ? 0.76 : 0.88)} />
        </View>

        <View pointerEvents="none" style={s.caption}>
          <Text numberOfLines={1} adjustsFontSizeToFit style={[s.name, { color: INK }]}>{t(deity.name)}</Text>
          <View style={s.status}>
            <View style={[s.rule, { backgroundColor: `${palette.accent}55` }]} />
            <Text style={[s.statusMark, { color: palette.accent }]}>{selected ? '✓' : '✦'}</Text>
            <View style={[s.rule, { backgroundColor: `${palette.accent}55` }]} />
          </View>
        </View>

        <View pointerEvents="none" style={s.sheenClip}>
          <Animated.View style={[s.sheen, {
            opacity: burst.interpolate({ inputRange: [0, 0.08, 0.65, 1], outputRange: [0, 0.75, 0.35, 0] }),
            transform: [
              { translateX: burst.interpolate({ inputRange: [0, 1], outputRange: [-width, width * 1.6] }) },
              { rotate: '22deg' },
            ],
          }]} />
        </View>
      </Pressable>

      <Animated.View pointerEvents="none" style={[s.aura, {
        borderColor: palette.accent,
        opacity: burst.interpolate({ inputRange: [0, 0.12, 1], outputRange: [0, 0.5, 0] }),
        transform: [{ scale: burst.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] }) }],
      }]} />
      {Array.from({ length: 6 }, (_, particle) => {
        const angle = (particle / 6) * Math.PI * 2 - Math.PI / 2;
        return (
          <Animated.Text key={particle} pointerEvents="none" accessible={false} aria-hidden style={[s.spark, {
            color: particle % 2 ? palette.accent : '#E5B63F',
            opacity: burst.interpolate({ inputRange: [0, 0.08, 0.65, 1], outputRange: [0, 1, 0.75, 0] }),
            transform: [
              { translateX: burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(angle) * width * 0.62] }) },
              { translateY: burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(angle) * width * 0.78] }) },
              { scale: burst.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.3, 1.2, 0.2] }) },
              { rotate: burst.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '100deg'] }) },
            ],
          }]}>{deity.topic === 'love' ? '♥' : '✦'}</Animated.Text>
        );
      })}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  deck: { flexDirection: 'row', gap: 10, paddingTop: 14, paddingBottom: 12, marginBottom: 12 },
  slot: { flex: 1, minWidth: 0 },
  card: { width: '100%', aspectRatio: 5 / 7, borderWidth: 1.5, borderRadius: 13 },
  frame: { ...FILL, margin: 6, borderWidth: 1, borderRadius: 8 },
  corner: { position: 'absolute', alignItems: 'center', zIndex: 1 },
  cornerTop: { top: 10, left: 11 },
  cornerBottom: { right: 11, bottom: 10, transform: [{ rotate: '180deg' }] },
  rank: { fontFamily: fonts.display, fontWeight: '700', fontSize: 17, lineHeight: 18 },
  suit: { fontSize: 13, lineHeight: 15 },
  monogram: { position: 'absolute', alignSelf: 'center', top: 14, fontSize: 8, fontWeight: '700', letterSpacing: 3, color: '#B7A58D' },
  portrait: { position: 'absolute', top: '15%', bottom: '35%', left: 0, right: 0, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', borderRadius: 999 },
  orbit: { position: 'absolute', borderRadius: 999, borderWidth: 1, borderStyle: 'dashed', transform: [{ rotate: '20deg' }] },
  caption: { position: 'absolute', bottom: 13, left: 22, right: 22, alignItems: 'center' },
  name: { fontFamily: fonts.display, fontWeight: '700', fontSize: 15, letterSpacing: 0.3, maxWidth: '100%' },
  status: { flexDirection: 'row', gap: 5, alignItems: 'center', marginTop: 4 },
  rule: { width: 12, height: 1 },
  statusMark: { fontSize: 11, lineHeight: 13, fontWeight: '700' },
  sheenClip: { ...FILL, overflow: 'hidden', borderRadius: 12 },
  sheen: { position: 'absolute', left: 0, top: '-30%', bottom: '-30%', width: '40%', backgroundColor: '#FFFFFF' },
  aura: { ...FILL, borderWidth: 2, borderRadius: 14 },
  spark: { position: 'absolute', left: '46%', top: '44%', fontSize: 17, zIndex: 3 },
});

import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import type { Deity } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { colors, fonts, radius, space } from '@/lib/theme';
import { DeityArt } from './DeityArt';

const native = Platform.OS !== 'web';

function useReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}

function ThinkingDots() {
  const v = useRef(new Animated.Value(0)).current;
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(Animated.timing(v, { toValue: 3, duration: 1200, easing: Easing.linear, useNativeDriver: native }));
    loop.start();
    return () => loop.stop();
  }, [v, reduce]);
  return (
    <View style={{ flexDirection: 'row', gap: 6, paddingVertical: 4, alignSelf: 'center' }}>
      {[0, 1, 2].map((i) => (
        <Animated.View key={i} style={[s.dot, !reduce && {
          opacity: v.interpolate({ inputRange: [0, i, i + 0.5, i + 1, 3], outputRange: [0.3, 0.3, 1, 0.3, 0.3], extrapolate: 'clamp' }),
        }]} />
      ))}
    </View>
  );
}

/**
 * The spirit face to face: a large portrait with a warm glow and its latest line in a speech bubble.
 * It breathes while idle, nods when the user sends (`nudge`), hops when a new line arrives, shows
 * thinking dots while waiting and a glow ring while the mic listens. Motion is off with Reduce Motion.
 */
export function SpiritStage({ deity, line, thinking, listening, nudge, compact }: {
  deity: Deity; line: string; thinking: boolean; listening: boolean; nudge: number; compact: boolean;
}) {
  const t = useT();
  const reduce = useReducedMotion();
  const size = compact ? 84 : 150;
  const breathe = useRef(new Animated.Value(0)).current;
  const hop = useRef(new Animated.Value(0)).current;
  const nod = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(breathe, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: native }),
      Animated.timing(breathe, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: native }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [breathe, reduce]);

  // A small hop each time the spirit says something new.
  useEffect(() => {
    if (reduce || thinking) return;
    hop.setValue(0);
    Animated.sequence([
      Animated.timing(hop, { toValue: 1, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: native }),
      Animated.spring(hop, { toValue: 0, friction: 4, tension: 120, useNativeDriver: native }),
    ]).start();
  }, [line, thinking, hop, reduce]);

  // A nod when the user sends a message.
  useEffect(() => {
    if (reduce || !nudge) return;
    Animated.sequence([
      Animated.timing(nod, { toValue: 1, duration: 140, useNativeDriver: native }),
      Animated.timing(nod, { toValue: 0, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: native }),
    ]).start();
  }, [nudge, nod, reduce]);

  useEffect(() => {
    if (!listening || reduce) { ring.setValue(0); return; }
    const loop = Animated.loop(Animated.timing(ring, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: native }));
    loop.start();
    return () => loop.stop();
  }, [listening, ring, reduce]);

  const glow = size * 1.3;
  return (
    <View style={[s.stage, compact && s.stageCompact]}>
      <View style={[s.portrait, { width: glow, height: glow }]}>
        <View style={[s.glowOuter, { width: glow, height: glow, borderRadius: glow / 2 }]} />
        <View style={[s.glowInner, { width: glow * 0.78, height: glow * 0.78, borderRadius: glow * 0.39 }]} />
        {listening && (
          <Animated.View pointerEvents="none" style={[s.ring, { width: glow * 0.86, height: glow * 0.86, borderRadius: glow * 0.43 },
            reduce ? { opacity: 0.8 } : {
              opacity: ring.interpolate({ inputRange: [0, 1], outputRange: [0.85, 0] }),
              transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.18] }) }],
            }]} />
        )}
        <Animated.View style={{ transform: [
          { translateY: Animated.add(breathe.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }), hop.interpolate({ inputRange: [0, 1], outputRange: [0, -10] })) },
          { scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.025] }) },
          { rotate: nod.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-6deg'] }) },
        ] }}>
          <DeityArt theme={deity.theme} size={size} />
        </Animated.View>
      </View>
      {!compact && <Text style={s.name}>{t(deity.name)} · {t(deity.title)}</Text>}
      <View style={s.speech} accessibilityLiveRegion="polite">
        <View style={s.tail} />
        {thinking ? <ThinkingDots /> : <Text style={[s.speechText, compact && { fontSize: 15, lineHeight: 21 }]}>{line}</Text>}
        {listening && !thinking && <Text style={s.listening}>{t('{name} is listening…', { name: t(deity.name) })}</Text>}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  stage: { alignItems: 'center', paddingTop: space(1), paddingBottom: space(4) },
  stageCompact: { paddingBottom: space(3) },
  portrait: { alignItems: 'center', justifyContent: 'center' },
  glowOuter: { position: 'absolute', backgroundColor: '#FFF0C9', opacity: 0.9 },
  glowInner: { position: 'absolute', backgroundColor: '#FFE19A', opacity: 0.55 },
  ring: { position: 'absolute', borderWidth: 3, borderColor: colors.red },
  name: { fontFamily: fonts.display, fontSize: 15, fontWeight: '700', color: colors.goldDeep, marginTop: space(1) },
  speech: {
    alignSelf: 'stretch', marginTop: space(3), backgroundColor: '#fff', borderRadius: radius + 4, borderWidth: 1, borderColor: colors.line,
    paddingHorizontal: space(4), paddingVertical: space(3), minHeight: 52, justifyContent: 'center',
    shadowColor: '#B8860B', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  tail: {
    position: 'absolute', top: -8, left: '50%', marginLeft: -8, width: 16, height: 16, backgroundColor: '#fff',
    borderLeftWidth: 1, borderTopWidth: 1, borderColor: colors.line, transform: [{ rotate: '45deg' }],
  },
  speechText: { fontSize: 17, lineHeight: 25, color: colors.ink, textAlign: 'center' },
  listening: { fontSize: 12, color: colors.red, textAlign: 'center', marginTop: space(1) },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.goldDeep, alignSelf: 'center' },
});

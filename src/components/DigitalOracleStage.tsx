import { useEffect, useId, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import Svg, {
  Defs,
  Ellipse,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { LocalizedText as Text } from "./LocalizedText";
import { colors, fonts } from "@/lib/theme";

export type OraclePresence =
  "idle" | "listening" | "thinking" | "speaking" | "review";
const images = {
  listening: require("@/assets/images/selene-listening.png"),
  thinking: require("@/assets/images/selene-thinking.png"),
  speaking: require("@/assets/images/selene-speaking.png"),
};
export function DigitalOracleStage({
  presence,
  words,
  subtitle,
  compact,
  reduced,
  microphone = false,
}: {
  presence: OraclePresence;
  words: string;
  subtitle: string;
  compact: boolean;
  reduced: boolean;
  microphone?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  const breath = useRef(new Animated.Value(0)).current;
  const flow = useRef(new Animated.Value(0)).current;
  const thought = useRef(new Animated.Value(0)).current;
  const speaking = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) {
      breath.setValue(0);
      flow.setValue(0);
      return;
    }
    const breathing = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: 3400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: 3400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== "web",
        }),
      ]),
    );
    const drifting = Animated.loop(
      Animated.timing(flow, {
        toValue: 1,
        duration: 18000,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== "web",
      }),
    );
    breathing.start();
    drifting.start();
    return () => {
      breathing.stop();
      drifting.stop();
    };
  }, [reduced, breath, flow]);
  useEffect(() => {
    const a = Animated.timing(thought, {
      toValue: presence === "thinking" ? 1 : 0,
      duration: reduced ? 0 : 450,
      useNativeDriver: Platform.OS !== "web",
    });
    const b = Animated.timing(speaking, {
      toValue: presence === "speaking" ? 1 : 0,
      duration: reduced ? 0 : 350,
      useNativeDriver: Platform.OS !== "web",
    });
    a.start();
    b.start();
    return () => {
      a.stop();
      b.stop();
    };
  }, [presence, reduced, thought, speaking]);
  const status = {
    idle: "A moment, just for you",
    listening: microphone
      ? "Listening to your voice"
      : "Listening to your words",
    thinking: "Reflecting on your words",
    speaking: "Selene is responding",
    review: "Your words. Your confirmation.",
  }[presence];
  const chunks =
    words
      .trim()
      .match(/.{1,36}/gu)
      ?.slice(-4) ?? [];
  return (
    <View style={[s.stage, { height: compact ? 430 : 570 }]}>
      <Svg
        style={StyleSheet.absoluteFill}
        width="100%"
        height="100%"
        viewBox="0 0 1000 600"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden={true}
      >
        <Defs>
          <RadialGradient id={id}>
            <Stop
              stopColor={presence === "listening" ? "#805277" : "#68437E"}
              stopOpacity=".8"
            />
            <Stop offset="1" stopColor="#17101F" />
          </RadialGradient>
        </Defs>
        <Rect width="1000" height="600" fill={"url(#" + id + ")"} />
        <Ellipse
          cx="500"
          cy="287"
          rx="214"
          ry="245"
          fill="none"
          stroke="#D8BA98"
          strokeOpacity=".3"
        />
        <Ellipse
          cx="500"
          cy="287"
          rx="282"
          ry="190"
          transform="rotate(-24 500 287)"
          fill="none"
          stroke="#D8BA98"
          strokeOpacity=".13"
        />
      </Svg>
      <Animated.View
        pointerEvents="none"
        aria-hidden={true}
        style={[
          s.words,
          {
            transform: [
              {
                translateY: flow.interpolate({
                  inputRange: [0, 1],
                  outputRange: [40, -80],
                }),
              },
            ],
          },
        ]}
      >
        {chunks.map((chunk, i) => (
          <Text
            key={i}
            localize={false}
            numberOfLines={2}
            style={{
              color: "#EBD5F3",
              opacity: 0.18,
              fontFamily: fonts.display,
              fontSize: compact ? 19 : 30,
              width: "55%",
              alignSelf: i % 2 ? "flex-end" : "flex-start",
              marginTop: 35,
            }}
          >
            {chunk}
          </Text>
        ))}
      </Animated.View>
      <View style={s.identity}>
        <Text style={s.name}>Selene</Text>
        <Text style={s.tag}>YOUR AI ORACLE GUIDE</Text>
      </View>
      <View style={s.status}>
        <View
          style={{
            width: 5,
            height: 5,
            borderRadius: 9,
            backgroundColor:
              presence === "thinking" ? colors.gold : colors.love,
          }}
        />
        <Text style={s.statusText}>{status}</Text>
      </View>
      <Animated.View
        pointerEvents="none"
        style={[
          s.person,
          {
            width: compact ? 300 : 410,
            height: compact ? 375 : 512,
            transform: [
              {
                translateY: breath.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -4],
                }),
              },
              {
                scale: breath.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.008],
                }),
              },
            ],
          },
        ]}
      >
        <Image
          source={images.listening}
          style={s.image}
          resizeMode="contain"
          accessibilityLabel="Selene, your fictional AI oracle guide"
        />
        <Animated.Image
          source={images.thinking}
          style={[s.image, { opacity: thought }]}
          resizeMode="contain"
          aria-hidden={true}
        />
        <Animated.Image
          source={images.speaking}
          style={[s.image, { opacity: speaking }]}
          resizeMode="contain"
          aria-hidden={true}
        />
      </Animated.View>
      <View style={s.caption} accessibilityLiveRegion="polite">
        <Text
          localize={false}
          style={{
            color: colors.ink,
            fontSize: compact ? 14 : 17,
            lineHeight: compact ? 24 : 28,
            textAlign: "center",
          }}
        >
          {subtitle}
        </Text>
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  stage: {
    position: "relative",
    backgroundColor: "#17101F",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#634869",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  person: { position: "absolute", bottom: -10, alignSelf: "center" },
  image: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  words: { position: "absolute", top: 70, left: 26, right: 26 },
  identity: { position: "absolute", left: 22, top: 18, gap: 3, zIndex: 2 },
  name: { fontFamily: fonts.display, color: colors.ink, fontSize: 24 },
  tag: { color: colors.gold, fontSize: 8, letterSpacing: 1.2 },
  status: {
    position: "absolute",
    top: 22,
    right: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    maxWidth: "48%",
  },
  statusText: { color: colors.muted, fontSize: 10, lineHeight: 17 },
  caption: {
    width: "100%",
    zIndex: 3,
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: "#170F24EA",
    borderTopWidth: 1,
    borderColor: "#604362",
    minHeight: 88,
    justifyContent: "center",
  },
});

import { useId } from "react";
import { Animated, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { LocalizedText as Text } from "./LocalizedText";
import { useAmbientMotion } from "@/lib/useAmbientMotion";
import { useT } from "@/lib/i18n";
import { colors } from "@/lib/theme";

const points = [
  [72, 130],
  [132, 80],
  [205, 112],
  [270, 65],
  [337, 105],
  [405, 70],
  [472, 130],
];
export function OracleGenerationSky({
  status,
  bits,
}: {
  status: "queued" | "generating";
  bits: string;
}) {
  const { phase } = useAmbientMotion(4200),
    t = useT();
  const id = useId().replace(/:/g, "");
  const queued = status === "queued";
  const label = queued
    ? "Your reading is queued. A little sky is gathering."
    : "Connecting your question with your hexagram…";
  return (
    <View style={{ gap: 18 }}>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={t(label)}
        accessibilityValue={{
          text: t(
            queued ? "Waiting to begin" : "Generating your interpretation",
          ),
        }}
        style={{
          height: 220,
          overflow: "hidden",
          borderRadius: 20,
          backgroundColor: "#211B32",
          borderWidth: 1,
          borderColor: "#56405F",
        }}
      >
        <View
          pointerEvents="none"
          aria-hidden={true}
          style={{ position: "absolute", width: "100%", height: "100%" }}
        >
          <Svg
            width="100%"
            height="100%"
            viewBox="0 0 540 220"
            preserveAspectRatio="xMidYMid slice"
          >
            <Defs>
              <RadialGradient id={`${id}nebula`}>
                <Stop stopColor="#986DB0" stopOpacity=".32" />
                <Stop offset="1" stopColor="#272039" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect width="540" height="220" fill="#211B32" />
            <Ellipse
              cx="275"
              cy="112"
              rx="255"
              ry="110"
              fill={`url(#${id}nebula)`}
            />
            {Array.from({ length: 48 }, (_, i) => (
              <Circle
                key={i}
                cx={12 + ((i * 83) % 516)}
                cy={9 + ((i * 47) % 201)}
                r={i % 6 === 0 ? 1.6 : 0.8}
                fill="#EAD8F3"
                opacity={0.2 + (i % 4) * 0.13}
              />
            ))}
            <Ellipse
              cx="270"
              cy="110"
              rx="164"
              ry="69"
              stroke="#AD91B5"
              strokeOpacity=".22"
              fill="none"
              transform="rotate(-16 270 110)"
            />
            <Ellipse
              cx="270"
              cy="110"
              rx="108"
              ry="87"
              stroke="#C9A779"
              strokeOpacity=".15"
              fill="none"
              transform="rotate(24 270 110)"
            />
          </Svg>
        </View>
        <Animated.View
          pointerEvents="none"
          aria-hidden={true}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            opacity: phase.interpolate({
              inputRange: [0, 1],
              outputRange: [0.55, 1],
            }),
            transform: [
              {
                scale: phase.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.98, 1.035],
                }),
              },
            ],
          }}
        >
          <Svg width="100%" height="100%" viewBox="0 0 540 220">
            <Path
              d="M72 130 132 80 205 112 270 65 337 105 405 70 472 130"
              fill="none"
              stroke="#D6B8DD"
              strokeWidth="1"
              strokeDasharray={queued ? "2 8" : undefined}
            />
            {points.map(([x, y], i) => (
              <Circle
                key={i}
                cx={x}
                cy={y}
                r={i === 3 ? 5 : 3}
                fill={queued ? "#C8B3D2" : "#F3D9AF"}
              />
            ))}
            <Circle cx="270" cy="110" r="28" fill="#BDA3CB" opacity=".1" />
            <Circle cx="270" cy="110" r="18" fill="#E8D7E6" opacity=".9" />
            <Circle cx="265" cy="104" r="5" fill="#FFF3E5" />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Path
                key={i}
                d={
                  bits[5 - i] === "1"
                    ? `M252 ${153 + i * 5}h36`
                    : `M252 ${153 + i * 5}h14m8 0h14`
                }
                stroke="#E7CBA7"
                strokeWidth="2"
                opacity=".5"
              />
            ))}
          </Svg>
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          aria-hidden={true}
          style={{
            position: "absolute",
            left: "50%",
            top: 8,
            width: 2,
            height: 204,
            transform: [
              {
                rotate: phase.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["-110deg", "250deg"],
                }),
              },
            ],
          }}
        >
          <View
            style={{
              width: 5,
              height: 5,
              borderRadius: 3,
              backgroundColor: "#FFE2B2",
              shadowColor: "#EDBBDD",
              shadowOpacity: 0.9,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 0 },
            }}
          />
        </Animated.View>
      </View>
      <Text
        accessibilityLiveRegion="polite"
        style={{
          textAlign: "center",
          color: colors.ink,
          fontSize: 14,
          lineHeight: 23,
        }}
      >
        {label}
      </Text>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {["In the queue", "Weaving your reading", "Ready to reveal"].map(
          (step, i) => (
            <View
              key={step}
              style={{
                flex: 1,
                gap: 7,
                borderTopWidth: 2,
                borderColor: i <= (queued ? 0 : 1) ? colors.gold : colors.line,
                paddingTop: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  lineHeight: 18,
                  color: i === (queued ? 0 : 1) ? colors.gold : colors.muted,
                }}
              >
                {step}
              </Text>
            </View>
          ),
        )}
      </View>
    </View>
  );
}

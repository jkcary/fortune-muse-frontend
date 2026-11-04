import { useEffect, useId, useRef } from "react";
import { Animated, Easing, Platform, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
  G,
} from "react-native-svg";
import { useCalmMotion } from "./OracleArt";

/** The opening is decorative. Choice changes the exploration, never the recorded cast. */
export function OracleDoorArt({
  open,
  rose = false,
  bits,
}: {
  open: boolean;
  rose?: boolean;
  bits: string;
}) {
  const id = useId().replace(/:/g, "");
  const reduced = useCalmMotion();
  const progress = useRef(new Animated.Value(open ? 1 : 0)).current;
  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: reduced ? 0 : 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== "web",
    });
    animation.start();
    return () => animation.stop();
  }, [open, reduced, progress]);
  const accent = rose ? "#EDB5D3" : "#E8C8A0";
  return (
    <View
      pointerEvents="none"
      aria-hidden={true}
      style={{ height: 172, width: "100%", alignItems: "center" }}
    >
      <Svg width="100%" height="172" viewBox="55 0 150 180">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <Stop stopColor={rose ? "#734765" : "#586E82"} />
            <Stop offset="1" stopColor="#20162F" />
          </LinearGradient>
        </Defs>
        <Path
          d="M65 165V72a65 65 0 0 1 130 0v93Z"
          fill={`url(#${id})`}
          stroke={accent}
          strokeWidth="1.2"
        />
        <Circle
          cx={rose ? 143 : 116}
          cy="62"
          r="22"
          fill={accent}
          opacity=".85"
        />
        <Circle cx="94" cy="43" r="1.4" fill="#FFF4EF" />
        <Circle cx="167" cy="88" r="1" fill="#FFF4EF" />
        <Path
          d={
            rose
              ? "M66 129Q98 109 130 132T194 120V164H66Z"
              : "M66 140 102 93 138 133 161 109 194 143V164H66Z"
          }
          fill={rose ? "#805B7C" : "#3D5B6B"}
        />
        <Path
          d="M66 150Q110 129 153 148T194 142V164H66Z"
          fill={rose ? "#483251" : "#2C3B50"}
        />
        <Path
          d="M55 165h150M60 171h140M70 177h120"
          stroke={accent}
          strokeOpacity=".3"
        />
        <Path
          d="M58 164V72a72 72 0 0 1 144 0v92"
          stroke={accent}
          strokeOpacity=".35"
          fill="none"
        />
      </Svg>
      <Animated.View
        style={{
          position: "absolute",
          width: "100%",
          maxWidth: 260,
          height: 172,
          opacity: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0],
          }),
          transform: [
            {
              scaleX: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0.55],
              }),
            },
            {
              translateX: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -35],
              }),
            },
          ],
        }}
      >
        <Svg width="100%" height="172" viewBox="55 0 150 180">
          <Path
            d="M65 165V72a65 65 0 0 1 130 0v93Z"
            fill={rose ? "#3C2442" : "#302639"}
            stroke={accent}
            strokeWidth="1.2"
          />
          <Path
            d="M77 156V72a53 53 0 0 1 106 0v84Z"
            fill="none"
            stroke={accent}
            strokeOpacity=".25"
          />
          <Circle
            cx="130"
            cy="86"
            r="31"
            stroke={accent}
            strokeOpacity=".4"
            fill="none"
          />
          <G stroke={accent} strokeWidth="2.4">
            {bits
              .split("")
              .slice()
              .reverse()
              .map((bit, i) =>
                bit === "1" ? (
                  <Path key={i} d={`M114 ${70 + i * 6.5}h32`} />
                ) : (
                  <Path key={i} d={`M114 ${70 + i * 6.5}h13m6 0h13`} />
                ),
              )}
          </G>
          <Rect x="174" y="116" width="3" height="14" rx="1.5" fill={accent} />
        </Svg>
      </Animated.View>
    </View>
  );
}

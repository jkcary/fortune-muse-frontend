import { useId } from "react";
import { Animated, StyleSheet, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";

/** The six real cast lines settle bottom-to-top; the three coin lights converge. */
export function OracleSeal({
  bits,
  love,
  size = 320,
  progress,
}: {
  bits: string;
  love: boolean;
  size?: number;
  progress: Animated.Value;
}) {
  const id = useId().replace(/:/g, "");
  const accent = love ? "#EABEDC" : "#E9D1A1";
  return (
    <View
      accessible={false}
      style={{ width: size, height: size, alignSelf: "center" }}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: progress.interpolate({
              inputRange: [0, 0.65, 1],
              outputRange: [0.2, 0.8, 1],
            }),
            transform: [
              {
                scale: progress.interpolate({
                  inputRange: [0, 0.7, 1],
                  outputRange: [1.18, 0.96, 1],
                }),
              },
              {
                rotate: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["-24deg", "0deg"],
                }),
              },
            ],
          },
        ]}
      >
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 400 400"
          aria-hidden={true}
        >
          <Defs>
            <RadialGradient id={`${id}halo`}>
              <Stop stopColor={accent} stopOpacity=".34" />
              <Stop offset=".65" stopColor="#9E72C5" stopOpacity=".12" />
              <Stop offset="1" stopColor="#181020" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="200" cy="200" r="200" fill={`url(#${id}halo)`} />
          {[157, 171, 185].map((r, i) => (
            <Circle
              key={r}
              cx="200"
              cy="200"
              r={r}
              fill="none"
              stroke={accent}
              strokeOpacity={i === 1 ? 0.65 : 0.22}
              strokeWidth={i === 1 ? 0.9 : 0.5}
            />
          ))}
          {Array.from({ length: 48 }, (_, i) => (
            <G key={i} transform={`rotate(${i * 7.5} 200 200)`}>
              <Line
                x1="200"
                y1={i % 4 === 0 ? 13 : 19}
                x2="200"
                y2="26"
                stroke={accent}
                strokeOpacity={i % 4 === 0 ? 0.8 : 0.28}
                strokeWidth=".8"
              />
            </G>
          ))}
          <Ellipse
            cx="200"
            cy="200"
            rx="195"
            ry="68"
            transform="rotate(-32 200 200)"
            stroke={accent}
            strokeOpacity=".35"
            fill="none"
          />
          {[0, 90, 180, 270].map((a) => (
            <Path
              key={a}
              transform={`rotate(${a} 200 200)`}
              d="M200 6 204 16 200 26 196 16Z"
              fill={accent}
            />
          ))}
        </Svg>
      </Animated.View>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: progress.interpolate({
              inputRange: [0, 0.2, 0.8, 1],
              outputRange: [0.1, 0.65, 0.9, 1],
            }),
            transform: [
              {
                scale: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.72, 1],
                }),
              },
            ],
          },
        ]}
      >
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 400 400"
          aria-hidden={true}
        >
          <Defs>
            <RadialGradient id={`${id}pearl`} cx="32%" cy="24%" r="83%">
              <Stop stopColor="#FFFAEF" />
              <Stop offset=".2" stopColor="#EFE2EF" />
              <Stop offset=".48" stopColor={love ? "#CCA9CE" : "#C6B9D7"} />
              <Stop offset=".7" stopColor="#61577C" />
              <Stop offset=".9" stopColor="#3A294C" />
              <Stop offset="1" stopColor="#9C7B9A" />
            </RadialGradient>
            <LinearGradient id={`${id}rim`} x1="0" y1="0" x2="1" y2="1">
              <Stop stopColor="#FFF4D7" />
              <Stop offset=".4" stopColor="#D0ACC8" />
              <Stop offset=".75" stopColor="#8C699E" />
              <Stop offset="1" stopColor="#F7DEBA" />
            </LinearGradient>
          </Defs>
          <Circle
            cx="200"
            cy="200"
            r="139"
            fill={`url(#${id}pearl)`}
            stroke={`url(#${id}rim)`}
            strokeWidth="2"
          />
          <Circle
            cx="200"
            cy="200"
            r="130"
            fill="none"
            stroke="#FFF8EE"
            strokeOpacity=".25"
            strokeWidth=".6"
          />
          <Ellipse
            cx="165"
            cy="114"
            rx="50"
            ry="18"
            transform="rotate(-28 165 114)"
            fill="#FFFFFF"
            fillOpacity=".16"
          />
          <Circle
            cx="200"
            cy="203"
            r="94"
            fill="#271B39"
            fillOpacity=".65"
            stroke={accent}
            strokeOpacity=".55"
            strokeWidth=".8"
          />
          <Circle
            cx="200"
            cy="203"
            r="102"
            fill="none"
            stroke={accent}
            strokeOpacity=".25"
            strokeDasharray="1 7"
          />
        </Svg>
      </Animated.View>
      {[...bits].map((bit, i) => {
        const start = 0.08 + i * 0.085;
        return (
          <Animated.View
            key={i}
            style={{
              position: "absolute",
              left: size * 0.35,
              top: size * (0.645 - i * 0.056),
              width: size * 0.3,
              height: size * 0.018,
              opacity: progress.interpolate({
                inputRange: [0, start, start + 0.12, 1],
                outputRange: [0, 0, 1, 1],
                extrapolate: "clamp",
              }),
              transform: [
                {
                  translateY: progress.interpolate({
                    inputRange: [0, start, start + 0.12, 1],
                    outputRange: [12, 12, 0, 0],
                  }),
                },
              ],
            }}
          >
            <Svg
              width="100%"
              height="100%"
              viewBox="0 0 100 6"
              aria-hidden={true}
            >
              {bit === "1" ? (
                <Rect width="100" height="6" rx="1" fill={accent} />
              ) : (
                <>
                  <Rect width="43" height="6" rx="1" fill={accent} />
                  <Rect x="57" width="43" height="6" rx="1" fill={accent} />
                </>
              )}
            </Svg>
          </Animated.View>
        );
      })}
      {[0, 1, 2].map((i) => {
        const angle = ((-90 + i * 120) * Math.PI) / 180;
        return (
          <Animated.View
            key={i}
            style={{
              position: "absolute",
              left: size / 2 - 12,
              top: size / 2 - 12,
              width: 24,
              height: 24,
              opacity: progress.interpolate({
                inputRange: [0, 0.55, 0.75, 1],
                outputRange: [0.9, 0.7, 0, 0],
              }),
              transform: [
                {
                  translateX: progress.interpolate({
                    inputRange: [0, 0.75, 1],
                    outputRange: [Math.cos(angle) * size * 0.43, 0, 0],
                  }),
                },
                {
                  translateY: progress.interpolate({
                    inputRange: [0, 0.75, 1],
                    outputRange: [Math.sin(angle) * size * 0.43, 0, 0],
                  }),
                },
                {
                  scale: progress.interpolate({
                    inputRange: [0, 0.75, 1],
                    outputRange: [1, 0.3, 0.3],
                  }),
                },
              ],
            }}
          >
            <Svg width="24" height="24" viewBox="0 0 24 24" aria-hidden={true}>
              <Circle cx="12" cy="12" r="10" fill="#3D2C45" stroke={accent} />
              <Rect x="9" y="9" width="6" height="6" fill={accent} />
              <Circle
                cx="12"
                cy="12"
                r="7"
                fill="none"
                stroke={accent}
                strokeOpacity=".4"
              />
            </Svg>
          </Animated.View>
        );
      })}
    </View>
  );
}

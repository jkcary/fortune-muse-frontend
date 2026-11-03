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
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  View,
} from "react-native";
import { useEffect, useRef, useState, useId } from "react";

export function useCalmMotion() {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (alive) setReduced(v);
    });
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduced,
    );
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return reduced;
}
export function HexagramGlyph({
  bits = "111111",
  moving = [],
  size = 100,
  color = "#D0B47A",
}: {
  bits?: string;
  moving?: number[];
  size?: number;
  color?: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      accessibilityLabel="Six-line hexagram"
    >
      {[...bits].map((bit, i) => {
        const y = 83 - i * 14;
        const fill = moving.includes(i + 1) ? "#E8B0CB" : color;
        return bit === "1" ? (
          <Rect key={i} x={12} y={y} width={76} height={6} rx={1} fill={fill} />
        ) : (
          <G key={i}>
            <Rect x={12} y={y} width={32} height={6} rx={1} fill={fill} />
            <Rect x={56} y={y} width={32} height={6} rx={1} fill={fill} />
          </G>
        );
      })}
    </Svg>
  );
}
export function OracleArt({
  love = false,
  size = 420,
  animate = true,
}: {
  love?: boolean;
  size?: number;
  animate?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const motion = useRef(new Animated.Value(0)).current;
  const reduced = useCalmMotion();
  useEffect(() => {
    if (reduced || !animate) {
      motion.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(motion, {
          toValue: 1,
          duration: 4800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(motion, {
          toValue: 0,
          duration: 4800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== "web",
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, animate, motion]);
  const main = love ? "#D2A1BC" : "#D9BB7B";
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        width: size,
        height: size,
        transform: [
          {
            translateY: motion.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -9],
            }),
          },
        ],
      }}
    >
      <Svg
        width={size}
        height={size}
        viewBox="0 0 520 520"
        accessibilityLabel={
          love
            ? "Rose-gold orbital coin sculpture"
            : "Golden I Ching coin sculpture"
        }
      >
        <Defs>
          <RadialGradient id={uid + "halo"}>
            <Stop
              offset="0"
              stopColor={love ? "#663450" : "#65502A"}
              stopOpacity=".38"
            />
            <Stop
              offset=".6"
              stopColor={love ? "#3B233B" : "#393022"}
              stopOpacity=".13"
            />
            <Stop offset="1" stopColor="#090B10" stopOpacity="0" />
          </RadialGradient>
          <LinearGradient id={uid + "metal"} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={love ? "#F2CAD8" : "#FFF0C0"} />
            <Stop offset=".2" stopColor={love ? "#A77791" : "#A37E43"} />
            <Stop offset=".48" stopColor={love ? "#F6DCE7" : "#EAD49A"} />
            <Stop offset=".7" stopColor={love ? "#795569" : "#795623"} />
            <Stop offset="1" stopColor={love ? "#D0A8BC" : "#D8B870"} />
          </LinearGradient>
          <LinearGradient id={uid + "edge"} x1="0" y1="0" x2="1" y2=".8">
            <Stop stopColor="#493921" />
            <Stop offset=".5" stopColor={main} />
            <Stop offset="1" stopColor="#403120" />
          </LinearGradient>
        </Defs>
        <Circle cx="260" cy="260" r="258" fill={"url(#" + uid + "halo)"} />
        {[178, 210, 238].map((r, i) => (
          <Circle
            key={r}
            cx="260"
            cy="260"
            r={r}
            fill="none"
            stroke={main}
            strokeOpacity={0.09 + i * 0.015}
            strokeWidth=".6"
          />
        ))}
        <G transform="rotate(-25 260 260)">
          <Ellipse
            cx="260"
            cy="260"
            rx="242"
            ry="97"
            fill="none"
            stroke={main}
            strokeOpacity=".4"
            strokeWidth=".8"
          />
          <Ellipse
            cx="260"
            cy="260"
            rx="229"
            ry="89"
            fill="none"
            stroke={main}
            strokeOpacity=".12"
            strokeWidth=".6"
          />
        </G>
        <G transform="rotate(45 260 260)">
          <Ellipse
            cx="260"
            cy="260"
            rx="200"
            ry="242"
            fill="none"
            stroke={main}
            strokeOpacity=".12"
            strokeWidth=".6"
          />
        </G>
        {Array.from({ length: 48 }, (_, i) => {
          const a = (i * Math.PI) / 24;
          return (
            <Line
              key={i}
              x1={260 + Math.cos(a) * 210}
              y1={260 + Math.sin(a) * 210}
              x2={260 + Math.cos(a) * (i % 4 === 0 ? 219 : 214)}
              y2={260 + Math.sin(a) * (i % 4 === 0 ? 219 : 214)}
              stroke={main}
              strokeOpacity={i % 4 === 0 ? 0.45 : 0.2}
              strokeWidth=".7"
            />
          );
        })}
        <Ellipse cx="265" cy="411" rx="115" ry="12" fill="#000" opacity=".3" />
        <G transform="translate(125 98) rotate(-23 130 130) skewY(7)">
          <Circle
            cx="139"
            cy="148"
            r="132"
            fill={"url(#" + uid + "edge)"}
            stroke="#6D542F"
            strokeWidth="1"
          />
          <Circle
            cx="130"
            cy="130"
            r="132"
            fill={"url(#" + uid + "metal)"}
            stroke={main}
            strokeWidth="1"
          />
          <Circle
            cx="130"
            cy="130"
            r="122"
            fill="none"
            stroke="#43331F"
            strokeOpacity=".55"
            strokeWidth="1"
          />
          <Circle
            cx="130"
            cy="130"
            r="116"
            fill="none"
            stroke="#FFF0C9"
            strokeOpacity=".45"
            strokeWidth=".8"
          />
          {Array.from({ length: 64 }, (_, i) => {
            const a = (i * Math.PI) / 32;
            return (
              <Line
                key={i}
                x1={130 + Math.cos(a) * 123}
                y1={130 + Math.sin(a) * 123}
                x2={130 + Math.cos(a) * 128}
                y2={130 + Math.sin(a) * 128}
                stroke="#4B3920"
                strokeOpacity=".55"
                strokeWidth="1"
              />
            );
          })}
          <Rect x="99" y="99" width="66" height="66" rx="2" fill="#5B4429" />
          <Rect x="99" y="99" width="60" height="60" rx="1" fill="#0D1016" />
          <Path
            d="M99 159h60V99"
            stroke="#F3D99A"
            strokeOpacity=".6"
            strokeWidth="2"
            fill="none"
          />
          {Array.from({ length: 8 }, (_, i) => (
            <G key={i} transform={"rotate(" + i * 45 + " 130 130)"}>
              {[0, 1, 2].map((j) => (
                <G key={j}>
                  <Rect
                    x="114"
                    y={36 + j * 9}
                    width={i % 3 === j ? 13 : 32}
                    height="4"
                    fill="#4D3821"
                    opacity=".72"
                  />
                  {i % 3 === j && (
                    <Rect
                      x="133"
                      y={36 + j * 9}
                      width="13"
                      height="4"
                      fill="#4D3821"
                      opacity=".72"
                    />
                  )}
                </G>
              ))}
            </G>
          ))}
        </G>
        <G transform="rotate(-25 260 260)">
          <Path
            d="M18 260a242 97 0 0 0 484 0"
            stroke={"url(#" + uid + "metal)"}
            strokeWidth="1.5"
            fill="none"
          />
          <Circle cx="465" cy="310" r="4" fill={main} />
        </G>
        <Circle cx="103" cy="132" r="3" fill={main} />
        <Circle cx="431" cy="151" r="1.5" fill={main} />
        <Circle cx="392" cy="401" r="2" fill={main} />
        <Path
          d="M410 85v14m-7-7h14M75 342v12m-6-6h12"
          stroke={main}
          strokeWidth="1"
          strokeOpacity=".65"
        />
      </Svg>
    </Animated.View>
  );
}

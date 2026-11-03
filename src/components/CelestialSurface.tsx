import { useId } from "react";
import { StyleSheet, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";

export function CelestialBackdrop() {
  const id = useId().replace(/:/g, "");
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { height: 1260, overflow: "hidden" }]}
    >
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 1440 1260"
        preserveAspectRatio="xMidYMin slice"
      >
        <Defs>
          <RadialGradient id={id + "nebula"}>
            <Stop stopColor="#74529B" stopOpacity=".36" />
            <Stop offset=".55" stopColor="#39294E" stopOpacity=".22" />
            <Stop offset="1" stopColor="#15101F" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id={id + "rose"}>
            <Stop stopColor="#955A7F" stopOpacity=".25" />
            <Stop offset="1" stopColor="#15101F" stopOpacity="0" />
          </RadialGradient>
          <LinearGradient id={id + "horizon"} x1="0" y1="0" x2="1" y2="1">
            <Stop stopColor="#E6CCF9" stopOpacity="0" />
            <Stop offset=".5" stopColor="#DBB9ED" stopOpacity=".3" />
            <Stop offset="1" stopColor="#DBB9ED" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Circle cx="1020" cy="350" r="650" fill={"url(#" + id + "nebula)"} />
        <Circle cx="160" cy="820" r="490" fill={"url(#" + id + "rose)"} />
        <Path
          d="M-100 690Q800 80 1570 510"
          stroke={"url(#" + id + "horizon)"}
          strokeWidth="1"
          fill="none"
        />
        {Array.from({ length: 66 }, (_, i) => {
          const x = (i * 197 + 47) % 1440,
            y = (i * 113 + 53) % 1160;
          return (
            <Circle
              key={i}
              cx={x}
              cy={y}
              r={i % 11 === 0 ? 1.6 : 0.65}
              fill={i % 3 ? "#F8E7FF" : "#D8B5EB"}
              opacity={0.13 + (i % 5) * 0.065}
            />
          );
        })}
        {[
          [180, 174],
          [1270, 194],
          [1204, 666],
          [384, 690],
        ].map(([x, y], i) => (
          <Path
            key={i}
            d={"M" + x + " " + (y - 6) + "v12m-6-6h12"}
            stroke="#E6CCF9"
            strokeWidth=".8"
            opacity=".3"
          />
        ))}
      </Svg>
    </View>
  );
}
export function PearlSurface() {
  const id = useId().replace(/:/g, "");
  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        { borderRadius: 20, overflow: "hidden" },
      ]}
    >
      <Svg
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        viewBox="0 0 600 400"
      >
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <Stop stopColor="#EFD8FF" stopOpacity=".065" />
            <Stop offset=".5" stopColor="#A485C8" stopOpacity=".015" />
            <Stop offset="1" stopColor="#ECC9E4" stopOpacity=".06" />
          </LinearGradient>
        </Defs>
        <Rect width="600" height="400" fill={"url(#" + id + ")"} />
        <Path d="M0 .5H600" stroke="#F3DDF9" strokeOpacity=".16" />
      </Svg>
    </View>
  );
}

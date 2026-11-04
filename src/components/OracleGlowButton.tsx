import { useId, useState } from "react";
import { Animated, Pressable, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { LocalizedText as Text } from "./LocalizedText";
import { useAmbientMotion } from "@/lib/useAmbientMotion";

export function OracleGlowButton({
  title,
  onPress,
}: {
  title: string;
  onPress: () => void;
}) {
  const { phase, reduced } = useAmbientMotion(2600);
  const [width, setWidth] = useState(320);
  const [hovered, setHovered] = useState(false),
    [focused, setFocused] = useState(false);
  const shineId = useId().replace(/:/g, "");
  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={{ position: "relative", width: "100%" }}
    >
      <Animated.View
        pointerEvents="none"
        aria-hidden={true}
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 999,
          backgroundColor: "#E3BDE9",
          shadowColor: "#E6ADFA",
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 22,
          shadowOpacity: 0.9,
          opacity: phase.interpolate({
            inputRange: [0, 1],
            outputRange: [0.18, 0.6],
          }),
          transform: [
            {
              scaleX: phase.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.012],
              }),
            },
            {
              scaleY: phase.interpolate({
                inputRange: [0, 1],
                outputRange: [1.08, 1.32],
              }),
            },
          ],
        }}
      />
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={({ pressed }) => ({
          minHeight: 50,
          borderRadius: 999,
          backgroundColor: pressed
            ? "#D4B4DF"
            : hovered
              ? "#F0E1F4"
              : "#E6D4EB",
          borderWidth: focused ? 2 : 1,
          borderColor: focused ? "#FFF3D6" : "#F3DFF4",
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 14,
          paddingHorizontal: 22,
        })}
      >
        {!reduced && (
          <Animated.View
            pointerEvents="none"
            aria-hidden={true}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              width: 100,
              left: -100,
              opacity: 0.65,
              transform: [
                {
                  translateX: phase.interpolate({
                    inputRange: [0, 0.25, 0.75, 1],
                    outputRange: [0, 0, width + 200, width + 200],
                  }),
                },
                { skewX: "-22deg" },
              ],
            }}
          >
            <Svg width="100%" height="100%">
              <Defs>
                <LinearGradient id={shineId}>
                  <Stop stopColor="#FFF" stopOpacity="0" />
                  <Stop offset=".5" stopColor="#FFF" stopOpacity=".85" />
                  <Stop offset="1" stopColor="#FFF" stopOpacity="0" />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill={`url(#${shineId})`} />
            </Svg>
          </Animated.View>
        )}
        <Text
          style={{
            fontWeight: "700",
            fontSize: 14,
            lineHeight: 20,
            color: "#211627",
            textAlign: "center",
          }}
        >
          {title}
        </Text>
      </Pressable>
    </View>
  );
}

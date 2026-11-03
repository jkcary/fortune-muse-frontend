import { useId, useState, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { LocalizedText as Text } from "./LocalizedText";
import { PearlSurface } from "./CelestialSurface";
import { colors } from "@/lib/theme";

/** Account sections stay compact until the user opens the controls they need. */
export function SettingsDisclosure({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderColor: colors.line,
        borderWidth: 1,
        borderRadius: 20,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <PearlSurface />
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        aria-expanded={expanded}
        aria-controls={contentId}
        onPress={() => setExpanded((value) => !value)}
        style={({ pressed }) => ({
          minHeight: 64,
          paddingHorizontal: 24,
          paddingVertical: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text
          style={{
            color: colors.gold,
            fontSize: 11,
            fontWeight: "600",
            lineHeight: 20,
            letterSpacing: 1.8,
            flex: 1,
          }}
        >
          {title}
        </Text>
        <Svg
          width={16}
          height={16}
          viewBox="0 0 16 16"
          aria-hidden={true}
          style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }] }}
        >
          <Path
            d="M4 6 8 10 12 6"
            fill="none"
            stroke={colors.gold}
            strokeWidth={1.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Pressable>
      <View
        nativeID={contentId}
        style={{
          display: expanded ? "flex" : "none",
          paddingHorizontal: 24,
          paddingBottom: 24,
          gap: 14,
        }}
      >
        {children}
      </View>
    </View>
  );
}

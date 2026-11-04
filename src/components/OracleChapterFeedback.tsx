import { useEffect, useRef } from "react";
import { Animated, Platform, View } from "react-native";
import { LocalizedText as Text } from "./LocalizedText";
import { useCalmMotion } from "./OracleArt";
import { colors } from "@/lib/theme";

export function OracleChapterFeedback({
  chapterId,
  temporary = false,
}: {
  chapterId: string;
  temporary?: boolean;
}) {
  const reduced = useCalmMotion();
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    progress.setValue(0);
    if (reduced) return;
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 900,
      useNativeDriver: Platform.OS !== "web",
    });
    animation.start();
    return () => animation.stop();
  }, [chapterId, reduced, progress]);
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 10,
      }}
    >
      <Animated.View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.gold,
          alignItems: "center",
          justifyContent: "center",
          transform: [
            {
              scale: reduced
                ? 1
                : progress.interpolate({
                    inputRange: [0, 0.4, 1],
                    outputRange: [0.8, 1.16, 1],
                  }),
            },
          ],
        }}
      >
        <Text style={{ color: colors.gold }}>✦</Text>
      </Animated.View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: colors.gold, fontSize: 14 }}>
          A new chapter is here.
        </Text>
        <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 19 }}>
          {temporary
            ? "This chapter stays with your temporary story."
            : "Your constellation has a new node."}
        </Text>
      </View>
    </View>
  );
}

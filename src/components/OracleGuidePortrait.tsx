import { Image, StyleSheet, View } from "react-native";
import { useT } from "@/lib/i18n";

export function OracleGuidePortrait({
  size = 56,
  hero = false,
}: {
  size?: number;
  hero?: boolean;
}) {
  const t = useT();
  return (
    <View
      style={{
        width: size,
        height: hero ? size * 1.25 : size,
        borderRadius: hero ? 24 : 999,
        borderWidth: 1,
        borderColor: "#937290",
        overflow: "hidden",
        backgroundColor: "#302238",
      }}
    >
      <Image
        source={require("@/assets/images/oracle-guide-selene.png")}
        resizeMode="cover"
        accessibilityLabel={t("Selene, your fictional AI oracle guide")}
        style={[StyleSheet.absoluteFill, { width: "100%", height: "100%" }]}
      />
    </View>
  );
}

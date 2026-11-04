import { View } from "react-native";
import { router } from "expo-router";
import { LocalizedText as Text } from "./LocalizedText";
import { Copy, Eyebrow } from "./OracleShell";
import { Button } from "./ui";
import { GardenArt } from "./GardenArt";
import { useGarden } from "@/lib/garden";
import { colors, fonts } from "@/lib/theme";

export function GardenInvitation() {
  const { state } = useGarden();
  return (
    <View
      style={{
        padding: 20,
        borderWidth: 1,
        borderColor: "#65516D",
        borderRadius: 24,
        backgroundColor: "#251E35",
        gap: 10,
        marginTop: 24,
      }}
    >
      <Eyebrow>NO QUESTION NEEDED</Eyebrow>
      <Text
        style={{ fontFamily: fonts.display, fontSize: 30, color: colors.ink }}
      >
        A little light, just for you.
      </Text>
      <GardenArt decor={state.decor} lights={state.completed.length} />
      <Copy muted>
        A small light-path puzzle. Twelve lanterns to discover. A garden to make
        your own.
      </Copy>
      <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
        <Button
          title="Play Star Lantern Garden ↗"
          onPress={() => router.push("/garden")}
        />
        <Button
          title="A quiet moment with Selene"
          kind="ghost"
          onPress={() => router.push("/companion")}
        />
      </View>
    </View>
  );
}

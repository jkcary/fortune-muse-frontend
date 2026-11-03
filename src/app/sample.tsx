import { LocalizedText as Text } from "@/components/LocalizedText";
import { router } from "expo-router";
import { View } from "react-native";
import { HexagramGlyph } from "@/components/OracleArt";
import {
  Copy,
  Display,
  Eyebrow,
  OracleShell,
  Panel,
  oracleStyles as s,
} from "@/components/OracleShell";
import { Button } from "@/components/ui";

export default function Sample() {
  return (
    <OracleShell wide={false}>
      <View style={{ paddingTop: 45, gap: 24 }}>
        <Eyebrow>AN EDITORIAL SAMPLE · NOT A LIVE READING</Eyebrow>
        <Display size={48}>Small steps.{"\n"}Meaningful movement.</Display>
        <Copy muted>
          Example question: “What should I consider about starting a side
          project?”
        </Copy>
        <Panel>
          <View style={{ alignItems: "center", gap: 14 }}>
            <HexagramGlyph bits="011000" size={130} />
            <Text style={s.label}>46 / GROWING UPWARD</Text>
          </View>
          <Text style={s.subheading}>Give your idea room to take root.</Text>
          <Copy>
            Growing Upward invites a patient approach to development. In this
            example, the useful question is what you can build consistently
            alongside your current responsibilities.
          </Copy>
          <Copy muted>
            This sample uses six unchanging lines: 8, 7, 7, 8, 8, 8. There is no
            separate transformed hexagram.
          </Copy>
          <Text style={s.label}>ONE STEP FOR TODAY</Text>
          <Copy>
            Before tonight, write a one-sentence description of the project and
            identify one person who could give you specific feedback.
          </Copy>
          <Text style={s.label}>A QUESTION TO CARRY</Text>
          <Copy>
            What would make the first step small enough to actually take?
          </Copy>
          <Text style={s.small}>
            Original editorial sample for entertainment and personal reflection.
            Your own reading depends on the recorded cast and the context you
            share.
          </Text>
        </Panel>
        <Button
          title="Explore your own question  ↗"
          onPress={() => router.push("/ask")}
        />
      </View>
    </OracleShell>
  );
}

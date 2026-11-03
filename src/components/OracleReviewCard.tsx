import { useState } from "react";
import { ActivityIndicator, TextInput, View } from "react-native";
import { LocalizedText as Text } from "./LocalizedText";
import { Button, Check, ErrorText, Field } from "./ui";
import { Panel } from "./OracleShell";
import { colors, fonts } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";
import {
  REVIEW_FIELDS,
  type ReviewFields,
  type ReviewKey,
} from "@/lib/oracleReview";
import { SettingsDisclosure } from "./SettingsDisclosure";
export function OracleReviewCard({
  topic,
  question,
  context,
  fields,
  organizing,
  reviewError,
  aiOrganized,
  contextLength,
  privateMode,
  saving,
  error,
  onQuestion,
  onField,
  onRetry,
  onPrivate,
  onSave,
  onBack,
}: {
  topic: "wealth" | "love";
  question: string;
  context: string;
  fields: ReviewFields;
  organizing: boolean;
  reviewError: string;
  aiOrganized: boolean;
  contextLength: number;
  privateMode: boolean;
  saving: boolean;
  error: string;
  onQuestion: (text: string) => void;
  onField: (key: ReviewKey, value: string) => void;
  onRetry: () => void;
  onPrivate: (value: boolean) => void;
  onSave: () => void;
  onBack: () => void;
}) {
  const { t } = useI18n();
  const [heights, setHeights] = useState<Partial<Record<ReviewKey, number>>>(
    {},
  );
  return (
    <Panel>
      <Text style={{ color: colors.gold, fontSize: 10, letterSpacing: 1.7 }}>
        02 / REVIEW YOUR INTENTION
      </Text>
      <Text
        style={{ fontFamily: fonts.display, color: colors.ink, fontSize: 30 }}
      >
        Your words, before the coins.
      </Text>
      <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 24 }}>
        You can edit the information directly in this card. Confirm and save
        your changes before casting.
      </Text>
      <View
        style={{
          borderBottomWidth: 1,
          borderColor: colors.line,
          paddingBottom: 14,
        }}
      >
        <Text style={{ color: colors.gold, fontSize: 12 }}>
          {topic === "love" ? "Love & Connection" : "Wealth & Career"}
        </Text>
      </View>
      <Field
        label="Your question"
        value={question}
        onChangeText={onQuestion}
        multiline
        maxLength={600}
        editable={!saving && !organizing}
        style={{ minHeight: 95 }}
      />
      <Text style={{ color: colors.gold, fontSize: 12 }}>
        Your information, organized
      </Text>
      {organizing ? (
        <View
          accessibilityLiveRegion="polite"
          style={{
            flexDirection: "row",
            gap: 12,
            paddingVertical: 24,
            alignItems: "center",
          }}
        >
          <ActivityIndicator color={colors.gold} />
          <Text style={{ color: colors.muted, flex: 1 }}>
            AI is organizing your words into clear fields…
          </Text>
        </View>
      ) : (
        <>
          <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 20 }}>
            {aiOrganized
              ? "AI-organized from your words. Check each value and edit it directly; unmentioned details stay blank."
              : "Fill in or edit these fields. Your original words are available below."}
          </Text>
          <View
            style={{
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            {REVIEW_FIELDS.map(([key, label], index) => (
              <View
                key={key}
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  gap: 10,
                  borderTopWidth: index ? 1 : 0,
                  borderColor: colors.line,
                  backgroundColor: index % 2 ? "#FFFFFF03" : "transparent",
                }}
              >
                <Text
                  style={{
                    color: colors.gold,
                    fontSize: 12,
                    lineHeight: 21,
                    width: 100,
                    paddingTop: 7,
                  }}
                >
                  {label}
                </Text>
                <TextInput
                  accessibilityLabel={t(label)}
                  value={fields[key]}
                  onChangeText={(value) => onField(key, value)}
                  placeholder={t("Not mentioned — you can add it")}
                  placeholderTextColor={colors.muted}
                  editable={!saving}
                  multiline
                  maxLength={1200}
                  onContentSizeChange={({ nativeEvent }) => {
                    const height = Math.max(
                      42,
                      Math.ceil(nativeEvent.contentSize.height),
                    );
                    setHeights((previous) =>
                      previous[key] === height
                        ? previous
                        : { ...previous, [key]: height },
                    );
                  }}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    minHeight: 42,
                    height: heights[key],
                    padding: 7,
                    color: colors.ink,
                    fontSize: 13,
                    lineHeight: 22,
                    textAlignVertical: "top",
                    borderRadius: 8,
                    backgroundColor: "#120C1C55",
                  }}
                />
              </View>
            ))}
          </View>
          <Text
            localize={false}
            style={{
              color: contextLength > 1200 ? colors.redSoft : colors.muted,
              fontSize: 11,
            }}
          >
            {contextLength}/1200
          </Text>
          {contextLength > 1200 && (
            <ErrorText>
              Your context is full. Please shorten it before saving.
            </ErrorText>
          )}
        </>
      )}
      {!!reviewError && (
        <>
          <ErrorText>{reviewError}</ErrorText>
          <Button
            title="Try AI organization again"
            kind="ghost"
            onPress={onRetry}
            disabled={organizing || saving}
          />
        </>
      )}
      {!!context && (
        <SettingsDisclosure title="Your original words">
          <Text
            localize={false}
            selectable
            style={{ color: colors.muted, fontSize: 12, lineHeight: 22 }}
          >
            {context}
          </Text>
        </SettingsDisclosure>
      )}
      <Text style={{ color: colors.muted, fontSize: 11, lineHeight: 19 }}>
        Only your question and the background shown here will be saved for this
        reading.
      </Text>
      <View pointerEvents={saving ? "none" : "auto"}>
        <Check checked={privateMode} onChange={onPrivate}>
          Temporary reading — keep it out of my journal.
        </Check>
      </View>
      {privateMode && (
        <Text style={{ color: colors.muted, fontSize: 11, lineHeight: 19 }}>
          Available for 24 hours. The question, reading and follow-ups are then
          deleted; necessary purchase records remain.
        </Text>
      )}
      <ErrorText>{error}</ErrorText>
      <Button
        title="Confirm & save, then cast  ↗"
        onPress={onSave}
        loading={saving}
        disabled={organizing || contextLength > 1200}
        style={{ borderRadius: 999 }}
      />
      <Button
        title="Back to our conversation"
        onPress={onBack}
        kind="ghost"
        disabled={saving}
      />
    </Panel>
  );
}

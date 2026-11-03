import { useState } from "react";
import { Modal, Pressable, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { LocalizedText as Text } from "./LocalizedText";
import { LANGUAGES, useI18n } from "@/lib/i18n";
import { colors } from "@/lib/theme";

export function LanguageSelect({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("Language")}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(true)}
        style={{
          height: 40,
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: "#70516F",
          borderRadius: 999,
          paddingHorizontal: compact ? 12 : 18,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
        }}
      >
        <Text
          localize={false}
          style={{
            color: colors.ink,
            fontSize: 12,
            fontWeight: "400",
            lineHeight: 16,
          }}
        >
          {LANGUAGES.find((language) => language.id === lang)?.label}
        </Text>
        <Svg width={10} height={10} viewBox="0 0 10 10" accessible={false}>
          <Path
            d="M2 3.5 5 6.5 8 3.5"
            fill="none"
            stroke={colors.gold}
            strokeWidth={1.25}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            padding: 24,
            backgroundColor: "#080510BB",
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("Cancel")}
            onPress={() => setOpen(false)}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
            }}
          />
          <View
            accessibilityViewIsModal
            style={{
              width: "100%",
              maxWidth: 360,
              alignSelf: "center",
              borderRadius: 20,
              padding: 12,
              backgroundColor: colors.card,
            }}
          >
            {LANGUAGES.map((language) => (
              <Pressable
                key={language.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: lang === language.id }}
                onPress={() => {
                  setOpen(false);
                  void setLang(language.id);
                }}
                style={{
                  padding: 18,
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  localize={false}
                  style={{ color: colors.ink, fontSize: 16 }}
                >
                  {language.label}
                </Text>
                {lang === language.id && (
                  <Text style={{ color: colors.love }}>✓</Text>
                )}
              </Pressable>
            ))}
            <Pressable
              accessibilityRole="button"
              onPress={() => setOpen(false)}
              style={{ padding: 18 }}
            >
              <Text style={{ color: colors.muted }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

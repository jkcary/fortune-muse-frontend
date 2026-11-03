import {
  Children,
  Fragment,
  cloneElement,
  isValidElement,
  type ReactNode,
} from "react";
import { Text as NativeText, type TextProps } from "react-native";
import { useI18n } from "@/lib/i18n";

function content(node: ReactNode, t: (s: string) => string): ReactNode {
  if (typeof node === "string") return t(node);
  if (Array.isArray(node))
    return Children.map(node, (child) => content(child, t));
  if (isValidElement<{ children?: ReactNode }>(node) && node.type === Fragment)
    return cloneElement(node, {}, content(node.props.children, t));
  return node;
}
/** Translate UI copy, while allowing saved/user-authored content to stay verbatim. */
export function LocalizedText({
  children,
  localize = true,
  ...props
}: TextProps & { localize?: boolean }) {
  const { t, lang } = useI18n();
  return (
    <NativeText
      {...props}
      accessibilityLabel={
        props.accessibilityLabel ? t(props.accessibilityLabel) : undefined
      }
      style={[props.style, lang.startsWith("zh") && { letterSpacing: 0 }]}
    >
      {localize ? content(children, t) : children}
    </NativeText>
  );
}

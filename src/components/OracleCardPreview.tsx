import { useMemo, type Ref } from "react";
import Svg, { parse, SvgAst, type XmlAST } from "react-native-svg";

// Decode text only AFTER parsing, so escaped user-visible words remain text,
// and preview/native PNG output match the browser's standard SVG rendering.
function decodeText(ast: XmlAST): XmlAST {
  ast.children = ast.children.map((child) =>
    typeof child === "string"
      ? child.replace(
          /&(amp|lt|gt|quot|apos);/g,
          (_, entity: string) =>
            ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" })[entity]!,
        )
      : decodeText(child),
  );
  return ast;
}
export function OracleCardPreview({
  xml,
  width = "100%",
  height = "100%",
  svgRef,
}: {
  xml: string;
  width?: number | string;
  height?: number | string;
  svgRef?: Ref<Svg>;
}) {
  const ast = useMemo(() => parse(xml, decodeText), [xml]);
  return <SvgAst ast={ast} override={{ width, height, ref: svgRef }} />;
}

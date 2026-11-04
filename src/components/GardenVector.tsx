import { useId } from "react";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";

/** Original vector garden; each earned object has a permanent place in the scene. */
export function GardenVector({
  decor = [],
  lights = 0,
  enhanced = false,
}: {
  decor?: string[];
  lights?: number;
  enhanced?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <Svg
      width="100%"
      height={240}
      viewBox="0 0 720 300"
      accessibilityLabel="Star lantern garden"
      role="img"
    >
      <Defs>
        <LinearGradient id={`${id}sky`} x2="0" y2="1">
          <Stop stopColor="#18182F" />
          <Stop offset="1" stopColor="#493752" />
        </LinearGradient>
        <RadialGradient id={`${id}glow`}>
          <Stop stopColor="#FFF0CB" stopOpacity=".8" />
          <Stop offset="1" stopColor="#E2B4DB" stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id={`${id}land`} x2="0" y2="1">
          <Stop stopColor="#776980" />
          <Stop offset=".3" stopColor="#3A334E" />
          <Stop offset="1" stopColor="#1B1D33" />
        </LinearGradient>
      </Defs>
      <Rect width="720" height="300" rx="22" fill={`url(#${id}sky)`} />
      {!enhanced &&
        Array.from({ length: 28 }, (_, i) => (
          <Circle
            key={i}
            cx={25 + ((i * 97) % 670)}
            cy={15 + ((i * 31) % 155)}
            r={i % 4 === 0 ? 1.5 : 0.7}
            fill="#EBD5B8"
            opacity={0.3 + (i % 3) * 0.2}
          />
        ))}
      <Circle cx="558" cy="62" r="60" fill={`url(#${id}glow)`} />
      <Circle cx="558" cy="62" r="19" fill="#EEE2D3" />
      <Circle cx="565" cy="57" r="17" fill="#37304B" />
      <Ellipse
        cx="352"
        cy="254"
        rx="258"
        ry="24"
        stroke="#BCA3C9"
        strokeWidth=".6"
        fill="none"
        opacity=".4"
      />
      <Path
        d="M80 207 L180 159 L532 159 L640 207 L590 247 L168 247Z"
        fill={`url(#${id}land)`}
        stroke="#A18EA9"
      />
      <Path
        d="M80 207 L168 247 L200 273 L548 273 L590 247 L640 207 L576 230 L171 230Z"
        fill="#25263F"
      />
      <Path
        d="M150 207 Q352 135 565 205"
        fill="none"
        stroke="#B9A2B9"
        strokeWidth="2"
      />
      <Ellipse
        cx="360"
        cy="211"
        rx="100"
        ry="23"
        fill="#252039"
        stroke="#C4A5BB"
        strokeWidth=".7"
      />
      <Path d="M285 212 Q360 192 435 212" stroke="#977EAA" fill="none" />
      {Array.from({ length: Math.min(12, lights) }, (_, i) => (
        <G key={i}>
          <Circle
            cx={192 + i * 29}
            cy={192 + Math.sin(i) * 12}
            r="14"
            fill={`url(#${id}glow)`}
          />
          <Circle
            cx={192 + i * 29}
            cy={192 + Math.sin(i) * 12}
            r="2.7"
            fill="#FFE9BA"
          />
        </G>
      ))}
      {decor.includes("moon-lamp") && (
        <G>
          <Line
            x1="177"
            y1="196"
            x2="177"
            y2="103"
            stroke="#CCB783"
            strokeWidth="3"
          />
          <Path
            d="M161 120 Q177 76 193 120 L188 143 L166 143Z"
            fill="#E5CE9B"
          />
          <Circle cx="177" cy="127" r="34" fill={`url(#${id}glow)`} />
          <Line x1="169" y1="116" x2="185" y2="116" stroke="#7D6377" />
          <Ellipse cx="177" cy="197" rx="15" ry="4" fill="#85718E" />
        </G>
      )}
      {!enhanced &&
        decor.includes("star-flowers") &&
        [0, 1, 2, 3, 4].map((i) => (
          <G key={i}>
            <Path
              d={`M${228 + i * 14} 229 Q${221 + i * 14} 202 ${227 + i * 14} ${195 + (i % 2) * 9}`}
              stroke="#9EB6AA"
              fill="none"
            />
            <Path
              d={
                Array.from({ length: 10 }, (_, point) => {
                  const angle = -Math.PI / 2 + (point * Math.PI) / 5;
                  const radius = point % 2 ? 4 : 9;
                  return `${point ? "L" : "M"}${227 + i * 14 + Math.cos(angle) * radius} ${195 + (i % 2) * 9 + Math.sin(angle) * radius}`;
                }).join(" ") + "Z"
              }
              fill="#D6B7E6"
            />
          </G>
        ))}
      {decor.includes("pearl-fountain") && (
        <G>
          <Ellipse
            cx="360"
            cy="219"
            rx="40"
            ry="12"
            fill="#7B6686"
            stroke="#CDB4CD"
          />
          <Path d="M337 211 L349 176 L371 176 L383 211Z" fill="#9A86A3" />
          <Circle cx="360" cy="165" r="34" fill={`url(#${id}glow)`} />
          <Circle cx="360" cy="165" r="15" fill="#F0DFE8" />
          <Circle cx="356" cy="160" r="5" fill="#FFFAF2" />
        </G>
      )}
      {decor.includes("moon-bridge") && (
        <G>
          <Path
            d="M426 223 Q473 154 520 219 L520 233 Q473 183 426 236Z"
            fill="#BDA6BC"
          />
          <Path
            d="M424 212 Q473 145 522 209"
            fill="none"
            stroke="#E4CCB0"
            strokeWidth="3"
          />
          {[438, 455, 473, 491, 509].map((x, i) => (
            <Line
              key={x}
              x1={x}
              y1={194 - Math.sin((i / 4) * Math.PI) * 16}
              x2={x}
              y2={215 - Math.sin((i / 4) * Math.PI) * 16}
              stroke="#CDB5AC"
            />
          ))}
        </G>
      )}
      {decor.includes("wind-chimes") && (
        <G>
          <Path
            d="M566 201 L566 101 L526 101"
            stroke="#C2AB88"
            strokeWidth="3"
            fill="none"
          />
          <Path d="M525 111 L539 111 L532 103Z" fill="#D8BF94" />
          {[0, 1, 2].map((i) => (
            <G key={i}>
              <Line
                x1={525 + i * 7}
                y1="111"
                x2={525 + i * 7}
                y2={133 + i * 7}
                stroke="#DECDB4"
              />
              <Rect
                x={523 + i * 7}
                y={129 + i * 7}
                width="3"
                height="15"
                rx="1"
                fill="#DFD3C4"
              />
            </G>
          ))}
        </G>
      )}
      {decor.includes("observatory") && (
        <G>
          <Path
            d="M309 166 L309 115 Q343 69 377 115 L377 160Z"
            fill="#766B88"
            stroke="#BDA6C5"
          />
          <Path d="M309 115 Q343 70 377 115Z" fill="#AF99BA" />
          <Rect x="337" y="125" width="14" height="37" rx="7" fill="#28263F" />
          <Path d="M343 93 L368 74" stroke="#E1C7A1" strokeWidth="7" />
          <Circle cx="370" cy="72" r="5" fill="#DCC9B5" />
        </G>
      )}
    </Svg>
  );
}

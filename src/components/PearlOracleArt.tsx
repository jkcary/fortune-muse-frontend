import { useEffect, useId, useRef } from "react";
import { Animated, Easing, Platform } from "react-native";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { useCalmMotion } from "./OracleArt";
import { useT } from "@/lib/i18n";

/** A code-native nacre sphere: orbital filigree, a coin seal and restrained celestial movement. */
export function OracleArt({
  love = false,
  size = 440,
  animate = true,
}: {
  love?: boolean;
  size?: number;
  animate?: boolean;
}) {
  const t = useT();
  const id = useId().replace(/:/g, "");
  const reduced = useCalmMotion();
  const float = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced || !animate) {
      float.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 6000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 6000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== "web",
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, animate, float]);
  const accent = love ? "#EDBAD6" : "#EAD0A8";
  const url = (name: string) => "url(#" + id + name + ")";
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        width: size,
        height: size,
        transform: [
          {
            translateY: float.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -10],
            }),
          },
        ],
      }}
    >
      <Svg
        width={size}
        height={size}
        viewBox="0 0 600 600"
        accessibilityLabel={t(
          love
            ? "Rose pearl eclipse with intertwined celestial orbits"
            : "Iridescent pearl sphere with a golden I Ching coin seal",
        )}
      >
        <Defs>
          <RadialGradient id={id + "halo"}>
            <Stop stopColor={love ? "#AD6B99" : "#AE8CD2"} stopOpacity=".4" />
            <Stop offset=".55" stopColor="#77608F" stopOpacity=".12" />
            <Stop offset="1" stopColor="#15101F" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id={id + "pearl"} cx=".32" cy=".23" r=".78">
            <Stop stopColor="#FFF9F2" />
            <Stop offset=".19" stopColor="#F2E5EF" />
            <Stop offset=".37" stopColor={love ? "#E9BDDA" : "#C6D7E7"} />
            <Stop offset=".55" stopColor="#C3AFDC" />
            <Stop offset=".72" stopColor={love ? "#A16D9B" : "#A391C0"} />
            <Stop offset=".9" stopColor="#4A325F" />
            <Stop offset="1" stopColor="#21172F" />
          </RadialGradient>
          <LinearGradient id={id + "nacre"} x1="0" y1="0" x2="1" y2="1">
            <Stop stopColor="#FBE5F5" />
            <Stop offset=".25" stopColor="#B6D7DE" />
            <Stop offset=".5" stopColor="#C2ADE2" />
            <Stop offset=".73" stopColor="#F4C3D3" />
            <Stop offset="1" stopColor="#FFF4D8" />
          </LinearGradient>
          <LinearGradient id={id + "gold"} x1="0" y1="0" x2="1" y2="1">
            <Stop stopColor="#FFF5D7" />
            <Stop offset=".24" stopColor="#BE9475" />
            <Stop offset=".47" stopColor="#F3DEC0" />
            <Stop offset=".75" stopColor="#8B6582" />
            <Stop offset="1" stopColor="#EBC5B2" />
          </LinearGradient>
          <RadialGradient id={id + "moon"} cx=".3" cy=".25">
            <Stop stopColor="#FFF6EF" />
            <Stop offset=".45" stopColor="#E5CCEE" />
            <Stop offset="1" stopColor="#8D6DAD" />
          </RadialGradient>
        </Defs>
        <Circle cx="300" cy="300" r="298" fill={url("halo")} />
        {[235, 254, 279].map((r, i) => (
          <Circle
            key={r}
            cx="300"
            cy="300"
            r={r}
            fill="none"
            stroke={accent}
            strokeOpacity={0.12 - i * 0.025}
            strokeWidth=".75"
          />
        ))}
        {Array.from({ length: 40 }, (_, i) => {
          const a = (i * Math.PI) / 20;
          const x = 300 + Math.cos(a) * 254,
            y = 300 + Math.sin(a) * 254;
          return (
            <Circle
              key={i}
              cx={x}
              cy={y}
              r={i % 5 === 0 ? 2 : 1}
              fill={accent}
              opacity={i % 5 === 0 ? 0.65 : 0.28}
            />
          );
        })}
        <G transform="rotate(-28 300 300)">
          <Ellipse
            cx="300"
            cy="300"
            rx="278"
            ry="106"
            stroke={url("gold")}
            strokeOpacity=".6"
            strokeWidth="1.2"
            fill="none"
          />
          <Ellipse
            cx="300"
            cy="300"
            rx="290"
            ry="118"
            stroke={accent}
            strokeOpacity=".18"
            strokeWidth=".6"
            fill="none"
          />
        </G>
        <G transform="rotate(31 300 300)">
          <Ellipse
            cx="300"
            cy="300"
            rx="204"
            ry="274"
            stroke={accent}
            strokeOpacity=".27"
            strokeWidth=".7"
            fill="none"
          />
        </G>
        <Circle
          cx="300"
          cy="300"
          r="174"
          fill={url("pearl")}
          stroke="#F9E8EF"
          strokeOpacity=".45"
          strokeWidth="1"
        />
        <Path
          d="M166 203C230 137 369 131 444 232C369 167 224 186 171 274C204 226 298 204 348 230C252 194 173 244 151 321"
          fill={url("nacre")}
          opacity=".32"
        />
        <Path
          d="M164 342C218 424 369 441 447 346C377 406 250 404 178 319C199 347 278 385 345 351C281 392 207 372 164 342"
          fill={url("nacre")}
          opacity=".26"
        />
        <Ellipse
          cx="246"
          cy="199"
          rx="62"
          ry="22"
          transform="rotate(-29 246 199)"
          fill="#FFF9EF"
          opacity=".19"
        />
        <Circle
          cx="300"
          cy="300"
          r="158"
          fill="none"
          stroke={url("nacre")}
          strokeOpacity=".28"
          strokeWidth=".6"
        />
        {love ? (
          <G>
            <Circle
              cx="369"
              cy="325"
              r="111"
              fill={url("moon")}
              fillOpacity=".13"
              stroke={url("gold")}
              strokeWidth="1.3"
            />
            <Path
              d="M339 317c-16-27-46-6-25 17l25 24 25-24c21-23-9-44-25-17z"
              fill="none"
              stroke={url("gold")}
              strokeWidth="1.8"
            />
          </G>
        ) : (
          <G transform="rotate(-14 300 300)">
            <Circle
              cx="300"
              cy="300"
              r="62"
              fill="#F5E5E8"
              fillOpacity=".08"
              stroke={url("gold")}
              strokeWidth="1.4"
            />
            <Circle
              cx="300"
              cy="300"
              r="54"
              fill="none"
              stroke="#F8EBD6"
              strokeOpacity=".35"
              strokeWidth=".7"
            />
            <Rect
              x="284"
              y="284"
              width="32"
              height="32"
              fill="#685471"
              fillOpacity=".45"
              stroke={url("gold")}
              strokeWidth="1.1"
            />
            {[0, 1, 2, 3].map((i) => (
              <G key={i} transform={"rotate(" + i * 90 + " 300 300)"}>
                <Path
                  d="M285 258h30m-30 7h12m6 0h12"
                  stroke={url("gold")}
                  strokeWidth="2"
                />
              </G>
            ))}
          </G>
        )}
        <G transform="rotate(-28 300 300)">
          <Path
            d="M22 300a278 106 0 0 0 556 0"
            stroke={url("gold")}
            strokeWidth="2"
            fill="none"
          />
          <Circle cx="558" cy="340" r="5" fill="#F7DED6" />
        </G>
        <Circle
          cx="118"
          cy="136"
          r="22"
          fill={url("moon")}
          stroke="#F3D9E8"
          strokeWidth=".6"
        />
        <Circle
          cx="493"
          cy="420"
          r="12"
          fill={url("pearl")}
          stroke="#E9D4E3"
          strokeWidth=".6"
        />
        <Path
          d="M300 15v44m-22-22h44m-37-15 30 30m0-30-30 30M82 401v22m-11-11h22M489 139v28m-14-14h28M300 540v45m-10-23h20"
          stroke={accent}
          strokeOpacity=".75"
          strokeWidth="1"
        />
        <Path
          d="M300 62l6 11-6 11-6-11zM300 517l6 11-6 11-6-11z"
          fill={url("gold")}
        />
        <Path
          d="M64 231l-5-18 12 5m442 56 14-9 3 17"
          stroke={accent}
          strokeOpacity=".4"
          fill="none"
        />
        {[
          [91, 265],
          [454, 96],
          [522, 289],
          [190, 510],
          [409, 507],
          [57, 475],
        ].map(([x, y], i) => (
          <Circle
            key={i}
            cx={x}
            cy={y}
            r={i % 2 ? 1.5 : 2.5}
            fill="#FBEAF5"
            opacity=".7"
          />
        ))}
      </Svg>
    </Animated.View>
  );
}

import { Image, type ImageSourcePropType } from 'react-native';

const BRIX = { source: require('@/assets/images/spirits/brix.png'), label: 'BRIX', baselineOffset: 0 };
const BAO = { source: require('@/assets/images/spirits/bao.png'), label: 'BAO', baselineOffset: 0.07 };
const BUCK = { source: require('@/assets/images/spirits/buck.png'), label: 'BUCK', baselineOffset: -0.03 };
const RUBY = { source: require('@/assets/images/spirits/ruby.png'), label: 'RUBY', baselineOffset: 0 };
const VAL = { source: require('@/assets/images/spirits/val.png'), label: 'VAL', baselineOffset: 0 };
const EMBER = { source: require('@/assets/images/spirits/ember.png'), label: 'EMBER', baselineOffset: 0 };

// Legacy themes remain valid for saved readings and older API responses.
const SPIRITS: Record<string, { source: ImageSourcePropType; label: string; baselineOffset: number }> = {
  'gold-bar': BRIX,
  nugget: BRIX,
  ingot: BAO,
  dollar: BUCK,
  greenback: BUCK,
  heart: RUBY,
  'love-letter': VAL,
  'heart-flame': EMBER,
};

/** Shared transparent character art for web, Android and iOS. */
export function DeityArt({ theme, size = 120 }: { theme: string; size?: number }) {
  const spirit = SPIRITS[theme];
  if (!spirit) return null;

  return (
    <Image
      source={spirit.source}
      // Align visible feet despite the different transparent margins in each PNG.
      style={{ width: size, height: size, transform: [{ translateY: size * spirit.baselineOffset }] }}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel={spirit.label}
    />
  );
}

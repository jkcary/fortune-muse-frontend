import { Link } from 'expo-router';
import { Text } from 'react-native';
import { useT } from '@/lib/i18n';
import { colors } from '@/lib/theme';
import { Check } from './ui';

/** "I agree to the Terms of Use and Privacy Policy." with both links, in the current language. */
export function TermsCheck({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  const t = useT();
  return (
    <Check checked={checked} onChange={onChange}>
      {t('terms.pre')}<Link href="/legal/terms"><Text style={{ color: colors.goldDeep }}>{t('Terms of Use')}</Text></Link>{t('terms.mid')}
      <Link href="/legal/privacy"><Text style={{ color: colors.goldDeep }}>{t('Privacy Policy')}</Text></Link>{t('terms.post')}
    </Check>
  );
}

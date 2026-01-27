import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
  ImageSourcePropType,
} from 'react-native';
import Constants from 'expo-constants';
import * as Application from 'expo-application';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const logoPlaceholder: ImageSourcePropType = require('../../assets/fc-zlicin-logo.jpg');
const clubAddress = 'U Zličínského hřiště 499/3, Praha 5 - Zličín';
const primaryEmail = 'fczlicin@fczlicin.cz';
const primaryPhone = '+420 602 292 500';
const privacyPolicyUrl = 'https://www.fczlicin.cz/privacy-policy/';
const creatorUrl = 'https://www.janfranc.cz';

type MetadataState = {
  version: string;
  lastUpdated: string;
};

const formatDate = (value: string | number | Date) => {
  const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return 'Nedostupné';
  }
  return new Intl.DateTimeFormat('cs-CZ', { dateStyle: 'long' }).format(date);
};

const useAppMetadata = (): MetadataState => {
  const [metadata, setMetadata] = React.useState<MetadataState>({
    version: 'Nedostupná',
    lastUpdated: 'Nedostupné',
  });

  React.useEffect(() => {
    const detectedVersion =
      Application.nativeApplicationVersion || Constants.expoConfig?.version || 'Nedostupná';
    const extra = Constants.expoConfig?.extra ?? {};
    const fallbackExtraDate =
      (typeof extra.buildDate === 'string' && extra.buildDate) ||
      (typeof extra.buildTimestamp === 'number' && extra.buildTimestamp) ||
      undefined;

    setMetadata({
      version: detectedVersion,
      lastUpdated: fallbackExtraDate ? formatDate(fallbackExtraDate) : 'Nedostupné',
    });
  }, []);

  return metadata;
};

const openLinkSafely = async (target: string) => {
  try {
    const canOpen = await Linking.canOpenURL(target);
    if (canOpen) {
      await Linking.openURL(target);
    }
  } catch (error) {
    console.warn('Unable to open link', target, error);
  }
};

const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={styles.sectionCard}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

type LinkRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress?: () => void;
};

const LinkRow = ({ icon, label, value, onPress }: LinkRowProps) => (
  <TouchableOpacity
    style={styles.linkRow}
    onPress={onPress}
    activeOpacity={0.75}
    disabled={!onPress}
  >
    <View style={styles.linkIconWrapper}>
      <Ionicons name={icon} size={20} color={colors.brandBlue} />
    </View>
    <View style={styles.linkTextWrapper}>
      <Text style={styles.linkLabel}>{label}</Text>
      <Text style={[styles.linkValue, onPress && styles.linkValueInteractive]}>{value}</Text>
    </View>
    {onPress && <Ionicons name="open-outline" size={20} color={colors.gray600} />}
  </TouchableOpacity>
);

export default function AboutScreen() {
  const metadata = useAppMetadata();

  const handleAddressPress = React.useCallback(() => {
    const encoded = encodeURIComponent(clubAddress);
    openLinkSafely(`https://maps.apple.com/?q=${encoded}`);
  }, []);

  const handlePhonePress = React.useCallback(() => {
    openLinkSafely(`tel:${primaryPhone.replace(/\s+/g, '')}`);
  }, []);

  const handleEmailPress = React.useCallback(() => {
    openLinkSafely(`mailto:${primaryEmail}`);
  }, []);

  const handleCreatorPress = React.useCallback(() => {
    openLinkSafely(creatorUrl);
  }, []);

  const handlePrivacyPress = React.useCallback(() => {
    openLinkSafely(privacyPolicyUrl);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <Image source={logoPlaceholder} style={styles.logo} />
          <View style={styles.headerTextWrapper}>
            <Text style={styles.screenTitle}>O aplikaci</Text>
            <Text style={styles.subtitle}>Oficiální klubová aplikace FC Zličín</Text>
          </View>
        </View>

        <SectionCard title="Co je tato aplikace">
          <Text style={styles.bodyText}>
            Oficiální mobilní aplikace fotbalového klubu FC Zličín — sleduj novinky, výsledky, zápasy,
            soupisky a další důležité informace.
          </Text>
        </SectionCard>

        <SectionCard title="O klubu">
          <Text style={styles.bodyText}>
            Fotbalový klub FC Zličín je pražský fotbalový klub z Prahy-Zličína, hrající soutěže včetně
            Pražského přeboru a mládežnických kategorií.
          </Text>
        </SectionCard>

        <SectionCard title="Klubové info">
          <LinkRow icon="location-outline" label="Adresa klubu" value={clubAddress} onPress={handleAddressPress} />
          <LinkRow icon="call-outline" label="Telefon" value={primaryPhone} onPress={handlePhonePress} />
          <LinkRow icon="mail-outline" label="E-mail" value={primaryEmail} onPress={handleEmailPress} />
        </SectionCard>

        <SectionCard title="Kdo aplikaci vytvořil">
          <TouchableOpacity style={styles.creatorRow} onPress={handleCreatorPress} activeOpacity={0.75}>
            <Ionicons name="person-circle-outline" size={24} color={colors.brandBlue} />
            <View style={styles.creatorTextWrapper}>
              <Text style={styles.bodyText}>Aplikaci vytvořil</Text>
              <Text style={styles.creatorName}>Jan Franc</Text>
              <Text style={styles.linkValueInteractive}>www.janfranc.cz</Text>
            </View>
          </TouchableOpacity>
        </SectionCard>

        <SectionCard title="Verze aplikace">
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Verze</Text>
            <Text style={styles.metaValue}>{metadata.version}</Text>
          </View>
        </SectionCard>

        <SectionCard title="Kontakt & Podpora">
          <Text style={styles.bodyText}>Máte dotaz nebo potřebujete pomoc s aplikací?</Text>
          <TouchableOpacity style={styles.supportButton} onPress={handleEmailPress} activeOpacity={0.85}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.white} />
            <Text style={styles.supportButtonText}>{primaryEmail}</Text>
          </TouchableOpacity>
        </SectionCard>

        <SectionCard title="Právní informace">
          <LinkRow
            icon="document-text-outline"
            label="Zásady ochrany osobních údajů"
            value="www.fczlicin.cz/privacy-policy"
            onPress={handlePrivacyPress}
          />
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.gray200,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  headerCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: colors.shadow,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: colors.brandBlue,
    marginRight: 16,
    backgroundColor: colors.brandBlueSubtle,
  },
  headerTextWrapper: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.brandBlue,
  },
  subtitle: {
    fontSize: 15,
    color: colors.gray700,
    marginTop: 6,
    lineHeight: 20,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray900,
    marginBottom: 12,
  },
  bodyText: {
    fontSize: 15,
    color: colors.gray700,
    lineHeight: 22,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray400,
  },
  linkIconWrapper: {
    width: 32,
    alignItems: 'center',
  },
  linkTextWrapper: {
    flex: 1,
    marginLeft: 12,
  },
  linkLabel: {
    fontSize: 13,
    textTransform: 'uppercase',
    color: colors.gray600,
    letterSpacing: 0.5,
  },
  linkValue: {
    fontSize: 16,
    color: colors.gray900,
    marginTop: 2,
  },
  linkValueInteractive: {
    color: colors.brandBlue,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  creatorTextWrapper: {
    marginLeft: 12,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray900,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  metaLabel: {
    fontSize: 14,
    color: colors.gray600,
  },
  metaValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray900,
  },
  supportButton: {
    marginTop: 12,
    backgroundColor: colors.brandBlue,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

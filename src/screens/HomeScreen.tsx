import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/linking';
import { TabParamList } from '../navigation/TabNavigator';
import CountdownTimer from '../components/CountdownTimer';
import { 
  useMatchCalendar, 
  useMatchResults, 
  useStandings, 
  useSeasons, 
  useTeams, 
  useCurrentSeason 
} from '../hooks/useFootballData';
import { useNews } from '../hooks/useNews';
import { useTheme } from '../theme/ThemeProvider';
import type { News } from '../types';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');

type HomeScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<RootStackParamList>,
  BottomTabNavigationProp<TabParamList>
>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [activeSlide, setActiveSlide] = useState(0);
  const { globalStyles } = useTheme();
  const hasLoggedMount = useRef(false);
  
  // Football data hooks
  const { data: teams } = useTeams();
  const { data: seasons } = useSeasons();
  const { data: currentSeason } = useCurrentSeason();
  
  // News data hook - uses cache first, then API
  const { news, loading: newsLoading, error: newsError } = useNews();
  
  // Get first 3-5 news items for carousel
  const displayNews = useMemo(() => news?.slice(0, 5) || [], [news]);
  
  // Default team and season
  const defaultTeam = teams?.[0]?.id || 1;
  const defaultSeason = currentSeason?.id || seasons?.[0]?.id || 22;
  
  // Fetch data
  const { data: upcomingMatches, loading: matchesLoading, error: matchesError, refetch: refetchMatches } = useMatchCalendar(defaultTeam, defaultSeason);
  const { data: recentMatches } = useMatchResults(defaultTeam, defaultSeason);
  const { data: standings } = useStandings(defaultTeam, defaultSeason);

  // Track first render (mount) of HomeScreen
  useEffect(() => {
    if (!hasLoggedMount.current) {
      hasLoggedMount.current = true;
    }
  }, []);

  // Track when meaningful content is rendered (when we have data)
  useEffect(() => {
    // Check if we have meaningful data to display
    const hasMeaningfulContent = displayNews.length > 0 || upcomingMatches || recentMatches || standings;
    if (hasMeaningfulContent && hasLoggedMount.current) {
      // Use setTimeout to ensure this runs after render
      const timer = setTimeout(() => {
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [displayNews, upcomingMatches, recentMatches, standings]);
  
  // Find FC Zličín position in standings
  const ourPosition = standings?.findIndex(team => 
    team.team?.toLowerCase().includes('zličín') || 
    team.team?.toLowerCase().includes('zlicin')
  );
  const ourStanding = ourPosition !== undefined && ourPosition !== -1 ? standings[ourPosition] : null;
  
  // Get next match
  const nextMatch = upcomingMatches && upcomingMatches.length > 0 ? upcomingMatches[0] : null;
  
  // Get last 3 matches, sorted by date (newest first), only finished matches
  const lastMatches = recentMatches
    ?.filter((match) => match.status === 'finished' && match.homeScore !== null && match.awayScore !== null)
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA; // Newest first
    })
    .slice(0, 3) || [];

  const renderNewsCarousel = () => {
    // Don't show carousel while loading if we don't have cached data
    if (newsLoading && displayNews.length === 0) {
      return null;
    }

    // Don't show carousel if there's an error and no cached data
    if (newsError && displayNews.length === 0) {
      return null;
    }

    // Don't show carousel if there are no news
    if (!displayNews || displayNews.length === 0) {
      return null;
    }

    const handleNewsPress = (newsItem: News) => {
      navigation.navigate('NewsDetail', {
        newsId: newsItem.id,
        newsTitle: newsItem.title,
        source: 'home',
      });
    };

    return (
      <View style={styles.newsSection}>
        <View style={styles.carouselContainer}>
          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
              setActiveSlide(slideIndex);
            }}
          >
            {displayNews.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.carouselSlide}
                onPress={() => handleNewsPress(item)}
                activeOpacity={0.9}
              >
                <Image 
                  source={{ uri: item.image_url || 'https://via.placeholder.com/400x250/014fa1/FFFFFF?text=FC+Zličín' }} 
                  style={styles.carouselImage}
                  resizeMode="cover"
                />
                <View style={styles.carouselOverlay}>
                  <View style={styles.categoryBadge}>
                    <Text style={[globalStyles.caption, styles.categoryText]}>
                      {item.category || 'Novinky'}
                    </Text>
                  </View>
                  <Text style={[globalStyles.title, styles.carouselTitle]} numberOfLines={2}>
                    {item.title || 'Bez nadpisu'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Dots indicator */}
          {displayNews.length > 1 && (
            <View style={styles.dotsContainer}>
              {displayNews.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    { backgroundColor: index === activeSlide ? colors.brandBlue : colors.overlayWhite50 }
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderQuickActions = () => {
    const actions: Array<{
      id: string;
      title: string;
      icon: keyof typeof Ionicons.glyphMap;
      color: string;
      onPress: () => void;
    }> = [
      {
        id: 'matches',
        title: 'Zápasy',
        icon: 'football',
        color: colors.brandBlue,
        onPress: () => navigation.navigate('Matches'),
      },
      {
        id: 'standings',
        title: 'Tabulka',
        icon: 'trophy',
        color: colors.warning,
        onPress: () => navigation.navigate('Artists'),
      },
      {
        id: 'team',
        title: 'Tým',
        icon: 'people',
        color: colors.success,
        onPress: () => navigation.navigate('Favorites'),
      },
      {
        id: 'news',
        title: 'Novinky',
        icon: 'newspaper',
        color: colors.error,
        onPress: () => navigation.navigate('News'),
      },
    ];

    return (
      <View style={styles.quickActionsContainer}>
        <Text style={[globalStyles.heading, styles.sectionTitle]}>Rychlý přístup</Text>
        <View style={styles.quickActionsGrid}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.quickActionCard}
              onPress={action.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}15` }]}>
                <Ionicons name={action.icon} size={28} color={action.color} />
              </View>
              <Text style={[globalStyles.text, styles.quickActionText]}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderStandingsWidget = () => {
    if (!ourStanding || !standings) return null;

    return (
      <TouchableOpacity 
        style={styles.widgetCard}
        onPress={() => navigation.navigate('Artists')}
        activeOpacity={0.7}
      >
        <View style={styles.widgetHeader}>
          <Ionicons name="trophy" size={20} color={colors.warning} />
          <Text style={[globalStyles.heading, styles.widgetTitle]}>Aktuální pozice</Text>
        </View>
        <View style={styles.standingsContent}>
          <View style={styles.positionBadge}>
            <Text style={[globalStyles.title, styles.positionNumber]}>{ourStanding?.position || '-'}</Text>
          </View>
          <View style={styles.standingsInfo}>
            <Text style={[globalStyles.title, styles.standingsTeam]}>{ourStanding.team || 'FC Zličín'}</Text>
            <View style={styles.standingsStats}>
              <View style={styles.statItem}>
                <Text style={[globalStyles.title, styles.statValue]}>{ourStanding.points || 0}</Text>
                <Text style={[globalStyles.caption, styles.statLabel]}>Body</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[globalStyles.title, styles.statValue]}>{ourStanding.won || 0}</Text>
                <Text style={[globalStyles.caption, styles.statLabel]}>Výhry</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[globalStyles.title, styles.statValue]}>{ourStanding.drawn || 0}</Text>
                <Text style={[globalStyles.caption, styles.statLabel]}>Remízy</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[globalStyles.title, styles.statValue]}>{ourStanding.lost || 0}</Text>
                <Text style={[globalStyles.caption, styles.statLabel]}>Prohry</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.widgetFooter}>
          <Text style={[globalStyles.text, styles.widgetLink]}>Zobrazit celou tabulku →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderRecentResults = () => {
    if (!lastMatches || lastMatches.length === 0) return null;

    return (
      <View style={styles.widgetCard}>
        <View style={styles.widgetHeader}>
          <Ionicons name="time" size={20} color={colors.brandBlue} />
          <Text style={[globalStyles.heading, styles.widgetTitle]}>Poslední výsledky</Text>
        </View>
        {lastMatches.map((match, index) => {
          const matchDate = match.date ? new Date(match.date) : null;
          const isHome = match.isHome || match.homeTeam?.toLowerCase().includes('zličín') || 
                        match.homeTeam?.toLowerCase().includes('zlicin');
          
          // Determine result type (win/draw/loss)
          const homeScore = match.homeScore ?? 0;
          const awayScore = match.awayScore ?? 0;
          let resultColor = colors.warning; // Default: orange for draw
          
          if (isHome) {
            if (homeScore > awayScore) {
              resultColor = colors.success; // Green for win
            } else if (homeScore < awayScore) {
              resultColor = colors.error; // Red for loss
            }
          } else {
            if (awayScore > homeScore) {
              resultColor = colors.success; // Green for win
            } else if (awayScore < homeScore) {
              resultColor = colors.error; // Red for loss
            }
          }
          
          const hasDetail = match.hasDetail !== false; // Default true pokud není specifikováno
          
          return (
            <TouchableOpacity
              key={match.id || index}
              style={styles.resultItem}
              onPress={() => hasDetail ? navigation.navigate('MatchDetail', { matchId: match.id.toString(), source: 'home_recent' }) : null}
              activeOpacity={0.7}
              disabled={!hasDetail}
            >
              <View style={styles.resultContent}>
                <View style={styles.resultTeamColumn}>
                  <Text style={[globalStyles.text, styles.resultTeamName, isHome && styles.resultTeamNameBold]}>
                    {match.homeTeam || 'FC Zličín'}
                  </Text>
                </View>
                <View style={styles.resultScoreColumn}>
                  <Text style={[globalStyles.title, styles.resultScore, { color: resultColor }]}>
                    {homeScore}:{awayScore}
                  </Text>
                </View>
                <View style={styles.resultTeamColumn}>
                  <Text style={[globalStyles.text, styles.resultTeamName, !isHome && styles.resultTeamNameBold]}>
                    {match.awayTeam || 'Soupeř'}
                  </Text>
                </View>
              </View>
              {matchDate && (
                <Text style={[globalStyles.caption, styles.resultDate]}>
                  {matchDate.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' })}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity 
          style={styles.widgetFooter}
          onPress={() => navigation.navigate('Matches')}
        >
          <Text style={[globalStyles.text, styles.widgetLink]}>Zobrazit všechny zápasy →</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderUpcomingMatch = () => {
    if (matchesLoading) {
      return (
        <View style={styles.matchCard}>
          <Text style={[globalStyles.heading, styles.matchCardTitle]}>Nejbližší utkání</Text>
          <ActivityIndicator size="small" color={colors.brandBlue} style={styles.loadingIndicator} />
          <Text style={[globalStyles.text, styles.loadingText]}>Načítání...</Text>
        </View>
      );
    }

    if (matchesError) {
      return (
        <View style={styles.matchCard}>
          <Text style={[globalStyles.heading, styles.matchCardTitle]}>Nejbližší utkání</Text>
          <Text style={[globalStyles.text, styles.errorText]}>
            Nepodařilo se načíst nadcházející zápasy
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetchMatches}>
            <Text style={[globalStyles.button, styles.retryButtonText]}>Zkusit znovu</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!nextMatch) {
      return (
        <View style={styles.matchCard}>
          <Text style={[globalStyles.heading, styles.matchCardTitle]}>Nejbližší utkání</Text>
          <Text style={[globalStyles.text, styles.noMatchesText]}>
            Momentálně nejsou naplánovány žádné zápasy
          </Text>
        </View>
      );
    }

    const matchDate = nextMatch.date ? new Date(nextMatch.date) : new Date();
    const isHome = nextMatch.homeTeam?.toLowerCase().includes('zličín') || 
                   nextMatch.homeTeam?.toLowerCase().includes('zlicin');

    const hasDetail = nextMatch.hasDetail !== false; // Default true pokud není specifikováno
    
    return (
      <TouchableOpacity 
        style={styles.matchCard}
        onPress={() => hasDetail ? navigation.navigate('MatchDetail', { matchId: nextMatch.id.toString(), source: 'home_next' }) : null}
        activeOpacity={1}
        disabled={!hasDetail}
      >
        <View style={styles.matchCardHeader}>
          <Text style={[globalStyles.heading, styles.matchCardTitle]}>Nejbližší utkání</Text>
          {nextMatch.round && (
            <View style={styles.roundBadge}>
              <Text style={[globalStyles.caption, styles.roundBadgeText]}>{nextMatch.round}.kolo</Text>
            </View>
          )}
        </View>
        <View style={styles.matchContent}>
          <View style={styles.teamContainer}>
            {nextMatch.homeTeamLogo ? (
              <Image 
                source={{ uri: nextMatch.homeTeamLogo }} 
                style={styles.teamLogoImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.teamLogo}>
                <Text style={[globalStyles.caption, styles.logoText]}>
                  {nextMatch.homeTeam?.toUpperCase().substring(0, 8) || 'FC ZLIČÍN'}
                </Text>
                <Text style={[globalStyles.caption, styles.logoYear]}>1929</Text>
              </View>
            )}
            <Text style={[globalStyles.text, styles.teamName]} numberOfLines={1}>
              {nextMatch.homeTeam || 'FC Zličín'}
            </Text>
          </View>
          
          <View style={styles.matchInfo}>
            <Text style={[globalStyles.subtitle, styles.matchDate]}>
              {matchDate.toLocaleDateString('cs-CZ', { weekday: 'short', day: 'numeric', month: 'short' })}
            </Text>
            <Text style={[globalStyles.caption, styles.matchTime]}>
              {matchDate.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <View style={styles.countdownContainer}>
              <CountdownTimer targetDate={matchDate} />
            </View>
            {isHome && (
              <View style={styles.homeBadge}>
                <Ionicons name="home" size={12} color={colors.white} />
                <Text style={[globalStyles.caption, styles.homeBadgeText]}>DOMÁCÍ</Text>
              </View>
            )}
          </View>
          
          <View style={styles.teamContainer}>
            {nextMatch.awayTeamLogo ? (
              <Image 
                source={{ uri: nextMatch.awayTeamLogo }} 
                style={styles.teamLogoImage}
                resizeMode="contain"
              />
            ) : (
              <View style={[styles.teamLogo, styles.awayTeamLogo]}>
                <Text style={[globalStyles.caption, styles.logoText]}>
                  {nextMatch.awayTeam?.toUpperCase().substring(0, 8) || 'SOUPĚŘ'}
                </Text>
                <Text style={[globalStyles.caption, styles.logoYear]}>1936</Text>
              </View>
            )}
            <Text style={[globalStyles.text, styles.teamName]} numberOfLines={1}>
              {nextMatch.awayTeam || 'Soupeř'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {renderNewsCarousel()}
        {renderUpcomingMatch()}
        {renderQuickActions()}
        {renderStandingsWidget()}
        {renderRecentResults()}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray300,
  },
  scrollView: {
    flex: 1,
  },
  newsSection: {
    marginBottom: 24,
  },
  carouselContainer: {
    height: 280,
  },
  carouselSlide: {
    width: width,
    height: 280,
    position: 'relative',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  carouselOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: colors.overlay40,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  categoryBadge: {
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  categoryText: {
    fontWeight: 'bold',
    color: colors.brandBlue,
  },
  carouselTitle: {
    color: colors.white,
    textShadowColor: colors.overlay80,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
    lineHeight: 28,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 24,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    backgroundColor: colors.overlayWhite50,
  },
  matchCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    backgroundColor: colors.white,
    borderRadius: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.gray475,
  },
  matchCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  matchCardTitle: {
    color: colors.brandBlue,
  },
  roundBadge: {
    backgroundColor: colors.brandBlue,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roundBadgeText: {
    color: colors.white,
  },
  loadingIndicator: {
    marginVertical: 20,
  },
  loadingText: {
    textAlign: 'center',
    color: colors.gray700,
    marginTop: 8,
  },
  errorText: {
    textAlign: 'center',
    color: colors.error,
    marginBottom: 16,
  },
  noMatchesText: {
    textAlign: 'center',
    color: colors.gray700,
    paddingVertical: 20,
  },
  retryButton: {
    backgroundColor: colors.brandBlue,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 8,
  },
  retryButtonText: {
    color: colors.white,
  },
  matchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  teamContainer: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 4,
    minWidth: 0,
  },
  teamLogo: {
    width: 70,
    height: 80,
    backgroundColor: colors.brandBlue,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: colors.brandBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  teamLogoImage: {
    width: 70,
    height: 80,
    marginBottom: 10,
  },
  awayTeamLogo: {
    backgroundColor: colors.error,
  },
  logoText: {
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  logoYear: {
    fontWeight: 'bold',
    color: colors.white,
    marginTop: 4,
  },
  teamName: {
    fontWeight: '600',
    color: colors.gray900,
    textAlign: 'center',
    flexShrink: 1,
    width: '100%',
  },
  matchInfo: {
    alignItems: 'center',
    flex: 2,
    paddingHorizontal: 12,
  },
  matchDate: {
    color: colors.gray900,
    marginBottom: 4,
    fontWeight: '600',
  },
  matchTime: {
    color: colors.gray700,
    marginBottom: 12,
  },
  countdownContainer: {
    marginTop: 4,
  },
  homeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  homeBadgeText: {
    color: colors.white,
    marginLeft: 4,
  },
  // Quick Actions
  quickActionsContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    color: colors.gray900,
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: (width - 48) / 2,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.gray400,
  },
  quickActionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    color: colors.gray900,
    textAlign: 'center',
  },
  // Widgets
  widgetCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.gray400,
  },
  widgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  widgetTitle: {
    color: colors.gray900,
    marginLeft: 8,
  },
  standingsContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  positionBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.warning,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  positionNumber: {
    color: colors.white,
  },
  standingsInfo: {
    flex: 1,
  },
  standingsTeam: {
    color: colors.gray900,
    marginBottom: 12,
  },
  standingsStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: colors.brandBlue,
    marginBottom: 4,
  },
  statLabel: {
    color: colors.gray700,
  },
  widgetFooter: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray400,
  },
  widgetLink: {
    color: colors.brandBlue,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Recent Results
  resultItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray400,
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  resultTeamColumn: {
    flex: 1,
    alignItems: 'flex-start',
    paddingHorizontal: 8,
  },
  resultScoreColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  resultTeamName: {
    color: colors.gray700,
    textAlign: 'left',
  },
  resultTeamNameBold: {
    fontWeight: 'bold',
    color: colors.gray900,
  },
  resultScore: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  resultDate: {
    color: colors.gray600,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 20,
  },
});

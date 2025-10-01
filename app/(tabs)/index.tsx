import react, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MapPin, Bus, Building2 } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [popularRoutes, setPopularRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPopularRoutes();
  }, []);

  const loadPopularRoutes = async () => {
    try {
      const { data: busLines, error: busError } = await supabase
        .from('bus_lines')
        .select('*')
        .eq('active', true)
        .limit(5);

      const { data: intercityRoutes, error: intercityError } = await supabase
        .from('intercity_routes')
        .select('*, transport_agencies(name)')
        .eq('active', true)
        .limit(3);

      if (!busError && busLines) {
        setPopularRoutes((prev) => [
          ...prev,
          ...busLines.map((line) => ({ ...line, type: 'bus' })),
        ]);
      }

      if (!intercityError && intercityRoutes) {
        setPopularRoutes((prev) => [
          ...prev,
          ...intercityRoutes.map((route) => ({ ...route, type: 'intercity' })),
        ]);
      }
    } catch (error) {
      console.error('Error loading routes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push({
        pathname: '/(tabs)/search',
        params: { query: searchQuery },
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Transport Burundi</Text>
          <Text style={styles.subtitle}>
            Trouvez votre itinéraire facilement
          </Text>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Search size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Où allez-vous ?"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/map')}>
            <View style={styles.actionIconContainer}>
              <MapPin size={24} color="#2563EB" />
            </View>
            <Text style={styles.actionTitle}>Carte</Text>
            <Text style={styles.actionSubtitle}>Voir les lignes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/agencies')}>
            <View style={styles.actionIconContainer}>
              <Building2 size={24} color="#2563EB" />
            </View>
            <Text style={styles.actionTitle}>Agences</Text>
            <Text style={styles.actionSubtitle}>Interprovincial</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Itinéraires populaires</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#2563EB" />
          ) : popularRoutes.length > 0 ? (
            popularRoutes.map((route) => (
              <TouchableOpacity
                key={route.id}
                style={styles.routeCard}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/map',
                    params: { routeId: route.id, type: route.type },
                  })
                }>
                <View
                  style={[
                    styles.routeIcon,
                    {
                      backgroundColor:
                        route.type === 'bus' ? '#DBEAFE' : '#FEF3C7',
                    },
                  ]}>
                  {route.type === 'bus' ? (
                    <Bus size={20} color="#2563EB" />
                  ) : (
                    <Building2 size={20} color="#F59E0B" />
                  )}
                </View>
                <View style={styles.routeInfo}>
                  <Text style={styles.routeName}>
                    {route.name ||
                      `${route.departure_point} → ${route.arrival_point}`}
                  </Text>
                  {route.zones_covered && route.zones_covered.length > 0 && (
                    <Text style={styles.routeZones}>
                      {route.zones_covered.join(' • ')}
                    </Text>
                  )}
                  {route.transport_agencies && (
                    <Text style={styles.routeAgency}>
                      {route.transport_agencies.name}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>Aucun itinéraire disponible</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#111827',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  routeCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  routeIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  routeZones: {
    fontSize: 14,
    color: '#6B7280',
  },
  routeAgency: {
    fontSize: 14,
    color: '#2563EB',
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    marginTop: 20,
  },
});

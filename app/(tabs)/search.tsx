import { useState, useEffect } from 'react';
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
import { Search as SearchIcon, Bus, Building2, X } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useLocalSearchParams } from 'expo-router';

type SearchResult = {
  id: string;
  name: string;
  type: 'bus' | 'intercity';
  details?: string;
  zones?: string[];
  agency?: string;
};

export default function SearchScreen() {
  const params = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState(
    (params.query as string) || ''
  );
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch();
    }
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const searchTerm = searchQuery.toLowerCase();

      const { data: busLines, error: busError } = await supabase
        .from('bus_lines')
        .select('*')
        .eq('active', true);

      const { data: intercityRoutes, error: intercityError } = await supabase
        .from('intercity_routes')
        .select('*, transport_agencies(name)')
        .eq('active', true);

      const searchResults: SearchResult[] = [];

      if (!busError && busLines) {
        busLines.forEach((line) => {
          const matchesName = line.name.toLowerCase().includes(searchTerm);
          const matchesZone = line.zones_covered?.some((zone: string) =>
            zone.toLowerCase().includes(searchTerm)
          );

          if (matchesName || matchesZone) {
            searchResults.push({
              id: line.id,
              name: line.name,
              type: 'bus',
              zones: line.zones_covered || [],
            });
          }
        });
      }

      if (!intercityError && intercityRoutes) {
        intercityRoutes.forEach((route: any) => {
          const matchesDeparture = route.departure_point
            .toLowerCase()
            .includes(searchTerm);
          const matchesArrival = route.arrival_point
            .toLowerCase()
            .includes(searchTerm);

          if (matchesDeparture || matchesArrival) {
            searchResults.push({
              id: route.id,
              name: `${route.departure_point} → ${route.arrival_point}`,
              type: 'intercity',
              agency: route.transport_agencies?.name,
              details: route.price ? `${route.price} FBU` : undefined,
            });
          }
        });
      }

      setResults(searchResults);

      if (searchQuery.trim() && !recentSearches.includes(searchQuery)) {
        setRecentSearches((prev) => [searchQuery, ...prev.slice(0, 4)]);
      }
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setResults([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchBox}>
          <SearchIcon size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une destination..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : results.length > 0 ? (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>
              {results.length} résultat{results.length > 1 ? 's' : ''}
            </Text>
            {results.map((result) => (
              <TouchableOpacity key={result.id} style={styles.resultCard}>
                <View
                  style={[
                    styles.resultIcon,
                    {
                      backgroundColor:
                        result.type === 'bus' ? '#DBEAFE' : '#FEF3C7',
                    },
                  ]}>
                  {result.type === 'bus' ? (
                    <Bus size={20} color="#2563EB" />
                  ) : (
                    <Building2 size={20} color="#F59E0B" />
                  )}
                </View>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>{result.name}</Text>
                  {result.zones && result.zones.length > 0 && (
                    <Text style={styles.resultZones}>
                      {result.zones.join(' • ')}
                    </Text>
                  )}
                  {result.agency && (
                    <Text style={styles.resultAgency}>{result.agency}</Text>
                  )}
                  {result.details && (
                    <Text style={styles.resultDetails}>{result.details}</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : searchQuery.trim() ? (
          <View style={styles.emptyContainer}>
            <SearchIcon size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>Aucun résultat trouvé</Text>
            <Text style={styles.emptySubtext}>
              Essayez avec un autre terme de recherche
            </Text>
          </View>
        ) : (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Suggestions</Text>
            {[
              'Centre-ville',
              'Gasenyi',
              'Ngozi',
              'Gitega',
              'Bujumbura',
            ].map((suggestion) => (
              <TouchableOpacity
                key={suggestion}
                style={styles.suggestionItem}
                onPress={() => {
                  setSearchQuery(suggestion);
                  handleSearch();
                }}>
                <SearchIcon size={16} color="#6B7280" />
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
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
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  resultsContainer: {
    padding: 16,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  resultZones: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  resultAgency: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
  resultDetails: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  suggestionsContainer: {
    padding: 16,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  suggestionText: {
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
  },
});

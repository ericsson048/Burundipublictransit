import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Building2, Phone, Mail, MapPin } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

type AgencyWithRoutes = {
  id: string;
  name: string;
  contact_phone?: string;
  contact_email?: string;
  routes: Array<{
    id: string;
    departure_point: string;
    arrival_point: string;
    price?: number;
    duration_minutes?: number;
  }>;
};

export default function AgenciesScreen() {
  const [agencies, setAgencies] = useState<AgencyWithRoutes[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAgency, setExpandedAgency] = useState<string | null>(null);

  useEffect(() => {
    loadAgencies();
  }, []);

  const loadAgencies = async () => {
    try {
      const { data: agenciesData, error: agenciesError } = await supabase
        .from('transport_agencies')
        .select('*')
        .eq('active', true);

      if (agenciesError) throw agenciesError;

      if (agenciesData) {
        const agenciesWithRoutes = await Promise.all(
          agenciesData.map(async (agency) => {
            const { data: routes } = await supabase
              .from('intercity_routes')
              .select('id, departure_point, arrival_point, price, duration_minutes')
              .eq('agency_id', agency.id)
              .eq('active', true);

            return {
              ...agency,
              routes: routes || [],
            };
          })
        );

        setAgencies(agenciesWithRoutes);
      }
    } catch (error) {
      console.error('Error loading agencies:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAgency = (agencyId: string) => {
    setExpandedAgency(expandedAgency === agencyId ? null : agencyId);
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}min`;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Agences de Transport</Text>
        <Text style={styles.subtitle}>Transport interprovincial</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : agencies.length > 0 ? (
          agencies.map((agency) => (
            <View key={agency.id} style={styles.agencyCard}>
              <TouchableOpacity
                style={styles.agencyHeader}
                onPress={() => toggleAgency(agency.id)}>
                <View style={styles.agencyIcon}>
                  <Building2 size={24} color="#2563EB" />
                </View>
                <View style={styles.agencyInfo}>
                  <Text style={styles.agencyName}>{agency.name}</Text>
                  <Text style={styles.agencyRoutes}>
                    {agency.routes.length} trajet
                    {agency.routes.length > 1 ? 's' : ''}
                  </Text>
                </View>
              </TouchableOpacity>

              {expandedAgency === agency.id && (
                <View style={styles.agencyDetails}>
                  {agency.contact_phone && (
                    <View style={styles.contactRow}>
                      <Phone size={16} color="#6B7280" />
                      <Text style={styles.contactText}>
                        {agency.contact_phone}
                      </Text>
                    </View>
                  )}

                  {agency.contact_email && (
                    <View style={styles.contactRow}>
                      <Mail size={16} color="#6B7280" />
                      <Text style={styles.contactText}>
                        {agency.contact_email}
                      </Text>
                    </View>
                  )}

                  {agency.routes.length > 0 && (
                    <View style={styles.routesContainer}>
                      <Text style={styles.routesTitle}>Trajets disponibles</Text>
                      {agency.routes.map((route) => (
                        <View key={route.id} style={styles.routeItem}>
                          <View style={styles.routeHeader}>
                            <MapPin size={16} color="#2563EB" />
                            <Text style={styles.routeText}>
                              {route.departure_point} → {route.arrival_point}
                            </Text>
                          </View>
                          <View style={styles.routeMeta}>
                            {route.price && (
                              <Text style={styles.routePrice}>
                                {route.price} FBU
                              </Text>
                            )}
                            {route.duration_minutes && (
                              <Text style={styles.routeDuration}>
                                {formatDuration(route.duration_minutes)}
                              </Text>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Building2 size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>Aucune agence disponible</Text>
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
    padding: 20,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
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
  agencyCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  agencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  agencyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  agencyInfo: {
    flex: 1,
  },
  agencyName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  agencyRoutes: {
    fontSize: 14,
    color: '#6B7280',
  },
  agencyDetails: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  routesContainer: {
    marginTop: 16,
  },
  routesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  routeItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  routeText: {
    fontSize: 14,
    color: '#111827',
    marginLeft: 6,
    fontWeight: '500',
  },
  routeMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  routePrice: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  routeDuration: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
});

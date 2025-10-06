import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useLocalSearchParams } from 'expo-router';
import { MapPin, DollarSign } from 'lucide-react-native';

let MapView: any;
let Marker: any;
let Polyline: any;
let PROVIDER_GOOGLE: any;
let Callout: any;

if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  Polyline = maps.Polyline;
  PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
  Callout = maps.Callout;
}

export const BUJUMBURA_CENTER = {
  latitude: -3.3731,
  longitude: 29.36,
};

export default function MapScreen() {
  const [busLines, setBusLines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLine, setSelectedLine] = useState<any>(null);
  const mapRef = useRef<any>(null);
  const params = useLocalSearchParams();

  useEffect(() => {
    loadBusLines();
  }, []);

  const loadBusLines = async () => {
    try {
      const { data, error } = await supabase
        .from('bus_lines')
        .select('*')
        .eq('active', true);

      if (error) throw error;
      if (data) setBusLines(data);
    } catch (error) {
      console.error('Error loading bus lines:', error);
    } finally {
      setLoading(false);
    }
  };

  // Zoom automatique sur toutes les lignes
  useEffect(() => {
    if (busLines.length && mapRef.current) {
      const allCoords: { latitude: number; longitude: number }[] = [];
      busLines.forEach(line => {
        if (line.route_coordinates?.coordinates) {
          line.route_coordinates.coordinates.forEach((c: number[]) => {
            allCoords.push({ latitude: c[1], longitude: c[0] });
          });
        }
      });

      if (allCoords.length > 0) {
        mapRef.current.fitToCoordinates(allCoords, {
          edgePadding: { top: 80, right: 80, bottom: 200, left: 80 },
          animated: true,
        });
      }
    }
  }, [busLines]);

  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.webMessage}>
          <Text style={styles.webMessageTitle}>Carte non disponible</Text>
          <Text style={styles.webMessageText}>
            La carte interactive nécessite un appareil mobile. Veuillez utiliser
            l'application sur iOS ou Android.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Chargement de la carte...</Text>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: BUJUMBURA_CENTER.latitude,
              longitude: BUJUMBURA_CENTER.longitude,
              latitudeDelta: 0.1,
              longitudeDelta: 0.1,
            }}
            zoomEnabled
            scrollEnabled
          >
            {busLines.map((line) =>
              line.route_coordinates?.coordinates ? (
                <Polyline
                  key={line.id}
                  coordinates={line.route_coordinates.coordinates.map(
                    (c: number[]) => ({ latitude: c[1], longitude: c[0] })
                  )}
                  strokeColor={line.color || '#2563EB'}
                  strokeWidth={4}
                  lineCap="round"
                />
              ) : null
            )}

            {/* Affichage des stops */}
            {busLines.map((line) =>
              line.stops && Array.isArray(line.stops)
                ? line.stops.map((stop: any, index: number) => (
                    <Marker
                      key={`${line.id}-stop-${index}`}
                      coordinate={{
                        latitude: stop.coordinates[1],
                        longitude: stop.coordinates[0],
                      }}
                      pinColor={line.color || '#2563EB'}
                      onPress={() => setSelectedLine(line)}
                    >
                      <Callout>
                        <View style={styles.callout}>
                          <Text style={styles.calloutTitle}>{line.name}</Text>
                          <Text style={styles.calloutText}>
                            Prix: {line.price || 500} FBU
                          </Text>
                        </View>
                      </Callout>
                    </Marker>
                  ))
                : null
            )}
          </MapView>
        )}
      </View>

      {selectedLine ? (
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View>
              <Text style={styles.infoTitle}>{selectedLine.name}</Text>
              <Text style={styles.infoSubtitle}>
                {selectedLine.zones_covered?.join(' • ')}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedLine(null)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.priceContainer}>
            <DollarSign size={20} color="#059669" />
            <Text style={styles.priceText}>
              {selectedLine.price || 500} FBU
            </Text>
          </View>
          {selectedLine.stops && selectedLine.stops.length > 0 && (
            <View style={styles.stopsContainer}>
              <Text style={styles.stopsTitle}>Arrêts</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {selectedLine.stops.map((stop: any, idx: number) => (
                  <View key={idx} style={styles.stopChip}>
                    <MapPin size={12} color="#6B7280" />
                    <Text style={styles.stopText}>{stop.name}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Lignes de bus</Text>
          <ScrollView style={styles.legendScroll}>
            {busLines.map((line) => (
              <TouchableOpacity
                key={line.id}
                style={styles.legendItem}
                onPress={() => setSelectedLine(line)}
              >
                <View
                  style={[
                    styles.legendColor,
                    { backgroundColor: line.color || '#2563EB' },
                  ]}
                />
                <View style={styles.legendInfo}>
                  <Text style={styles.legendText} numberOfLines={1}>
                    {line.name}
                  </Text>
                  <Text style={styles.legendPrice}>
                    {line.price || 500} FBU
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  mapContainer: { flex: 1 },
  map: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: { marginTop: 12, fontSize: 16, color: '#6B7280' },
  webMessage: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  webMessageTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 12, textAlign: 'center' },
  webMessageText: { fontSize: 16, color: '#6B7280', textAlign: 'center', lineHeight: 24 },
  legend: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  legendTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 },
  legendScroll: { maxHeight: 150 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingRight: 8 },
  legendColor: { width: 20, height: 4, borderRadius: 2, marginRight: 8 },
  legendInfo: { flex: 1 },
  legendText: { fontSize: 14, color: '#111827', fontWeight: '500' },
  legendPrice: { fontSize: 12, color: '#059669', marginTop: 2 },
  callout: { padding: 8, minWidth: 150 },
  calloutTitle: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 4 },
  calloutText: { fontSize: 12, color: '#6B7280' },
  infoCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  infoTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  infoSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  closeButton: { fontSize: 20, color: '#6B7280', padding: 4 },
  priceContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#F0FDF4', borderRadius: 8 },
  priceText: { fontSize: 18, fontWeight: '700', color: '#059669', marginLeft: 8 },
  stopsContainer: { marginTop: 8 },
  stopsTitle: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 8 },
  stopChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, marginRight: 8 },
  stopText: { fontSize: 12, color: '#6B7280', marginLeft: 4 },
});

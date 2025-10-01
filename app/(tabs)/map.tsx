import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import SuperCluster from 'supercluster';
import { supabase } from '@/lib/supabase';
import { useLocalSearchParams } from 'expo-router';

export const BUJUMBURA_CENTER = {
  latitude: -3.3731,
  longitude: 29.36,
};

export default function MapScreen() {
  const [busLines, setBusLines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<MapView>(null);
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
                    />
                  ))
                : null
            )}
          </MapView>
        )}
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Lignes de bus</Text>
        {busLines.slice(0, 5).map((line) => (
          <View key={line.id} style={styles.legendItem}>
            <View
              style={[
                styles.legendColor,
                { backgroundColor: line.color || '#2563EB' },
              ]}
            />
            <Text style={styles.legendText} numberOfLines={1}>
              {line.name}
            </Text>
          </View>
        ))}
      </View>
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
  legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  legendColor: { width: 20, height: 4, borderRadius: 2, marginRight: 8 },
  legendText: { flex: 1, fontSize: 14, color: '#6B7280' },
});

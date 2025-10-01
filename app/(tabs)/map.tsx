import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mapbox } from '@/lib/mapbox';
import { BUJUMBURA_CENTER } from '@/lib/mapbox';
import { supabase } from '@/lib/supabase';
import { useLocalSearchParams } from 'expo-router';

export default function MapScreen() {
  const [busLines, setBusLines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

      if (data) {
        setBusLines(data);
      }
    } catch (error) {
      console.error('Error loading bus lines:', error);
    } finally {
      setLoading(false);
    }
  };

  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.webMessage}>
          <Text style={styles.webMessageTitle}>Carte non disponible</Text>
          <Text style={styles.webMessageText}>
            La carte interactive Mapbox nécessite un appareil mobile. Veuillez
            utiliser l'application sur iOS ou Android pour voir les itinéraires.
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
          <Mapbox.MapView
            style={styles.map}
            styleURL={Mapbox.StyleURL.Street}
            zoomEnabled={true}
            scrollEnabled={true}>
            <Mapbox.Camera
              zoomLevel={12}
              centerCoordinate={[
                BUJUMBURA_CENTER.longitude,
                BUJUMBURA_CENTER.latitude,
              ]}
            />

            {busLines.map((line) => {
              if (
                line.route_coordinates &&
                line.route_coordinates.coordinates
              ) {
                return (
                  <Mapbox.ShapeSource
                    key={line.id}
                    id={`busLine-${line.id}`}
                    shape={{
                      type: 'Feature',
                      geometry: line.route_coordinates,
                      properties: {},
                    }}>
                    <Mapbox.LineLayer
                      id={`lineLayer-${line.id}`}
                      style={{
                        lineColor: line.color || '#2563EB',
                        lineWidth: 4,
                        lineOpacity: 0.8,
                      }}
                    />
                  </Mapbox.ShapeSource>
                );
              }
              return null;
            })}

            {busLines.map((line) => {
              if (line.stops && Array.isArray(line.stops)) {
                return line.stops.map((stop: any, index: number) => (
                  <Mapbox.PointAnnotation
                    key={`${line.id}-stop-${index}`}
                    id={`stop-${line.id}-${index}`}
                    coordinate={stop.coordinates}>
                    <View style={styles.stopMarker}>
                      <View
                        style={[
                          styles.stopMarkerInner,
                          { backgroundColor: line.color || '#2563EB' },
                        ]}
                      />
                    </View>
                  </Mapbox.PointAnnotation>
                ));
              }
              return null;
            })}
          </Mapbox.MapView>
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
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  webMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  webMessageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  webMessageText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  stopMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  stopMarkerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
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
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 20,
    height: 4,
    borderRadius: 2,
    marginRight: 8,
  },
  legendText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
  },
});

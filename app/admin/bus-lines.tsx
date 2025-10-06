import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Plus, Bus, Trash2, CreditCard as Edit } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';


type BusLine = {
  id: string;
  name: string;
  city_id: string;
  zones_covered: string[];
  color: string;
  active: boolean;
  route_coordinates: any;
  stops: { name: string; lat: number; lng: number }[];
};

type City = { id: string; name: string };

export default function ManageBusLines() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [busLines, setBusLines] = useState<BusLine[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLine, setEditingLine] = useState<BusLine | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<{ latitude: number; longitude: number }[]>([]);


  const [formData, setFormData] = useState({
    name: '',
    zones: '',
    color: '#2563EB',
    city_id: '',
    price: '500',
    stops: [] as { name: string; lat: number; lng: number }[],
    route_coordinates: { type: 'LineString', coordinates: [] as [number, number][] },
  });

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.back();
    } else {
      loadCities();
      loadBusLines();
    }
  }, [authLoading, isAdmin]);

  const loadCities = async () => {
    try {
      const { data, error } = await supabase.from('cities').select('id, name').order('name');
      if (error) throw error;
      if (data) setCities(data);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger les villes');
    }
  };

  const loadBusLines = async () => {
    try {
      const { data, error } = await supabase
        .from('bus_lines')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setBusLines(data);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger les lignes');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (line?: BusLine) => {
    if (line) {
      setEditingLine(line);
      setFormData({
        name: line.name,
        zones: line.zones_covered.join(', '),
        color: line.color,
        city_id: line.city_id,
        price: String(line.price || 500),
        stops: line.stops ?? [],
        route_coordinates: line.route_coordinates ?? { type: 'LineString', coordinates: [] },
      });
      setRouteCoordinates(line.route_coordinates?.coordinates?.map(([lng, lat]: [number, number]) => ({ latitude: lat, longitude: lng })) || []);

    } else {
      setEditingLine(null);
      setFormData({
        name: '',
        zones: '',
        color: '#2563EB',
        city_id: cities[0]?.id ?? '',
        price: '500',
        stops: [],
        route_coordinates: { type: 'LineString', coordinates: [] },
      });
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingLine(null);
    setFormData({
      name: '',
      zones: '',
      color: '#2563EB',
      city_id: cities[0]?.id ?? '',
      price: '500',
      stops: [],
      route_coordinates: { type: 'LineString', coordinates: [] },
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.city_id) {
      Alert.alert('Erreur', 'Le nom et la ville sont requis');
      return;
    }

    const zones = formData.zones
      .split(',')
      .map((z) => z.trim())
      .filter((z) => z);

    try {
      if (editingLine) {
        const { error } = await supabase
          .from('bus_lines')
          .update({
            name: formData.name,
            city_id: formData.city_id,
            zones_covered: zones,
            color: formData.color,
            price: parseInt(formData.price) || 500,
            stops: formData.stops,
            route_coordinates: formData.route_coordinates,
          })
          .eq('id', editingLine.id);
        if (error) throw error;
        Alert.alert('Succès', 'Ligne modifiée avec succès');
      } else {
        const { error } = await supabase.from('bus_lines').insert({
          name: formData.name,
          city_id: formData.city_id,
          zones_covered: zones,
          color: formData.color,
          price: parseInt(formData.price) || 500,
          stops: formData.stops,
          route_coordinates: formData.route_coordinates,
          active: true,
        });
        if (error) throw error;
        Alert.alert('Succès', 'Ligne ajoutée avec succès');
      }
      closeModal();
      loadBusLines();
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder la ligne');
    }
  };

  const handleDelete = (line: BusLine) => {
    Alert.alert(
      'Supprimer la ligne',
      `Êtes-vous sûr de vouloir supprimer "${line.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('bus_lines').delete().eq('id', line.id);
              if (error) throw error;
              Alert.alert('Succès', 'Ligne supprimée');
              loadBusLines();
            } catch {
              Alert.alert('Erreur', 'Impossible de supprimer la ligne');
            }
          },
        },
      ]
    );
  };

  if (authLoading || !isAdmin) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Lignes de Bus</Text>
        <TouchableOpacity onPress={() => openModal()}>
          <Plus size={24} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          {busLines.length > 0 ? (
            busLines.map((line) => (
              <View key={line.id} style={styles.lineCard}>
                <View style={styles.lineHeader}>
                  <View style={[styles.lineColor, { backgroundColor: line.color }]} />
                  <View style={styles.lineInfo}>
                    <Text style={styles.lineName}>{line.name}</Text>
                    <Text style={styles.lineZones}>
                      {line.zones_covered.join(' • ')}
                    </Text>
                    <Text style={styles.lineZones}>
                      {cities.find((c) => c.id === line.city_id)?.name ?? 'Ville non définie'}
                    </Text>
                    <Text style={styles.linePrice}>
                      {line.price ? `${line.price} FBU` : 'Prix non défini'}
                    </Text>
                  </View>
                </View>
                <View style={styles.lineActions}>
                  <TouchableOpacity onPress={() => handleDelete(line)}>
                    <Trash2 size={20} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Bus size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>Aucune ligne de bus</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>{editingLine ? 'Modifier la ligne' : 'Nouvelle ligne'}</Text>

      {/* Sélection de la ville */}
      <Text style={styles.label}>Ville</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={formData.city_id}
          onValueChange={(val) => setFormData({ ...formData, city_id: val })}
        >
          {cities.map((city) => (
            <Picker.Item key={city.id} label={city.name} value={city.id} />
          ))}
        </Picker>
      </View>

      {/* Nom de la ligne */}
      <Text style={styles.label}>Nom de la ligne</Text>
      <TextInput
        style={styles.input}
        placeholder="Nom de la ligne *"
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
      />

      {/* Zones */}
      <Text style={styles.label}>Zones couvertes</Text>
      <TextInput
        style={styles.input}
        placeholder="Zones (séparées par des virgules)"
        value={formData.zones}
        onChangeText={(text) => setFormData({ ...formData, zones: text })}
      />

      {/* Prix */}
      <Text style={styles.label}>Prix du trajet (FBU)</Text>
      <TextInput
        style={styles.input}
        placeholder="Prix en Francs Burundais"
        value={formData.price}
        onChangeText={(text) => setFormData({ ...formData, price: text })}
        keyboardType="numeric"
      />

      {/* Mini carte pour dessiner le tracé */}
      {Platform.OS !== 'web' ? (
        <>
          <Text style={styles.label}>Tracer la ligne sur la carte</Text>
          <Text style={styles.webWarning}>
            La carte interactive n'est pas disponible sur web. Utilisez l'application mobile pour tracer les lignes.
          </Text>
        </>
      ) : (
        <>
          <Text style={styles.label}>Tracer la ligne sur la carte</Text>
          <Text style={styles.webWarning}>
            La carte interactive n'est pas disponible sur web. Utilisez l'application mobile pour tracer les lignes.
          </Text>
        </>
      )}

      {/* Boutons modal */}
      <View style={styles.modalButtons}>
        <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={closeModal}>
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modalButton, styles.saveButton]}
          onPress={() => {
            setFormData({
              ...formData,
              route_coordinates: {
                type: 'LineString',
                coordinates: routeCoordinates.map(c => [c.longitude, c.latitude]),
              },
            });
            handleSave();
          }}
        >
          <Text style={styles.saveButtonText}>Enregistrer</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>

    </SafeAreaView>
  );
}

// Styles à adapter en ajoutant label, picker et stopRow
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1, padding: 16 },
  lineCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  lineHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  lineColor: { width: 4, height: 40, borderRadius: 2, marginRight: 12 },
  lineInfo: { flex: 1 },
  lineName: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  lineZones: { fontSize: 14, color: '#6B7280' },
  linePrice: { fontSize: 14, color: '#059669', fontWeight: '600', marginTop: 2 },
  lineActions: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  statusText: { fontSize: 14, fontWeight: '500' },
  activeText: { color: '#059669' },
  inactiveText: { color: '#DC2626' },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: '#6B7280', marginTop: 12 },

  // Modal styles existants
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, marginBottom: 12 },
  colorSection: { marginBottom: 12 },
  colorLabel: { fontSize: 14, fontWeight: '500', color: '#6B7280', marginBottom: 8 },
  colorOptions: { flexDirection: 'row', gap: 12 },
  colorOption: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: 'transparent' },
  selectedColor: { borderColor: '#111827' },

  // **Nouveaux styles manquants**
  label: { fontSize: 14, fontWeight: '500', color: '#6B7280', marginBottom: 4 },
  pickerContainer: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, marginBottom: 12 },
  stopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  stopInput: { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 8 },
  addStopButton: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  addStopText: { color: '#2563EB', fontWeight: '500' },
  webWarning: { fontSize: 13, color: '#DC2626', fontStyle: 'italic', marginBottom: 12, padding: 8, backgroundColor: '#FEF2F2', borderRadius: 6 },

  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalButton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  cancelButton: { backgroundColor: '#F3F4F6' },
  cancelButtonText: { color: '#6B7280', fontSize: 16, fontWeight: '600' },
  saveButton: { backgroundColor: '#2563EB' },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});


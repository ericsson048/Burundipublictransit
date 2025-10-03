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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Plus, Bus, Trash2, Edit } from 'lucide-react-native';

type BusLine = {
  id: string;
  name: string;
  zones_covered: string[];
  color: string;
  active: boolean;
};

export default function ManageBusLines() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [busLines, setBusLines] = useState<BusLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLine, setEditingLine] = useState<BusLine | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    zones: '',
    color: '#2563EB',
  });

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.back();
    } else {
      loadBusLines();
    }
  }, [authLoading, isAdmin]);

  const loadBusLines = async () => {
    try {
      const { data, error } = await supabase
        .from('bus_lines')
        .select('id, name, zones_covered, color, active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setBusLines(data);
    } catch (error) {
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
      });
    } else {
      setEditingLine(null);
      setFormData({ name: '', zones: '', color: '#2563EB' });
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingLine(null);
    setFormData({ name: '', zones: '', color: '#2563EB' });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Erreur', 'Le nom de la ligne est requis');
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
            zones_covered: zones,
            color: formData.color,
          })
          .eq('id', editingLine.id);

        if (error) throw error;
        Alert.alert('Succès', 'Ligne modifiée avec succès');
      } else {
        const { error } = await supabase.from('bus_lines').insert({
          name: formData.name,
          zones_covered: zones,
          color: formData.color,
          route_coordinates: {
            type: 'LineString',
            coordinates: [],
          },
          stops: [],
          active: true,
        });

        if (error) throw error;
        Alert.alert('Succès', 'Ligne ajoutée avec succès');
      }

      closeModal();
      loadBusLines();
    } catch (error) {
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
              const { error } = await supabase
                .from('bus_lines')
                .delete()
                .eq('id', line.id);

              if (error) throw error;
              Alert.alert('Succès', 'Ligne supprimée');
              loadBusLines();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer la ligne');
            }
          },
        },
      ]
    );
  };

  const toggleActive = async (line: BusLine) => {
    try {
      const { error } = await supabase
        .from('bus_lines')
        .update({ active: !line.active })
        .eq('id', line.id);

      if (error) throw error;
      loadBusLines();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier le statut');
    }
  };

  if (authLoading || !isAdmin) {
    return null;
  }

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
                  <View
                    style={[
                      styles.lineColor,
                      { backgroundColor: line.color },
                    ]}
                  />
                  <View style={styles.lineInfo}>
                    <Text style={styles.lineName}>{line.name}</Text>
                    {line.zones_covered.length > 0 && (
                      <Text style={styles.lineZones}>
                        {line.zones_covered.join(' • ')}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.lineActions}>
                  <TouchableOpacity onPress={() => toggleActive(line)}>
                    <Text
                      style={[
                        styles.statusText,
                        line.active ? styles.activeText : styles.inactiveText,
                      ]}>
                      {line.active ? 'Actif' : 'Inactif'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => openModal(line)}>
                    <Edit size={20} color="#2563EB" />
                  </TouchableOpacity>
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

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingLine ? 'Modifier la ligne' : 'Nouvelle ligne'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Nom de la ligne *"
              value={formData.name}
              onChangeText={(text) =>
                setFormData({ ...formData, name: text })
              }
            />

            <TextInput
              style={styles.input}
              placeholder="Zones (séparées par des virgules)"
              value={formData.zones}
              onChangeText={(text) =>
                setFormData({ ...formData, zones: text })
              }
            />

            <View style={styles.colorSection}>
              <Text style={styles.colorLabel}>Couleur de la ligne</Text>
              <View style={styles.colorOptions}>
                {['#2563EB', '#DC2626', '#059669', '#F59E0B', '#8B5CF6'].map(
                  (color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        formData.color === color && styles.selectedColor,
                      ]}
                      onPress={() =>
                        setFormData({ ...formData, color })
                      }
                    />
                  )
                )}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={closeModal}>
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSave}>
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  lineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  lineHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  lineColor: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  lineInfo: {
    flex: 1,
  },
  lineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  lineZones: {
    fontSize: 14,
    color: '#6B7280',
  },
  lineActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeText: {
    color: '#059669',
  },
  inactiveText: {
    color: '#DC2626',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  colorSection: {
    marginBottom: 12,
  },
  colorLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  colorOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#111827',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#2563EB',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

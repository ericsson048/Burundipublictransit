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
import { ArrowLeft, Plus, Building2, Trash2, Edit } from 'lucide-react-native';

type Agency = {
  id: string;
  name: string;
  contact_phone?: string;
  contact_email?: string;
  active: boolean;
};

export default function ManageAgencies() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contact_phone: '',
    contact_email: '',
  });

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.back();
    } else {
      loadAgencies();
    }
  }, [authLoading, isAdmin]);

  const loadAgencies = async () => {
    try {
      const { data, error } = await supabase
        .from('transport_agencies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setAgencies(data);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les agences');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (agency?: Agency) => {
    if (agency) {
      setEditingAgency(agency);
      setFormData({
        name: agency.name,
        contact_phone: agency.contact_phone || '',
        contact_email: agency.contact_email || '',
      });
    } else {
      setEditingAgency(null);
      setFormData({ name: '', contact_phone: '', contact_email: '' });
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingAgency(null);
    setFormData({ name: '', contact_phone: '', contact_email: '' });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Erreur', 'Le nom de l\'agence est requis');
      return;
    }

    try {
      if (editingAgency) {
        const { error } = await supabase
          .from('transport_agencies')
          .update({
            name: formData.name,
            contact_phone: formData.contact_phone || null,
            contact_email: formData.contact_email || null,
          })
          .eq('id', editingAgency.id);

        if (error) throw error;
        Alert.alert('Succès', 'Agence modifiée avec succès');
      } else {
        const { error } = await supabase.from('transport_agencies').insert({
          name: formData.name,
          contact_phone: formData.contact_phone || null,
          contact_email: formData.contact_email || null,
          active: true,
        });

        if (error) throw error;
        Alert.alert('Succès', 'Agence ajoutée avec succès');
      }

      closeModal();
      loadAgencies();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder l\'agence');
    }
  };

  const handleDelete = (agency: Agency) => {
    Alert.alert(
      'Supprimer l\'agence',
      `Êtes-vous sûr de vouloir supprimer "${agency.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('transport_agencies')
                .delete()
                .eq('id', agency.id);

              if (error) throw error;
              Alert.alert('Succès', 'Agence supprimée');
              loadAgencies();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer l\'agence');
            }
          },
        },
      ]
    );
  };

  const toggleActive = async (agency: Agency) => {
    try {
      const { error } = await supabase
        .from('transport_agencies')
        .update({ active: !agency.active })
        .eq('id', agency.id);

      if (error) throw error;
      loadAgencies();
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
        <Text style={styles.title}>Agences de Transport</Text>
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
          {agencies.length > 0 ? (
            agencies.map((agency) => (
              <View key={agency.id} style={styles.agencyCard}>
                <View style={styles.agencyHeader}>
                  <Building2 size={24} color="#2563EB" />
                  <View style={styles.agencyInfo}>
                    <Text style={styles.agencyName}>{agency.name}</Text>
                    {agency.contact_phone && (
                      <Text style={styles.agencyContact}>
                        {agency.contact_phone}
                      </Text>
                    )}
                    {agency.contact_email && (
                      <Text style={styles.agencyContact}>
                        {agency.contact_email}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.agencyActions}>
                  <TouchableOpacity onPress={() => toggleActive(agency)}>
                    <Text
                      style={[
                        styles.statusText,
                        agency.active ? styles.activeText : styles.inactiveText,
                      ]}>
                      {agency.active ? 'Actif' : 'Inactif'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => openModal(agency)}>
                    <Edit size={20} color="#2563EB" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(agency)}>
                    <Trash2 size={20} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Building2 size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>Aucune agence</Text>
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
              {editingAgency ? 'Modifier l\'agence' : 'Nouvelle agence'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Nom de l'agence *"
              value={formData.name}
              onChangeText={(text) =>
                setFormData({ ...formData, name: text })
              }
            />

            <TextInput
              style={styles.input}
              placeholder="Téléphone"
              value={formData.contact_phone}
              onChangeText={(text) =>
                setFormData({ ...formData, contact_phone: text })
              }
              keyboardType="phone-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Email"
              value={formData.contact_email}
              onChangeText={(text) =>
                setFormData({ ...formData, contact_email: text })
              }
              keyboardType="email-address"
              autoCapitalize="none"
            />

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
  agencyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  agencyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  agencyInfo: {
    flex: 1,
    marginLeft: 12,
  },
  agencyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  agencyContact: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  agencyActions: {
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

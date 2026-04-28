import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';
import { BANGLADESH_LOCATIONS } from '@/constants/locations';

interface LocationPickerProps {
  label?: string;
  value: string;
  onChange: (loc: string) => void;
  placeholder?: string;
  error?: string;
}

export default function LocationPicker({ label, value, onChange, placeholder = "Select a location", error }: LocationPickerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');

  const filteredLocations = BANGLADESH_LOCATIONS.filter(loc => 
    loc.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (loc: string) => {
    onChange(loc);
    setModalVisible(false);
    setSearch('');
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity 
        style={[styles.inputBox, error ? styles.inputError : null]} 
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="location-outline" size={20} color={Colors.textMuted} style={styles.icon} />
        <Text style={[styles.inputText, !value && styles.placeholderText]}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color={Colors.textMuted} />
      </TouchableOpacity>
      
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafe} edges={['top']}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Location</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search locations..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor={Colors.textMuted}
              autoFocus={Platform.OS !== 'web'}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={['All Locations', ...filteredLocations]}
            keyExtractor={item => item}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.locationItem} 
                onPress={() => handleSelect(item === 'All Locations' ? '' : item)}
              >
                <Ionicons 
                  name={(value === item || (!value && item === 'All Locations')) ? "radio-button-on" : "radio-button-off"} 
                  size={20} 
                  color={(value === item || (!value && item === 'All Locations')) ? Colors.primary : Colors.textMuted} 
                />
                <Text style={[styles.locationText, (value === item || (!value && item === 'All Locations')) && styles.locationTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No locations found matching "{search}"</Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.md },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary, marginBottom: Spacing.sm },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: Radius.md,
    height: 50,
    paddingHorizontal: Spacing.md,
  },
  inputError: { borderColor: Colors.danger },
  icon: { marginRight: Spacing.sm },
  inputText: { flex: 1, fontSize: FontSize.md, color: Colors.text },
  placeholderText: { color: Colors.textMuted },
  errorText: { color: Colors.danger, fontSize: FontSize.xs, marginTop: Spacing.xs },
  
  modalSafe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    margin: Spacing.lg,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    gap: Spacing.sm,
  },
  searchInput: { flex: 1, fontSize: FontSize.md, color: Colors.text },
  
  listContent: { paddingBottom: Spacing.xxl },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  locationText: { fontSize: FontSize.md, color: Colors.text },
  locationTextActive: { fontWeight: FontWeight.bold, color: Colors.primary },
  separator: { height: 1, backgroundColor: Colors.surfaceBorder, marginLeft: 50 },
  
  empty: { padding: Spacing.xl, alignItems: 'center' },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.md },
});

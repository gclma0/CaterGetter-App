/**
 * VendorMap.native.tsx
 * iOS/Android map using react-native-maps.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';

export interface MapVendor {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  rating: number;
}

interface VendorMapProps {
  vendors: MapVendor[];
  onVendorPress: (id: string) => void;
}

export default function VendorMap({ vendors, onVendorPress }: VendorMapProps) {
  return (
    <View style={styles.wrapper}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: 23.762,
          longitude: 90.389,
          latitudeDelta: 0.18,
          longitudeDelta: 0.18,
        }}
      >
        {vendors.map((v) => (
          <Marker
            key={v.id}
            coordinate={{ latitude: v.latitude, longitude: v.longitude }}
            pinColor="#FF6B35"
          >
            <Callout onPress={() => onVendorPress(v.id)}>
              <View style={styles.callout}>
                <Text style={styles.calloutName}>{v.name}</Text>
                <Text style={styles.calloutLocation}>📍 {v.location}</Text>
                <Text style={styles.calloutRating}>★ {v.rating.toFixed(1)}</Text>
                <TouchableOpacity
                  onPress={() => onVendorPress(v.id)}
                  style={styles.calloutBtn}
                >
                  <Text style={styles.calloutBtnText}>View Caterer →</Text>
                </TouchableOpacity>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  callout: { padding: 8, minWidth: 160 },
  calloutName: { fontWeight: 'bold', fontSize: 14, marginBottom: 2 },
  calloutLocation: { color: '#888', fontSize: 12 },
  calloutRating: { color: '#f59e0b', fontSize: 12, marginTop: 2 },
  calloutBtn: {
    marginTop: 8, backgroundColor: '#FF6B35',
    padding: 7, borderRadius: 8, alignItems: 'center',
  },
  calloutBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});

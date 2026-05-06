/**
 * VendorMap.web.tsx
 * Web-only map using Leaflet (loaded via CDN, no native deps).
 */
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';

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
  const containerRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Inject Leaflet CSS once
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const initMap = () => {
      const L = (window as any).L;
      if (!L) return;

      // Remove previous instance
      const prev = (containerRef.current as any).__map;
      if (prev) { prev.remove(); (containerRef.current as any).__map = null; }

      const map = L.map(containerRef.current, {
        center: [23.762, 90.389],
        zoom: 12,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      const pinIcon = L.divIcon({
        className: '',
        html: `<div style="
          width:34px;height:34px;border-radius:50% 50% 50% 0;
          background:#FF6B35;border:3px solid #fff;
          transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,.4);
        "></div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -36],
      });

      vendors.forEach((v) => {
        L.marker([v.latitude, v.longitude], { icon: pinIcon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:system-ui,sans-serif;min-width:170px;padding:4px">
              <strong style="font-size:14px;color:#111">${v.name}</strong><br/>
              <span style="color:#888;font-size:12px">📍 ${v.location}</span><br/>
              <span style="color:#f59e0b;font-size:12px">★ ${v.rating.toFixed(1)}</span><br/>
              <button
                id="map-btn-${v.id}"
                style="margin-top:8px;padding:7px 0;background:#FF6B35;
                  color:#fff;border:none;border-radius:8px;cursor:pointer;
                  font-size:13px;font-weight:600;width:100%;"
              >View Caterer →</button>
            </div>
          `)
          .on('popupopen', () => {
            setTimeout(() => {
              const btn = document.getElementById(`map-btn-${v.id}`);
              if (btn) btn.onclick = () => onVendorPress(v.id);
            }, 50);
          });
      });

      (containerRef.current as any).__map = map;
    };

    if ((window as any).L) {
      initMap();
    } else {
      if (!document.getElementById('leaflet-js')) {
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = initMap;
        document.head.appendChild(script);
      } else {
        // Script tag exists but not yet loaded, poll
        const interval = setInterval(() => {
          if ((window as any).L) { clearInterval(interval); initMap(); }
        }, 100);
      }
    }

    return () => {
      const prev = containerRef.current && (containerRef.current as any).__map;
      if (prev) { prev.remove(); (containerRef.current as any).__map = null; }
    };
  }, [vendors]);

  return (
    <View style={styles.wrapper}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', borderRadius: 14 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, borderRadius: 14, overflow: 'hidden' },
});

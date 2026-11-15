import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Circle, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Button, Surface, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { incidentService } from '../services/incidentService';
import { getErrorMessage } from '../services/api';
import { INCIDENT_TYPE_LABELS } from '../utils/incidentLabels';
import type { DashboardStats, HeatmapPoint } from '../types';
import type { AppStackParamList, MainTabParamList } from '../navigation/AppNavigator';
import { AppToast } from '../components/AppToast';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'MapRisk'>,
  NativeStackScreenProps<AppStackParamList>
>;

const LIMA_INITIAL_REGION = {
  latitude: -12.0464,
  longitude: -77.0428,
  latitudeDelta: 0.14,
  longitudeDelta: 0.14,
};

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function getHeatColors(point: HeatmapPoint): { fill: string; stroke: string } {
  if (point.colorHint === 'red' || point.severity >= 4) {
    return { fill: 'rgba(239, 68, 68, 0.35)', stroke: 'rgba(239, 68, 68, 0.85)' };
  }
  if (point.colorHint === 'orange' || point.severity === 3) {
    return { fill: 'rgba(249, 115, 22, 0.32)', stroke: 'rgba(249, 115, 22, 0.8)' };
  }
  return { fill: 'rgba(234, 179, 8, 0.28)', stroke: 'rgba(234, 179, 8, 0.75)' };
}

export function MapRiskScreen({ navigation }: Props) {
  const [points, setPoints] = useState<HeatmapPoint[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [userDistrict, setUserDistrict] = useState<string | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const loadMapData = useCallback(async () => {
    setLoading(true);
    try {
      const [heatmapRes, statsRes] = await Promise.allSettled([
        incidentService.getHeatmap(),
        incidentService.getDashboardStats(),
      ]);
      if (heatmapRes.status === 'fulfilled') {
        setPoints(heatmapRes.value);
      } else {
        setToastMsg(getErrorMessage(heatmapRes.reason));
      }
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMapData();
  }, [loadMapData]);

  const handleEvaluatePosition = async () => {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setToastMsg('Permiso de ubicación denegado. Actívalo para evaluar tu zona.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setUserCoords(coords);

      try {
        const geo = await incidentService.reverseGeocode(coords.lat, coords.lng);
        const dist =
          geo?.address?.city_district || geo?.address?.suburb || geo?.address?.town || 'Tu ubicación';
        setUserDistrict(dist);
      } catch {
        setUserDistrict('Tu ubicación actual');
      }
    } catch {
      setToastMsg('No se pudo obtener tu señal GPS.');
    } finally {
      setLocLoading(false);
    }
  };

  // Cálculo dinámico de riesgo a 1 km (misma lógica que MapRiskPage)
  const localRisk = useMemo(() => {
    if (!userCoords) return null;
    const nearby = points.filter(
      (p) => getDistanceKm(userCoords.lat, userCoords.lng, p.lat, p.lng) <= 1.0,
    );
    const rawScore = nearby.reduce((acc, p) => acc + (p.weight || p.severity || 1) * 8, 0);
    const score = Math.min(100, Math.round(rawScore));
    const level = score >= 70 ? 'ALTO' : score >= 35 ? 'MEDIO' : 'BAJO';
    return { score, level, nearbyCount: nearby.length };
  }, [userCoords, points]);

  return (
    <View style={styles.screen}>
      {/* Barra superior de estado y acciones */}
      <View style={styles.topBar}>
        <View style={styles.badgeLive}>
          <View style={styles.dotRed} />
          <Text style={styles.badgeLiveText}>{points.length} Focos Activos</Text>
        </View>

        <View style={styles.topActions}>
          <Button
            mode="outlined"
            compact
            icon="refresh"
            loading={loading}
            onPress={loadMapData}
            textColor="#CBD5E1"
            style={styles.smallBtn}
          >
            Actualizar
          </Button>
          <Button
            mode="contained"
            compact
            icon="crosshairs-gps"
            loading={locLoading}
            onPress={handleEvaluatePosition}
            buttonColor="#1D4ED8"
            textColor="#FFFFFF"
            style={styles.smallBtn}
          >
            Mi Riesgo
          </Button>
        </View>
      </View>

      {/* Mapa Interactivo */}
      <View style={styles.mapWrapper}>
        <MapView
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          userInterfaceStyle="dark"
          initialRegion={LIMA_INITIAL_REGION}
          region={
            userCoords
              ? {
                  latitude: userCoords.lat,
                  longitude: userCoords.lng,
                  latitudeDelta: 0.03,
                  longitudeDelta: 0.03,
                }
              : undefined
          }
        >
          {points.map((pt, idx) => {
            const colors = getHeatColors(pt);
            return (
              <React.Fragment key={`${pt.incidentId}-${idx}`}>
                <Circle
                  center={{ latitude: pt.lat, longitude: pt.lng }}
                  radius={260}
                  fillColor={colors.fill}
                  strokeColor={colors.stroke}
                  strokeWidth={1.5}
                />
                <Marker
                  coordinate={{ latitude: pt.lat, longitude: pt.lng }}
                  title={pt.title}
                  description={`${INCIDENT_TYPE_LABELS[pt.incidentType] ?? pt.incidentType} • ${pt.districtName ?? 'Lima'}`}
                  pinColor={pt.colorHint === 'red' ? '#EF4444' : '#F97316'}
                  onCalloutPress={() =>
                    navigation.navigate('IncidentDetail', { incidentId: pt.incidentId })
                  }
                />
              </React.Fragment>
            );
          })}

          {userCoords && (
            <Marker
              coordinate={{ latitude: userCoords.lat, longitude: userCoords.lng }}
              title={userDistrict ?? 'Tu Ubicación'}
              pinColor="#3B82F6"
            />
          )}
        </MapView>

        {loading && (
          <View style={styles.mapOverlayLoader}>
            <ActivityIndicator size="small" color="#EF4444" />
            <Text style={styles.loaderText}>Actualizando radar...</Text>
          </View>
        )}
      </View>

      {/* En panel inferior: Evaluación de Sector y Zonas Críticas */}
      <ScrollView style={styles.bottomPanel} contentContainerStyle={styles.bottomContent}>
        <Surface style={styles.riskCard} elevation={2}>
          <View style={styles.riskHeader}>
            <MaterialCommunityIcons name="shield-alert" size={20} color="#EF4444" />
            <Text style={styles.riskTitle}>Evaluación del Sector (Radio 1 km)</Text>
          </View>

          {localRisk ? (
            <View style={styles.riskBody}>
              <View>
                <Text style={styles.riskScore}>
                  {localRisk.score}
                  <Text style={styles.riskMax}>/100</Text>
                </Text>
                <Text style={styles.riskDistrict}>{userDistrict}</Text>
                <Text style={styles.riskSub}>
                  {localRisk.nearbyCount} incidentes registrados cerca de ti
                </Text>
              </View>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>{localRisk.level}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.riskPlaceholder}>
              Pulsa "Mi Riesgo" arriba para calcular el nivel de peligro en tu ubicación GPS actual.
            </Text>
          )}
        </Surface>

        {stats?.topDangerZones && stats.topDangerZones.length > 0 && (
          <Surface style={styles.riskCard} elevation={2}>
            <Text style={styles.riskTitle}>Zonas Más Riesgosas Ahora</Text>
            {stats.topDangerZones.slice(0, 4).map((z) => (
              <View key={z.rank} style={styles.zoneRow}>
                <Text style={styles.zoneRank}>#{z.rank}</Text>
                <Text style={styles.zoneName} numberOfLines={1}>
                  {z.zone}
                </Text>
                <Text style={styles.zoneScore}>{z.score}/100</Text>
              </View>
            ))}
          </Surface>
        )}
      </ScrollView>

      <AppToast message={toastMsg} onDismiss={() => setToastMsg(null)} duration={3000} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#020617' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  badgeLive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(127, 29, 29, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  dotRed: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#EF4444' },
  badgeLiveText: { color: '#FCA5A5', fontSize: 11, fontWeight: '700' },
  topActions: { flexDirection: 'row', gap: 8 },
  smallBtn: { borderRadius: 10, borderColor: '#334155' },
  mapWrapper: { height: 290, position: 'relative' },
  map: { flex: 1 },
  mapOverlayLoader: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
  },
  loaderText: { color: '#E2E8F0', fontSize: 11, fontWeight: '600' },
  bottomPanel: { flex: 1 },
  bottomContent: { padding: 14, gap: 12, paddingBottom: 24 },
  riskCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 14,
  },
  riskHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  riskTitle: { color: '#F1F5F9', fontSize: 13, fontWeight: '700' },
  riskBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  riskScore: { color: '#EF4444', fontSize: 28, fontWeight: '900' },
  riskMax: { color: '#64748B', fontSize: 14, fontWeight: '600' },
  riskDistrict: { color: '#E2E8F0', fontSize: 13, fontWeight: '700' },
  riskSub: { color: '#94A3B8', fontSize: 11, marginTop: 2 },
  levelBadge: {
    backgroundColor: 'rgba(127, 29, 29, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  levelText: { color: '#FCA5A5', fontWeight: '900', fontSize: 12 },
  riskPlaceholder: { color: '#94A3B8', fontSize: 12, lineHeight: 18 },
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    gap: 8,
  },
  zoneRank: { color: '#F87171', fontWeight: '800', fontSize: 12, width: 24 },
  zoneName: { color: '#E2E8F0', fontSize: 12, flex: 1 },
  zoneScore: { color: '#FCA5A5', fontWeight: '700', fontSize: 12 },
});
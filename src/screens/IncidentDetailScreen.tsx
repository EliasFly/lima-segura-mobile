import React, { useCallback, useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Button, Divider, Surface, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { incidentService } from '../services/incidentService';
import { getErrorMessage } from '../services/api';
import { INCIDENT_STATUS_LABELS, INCIDENT_TYPE_LABELS } from '../utils/incidentLabels';
import type { IncidentDetail } from '../types';
import type { AppStackParamList } from '../navigation/AppNavigator';
import { AppToast } from '../components/AppToast';

type Props = NativeStackScreenProps<AppStackParamList, 'IncidentDetail'>;

export function IncidentDetailScreen({ route }: Props) {
  const { incidentId } = route.params;
  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await incidentService.getIncidentDetail(incidentId);
      setIncident(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [incidentId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handleConfirm = async () => {
    if (!incident || confirming) return;
    setConfirming(true);
    try {
      const result = await incidentService.confirmIncident(incident.id);
      setIncident((prev) =>
        prev
          ? {
              ...prev,
              confirmationsCount: result.confirmations,
              status: result.status,
              confirmedByMe: true,
            }
          : prev,
      );
      setToastMsg('Incidente confirmado. Gracias por validar la información.');
    } catch (err) {
      setToastMsg(getErrorMessage(err));
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#DC2626" />
        <Text style={styles.stateText}>Cargando detalle del incidente...</Text>
      </View>
    );
  }

  if (error || !incident) {
    return (
      <View style={styles.centerBox}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorTitle}>Error al cargar el reporte</Text>
        <Text style={styles.stateText}>{error ?? 'No se encontró el incidente.'}</Text>
        <Button
          mode="contained"
          icon="refresh"
          buttonColor="#DC2626"
          textColor="#FFFFFF"
          onPress={loadDetail}
          style={styles.retryButton}
        >
          Reintentar
        </Button>
      </View>
    );
  }

  const district = incident.districtName || incident.district?.name || 'Lima Metropolitana';

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <Surface style={styles.card} elevation={2}>
          {/* Badges superiores */}
          <View style={styles.badgeRow}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>
                {INCIDENT_TYPE_LABELS[incident.incidentType] ?? incident.incidentType}
              </Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>
                {INCIDENT_STATUS_LABELS[incident.status] ?? incident.status}
              </Text>
            </View>
          </View>

          {/* Título y descripción */}
          <Text style={styles.title}>{incident.title}</Text>

          {!!(incident.summary || incident.description) && (
            <Text style={styles.description}>{incident.summary || incident.description}</Text>
          )}

          <Divider style={styles.divider} />

          {/* Metadatos de ubicación y fecha */}
          <View style={styles.infoBlock}>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="map-marker" size={18} color="#EF4444" />
              <View style={styles.infoTextWrap}>
                <Text style={styles.infoLabel}>Ubicación</Text>
                <Text style={styles.infoValue}>
                  {district}
                  {incident.address ? ` — ${incident.address}` : ''}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="crosshairs-gps" size={18} color="#60A5FA" />
              <View style={styles.infoTextWrap}>
                <Text style={styles.infoLabel}>Coordenadas GPS</Text>
                <Text style={styles.infoValue}>
                  {incident.lat.toFixed(5)}, {incident.lng.toFixed(5)}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="clock-outline" size={18} color="#FBBF24" />
              <View style={styles.infoTextWrap}>
                <Text style={styles.infoLabel}>Fecha y hora del suceso</Text>
                <Text style={styles.infoValue}>
                  {new Date(incident.occurredAt || incident.createdAt).toLocaleString('es-PE')}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="shield-check" size={18} color="#34D399" />
              <View style={styles.infoTextWrap}>
                <Text style={styles.infoLabel}>Confirmaciones ciudadanas</Text>
                <Text style={styles.infoValue}>
                  {incident.confirmationsCount ?? 0} personas han confirmado este reporte
                </Text>
              </View>
            </View>
          </View>

          {/* Fuentes si existen */}
          {incident.sources && incident.sources.length > 0 && (
            <>
              <Divider style={styles.divider} />
              <Text style={styles.sectionHeader}>Fuentes asociadas</Text>
              {incident.sources.map((src) => (
                <TouchableOpacity
                  key={src.sourceItemId}
                  onPress={() => src.url && Linking.openURL(src.url)}
                  style={styles.sourceItem}
                >
                  <MaterialCommunityIcons name="newspaper-variant-outline" size={16} color="#94A3B8" />
                  <Text style={styles.sourceText} numberOfLines={1}>
                    {src.sourceName}: {src.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* Botón Confirmar */}
          <Button
            mode="contained"
            icon={incident.confirmedByMe ? 'check-circle' : 'check-decagram'}
            onPress={handleConfirm}
            loading={confirming}
            disabled={confirming || incident.confirmedByMe}
            buttonColor={incident.confirmedByMe ? '#059669' : '#DC2626'}
            textColor="#FFFFFF"
            contentStyle={styles.confirmBtnContent}
            style={styles.confirmButton}
          >
            {incident.confirmedByMe
              ? 'Incidente Confirmado por Ti'
              : 'Confirmar Veracidad del Incidente'}
          </Button>
        </Surface>
      </ScrollView>

      <AppToast message={toastMsg} onDismiss={() => setToastMsg(null)} duration={3500} style={styles.snackbar} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#020617' },
  container: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 20,
  },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14, gap: 8 },
  typeBadge: {
    backgroundColor: 'rgba(220, 38, 38, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: { color: '#FCA5A5', fontSize: 11, fontWeight: '700' },
  statusBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: { color: '#93C5FD', fontSize: 11, fontWeight: '700' },
  title: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginBottom: 10 },
  description: { color: '#CBD5E1', fontSize: 14, lineHeight: 21 },
  divider: { backgroundColor: '#1E293B', marginVertical: 16 },
  infoBlock: { gap: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoTextWrap: { flex: 1 },
  infoLabel: { color: '#64748B', fontSize: 11, fontWeight: '600' },
  infoValue: { color: '#F1F5F9', fontSize: 13, marginTop: 2 },
  sectionHeader: { color: '#CBD5E1', fontSize: 13, fontWeight: '700', marginBottom: 8 },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#020617',
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
    gap: 8,
  },
  sourceText: { color: '#60A5FA', fontSize: 12, flex: 1 },
  confirmButton: { marginTop: 22, borderRadius: 12 },
  confirmBtnContent: { paddingVertical: 6 },
  centerBox: { flex: 1, backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorTitle: { color: '#F1F5F9', fontSize: 16, fontWeight: '700', marginTop: 12 },
  stateText: { color: '#94A3B8', fontSize: 13, textAlign: 'center', marginTop: 6 },
  retryButton: { marginTop: 16, borderRadius: 10 },
  snackbar: { backgroundColor: '#991B1B' },
});
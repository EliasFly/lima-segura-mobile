import React from 'react';
import {
  ActivityIndicator, FlatList, RefreshControl,
  StyleSheet, TouchableOpacity,  View,
} from 'react-native';
import { Button, FAB, Searchbar, Surface, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useIncidents } from '../hooks/useIncidents';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import { INCIDENT_STATUS_LABELS, INCIDENT_TYPE_LABELS } from '../utils/incidentLabels';
import type { IncidentStatus, IncidentSummary } from '../types';
import type { AppStackParamList, MainTabParamList } from '../navigation/AppNavigator';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'IncidentList'>,
  NativeStackScreenProps<AppStackParamList>
>;

function getStatusColor(status: IncidentStatus): { bg: string; text: string } {
  switch (status) {
    case 'VERIFIED':
    case 'VALIDATED':
      return { bg: 'rgba(16, 185, 129, 0.18)', text: '#34D399' };
    case 'PUBLISHED':
      return { bg: 'rgba(59, 130, 246, 0.18)', text: '#60A5FA' };
    case 'REJECTED':
      return { bg: 'rgba(239, 68, 68, 0.18)', text: '#F87171' };
    default:
      return { bg: 'rgba(245, 158, 11, 0.18)', text: '#FBBF24' };
  }
}

function formatDate(isoDate?: string): string {
  if (!isoDate) return 'Fecha no disponible';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function IncidentListScreen({ navigation }: Props) {
  const {
    incidents,
    loading,
    refreshing,
    error,
    searchQuery,
    setSearchQuery,
    fetchIncidents,
  } = useIncidents();

  // Esto recarga silenciosamente al volver de Crear reporte o Detalle
  useFocusEffect(
    React.useCallback(() => {
      fetchIncidents(true);
    }, [fetchIncidents]),
  );

  const renderItem = ({ item }: { item: IncidentSummary }) => {
    const statusColors = getStatusColor(item.status);
    const district = item.districtName || item.district?.name || 'Lima';

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate('IncidentDetail', { incidentId: item.id })}
      >
        <Surface style={styles.card} elevation={2}>
          <View style={styles.cardHeader}>
            <View style={styles.typeBadge}>
              <MaterialCommunityIcons name="alert-octagon-outline" size={14} color="#F87171" />
              <Text style={styles.typeBadgeText}>
                {INCIDENT_TYPE_LABELS[item.incidentType] ?? item.incidentType}
              </Text>
            </View>

            <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
              <Text style={[styles.statusBadgeText, { color: statusColors.text }]}>
                {INCIDENT_STATUS_LABELS[item.status] ?? item.status}
              </Text>
            </View>
          </View>

          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>

          {!!(item.summary || item.description) && (
            <Text style={styles.cardSummary} numberOfLines={2}>
              {item.summary || item.description}
            </Text>
          )}

          <View style={styles.cardFooter}>
            <View style={styles.metaRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={14} color="#94A3B8" />
              <Text style={styles.metaText} numberOfLines={1}>
                {district}
                {item.address ? ` • ${item.address}` : ''}
              </Text>
            </View>

            <View style={styles.bottomRow}>
              <Text style={styles.dateText}>{formatDate(item.occurredAt || item.createdAt)}</Text>
              <View style={styles.confirmPill}>
                <MaterialCommunityIcons name="check-decagram-outline" size={14} color="#34D399" />
                <Text style={styles.confirmText}>{item.confirmationsCount ?? 0}</Text>
              </View>
            </View>
          </View>
        </Surface>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      {/* Buscador */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Buscar por título, distrito o dirección..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => fetchIncidents(false, searchQuery)}
          onClearIconPress={() => {
            setSearchQuery('');
            fetchIncidents(false, '');
          }}
          style={styles.searchbar}
          inputStyle={styles.searchInput}
          iconColor="#94A3B8"
          placeholderTextColor="#64748B"
        />
      </View>

      {/* Los estados: Carga inicial, Error con Reintentar, Lista vacía o Lista */}
      {loading && !refreshing ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#DC2626" />
          <Text style={styles.stateText}>Cargando reportes ciudadanos...</Text>
        </View>
      ) : error && incidents.length === 0 ? (
        <View style={styles.centerBox}>
          <MaterialCommunityIcons name="wifi-off" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>No se pudieron cargar los reportes</Text>
          <Text style={styles.stateText}>{error}</Text>
          <Button
            mode="contained"
            icon="refresh"
            buttonColor="#DC2626"
            textColor="#FFFFFF"
            onPress={() => fetchIncidents(false)}
            style={styles.retryButton}
          >
            Reintentar
          </Button>
        </View>
      ) : (
        <FlatList
          data={incidents}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchIncidents(true)}
              tintColor="#EF4444"
              colors={['#DC2626']}
            />
          }
          ListEmptyComponent={
            <View style={styles.centerBox}>
              <MaterialCommunityIcons name="shield-check-outline" size={48} color="#64748B" />
              <Text style={styles.errorTitle}>Sin incidentes encontrados</Text>
              <Text style={styles.stateText}>
                No hay reportes registrados con ese criterio. ¡Sé el primero en reportar!
              </Text>
            </View>
          }
        />
      )}

      {/* Botón flotante para crear reporte (Bloque 4) */}
      <FAB
        icon="plus"
        label="Reportar"
        color="#FFFFFF"
        style={styles.fab}
        onPress={() => navigation.navigate('CreateIncident')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#020617' },
  searchContainer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  searchbar: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    height: 46,
  },
  searchInput: { color: '#FFFFFF', fontSize: 13, minHeight: 0 },
  listContent: { padding: 16, paddingBottom: 90, gap: 12 },
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  typeBadgeText: { color: '#FCA5A5', fontSize: 11, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },
  cardTitle: { color: '#F8FAFC', fontSize: 15, fontWeight: '700', marginBottom: 6 },
  cardSummary: { color: '#94A3B8', fontSize: 12, lineHeight: 18, marginBottom: 10 },
  cardFooter: { borderTopWidth: 1, borderTopColor: '#1E293B', paddingTop: 10, gap: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: '#CBD5E1', fontSize: 12, flex: 1 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateText: { color: '#64748B', fontSize: 11 },
  confirmPill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  confirmText: { color: '#34D399', fontSize: 12, fontWeight: '700' },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, marginTop: 40 },
  errorTitle: { color: '#F1F5F9', fontSize: 16, fontWeight: '700', marginTop: 12, textAlign: 'center' },
  stateText: { color: '#94A3B8', fontSize: 13, textAlign: 'center', marginTop: 6 },
  retryButton: { marginTop: 16, borderRadius: 10 },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 20,
    backgroundColor: '#DC2626',
    borderRadius: 16,
  },
});
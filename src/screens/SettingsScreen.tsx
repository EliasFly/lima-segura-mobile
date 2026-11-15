import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Button, Divider, SegmentedButtons, Snackbar, Surface, Switch, Text,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';

export function SettingsScreen() {
  const { user, logout } = useAuth();
  const [gpsHighAccuracy, setGpsHighAccuracy] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState('5');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleSave = () => {
    setToastMsg('Preferencias guardadas correctamente en este dispositivo.');
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Perfil de Usuario */}
        <Surface style={styles.card} elevation={2}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="account-circle-outline" size={20} color="#60A5FA" />
            <Text style={styles.sectionTitle}>Perfil de Ciudadano</Text>
          </View>

          <View style={styles.fieldBox}>
            <Text style={styles.fieldLabel}>Nombre Completo</Text>
            <Text style={styles.fieldValue}>{user?.name ?? 'Usuario'}</Text>
          </View>

          <View style={styles.fieldBox}>
            <Text style={styles.fieldLabel}>Correo Electrónico</Text>
            <Text style={styles.fieldValue}>{user?.email ?? 'correo@limasegura.pe'}</Text>
          </View>

          <View style={styles.roleRow}>
            <Text style={styles.fieldLabel}>Rol en la Plataforma:</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {user?.role === 'ADMIN' ? 'ADMINISTRADOR DE SISTEMA' : 'CIUDADANO'}
              </Text>
            </View>
          </View>
        </Surface>

        {/* Parámetros de Ubicación y Mapa */}
        <Surface style={styles.card} elevation={2}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="map-marker-radius-outline" size={20} color="#EF4444" />
            <Text style={styles.sectionTitle}>Ubicación y Cartografía</Text>
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchTextWrap}>
              <Text style={styles.switchTitle}>Alta Precisión GPS</Text>
              <Text style={styles.switchSub}>
                Usa sensores de alta fidelidad para calcular el radio de riesgo de 1 km.
              </Text>
            </View>
            <Switch
              value={gpsHighAccuracy}
              onValueChange={setGpsHighAccuracy}
              color="#DC2626"
            />
          </View>

          <Divider style={styles.divider} />

          <Text style={styles.fieldLabel}>Intervalo de Refresco Automático (minutos)</Text>
          <SegmentedButtons
            value={refreshInterval}
            onValueChange={setRefreshInterval}
            buttons={[
              { value: '1', label: '1 min' },
              { value: '5', label: '5 min' },
              { value: '15', label: '15 min' },
            ]}
            style={styles.segmented}
          />
        </Surface>

        {/* Acciones */}
        <Button
          mode="contained"
          icon="content-save"
          onPress={handleSave}
          buttonColor="#DC2626"
          textColor="#FFFFFF"
          contentStyle={styles.btnContent}
          style={styles.saveBtn}
        >
          Guardar Configuración
        </Button>

        <Button
          mode="outlined"
          icon="logout"
          onPress={logout}
          textColor="#F87171"
          contentStyle={styles.btnContent}
          style={styles.logoutBtn}
        >
          Cerrar Sesión
        </Button>
      </ScrollView>

      <Snackbar visible={!!toastMsg} onDismiss={() => setToastMsg(null)} duration={3000}>
        {toastMsg}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#020617' },
  container: { padding: 16, gap: 14, paddingBottom: 32 },
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 16,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  fieldBox: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  fieldLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '600', marginBottom: 4 },
  fieldValue: { color: '#F1F5F9', fontSize: 13, fontWeight: '600' },
  roleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  roleBadge: {
    backgroundColor: 'rgba(127, 29, 29, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleText: { color: '#FCA5A5', fontSize: 11, fontWeight: '800' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  switchTextWrap: { flex: 1 },
  switchTitle: { color: '#F1F5F9', fontSize: 13, fontWeight: '700' },
  switchSub: { color: '#94A3B8', fontSize: 11, marginTop: 2 },
  divider: { backgroundColor: '#1E293B', marginVertical: 14 },
  segmented: { marginTop: 6 },
  btnContent: { paddingVertical: 5 },
  saveBtn: { borderRadius: 12 },
  logoutBtn: { borderRadius: 12, borderColor: 'rgba(239, 68, 68, 0.45)' },
});
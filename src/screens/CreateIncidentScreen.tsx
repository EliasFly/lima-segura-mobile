import React, { useState } from 'react';
import {
  Image, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, TouchableOpacity, View,
} from 'react-native';
import {
  Button, HelperText, Surface, Text, TextInput,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { incidentService } from '../services/incidentService';
import { getErrorMessage } from '../services/api';
import { INCIDENT_TYPE_LABELS } from '../utils/incidentLabels';
import type { IncidentType } from '../types';
import type { AppStackParamList } from '../navigation/AppNavigator';
import { AppToast } from '../components/AppToast';

type Props = NativeStackScreenProps<AppStackParamList, 'CreateIncident'>;

const SELECTABLE_TYPES: IncidentType[] = [
  'ROBBERY',
  'ARMED_ROBBERY',
  'THEFT',
  'VEHICLE_THEFT',
  'EXTORTION',
  'ASSAULT',
  'VANDALISM',
  'HIT_AND_RUN',
  'OTHER',
];

export function CreateIncidentScreen({ navigation }: Props) {
  const [incidentType, setIncidentType] = useState<IncidentType>('ROBBERY');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [address, setAddress] = useState('');
  const [districtName, setDistrictName] = useState('');

  // Para GPS y API externa Nominatim
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locWarning, setLocWarning] = useState<string | null>(null);

  // Para la Cámara
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [camWarning, setCamWarning] = useState<string | null>(null);

  // Envío
  const [submitting, setSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Sensor GPS y API Externa Nominatim
  const handleGetLocation = async () => {
    setLocLoading(true);
    setLocWarning(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocWarning(
          'Permiso de ubicación denegado. Escribe el distrito y la dirección: buscaremos el punto en el mapa.',
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = position.coords;
      setCoords({ lat: latitude, lng: longitude });

      // Llamada a API externa Nominatim (convierte las coordenadas en una dirección legible)
      try {
        const geo = await incidentService.reverseGeocode(latitude, longitude);
        if (geo?.address) {
          const road = geo.address.road || geo.address.pedestrian || '';
          const houseNumber = geo.address.house_number ? ` ${geo.address.house_number}` : '';
          const district =
            geo.address.city_district ||
            geo.address.suburb ||
            geo.address.town ||
            geo.address.city ||
            '';

          if (road) setAddress(`${road}${houseNumber}`.trim());
          else if (geo.display_name) setAddress(geo.display_name.split(',')[0]);

          if (district) setDistrictName(district);
        }
      } catch {
        setLocWarning(
          'Coordenadas GPS obtenidas, pero no se pudo consultar la dirección en Nominatim. Complétala manualmente.',
        );
      }
    } catch {
      setLocWarning(
        'No se pudo obtener la señal GPS. Escribe el distrito y la dirección: buscaremos el punto en el mapa.',
      );
    } finally {
      setLocLoading(false);
    }
  };

  // Sensor Cámara
  const handleTakePhoto = async () => {
    setCamWarning(null);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setCamWarning(
          'Permiso de cámara denegado. Puedes adjuntar una foto desde tu galería o continuar sin imagen.',
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch {
      setCamWarning(
        'La cámara no está disponible en este dispositivo. Usa la galería o envía el reporte sin foto.',
      );
    }
  };

  const handlePickFromGallery = async () => {
    setCamWarning(null);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setCamWarning('Permiso de galería denegado. Puedes enviar el reporte sin foto.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch {
      setCamWarning('No se pudo abrir la galería.');
    }
  };

  // Validar y enviar al Backend
  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    const trimmedAddress = address.trim();
    const trimmedDistrict = districtName.trim();

    if (!trimmedTitle) {
      setToastMsg('Ingresa un título breve para el incidente.');
      return;
    }
    if (!trimmedDistrict && !trimmedAddress) {
      setToastMsg('Usa el GPS o escribe el distrito y la dirección del suceso.');
      return;
    }

    setSubmitting(true);
    try {
      // Si no hay GPS, buscamos la dirección escrita para obtener coordenadas reales.
      let finalCoords = coords;
      if (!finalCoords) {
        const query = [trimmedAddress, trimmedDistrict, 'Lima, Perú'].filter(Boolean).join(', ');
        try {
          finalCoords = await incidentService.geocodeAddress(query);
        } catch {
          finalCoords = null;
        }
        if (!finalCoords) {
          setToastMsg('No encontramos esa dirección en Lima. Usa el GPS o escríbela con más detalle.');
          return;
        }
        setCoords(finalCoords);
      }

      // La foto solo se muestra como vista previa: el backend aún no recibe imágenes.
      const finalSummary = summary.trim() || undefined;

      await incidentService.reportIncident({
        incidentType,
        title: trimmedTitle,
        summary: finalSummary,
        address: trimmedAddress || undefined,
        districtName: trimmedDistrict || undefined,
        lat: finalCoords.lat,
        lng: finalCoords.lng,
      });

      setToastMsg('¡Reporte enviado con éxito!');
      setTimeout(() => {
        navigation.goBack();
      }, 900);
    } catch (err) {
      setToastMsg(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Surface style={styles.card} elevation={2}>
          {/* Tipo de incidente */}
          <Text style={styles.sectionTitle}>1. Tipo de Incidente</Text>
          <View style={styles.chipGrid}>
            {SELECTABLE_TYPES.map((type) => {
              const selected = incidentType === type;
              return (
                <TouchableOpacity
                  key={type}
                  onPress={() => setIncidentType(type)}
                  style={[styles.typeChip, selected && styles.typeChipSelected]}
                >
                  <Text style={[styles.typeChipText, selected && styles.typeChipTextSelected]}>
                    {INCIDENT_TYPE_LABELS[type]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Datos del reporte */}
          <Text style={styles.sectionTitle}>2. Detalles del Suceso</Text>
          <TextInput
            label="Título del reporte *"
            placeholder="Ej. Robo de celular en paradero"
            value={title}
            onChangeText={setTitle}
            mode="outlined"
            outlineColor="#1E293B"
            activeOutlineColor="#EF4444"
            textColor="#FFFFFF"
            style={styles.input}
          />

          <TextInput
            label="Descripción (opcional)"
            placeholder="Describe lo ocurrido, características o referencias..."
            value={summary}
            onChangeText={setSummary}
            mode="outlined"
            multiline
            numberOfLines={3}
            outlineColor="#1E293B"
            activeOutlineColor="#EF4444"
            textColor="#FFFFFF"
            style={styles.input}
          />

          {/* Sensor GPS y API Nominatim */}
          <Text style={styles.sectionTitle}>3. Ubicación (GPS + Nominatim)</Text>
          <Button
            mode="outlined"
            icon="crosshairs-gps"
            onPress={handleGetLocation}
            loading={locLoading}
            disabled={locLoading || submitting}
            textColor="#60A5FA"
            style={styles.sensorButton}
          >
            {locLoading ? 'Obteniendo GPS y dirección...' : 'Obtener Ubicación Actual (GPS)'}
          </Button>

          {coords && (
            <View style={styles.coordBadge}>
              <MaterialCommunityIcons name="check-circle-outline" size={16} color="#34D399" />
              <Text style={styles.coordText}>
                GPS fijado: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </Text>
            </View>
          )}

          {locWarning && (
            <HelperText type="error" visible={true} style={styles.warningText}>
              {locWarning}
            </HelperText>
          )}

          <TextInput
            label="Distrito *"
            placeholder="Ej. Miraflores, Surco, San Isidro..."
            value={districtName}
            onChangeText={setDistrictName}
            mode="outlined"
            outlineColor="#1E293B"
            activeOutlineColor="#EF4444"
            textColor="#FFFFFF"
            style={styles.input}
          />

          <TextInput
            label="Dirección o referencia *"
            placeholder="Ej. Av. Larco cuadra 4"
            value={address}
            onChangeText={setAddress}
            mode="outlined"
            outlineColor="#1E293B"
            activeOutlineColor="#EF4444"
            textColor="#FFFFFF"
            style={styles.input}
          />

          {/* Sensor Cámara */}
          <Text style={styles.sectionTitle}>4. Evidencia Fotográfica (Cámara)</Text>
          <View style={styles.cameraRow}>
            <Button
              mode="outlined"
              icon="camera"
              onPress={handleTakePhoto}
              disabled={submitting}
              textColor="#F87171"
              style={[styles.sensorButton, styles.halfBtn]}
            >
              Tomar Foto
            </Button>
            <Button
              mode="outlined"
              icon="image-outline"
              onPress={handlePickFromGallery}
              disabled={submitting}
              textColor="#CBD5E1"
              style={[styles.sensorButton, styles.halfBtn]}
            >
              Galería
            </Button>
          </View>

          {camWarning && (
            <HelperText type="error" visible={true} style={styles.warningText}>
              {camWarning}
            </HelperText>
          )}

          <HelperText type="info" visible={true} style={styles.photoNote}>
            La foto es solo una vista previa en tu celular; todavía no se envía al servidor.
          </HelperText>

          {photoUri && (
            <View style={styles.previewBox}>
              <Image source={{ uri: photoUri }} style={styles.previewImage} />
              <Button
                mode="text"
                icon="delete-outline"
                textColor="#F87171"
                onPress={() => setPhotoUri(null)}
              >
                Quitar foto
              </Button>
            </View>
          )}

          {/* Enviar */}
          <Button
            mode="contained"
            icon="send"
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting}
            buttonColor="#DC2626"
            textColor="#FFFFFF"
            contentStyle={styles.submitContent}
            style={styles.submitBtn}
          >
            {submitting ? 'Enviando Reporte...' : 'Publicar Reporte Ciudadano'}
          </Button>
        </Surface>
      </ScrollView>

      <AppToast message={toastMsg} onDismiss={() => setToastMsg(null)} duration={3500} style={styles.snackbar} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#020617' },
  container: { padding: 16, paddingBottom: 36 },
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 18,
  },
  sectionTitle: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 10,
  },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  typeChip: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  typeChipSelected: {
    backgroundColor: 'rgba(220, 38, 38, 0.25)',
    borderColor: '#EF4444',
  },
  typeChipText: { color: '#94A3B8', fontSize: 11, fontWeight: '600' },
  typeChipTextSelected: { color: '#FCA5A5', fontWeight: '700' },
  input: { backgroundColor: '#020617', marginBottom: 12, fontSize: 13 },
  sensorButton: {
    borderColor: '#334155',
    borderRadius: 12,
    marginBottom: 10,
  },
  coordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
    gap: 6,
  },
  coordText: { color: '#34D399', fontSize: 12, fontWeight: '600' },
  warningText: { color: '#FBBF24', fontSize: 12, marginBottom: 8 },
  cameraRow: { flexDirection: 'row', gap: 10 },
  halfBtn: { flex: 1 },
  previewBox: { alignItems: 'center', marginVertical: 8 },
  photoNote: { color: '#94A3B8', paddingHorizontal: 0 },
  previewImage: { width: '100%', height: 180, borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  submitBtn: { marginTop: 16, borderRadius: 12 },
  submitContent: { paddingVertical: 6 },
  snackbar: { backgroundColor: '#991B1B' },
});
import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, TouchableOpacity, View,
} from 'react-native';
import { Button, Surface, Text, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '../services/api';
import type { AuthStackParamList } from '../navigation/AppNavigator';
import { AppToast } from '../components/AppToast';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleRegister = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !password) {
      setToastMsg('Por favor completa todos los campos requeridos');
      return;
    }
    if (password.length < 6) {
      setToastMsg('La contraseña debe tener mínimo 6 caracteres');
      return;
    }
    if (confirmPassword !== password) {
      setToastMsg('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await register({ name: trimmedName, email: trimmedEmail, password });
    } catch (error) {
      setToastMsg(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Surface style={styles.card} elevation={4}>
          <View style={styles.header}>
            <View style={styles.iconBox}>
              <MaterialCommunityIcons name="shield-alert-outline" size={30} color="#EF4444" />
            </View>
            <Text variant="headlineMedium" style={styles.brandTitle}>
              LIMA SEGURA
            </Text>
            <Text variant="bodySmall" style={styles.subtitle}>
              Crea tu cuenta ciudadana para consultar el radar de seguridad
            </Text>
          </View>

          <Text style={styles.label}>Nombre Completo</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ej: Juan Pérez"
            placeholderTextColor="#64748B"
            mode="outlined"
            disabled={loading}
            outlineColor="#1E293B"
            activeOutlineColor="#EF4444"
            textColor="#FFFFFF"
            style={styles.input}
            left={<TextInput.Icon icon="account-outline" color="#64748B" />}
          />

          <Text style={styles.label}>Correo Electrónico</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="juan@ejemplo.com"
            placeholderTextColor="#64748B"
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            disabled={loading}
            outlineColor="#1E293B"
            activeOutlineColor="#EF4444"
            textColor="#FFFFFF"
            style={styles.input}
            left={<TextInput.Icon icon="email-outline" color="#64748B" />}
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor="#64748B"
            mode="outlined"
            secureTextEntry={!showPassword}
            disabled={loading}
            outlineColor="#1E293B"
            activeOutlineColor="#EF4444"
            textColor="#FFFFFF"
            style={styles.input}
            left={<TextInput.Icon icon="key-variant" color="#64748B" />}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                color="#64748B"
                onPress={() => setShowPassword((prev) => !prev)}
              />
            }
          />

          <Text style={styles.label}>Confirmar Contraseña</Text>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Repite tu contraseña"
            placeholderTextColor="#64748B"
            mode="outlined"
            secureTextEntry={!showPassword}
            disabled={loading}
            outlineColor="#1E293B"
            activeOutlineColor="#EF4444"
            textColor="#FFFFFF"
            style={styles.input}
            left={<TextInput.Icon icon="key-variant" color="#64748B" />}
          />

          <Button
            mode="contained"
            icon="account-plus"
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            buttonColor="#DC2626"
            textColor="#FFFFFF"
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            style={styles.submitButton}
          >
            {loading ? 'Creando Cuenta...' : 'Registrar Cuenta'}
          </Button>

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
            <TouchableOpacity disabled={loading} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Inicia sesión aquí</Text>
            </TouchableOpacity>
          </View>
        </Surface>
      </ScrollView>

      <AppToast message={toastMsg} onDismiss={() => setToastMsg(null)} duration={3500} style={styles.snackbar} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#020617' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 24,
  },
  header: { alignItems: 'center', marginBottom: 20 },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(220, 38, 38, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandTitle: { fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.5 },
  subtitle: { color: '#94A3B8', textAlign: 'center', marginTop: 4, fontSize: 12 },
  label: { color: '#CBD5E1', fontSize: 12, fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: '#020617', marginBottom: 14, fontSize: 13 },
  submitButton: { borderRadius: 12, marginTop: 6 },
  buttonContent: { paddingVertical: 6 },
  buttonLabel: { fontWeight: '700', fontSize: 13 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { color: '#94A3B8', fontSize: 12 },
  footerLink: { color: '#F87171', fontSize: 12, fontWeight: '700' },
  snackbar: { backgroundColor: '#F1F5F9' },
});
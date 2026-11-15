import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, TouchableOpacity, View,
} from 'react-native';
import { Button, Snackbar, Surface, Text, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '../services/api';
import type { AuthStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleFillAdmin = () => {
    setEmail('admin@limasegura.pe');
    setPassword('password123');
  };

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setToastMsg('Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      await login({ email: trimmedEmail, password });
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
          {/* Brand Icon & Heading */}
          <View style={styles.header}>
            <View style={styles.iconBox}>
              <MaterialCommunityIcons name="shield-alert-outline" size={30} color="#EF4444" />
            </View>
            <Text variant="headlineMedium" style={styles.brandTitle}>
              LIMA SEGURA
            </Text>
            <Text variant="bodySmall" style={styles.subtitle}>
              Acceso a la Plataforma de Monitoreo & Control Delictivo
            </Text>
          </View>

          {/* Quick Demo Credentials Pill */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleFillAdmin}
            disabled={loading}
            style={styles.demoPill}
          >
            <View style={styles.demoLeft}>
              <MaterialCommunityIcons name="shimmer" size={18} color="#F87171" />
              <View style={styles.demoTextContainer}>
                <Text style={styles.demoTitle}>Usar Credenciales de Administrador:</Text>
                <Text style={styles.demoSub}>admin@limasegura.pe / password123</Text>
              </View>
            </View>
            <View style={styles.demoBadge}>
              <Text style={styles.demoBadgeText}>Autocompletar</Text>
            </View>
          </TouchableOpacity>

          {/* Form */}
          <Text style={styles.label}>Correo Electrónico</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="ejemplo@limasegura.pe"
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
            placeholder="••••••••"
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

          <Button
            mode="contained"
            icon="login"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            buttonColor="#DC2626"
            textColor="#FFFFFF"
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            style={styles.submitButton}
          >
            {loading ? 'Validando Credenciales...' : 'Iniciar Sesión'}
          </Button>

          {/* Footer Navigation */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>¿No tienes una cuenta aún? </Text>
            <TouchableOpacity disabled={loading} onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>Regístrate aquí</Text>
            </TouchableOpacity>
          </View>
        </Surface>
      </ScrollView>

      <Snackbar
        visible={!!toastMsg}
        onDismiss={() => setToastMsg(null)}
        duration={3500}
        style={styles.snackbar}
      >
        {toastMsg}
      </Snackbar>
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
  demoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(69, 10, 10, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },
  demoLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 },
  demoTextContainer: { flex: 1 },
  demoTitle: { color: '#FCA5A5', fontWeight: '700', fontSize: 11 },
  demoSub: { color: 'rgba(248, 113, 113, 0.8)', fontSize: 10, marginTop: 1 },
  demoBadge: {
    backgroundColor: 'rgba(153, 27, 27, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 6,
  },
  demoBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  label: { color: '#CBD5E1', fontSize: 12, fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: '#020617', marginBottom: 14, fontSize: 13 },
  submitButton: { borderRadius: 12, marginTop: 6 },
  buttonContent: { paddingVertical: 6 },
  buttonLabel: { fontWeight: '700', fontSize: 13 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { color: '#94A3B8', fontSize: 12 },
  footerLink: { color: '#F87171', fontSize: 12, fontWeight: '700' },
  snackbar: { backgroundColor: '#991B1B' },
});
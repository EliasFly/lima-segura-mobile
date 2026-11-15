import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { IconButton, Text } from 'react-native-paper';
import { useAuth } from '../hooks/useAuth';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { IncidentListScreen } from '../screens/IncidentListScreen';
import { IncidentDetailScreen } from '../screens/IncidentDetailScreen';
import { CreateIncidentScreen } from '../screens/CreateIncidentScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AppStackParamList = {
  IncidentList: undefined;
  IncidentDetail: { incidentId: number };
  CreateIncident: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

export function AppNavigator() {
  const { isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#DC2626" />
        <Text style={{ color: '#94A3B8', marginTop: 12 }}>Cargando sesión...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <AppStack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: '#0F172A' },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { fontWeight: 'bold' },
            contentStyle: { backgroundColor: '#020617' },
          }}
        >
          <AppStack.Screen
            name="IncidentList"
            component={IncidentListScreen}
            options={{
              title: 'Lima Segura — Reportes',
              headerRight: () => (
                <IconButton icon="logout" iconColor="#F87171" onPress={logout} />
              ),
            }}
          />
          <AppStack.Screen
            name="IncidentDetail"
            component={IncidentDetailScreen}
            options={{ title: 'Detalle del Incidente' }}
          />
          <AppStack.Screen
            name="CreateIncident"
            component={CreateIncidentScreen}
            options={{ title: 'Nuevo Reporte Ciudadano' }}
          />
        </AppStack.Navigator>
      ) : (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Login" component={LoginScreen} />
          <AuthStack.Screen name="Register" component={RegisterScreen} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center', padding: 20 },
});
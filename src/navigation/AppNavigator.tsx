import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from 'react-native-paper';
import { useAuth } from '../hooks/useAuth';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { IncidentListScreen } from '../screens/IncidentListScreen';
import { IncidentDetailScreen } from '../screens/IncidentDetailScreen';
import { CreateIncidentScreen } from '../screens/CreateIncidentScreen';
import { MapRiskScreen } from '../screens/MapRiskScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  MapRisk: undefined;
  IncidentList: undefined;
  Settings: undefined;
};

export type AppStackParamList = {
  MainTabs: undefined;
  IncidentDetail: { incidentId: number };
  CreateIncident: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabsNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0F172A' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: 'bold' },
        tabBarStyle: {
          backgroundColor: '#0F172A',
          borderTopColor: '#1E293B',
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#EF4444',
        tabBarInactiveTintColor: '#64748B',
      }}
    >
      <Tab.Screen
        name="MapRisk"
        component={MapRiskScreen}
        options={{
          title: 'Mapa de Riesgo',
          tabBarLabel: 'Mapa',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="map-marker-alert" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="IncidentList"
        component={IncidentListScreen}
        options={{
          title: 'Reportes Ciudadanos',
          tabBarLabel: 'Reportes',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="format-list-bulleted" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Configuración',
          tabBarLabel: 'Ajustes',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog-outline" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

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
            name="MainTabs"
            component={MainTabsNavigator}
            options={{ headerShown: false }}
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
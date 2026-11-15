import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MD3DarkTheme, PaperProvider } from 'react-native-paper';
import { AuthProvider } from './src/context/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';

const theme={
  ...MD3DarkTheme, 
  colors:{
    ...MD3DarkTheme.colors,
    primary:'#DC2626', 
    secondary:'#EF4444',
    background: '#020617',
    surface: '#0F172A',
    surfaceVariant: '#1E293B',
    onSurface: '#F1F5F9',
    outline: '#334155'
  }
}
export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar barStyle="light-content"/>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}


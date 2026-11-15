import type { StyleProp, ViewStyle } from 'react-native';
import { Snackbar } from 'react-native-paper';

interface AppToastProps {
  message: string | null;
  onDismiss: () => void;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

/** Mensaje corto (toast) que se muestra abajo de la pantalla. */
export function AppToast({ message, onDismiss, duration = 3500, style }: AppToastProps) {
  return (
    <Snackbar visible={!!message} onDismiss={onDismiss} duration={duration} style={style}>
      {message ?? ''}
    </Snackbar>
  );
}

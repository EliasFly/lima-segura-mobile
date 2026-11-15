# LIMA SEGURA — App móvil

App móvil (Expo + React Native + TypeScript) del proyecto **LIMA SEGURA**, el mapa de inseguridad de Lima Metropolitana y Callao. Usa el mismo backend que la versión web.

- Backend: https://github.com/Kamilo0620/lima-segura-backend
- Web: https://github.com/Kamilo0620/lima-segura-web — desplegada en https://lima-segura-web.vercel.app
- API en producción: `https://limasegura-backend-54-225-157-83.sslip.io/api/v1`


## Funcionalidades

- **Login y registro** con JWT. El token se guarda en `expo-secure-store` y, si el backend responde 401, se cierra la sesión.
- **Mapa de riesgo** (`react-native-maps`): puntos de calor y zonas más peligrosas.
- **Lista de incidentes** con paginación y detalle de cada incidente.
- **Confirmar incidentes**: con 3 confirmaciones el incidente pasa a `PUBLISHED`.
- **Reportar un incidente**:
  - **GPS** (`expo-location`): con las coordenadas se llenan la dirección y el distrito usando Nominatim (OpenStreetMap).
    - *Plan B:* si el usuario niega el permiso o no hay señal, escribe la dirección y la app busca sus coordenadas en Nominatim, solo dentro de Lima y Callao.
  - **Cámara y galería** (`expo-image-picker`): la foto es solo una vista previa; el backend todavía no recibe imágenes. Si se niega el permiso, se puede reportar sin foto.
- **Ajustes**: datos del usuario y cerrar sesión.

## Manejo de errores

- Todas las llamadas a la API usan `try/catch` y muestran mensajes claros en un toast (`components/AppToast`).
- `services/api.ts` traduce los errores (sin conexión, timeout, 400, 401, 403, 404, 409, 429, 5xx) a mensajes en español.
- **Reintentos automáticos**: las lecturas (GET) se reintentan hasta 2 veces, esperando 1 s y luego 2 s, si falla la red o el servidor responde 5xx.
- Con un 401, se borra el token y se vuelve al login.

## Estructura

```
src/
├── components/   AppToast (componentes reutilizables)
├── context/      AuthContext (sesión del usuario)
├── hooks/        useAuth, useIncidents
├── navigation/   AppNavigator (tabs + stack)
├── screens/      Login, Register, MapRisk, IncidentList, IncidentDetail, CreateIncident, Settings
├── services/     api.ts (axios + token), authService, incidentService
└── types/        tipos compartidos
```

## Cómo correrlo

Requisitos: Node 20 o más y la app **Expo Go** en el celular (con la sesión iniciada en tu cuenta de Expo).

```bash
npm ci
cp .env.example .env      # en PowerShell: copy .env.example .env
npx expo start
```

Escanea el código QR con Expo Go: en Android desde la app y en iPhone desde la cámara.

### Variables de entorno

| Variable | Ejemplo | Para qué sirve |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | `https://limasegura-backend-54-225-157-83.sslip.io/api/v1` | URL base del backend. Debe terminar en `/api/v1`. |

Si usas el backend en tu laptop, pon la IP local de la PC, por ejemplo `http://192.168.1.20:8080/api/v1`, y no `localhost`. El archivo `.env` no se sube a Git.

## Verificación

```bash
npx tsc --noEmit
```

## Publicación (EAS Update)

La app se publica con **EAS Update** en Expo, en el canal `production`:

```bash
npx eas-cli@latest update --channel production --message "descripción del cambio"
```

El enlace para abrir la app en Expo Go aparece en el panel de Expo, en el proyecto `lima-segura`, en la sección **Updates**.

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { DeviceEventEmitter } from 'react-native';
import type { ApiError } from '../types';
import { tokenStorage } from '../utils/tokenStorage';

export const AUTH_LOGOUT_EVENT = 'auth:logout';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await tokenStorage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Reintentos: solo para GET (leer datos), cuando falla la red, se agota el tiempo
// o el servidor responde 5xx. Se espera 1 s y luego 2 s antes de reintentar.
const MAX_RETRIES = 2;
type RetryConfig = InternalAxiosRequestConfig & { _retryCount?: number };

function isRecoverable(error: AxiosError): boolean {
  if (!error.response) return true; // sin conexión o timeout
  return error.response.status >= 500;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const config = error.config as RetryConfig | undefined;
    if (config && config.method === 'get' && isRecoverable(error)) {
      config._retryCount = (config._retryCount ?? 0) + 1;
      if (config._retryCount <= MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * config._retryCount!));
        return api(config);
      }
    }

    const isAuthRequest = error.config?.url?.startsWith('/auth');
    if (error.response?.status === 401 && !isAuthRequest) {
      await tokenStorage.clear();
      DeviceEventEmitter.emit(AUTH_LOGOUT_EVENT);
    }
    return Promise.reject(error);
  },
);

export function getErrorMessage(error: unknown): string {
  if (axios.isCancel(error)) return 'La petición fue cancelada';
  if (!axios.isAxiosError<ApiError>(error)) return 'Ocurrió un error inesperado';
  if (error.code === 'ECONNABORTED') return 'El servidor tardó demasiado en responder';
  if (!error.response) return 'No hay conexión con el servidor';

  const { status, data } = error.response;
  switch (status) {
    case 400:
      return data?.message ?? 'Los datos enviados no son válidos';
    case 401:
      return 'Correo o contraseña incorrectos';
    case 403:
      return 'No tienes permiso para hacer esto';
    case 404:
      return data?.message ?? 'No se encontró lo que buscabas';
    case 409:
      return data?.message ?? 'Ese registro ya existe';
    case 429:
      return 'Demasiadas solicitudes, espera un momento e inténtalo de nuevo';
    default:
      return 'Error en el servidor, intenta más tarde';
  }
}

export default api;
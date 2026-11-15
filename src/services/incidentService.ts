import axios from 'axios';
import api from './api';
import type {
  CitizenReportRequest,
  ConfirmationResult,
  IncidentDetail,
  IncidentFilters,
  IncidentSummary,
  PageResponse,
} from '../types';
import { DashboardStats } from '../types';
import { HeatmapPoint } from '../types';

function normalizePage<T>(raw: any): PageResponse<T> {
  const meta = raw?.page ?? raw ?? {};
  const content: T[] = raw?.content ?? [];
  const number = meta.number ?? raw?.number ?? 0;
  const size = meta.size ?? raw?.size ?? content.length;
  const totalElements = meta.totalElements ?? raw?.totalElements ?? content.length;
  const totalPages = meta.totalPages ?? raw?.totalPages ?? 1;
  return {
    content,
    pageable: { pageNumber: number, pageSize: size },
    totalElements,
    totalPages,
    number,
    size,
    numberOfElements: content.length,
    first: number === 0,
    last: number >= totalPages - 1,
    empty: content.length === 0,
  };
}

const nominatim = axios.create({
  baseURL: 'https://nominatim.openstreetmap.org',
  timeout: 8000,
  headers: {
    'Accept-Language': 'es',
    'User-Agent': 'LimaSeguraMobileApp/1.0',
  },
});

export const incidentService = {
  async getIncidents(filters: IncidentFilters = {}): Promise<PageResponse<IncidentSummary>> {
    const params: Record<string, unknown> = {
      page: filters.page ?? 0,
      size: filters.size ?? 35,
      sort: 'occurredAt,desc',
    };
    const type = filters.type || filters.incidentType;
    if (type) params.type = type;
    if (filters.status) params.status = filters.status;
    if (filters.district) params.district = filters.district;
    if (filters.search?.trim()) params.search = filters.search.trim();

    const response = await api.get('/incidents', { params });
    return normalizePage<IncidentSummary>(response.data);
  },

  async getIncidentDetail(id: number): Promise<IncidentDetail> {
    const response = await api.get<IncidentDetail>(`/incidents/${id}`);
    return response.data;
  },

  async reportIncident(data: CitizenReportRequest): Promise<IncidentSummary> {
    const response = await api.post<IncidentSummary>('/incidents/report', data);
    return response.data;
  },

  async confirmIncident(id: number): Promise<ConfirmationResult> {
    const response = await api.post<ConfirmationResult>(`/incidents/${id}/confirm`);
    return response.data;
  },

  async reverseGeocode(lat: number, lng: number) {
    const response = await nominatim.get('/reverse', {
      params: { format: 'json', lat, lon: lng, zoom: 18, addressdetails: 1 },
    });
    return response.data as { display_name?: string; address?: Record<string, string> };
  },

  async getHeatmap(): Promise<HeatmapPoint[]> {
    const response = await api.get<HeatmapPoint[]>('/incidents/heatmap');
    return Array.isArray(response.data) ? response.data : [];
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get<DashboardStats>('/incidents/stats/dashboard');
    return response.data;
  }
};
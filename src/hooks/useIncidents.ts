import { useCallback, useEffect, useState } from 'react';
import { incidentService } from '../services/incidentService';
import { getErrorMessage } from '../services/api';
import type { IncidentSummary } from '../types';

export function useIncidents() {
  const [incidents, setIncidents] = useState<IncidentSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchIncidents = useCallback(
    async (isRefresh = false, customSearch?: string) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const query = customSearch !== undefined ? customSearch : searchQuery;
        const page = await incidentService.getIncidents({
          page: 0,
          size: 35,
          search: query,
        });
        setIncidents(page.content);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [searchQuery],
  );

  useEffect(() => {
    fetchIncidents(false);
  }, []);

  return {
    incidents,
    loading,
    refreshing,
    error,
    searchQuery,
    setSearchQuery,
    fetchIncidents,
  };
}
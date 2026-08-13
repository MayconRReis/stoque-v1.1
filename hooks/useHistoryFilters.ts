import React, { useState, useEffect } from 'react';
import { supabaseService } from '../services/supabaseService';
import { HistoryEntry } from '../types';

export const HISTORY_PAGE_SIZE = 100;

export function useHistoryFilters(
  user: any,
  isPublicView: boolean,
  showNotification: (msg: string, type?: 'success' | 'error' | 'info') => void
) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historySearch, setHistorySearch] = useState('');

  const [historyPage, setHistoryPage] = useState(0);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [isLoadingMoreHistory, setIsLoadingMoreHistory] = useState(false);
  const [isSearchingHistory, setIsSearchingHistory] = useState(false);

  // Initial load / reload (e.g. after login). Mirrors the other data loaders in loadData().
  const loadHistory = async () => {
    try {
      const result = await supabaseService.getHistoryPaginated(0, HISTORY_PAGE_SIZE, historySearch);
      setHistory(result.data);
      setHasMoreHistory(result.data.length < result.count);
      setHistoryPage(0);
    } catch (error) {
      console.error('Error loading history:', error);
      showNotification('Erro ao carregar histórico.', 'error');
    }
  };

  const loadMoreHistory = async () => {
    if (isLoadingMoreHistory || !hasMoreHistory) return;

    setIsLoadingMoreHistory(true);
    try {
      const nextPage = historyPage + 1;
      const result = await supabaseService.getHistoryPaginated(nextPage, HISTORY_PAGE_SIZE, historySearch);

      setHistory(prev => {
        const existingIds = new Set(prev.map(h => h.id));
        const newItems = result.data.filter(h => !existingIds.has(h.id));
        const combined = [...prev, ...newItems];
        setHasMoreHistory(combined.length < result.count);
        return combined;
      });
      setHistoryPage(nextPage);
    } catch (error) {
      console.error('Error loading more history:', error);
      showNotification('Erro ao carregar mais registros do histórico.', 'error');
    } finally {
      setIsLoadingMoreHistory(false);
    }
  };

  // Debounced search — queries the whole table server-side, not just what's already loaded.
  useEffect(() => {
    const timer = setTimeout(() => {
      const fetchFilteredHistory = async () => {
        setIsSearchingHistory(true);
        try {
          const result = await supabaseService.getHistoryPaginated(0, HISTORY_PAGE_SIZE, historySearch);
          setHistory(result.data);
          setHasMoreHistory(result.data.length < result.count);
          setHistoryPage(0);
        } catch (error) {
          console.error('Error searching history:', error);
          showNotification('Erro ao pesquisar no histórico.', 'error');
        } finally {
          setIsSearchingHistory(false);
        }
      };

      if (user || isPublicView) {
        fetchFilteredHistory();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historySearch, user, isPublicView]);

  return {
    history, setHistory,
    historySearch, setHistorySearch,
    historyPage, setHistoryPage,
    hasMoreHistory, setHasMoreHistory,
    isLoadingMoreHistory, isSearchingHistory,
    loadHistory,
    loadMoreHistory,
    HISTORY_PAGE_SIZE
  };
}

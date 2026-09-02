import React, { useState, useEffect } from 'react';
import { User as AppUser } from '../types';
import { supabaseService } from '../services/supabaseService';
import { isFetchOrNetworkError } from '../lib/supabase';
import { SlotContent } from '../types';
import { SheetRow } from '../types';

export const PAGE_SIZE = 50;

export function useInventoryFilters(
  user: any,
  isPublicView: boolean,
  showNotification: (msg: string, type?: 'success'|'error'|'info') => void,
  setData: React.Dispatch<React.SetStateAction<SheetRow[]>>
) {
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryTypeFilter, setInventoryTypeFilter] = useState<SlotContent | 'ALL' | 'CONTAINER' | 'SEM_SELO'>('ALL');
  const [isInventoryFilterOpen, setIsInventoryFilterOpen] = useState(false);

  const [inventoryPage, setInventoryPage] = useState(0);
  const [hasMoreInventory, setHasMoreInventory] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadMoreInventory = async () => {
    if (isLoadingMore || !hasMoreInventory) return;
    
    setIsLoadingMore(true);
    try {
      const nextPage = inventoryPage + 1;
      const result = await supabaseService.getInventoryPaginated(nextPage, PAGE_SIZE, {
        searchTerm: inventorySearch,
        typeFilter: inventoryTypeFilter
      });
      
      setData(prev => {
        const existingIds = new Set(prev.map(i => i.id));
        const newItems = result.data.filter(i => !existingIds.has(i.id));
        const combined = [...prev, ...newItems];
        setHasMoreInventory(combined.length < result.count);
        return combined;
      });
      setInventoryPage(nextPage);
    } catch (error) {
      if (isFetchOrNetworkError(error)) {
        console.warn('Network issue loading more inventory:', error);
      } else {
        console.warn('Error loading more inventory:', error);
      }
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Debounced search for server-side filtering
  useEffect(() => {
    const timer = setTimeout(() => {
      const fetchFilteredData = async () => {
        setIsLoadingMore(true);
        try {
          const result = await supabaseService.getInventoryPaginated(0, PAGE_SIZE, {
            searchTerm: inventorySearch,
            typeFilter: inventoryTypeFilter
          });
          setData(result.data);
          setHasMoreInventory(result.data.length < result.count);
          setInventoryPage(0);
        } catch (error) {
          if (isFetchOrNetworkError(error)) {
            console.warn('Network issue searching inventory:', error);
          } else {
            console.warn('Error searching inventory:', error);
          }
        } finally {
          setIsLoadingMore(false);
        }
      };
      
      if (user || isPublicView) {
        fetchFilteredData();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [inventorySearch, inventoryTypeFilter, user, isPublicView, setData, showNotification]);

  return {
    inventorySearch, setInventorySearch,
    inventoryTypeFilter, setInventoryTypeFilter,
    isInventoryFilterOpen, setIsInventoryFilterOpen,
    inventoryPage, setInventoryPage,
    hasMoreInventory, setHasMoreInventory,
    isLoadingMore, setIsLoadingMore,
    loadMoreInventory,
    PAGE_SIZE
  };
}

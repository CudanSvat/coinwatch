import AsyncStorage from '@react-native-async-storage/async-storage';
import {useCallback, useEffect, useState} from 'react';
import type {FavoriteItem} from '../types/dex';

const STORAGE_KEY = '@trading_favorites_v2';

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        setFavorites(JSON.parse(raw));
      }
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const persist = useCallback((items: FavoriteItem[]) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => {});
  }, []);

  const addFavorite = useCallback(
    (item: Omit<FavoriteItem, 'addedAt'>) => {
      setFavorites(prev => {
        if (prev.some(f => f.id === item.id)) {
          return prev;
        }
        const updated = [...prev, {...item, addedAt: Date.now()}];
        persist(updated);
        return updated;
      });
    },
    [persist],
  );

  const removeFavorite = useCallback(
    (id: string) => {
      setFavorites(prev => {
        const updated = prev.filter(f => f.id !== id);
        persist(updated);
        return updated;
      });
    },
    [persist],
  );

  const isFavorite = useCallback(
    (id: string): boolean => favorites.some(f => f.id === id),
    [favorites],
  );

  return {favorites, loading, addFavorite, removeFavorite, isFavorite, refresh: loadFavorites};
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import {useCallback, useEffect, useState} from 'react';
import type {FavoritePair} from '../types/dex';

const STORAGE_KEY = '@trading_favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoritePair[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        setFavorites(JSON.parse(raw));
      }
    } catch {
      // storage read failure is non-fatal
    } finally {
      setLoading(false);
    }
  }, []);

  const saveFavorites = useCallback(async (updated: FavoritePair[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setFavorites(updated);
    } catch {
      // storage write failure is non-fatal
    }
  }, []);

  const addFavorite = useCallback(
    async (pair: Omit<FavoritePair, 'addedAt'>) => {
      setFavorites(prev => {
        const exists = prev.some(
          f =>
            f.chainId === pair.chainId &&
            f.pairAddress === pair.pairAddress,
        );
        if (exists) {
          return prev;
        }
        const updated = [...prev, {...pair, addedAt: Date.now()}];
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(
          () => {},
        );
        return updated;
      });
    },
    [],
  );

  const removeFavorite = useCallback(
    async (chainId: string, pairAddress: string) => {
      setFavorites(prev => {
        const updated = prev.filter(
          f => !(f.chainId === chainId && f.pairAddress === pairAddress),
        );
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(
          () => {},
        );
        return updated;
      });
    },
    [],
  );

  const isFavorite = useCallback(
    (chainId: string, pairAddress: string): boolean => {
      return favorites.some(
        f => f.chainId === chainId && f.pairAddress === pairAddress,
      );
    },
    [favorites],
  );

  return {
    favorites,
    loading,
    addFavorite,
    removeFavorite,
    isFavorite,
    refresh: loadFavorites,
    saveFavorites,
  };
}

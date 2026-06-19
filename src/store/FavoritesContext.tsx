import React, {createContext, useContext} from 'react';
import {useFavorites} from './useFavorites';

type FavoritesContextType = ReturnType<typeof useFavorites>;

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export function FavoritesProvider({children}: {children: React.ReactNode}) {
  const value = useFavorites();
  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavoritesContext(): FavoritesContextType {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error('useFavoritesContext must be used inside FavoritesProvider');
  }
  return ctx;
}

import React from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {AppNavigator} from './src/navigation/AppNavigator';
import {FavoritesProvider} from './src/store/FavoritesContext';
import {UpdateModal} from './src/components/UpdateModal';
import {useUpdateChecker} from './src/hooks/useUpdateChecker';
import {Colors} from './src/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
    },
  },
});

function App() {
  const {update, dismiss} = useUpdateChecker();

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <StatusBar
          barStyle="light-content"
          backgroundColor={Colors.background}
          translucent={false}
        />
        <QueryClientProvider client={queryClient}>
          <FavoritesProvider>
            <AppNavigator />
            {update && <UpdateModal release={update} onDismiss={dismiss} />}
          </FavoritesProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;

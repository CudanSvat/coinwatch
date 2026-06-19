import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {FavoritesScreen} from '../screens/FavoritesScreen';
import {SearchScreen} from '../screens/SearchScreen';
import {TokenDetailScreen} from '../screens/TokenDetailScreen';
import {Colors, FontSize} from '../theme';
import type {TokenDetailParams} from '../types/dex';

export type RootStackParamList = {
  Main: undefined;
  TokenDetail: TokenDetailParams;
};

export type MainTabParamList = {
  Watchlist: undefined;
  Search: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

function TabIcon({emoji, label, focused}: {emoji: string; label: string; focused: boolean}) {
  return (
    <View style={tabStyles.container}>
      <Text style={tabStyles.emoji}>{emoji}</Text>
      <Text style={[tabStyles.label, {color: focused ? Colors.primary : Colors.textMuted}]}>
        {label}
      </Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  container: {alignItems: 'center', paddingTop: 6},
  emoji: {fontSize: 20},
  label: {fontSize: FontSize.xs, fontWeight: '600', marginTop: 2},
});

function MainTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          // Respect Android nav bar height so tabs are never hidden
          height: 58 + insets.bottom,
          paddingBottom: insets.bottom,
        },
      }}>
      <Tab.Screen
        name="Watchlist"
        component={FavoritesScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon emoji="⭐" label="Watchlist" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon emoji="🔍" label="Search" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const darkNavTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary,
    background: Colors.background,
    card: Colors.surface,
    text: Colors.textPrimary,
    border: Colors.border,
    notification: Colors.primary,
  },
};

export function AppNavigator() {
  return (
    <NavigationContainer theme={darkNavTheme}>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen
          name="TokenDetail"
          component={TokenDetailScreen}
          options={{presentation: 'card'}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

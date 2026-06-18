import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import {FavoritesScreen} from '../screens/FavoritesScreen';
import {SearchScreen} from '../screens/SearchScreen';
import {TokenDetailScreen} from '../screens/TokenDetailScreen';
import {Colors, FontSize} from '../theme';

export type RootStackParamList = {
  Main: undefined;
  TokenDetail: {
    chainId: string;
    pairAddress: string;
    baseTokenSymbol: string;
    baseTokenName: string;
    quoteTokenSymbol: string;
  };
  Search: undefined;
};

export type MainTabParamList = {
  Watchlist: undefined;
  Search: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

function TabIcon({
  emoji,
  label,
  focused,
}: {
  emoji: string;
  label: string;
  focused: boolean;
}) {
  return (
    <View style={tabIconStyles.container}>
      <Text style={tabIconStyles.emoji}>{emoji}</Text>
      <Text
        style={[
          tabIconStyles.label,
          {color: focused ? Colors.primary : Colors.textMuted},
        ]}>
        {label}
      </Text>
    </View>
  );
}

const tabIconStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 6,
  },
  emoji: {
    fontSize: 20,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    marginTop: 2,
  },
});

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
        },
        tabBarShowLabel: false,
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

import {DefaultTheme} from '@react-navigation/native';

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

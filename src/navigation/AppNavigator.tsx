import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { colors } from '../theme';
import HomeScreen from '../screens/HomeScreen';
import PairingScreen from '../screens/PairingScreen';

export type AppTabParamList = {
  MQ: undefined;
  Pairing: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.placeholder,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        tabBarIcon: ({ color, size }) => {
          const name = route.name === 'MQ' ? 'wifi' : 'bluetooth';
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="MQ" component={HomeScreen} options={{ tabBarLabel: 'MQ' }} />
      <Tab.Screen name="Pairing" component={PairingScreen} options={{ tabBarLabel: 'Pairing' }} />
    </Tab.Navigator>
  );
}

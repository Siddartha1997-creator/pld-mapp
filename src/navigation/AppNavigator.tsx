import Ionicons from 'react-native-vector-icons/Ionicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { colors } from '../theme';
import HomeScreen from '../screens/HomeScreen';
import DeviceListScreen from '../screens/DeviceListScreen';
import ProfileScreen from '../screens/ProfileScreen';

export type AppTabParamList = {
  Devices: undefined;
  MQ: undefined;
  Profile: undefined;
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
          const iconMap: Record<string, string> = {
            Devices: 'grid-outline',
            MQ: 'wifi',
            Profile: 'person-outline',
          };
          return <Ionicons name={iconMap[route.name] ?? 'ellipse-outline'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Devices" component={DeviceListScreen} options={{ tabBarLabel: 'Devices' }} />
      <Tab.Screen name="MQ" component={HomeScreen} options={{ tabBarLabel: 'MQ' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

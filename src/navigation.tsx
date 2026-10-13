import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStack } from './nav';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadow } from './theme';
import HomeScreen from './screens/HomeScreen';
import PatientsScreen from './screens/PatientsScreen';
import PatientDetailScreen from './screens/PatientDetailScreen';
import PatientFormScreen from './screens/PatientFormScreen';
import AgendaScreen from './screens/AgendaScreen';
import AppointmentFormScreen from './screens/AppointmentFormScreen';
import NoteFormScreen from './screens/NoteFormScreen';
import ReceiptsScreen from './screens/ReceiptsScreen';
import ReceiptFormScreen from './screens/ReceiptFormScreen';
import ReceiptDetailScreen from './screens/ReceiptDetailScreen';
import SettingsScreen from './screens/SettingsScreen';
import BreathingScreen from './screens/BreathingScreen';

const Stack = createNativeStackNavigator<RootStack>();
const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, [React.ComponentProps<typeof Ionicons>['name'], React.ComponentProps<typeof Ionicons>['name']]> = {
  Home: ['leaf', 'leaf-outline'],
  Pazienti: ['people', 'people-outline'],
  Agenda: ['calendar', 'calendar-outline'],
  Ricevute: ['receipt', 'receipt-outline'],
  Altro: ['settings', 'settings-outline'],
};

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: Platform.OS === 'ios' ? 0 : 6 },
        tabBarIcon: ({ focused, color }) => (
          <View style={[styles.tabIcon, focused && { backgroundColor: colors.primarySoft }]}>
            <Ionicons name={TAB_ICONS[route.name][focused ? 0 : 1]} size={21} color={color} />
          </View>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Pazienti" component={PatientsScreen} />
      <Tab.Screen name="Agenda" component={AgendaScreen} />
      <Tab.Screen name="Ricevute" component={ReceiptsScreen} />
      <Tab.Screen name="Altro" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.bg, primary: colors.primary } };

export default function Navigation() {
  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="Tabs" component={Tabs} />
        <Stack.Screen name="PatientDetail" component={PatientDetailScreen} />
        <Stack.Screen name="PatientForm" component={PatientFormScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="AppointmentForm" component={AppointmentFormScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="NoteForm" component={NoteFormScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="ReceiptForm" component={ReceiptFormScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="ReceiptDetail" component={ReceiptDetailScreen} />
        <Stack.Screen name="Breathing" component={BreathingScreen} options={{ animation: 'fade' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: Platform.OS === 'ios' ? 24 : 14,
    marginHorizontal: 14,
    height: 68,
    paddingTop: 8,
    borderRadius: 26,
    borderTopWidth: 0,
    backgroundColor: '#FFFFFF',
    ...shadow,
    shadowOpacity: 0.14,
  },
  tabIcon: { width: 44, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
});

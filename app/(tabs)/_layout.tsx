import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
   <Tabs
  screenOptions={{
    headerShown: false,

    tabBarStyle: {
      backgroundColor: '#1A3F12',
      borderTopWidth: 0,
      height: 78,
      paddingBottom: 10,
      paddingTop: 6,
    },

    tabBarActiveTintColor: '#FFFFFF',

    tabBarInactiveTintColor: '#D5DED6',
  }}
>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="boletim"
        options={{
          title: 'Boletim',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text" size={size} color={color} />
          ),
        }}
      />


      <Tabs.Screen
        name="sermoes"
        options={{
          title: 'Sermões',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="mic" size={size} color={color} />
          ),
        }}
      />

  <Tabs.Screen
  name="eventos"
  options={{
    title: 'Eventos',
    tabBarIcon: ({ color, size }) => (
      <Ionicons
        name="calendar"
        size={size}
        color={color}
      />
    ),
  }}
/>

      <Tabs.Screen
        name="mais"
        options={{
          title: 'Mais',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="menu" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
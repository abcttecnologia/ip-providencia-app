import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      backBehavior="history"
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
            <Ionicons name="home" size={size} color={String(color)} />
          ),
        }}
      />

      <Tabs.Screen
        name="comunhao"
        options={{
          title: 'Comunhão',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={String(color)} />
          ),
        }}
      />

      <Tabs.Screen
        name="agendaTab"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={String(color)} />
          ),
        }}
      />

      <Tabs.Screen
        name="sermoes"
        options={{
          title: 'Sermões',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="play-circle" size={size} color={String(color)} />
          ),
        }}
      />

      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle" size={size} color={String(color)} />
          ),
        }}
      />

      <Tabs.Screen
        name="mais"
        options={{
          href: null,
          title: 'Nossa IPP',
        }}
      />

      <Tabs.Screen
        name="eventos"
        options={{
          href: null,
          title: 'Eventos',
        }}
      />

    </Tabs>
  );
}

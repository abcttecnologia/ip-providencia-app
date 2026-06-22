import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: '#1A3F12',
        tabBarInactiveTintColor: '#8A8A8A',
        tabBarStyle: {
          height: 70,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: '#FFFFFF',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="house.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="boletim"
        options={{
          title: 'Boletim',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="doc.text.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="sermoes"
        options={{
          title: 'Sermões',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="play.rectangle.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="obra"
        options={{
          title: 'Obra',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="hammer.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="mais"
        options={{
          title: 'Mais',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="ellipsis.circle.fill" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}                                                                                                                             
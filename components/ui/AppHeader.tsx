import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Pressable,
  Text,
  View,
} from 'react-native';
import type { ComponentProps } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  title: string;
  showBack?: boolean;
  rightAction?: {
    icon: ComponentProps<typeof Ionicons>['name'];
    accessibilityLabel: string;
    onPress: () => void;
  };
};

export default function AppHeader({
  title,
  showBack = true,
  rightAction,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        backgroundColor: '#023411',
        paddingTop: insets.top + 12,
        paddingBottom: 16,
        paddingHorizontal: 18,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      {showBack ? (
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 32,
            alignItems: 'flex-start',
          }}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#FFF"
          />
        </Pressable>
      ) : (
        <View style={{ width: 32 }} />
      )}

      <Text
        style={{
          flex: 1,
          textAlign: 'center',
          color: '#FFF',
          fontSize: 20,
          fontWeight: '700',
        }}
      >
        {title}
      </Text>

      {rightAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={rightAction.accessibilityLabel}
          onPress={rightAction.onPress}
          style={{
            width: 32,
            alignItems: 'flex-end',
          }}
        >
          <Ionicons name={rightAction.icon} size={22} color="#FFF" />
        </Pressable>
      ) : (
        <View style={{ width: 32 }} />
      )}
    </View>
  );
}
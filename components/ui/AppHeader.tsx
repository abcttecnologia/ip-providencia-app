import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Pressable,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  title: string;
  showBack?: boolean;
};

export default function AppHeader({
  title,
  showBack = true,
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

      <View style={{ width: 32 }} />
    </View>
  );
}
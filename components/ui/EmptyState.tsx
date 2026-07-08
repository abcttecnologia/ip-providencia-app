import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

type Props = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
};

export default function EmptyState({
  icon = 'document-outline',
  title,
  description,
}: Props) {
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 50,
        paddingHorizontal: 24,
      }}
    >
      <Ionicons
        name={icon}
        size={54}
        color="#546B5F"
      />

      <Text
        style={{
          marginTop: 16,
          fontSize: 18,
          fontWeight: '700',
          color: '#023411',
          textAlign: 'center',
        }}
      >
        {title}
      </Text>

      {description && (
        <Text
          style={{
            marginTop: 10,
            color: '#666',
            fontSize: 14,
            lineHeight: 22,
            textAlign: 'center',
          }}
        >
          {description}
        </Text>
      )}
    </View>
  );
}
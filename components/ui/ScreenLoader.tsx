import React from 'react';
import {
    ActivityIndicator,
    Text,
    View,
} from 'react-native';

type Props = {
  message?: string;
};

export default function ScreenLoader({
  message = 'Carregando...',
}: Props) {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
      }}
    >
      <ActivityIndicator
        size="large"
        color="#023411"
      />

      <Text
        style={{
          marginTop: 14,
          color: '#546B5F',
          fontSize: 15,
          fontWeight: '500',
        }}
      >
        {message}
      </Text>
    </View>
  );
}
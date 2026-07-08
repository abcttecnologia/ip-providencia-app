import React from 'react';
import {
    Pressable,
    Text,
} from 'react-native';

type Props = {
  title: string;
  onPress: () => void;
};

export default function AppButton({
  title,
  onPress,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: '#023411',
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          color: '#FFF',
          fontWeight: '700',
          fontSize: 16,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
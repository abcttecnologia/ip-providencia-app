import React from 'react';
import { Text } from 'react-native';

type Props = {
  children: React.ReactNode;
};

export default function SectionTitle({
  children,
}: Props) {
  return (
    <Text
      style={{
        fontSize: 22,
        fontWeight: '700',
        color: '#023411',
        marginBottom: 18,
      }}
    >
      {children}
    </Text>
  );
}
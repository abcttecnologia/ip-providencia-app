import React from 'react';
import {
  StyleProp,
  ViewStyle,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function Screen({
  children,
  style,
}: Props) {
  return (
    <SafeAreaView
      edges={['left', 'right', 'bottom']}
      style={[
        {
          flex: 1,
          backgroundColor: '#ECE8DD',
        },
        style,
      ]}
    >
      {children}
    </SafeAreaView>
  );
}
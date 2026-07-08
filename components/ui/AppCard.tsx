import React from 'react';
import {
  StyleProp,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';

type Props = ViewProps & {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function AppCard({
  children,
  style,
  ...props
}: Props) {
  return (
    <View
      {...props}
      style={[
        {
          backgroundColor: '#FFFFFF',

          borderRadius: 20,

          padding: 18,

          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.08,
          shadowRadius: 8,

          elevation: 3,

          marginBottom: 16,

          overflow: 'hidden',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
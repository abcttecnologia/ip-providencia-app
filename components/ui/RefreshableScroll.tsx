import React from 'react';
import {
    RefreshControl,
    ScrollView,
    ScrollViewProps,
} from 'react-native';

type Props = ScrollViewProps & {
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
};

export default function RefreshableScroll({
  refreshing,
  onRefresh,
  children,
  ...props
}: Props) {
  return (
    <ScrollView
      {...props}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#023411']}
          tintColor="#023411"
        />
      }
    >
      {children}
    </ScrollView>
  );
}
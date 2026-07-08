import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';

import { WebView } from 'react-native-webview';

import OfflineBanner from '../../components/ui/OfflineBanner';

import { getLinks } from '../../services/config';

export default function BoletimScreen() {
  const [boletim, setBoletim] = useState('');
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    carregarBoletim();
  }, []);

  async function carregarBoletim() {
    try {
      const resultado = await getLinks();

      setOffline(resultado.offline);

      setBoletim(
        resultado.data?.boletim ?? ''
      );
    } catch (error) {
      console.log(error);
    }
  }

  if (!boletim) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          size="large"
          color="#1E5631"
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <OfflineBanner visible={offline} />

      <WebView
        source={{ uri: boletim }}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator
              size="large"
              color="#1E5631"
            />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
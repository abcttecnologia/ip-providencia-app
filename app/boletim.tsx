import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { WebView } from 'react-native-webview';

import AppHeader from '../components/ui/AppHeader';
import OfflineBanner from '../components/ui/OfflineBanner';

import { getLinks } from '../services/config';

const EXTERNAL_LINK_DOMAINS = [
  'youtube.com',
  'youtube-nocookie.com',
  'youtu.be',
  'instagram.com',
  'whatsapp.com',
  'wa.me',
];

function isExternalLink(url: string) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return EXTERNAL_LINK_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
    );
  } catch {
    return false;
  }
}

export default function BoletimScreen() {
  const [boletim, setBoletim] = useState('');
  const [offline, setOffline] = useState(false);
  const [erroCarregamento, setErroCarregamento] = useState(false);
  const [tentativa, setTentativa] = useState(0);

  function openExternalLink(url: string) {
    void Linking.openURL(url).catch((error) => {
      console.error('Erro ao abrir link externo do Boletim:', error);
      Alert.alert(
        'Não foi possível abrir o link',
        'Tente novamente em alguns instantes.',
      );
    });
  }

  useEffect(() => {
    let ativo = true;

    getLinks()
      .then((resultado) => {
        if (!ativo) return;

        const url = resultado.data?.boletim ?? '';
        setOffline(resultado.offline && Boolean(url));
        setBoletim(url);
        setErroCarregamento(!url);
      })
      .catch((error) => {
        if (!ativo) return;

        console.error('Erro ao buscar o link do Boletim:', error);
        setOffline(false);
        setErroCarregamento(true);
      });

    return () => {
      ativo = false;
    };
  }, [tentativa]);

  return (
    <SafeAreaView
      style={styles.container}
      edges={['left', 'right', 'bottom']}
    >
      <AppHeader title="Boletim / Devocional" />
      <OfflineBanner visible={offline} />

      {!boletim && !erroCarregamento ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#1E5631" />
        </View>
      ) : erroCarregamento ? (
        <View style={styles.loading}>
          <Text style={styles.errorText}>
            Não foi possível carregar o Boletim. Verifique sua conexão e tente novamente.
          </Text>
          <Pressable
            onPress={() => {
              setBoletim('');
              setOffline(false);
              setErroCarregamento(false);
              setTentativa((valor) => valor + 1);
            }}
          >
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.webViewContainer}>
          <WebView
            key={tentativa}
            source={{ uri: boletim }}
            style={styles.webView}
            onShouldStartLoadWithRequest={({ url }) => {
              if (!isExternalLink(url)) return true;
              openExternalLink(url);
              return false;
            }}
            startInLoadingState
            onLoad={() => {
              setOffline(false);
              setErroCarregamento(false);
            }}
            onError={({ nativeEvent }) => {
              console.error('Erro ao carregar o Boletim:', nativeEvent);
              setOffline(false);
              setErroCarregamento(true);
            }}
            onHttpError={({ nativeEvent }) => {
              console.error('Erro HTTP ao carregar o Boletim:', nativeEvent);
              setOffline(false);
              setErroCarregamento(true);
            }}
            renderLoading={() => (
              <View style={styles.loading}>
                <ActivityIndicator size="large" color="#1E5631" />
              </View>
            )}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  webViewContainer: {
    flex: 1,
  },

  webView: {
    flex: 1,
    backgroundColor: '#FFF',
  },

  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  errorText: {
    color: '#546B5F',
    textAlign: 'center',
    marginBottom: 16,
  },

  retryText: {
    color: '#1E5631',
    fontWeight: '700',
  },
});
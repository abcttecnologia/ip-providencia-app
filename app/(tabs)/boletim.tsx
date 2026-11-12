import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { WebView } from 'react-native-webview';

import AppHeader from '../../components/ui/AppHeader';
import OfflineBanner from '../../components/ui/OfflineBanner';

import { getLinks } from '../../services/config';

export default function BoletimScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const horizontalPadding = 20;
  const contentWidth = Math.max(0, screenWidth - horizontalPadding * 2);
  const [boletim, setBoletim] = useState('');
  const [offline, setOffline] = useState(false);
  const [erroCarregamento, setErroCarregamento] = useState(false);
  const [tentativa, setTentativa] = useState(0);

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
          <View style={[styles.webViewCard, { width: contentWidth }]}>
            <WebView
              key={`${tentativa}-${contentWidth}`}
              source={{ uri: boletim }}
              style={{ flex: 1, width: contentWidth, backgroundColor: '#FFF' }}
              injectedJavaScript={`
                (function() {
                  var viewport = document.querySelector('meta[name="viewport"]');
                  if (!viewport) {
                    viewport = document.createElement('meta');
                    viewport.name = 'viewport';
                    document.head.appendChild(viewport);
                  }
                  viewport.content = 'width=device-width, initial-scale=1';

                  var style = document.createElement('style');
                  style.textContent = [
                    'html, body { width: 100% !important; min-width: 0 !important; max-width: 100% !important; margin: 0 !important; padding: 0 !important; overflow-x: hidden !important; box-sizing: border-box !important; }',
                    'body { padding: 16px 16px 56px !important; text-align: left !important; }',
                    '*, *::before, *::after { box-sizing: border-box !important; max-width: 100% !important; }',
                    'p, li, td, th, div, span { min-width: 0 !important; white-space: normal !important; text-align: left !important; overflow-wrap: anywhere !important; word-break: break-word !important; }',
                    'img, video, iframe, table { max-width: 100% !important; height: auto !important; }',
                    'table { width: 100% !important; table-layout: fixed !important; }'
                  ].join('');
                  document.head.appendChild(style);
                  return true;
                })();
              `}
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
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  webViewCard: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
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
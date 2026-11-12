import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { WebView } from 'react-native-webview';

import OfflineBanner from '../../components/ui/OfflineBanner';

import { getLinks } from '../../services/config';

export default function BoletimScreen() {
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

  if (!boletim && !erroCarregamento) {
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

      {erroCarregamento ? (
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
        <WebView
          key={tentativa}
          source={{ uri: boletim }}
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
              <ActivityIndicator
                size="large"
                color="#1E5631"
              />
            </View>
          )}
        />
      )}
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
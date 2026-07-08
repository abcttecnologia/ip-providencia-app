import { useEffect, useState } from 'react';
import { View } from 'react-native';

import AvisosCard from '../../components/cards/AvisosCard';
import EventoCard from '../../components/cards/EventoCard';
import Header from '../../components/cards/Header';
import MenuCard from '../../components/cards/MenuCard';
import SermaoCard from '../../components/cards/SermaoCard';
import VersiculoCard from '../../components/cards/VersiculoCard';

import OfflineBanner from '../../components/ui/OfflineBanner';
import RefreshableScroll from '../../components/ui/RefreshableScroll';
import Screen from '../../components/ui/Screen';

import { getAvisos } from '../../services/avisos';
import { getEventos } from '../../services/calendar';
import { getLatestVideos } from '../../services/youtube';

export default function HomeScreen() {
const [ultimoVideo, setUltimoVideo] = useState<any>(null);
const [proximoEvento, setProximoEvento] = useState<any>(null);
const [avisos, setAvisos] = useState<any[]>([]);

const [refreshing, setRefreshing] = useState(false);

const [offlineAvisos, setOfflineAvisos] =
  useState(false);

const [offlineAgenda, setOfflineAgenda] =
  useState(false);

const [offlineYoutube, setOfflineYoutube] =
  useState(false);

  useEffect(() => {
    carregarTudo();
  }, []);

  async function carregarTudo() {
    await Promise.all([
      carregarUltimoVideo(),
      carregarProximoEvento(),
      carregarAvisos(),
    ]);
  }

  async function atualizar() {
    setRefreshing(true);

    try {
      await carregarTudo();
    } finally {
      setRefreshing(false);
    }
  }

async function carregarUltimoVideo() {
  try {
    const resultado = await getLatestVideos();

    setOfflineYoutube(resultado.offline);

    if (resultado.data.length > 0) {
      setUltimoVideo(resultado.data[0]);
    }
  } catch (error) {
    console.log(error);
  }
}

async function carregarProximoEvento() {
  try {
    const resultado = await getEventos();

    setOfflineAgenda(resultado.offline);

    if (resultado.data.length > 0) {
      setProximoEvento(resultado.data[0]);
    }
  } catch (error) {
    console.log(error);
  }
}

async function carregarAvisos() {
  try {
    const resultado = await getAvisos();

    setOfflineAvisos(resultado.offline);

    const dados = resultado.data;

    dados.sort((a: any, b: any) => {
      if (a.importante === b.importante) return 0;
      return a.importante ? -1 : 1;
    });

    setAvisos(dados);
  } catch (error) {
    console.log(error);
  }
}
  function formatarDataEvento(evento: any) {
    const dataTexto =
      evento?.start?.dateTime || evento?.start?.date;

    if (!dataTexto) return '';

    const data = new Date(dataTexto);

    const dia = data.toLocaleDateString('pt-BR', {
      weekday: 'long',
    });

    const hora = evento?.start?.dateTime
      ? data.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Dia todo';

    return `${dia} • ${hora}`;
  }

  return (
    <Screen>
      <RefreshableScroll
        refreshing={refreshing}
        onRefresh={atualizar}
      >
        <Header />

        <OfflineBanner
  visible={
    offlineAvisos ||
    offlineAgenda ||
    offlineYoutube
  }
/>

        <VersiculoCard />

        <EventoCard
          evento={proximoEvento}
          formatarDataEvento={formatarDataEvento}
        />

        <SermaoCard
          video={ultimoVideo}
        />

        <AvisosCard
          avisos={avisos}
        />

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingBottom: 30,
          }}
        >
          <MenuCard
            titulo="Dízimos"
            rota="/dizimos"
          />

          <MenuCard
            titulo="Agenda"
            rota="/agenda"
          />
        </View>
      </RefreshableScroll>
    </Screen>
  );
}
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';

import AvisosCard from '../../components/cards/AvisosCard';
import EventoCard from '../../components/cards/EventoCard';
import Header from '../../components/cards/Header';
import MenuCard from '../../components/cards/MenuCard';
import SermaoCard from '../../components/cards/SermaoCard';
import VersiculoCard from '../../components/cards/VersiculoCard';

import { getAvisos } from '../../services/avisos';
import { getEventos } from '../../services/calendar';
import { getLatestVideos } from '../../services/youtube';

export default function HomeScreen() {
  const [ultimoVideo, setUltimoVideo] = useState<any>(null);
  const [proximoEvento, setProximoEvento] = useState<any>(null);
  const [avisos, setAvisos] = useState<any[]>([]);

  useEffect(() => {
    carregarUltimoVideo();
    carregarProximoEvento();
    carregarAvisos();
  }, []);

  async function carregarUltimoVideo() {
    const videos = await getLatestVideos();

    if (videos.length > 0) {
      setUltimoVideo(videos[0]);
    }
  }

  async function carregarProximoEvento() {
    try {
      const eventos = await getEventos();

      if (eventos.length > 0) {
        setProximoEvento(eventos[0]);
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function carregarAvisos() {
    try {
      const dados = await getAvisos();

      dados.sort((a: any, b: any) => {
        if (a.importante === b.importante) return 0;
        return a.importante ? -1 : 1;
      });

      setAvisos(dados);
    } catch (error) {
      console.log('ERRO AO CARREGAR AVISOS:', error);
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
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: '#ECE8DD',
      }}
      showsVerticalScrollIndicator={false}
    >
      <Header />

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
    </ScrollView>
  );
}
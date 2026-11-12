import { useEffect, useState } from 'react';
import { View } from 'react-native';

import AvisosCard from '../../components/cards/AvisosCard';
import EventoCard from '../../components/cards/EventoCard';
import Header from '../../components/cards/Header';
import MenuCard from '../../components/cards/MenuCard';
import SermaoCard from '../../components/cards/SermaoCard';
import VersiculoCard from '../../components/cards/VersiculoCard';

import RefreshableScroll from '../../components/ui/RefreshableScroll';
import Screen from '../../components/ui/Screen';

import { getAvisos } from '../../services/avisos';
import { getEventos } from '../../services/calendar';
import { getVideos } from '../../services/youtube';


export default function HomeScreen() {
const [ultimoVideo, setUltimoVideo] = useState<any>(null);
const [proximoEvento, setProximoEvento] = useState<any>(null);
const [avisos, setAvisos] = useState<any[]>([]);

const [refreshing, setRefreshing] = useState(false);

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
    const resultado = await getVideos();

    setUltimoVideo(resultado.data[0] ?? null);
  } catch (error) {
    console.error('Erro ao carregar o último vídeo:', error);
  }
}

async function carregarProximoEvento() {
  try {
    const resultado = await getEventos();

    setProximoEvento(resultado.data[0] ?? null);
  } catch (error) {
    console.error('Erro ao carregar o próximo evento:', error);
  }
}

async function carregarAvisos() {
  try {
    const resultado = await getAvisos();

    const dados = resultado.data ?? [];

    dados.sort((a: any, b: any) => {
      if (a.importante === b.importante) return 0;
      return a.importante ? -1 : 1;
    });

    setAvisos(dados);
  } catch (error) {
    console.error('Erro ao carregar os avisos:', error);
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

<VersiculoCard />

<EventoCard
  evento={proximoEvento}
  formatarDataEvento={formatarDataEvento}
/>

<SermaoCard video={ultimoVideo} />

<AvisosCard avisos={avisos} />
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

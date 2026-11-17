# IP Providência

Aplicativo oficial da Igreja Presbiteriana Providência.

> *Deus guia. Deus sustenta. Deus provê.*

## Sobre o projeto

O IP Providência reúne em um só lugar as informações, os conteúdos e os recursos da Igreja Presbiteriana Providência, em Brasília (DF). Membros e visitantes acompanham a vida da igreja pelo celular, e a equipe administra cadastros, avisos e o cuidado pastoral por um portal web.

O projeto tem duas partes:

- **Aplicativo** (Android e iOS), para membros e visitantes.
- **Portal administrativo** (web), para administrador, secretaria, equipe pastoral e tesouraria.

## Funcionalidades

**No aplicativo**

- Início com versículo, avisos e próximos eventos
- Boletim semanal
- Sermões, organizados por série
- Agenda de eventos (Google Calendar)
- Avisos
- Biblioteca
- Hinário Novo Cântico
- Dízimos e ofertas
- Pequenos Grupos: lista dos grupos, próximo encontro e pedido para participar
- Área do membro: perfil, família, ministérios, pedidos de oração e anotações pessoais
- Notificações e lembretes de cultos e encontros
- Como chegar, redes sociais e informações da igreja
- Exclusão da própria conta e dos dados, pelo próprio app

**No portal administrativo**

- Painel com indicadores da comunidade
- Membros, famílias e visitantes
- Visitas pastorais e histórico de membros
- Acompanhamentos e pedidos de oração (somente equipe pastoral)
- Pequenos Grupos e pedidos de participação
- Concessão de funções e permissões
- Solicitações de exclusão de dados (LGPD)
- Registro de auditoria

## Perfis de acesso

| Perfil ou função | Onde | O que acessa |
|---|---|---|
| Visitante | App | Conteúdo público |
| Membro | App | Conteúdo público e área do membro |
| Líder de PG | App | Participantes, pedidos e presença do próprio grupo |
| Secretaria | Portal | Cadastros, famílias, visitas e histórico |
| Pastoral | Portal | Secretaria, mais acompanhamentos e pedidos de oração |
| Tesouraria | Portal | Apenas a área financeira |
| Administrador | Portal | Permissões e conteúdo; não vê acompanhamentos sem a função Pastoral |

As permissões são aplicadas pelas regras do Firestore (`firestore.rules`), e não só pelas telas. Pertencer a um ministério não dá acesso a dados; só as funções concedidas pelo administrador dão.

## Tecnologias

**Aplicativo**

- React Native, Expo SDK 54 e Expo Router
- TypeScript
- Expo Notifications
- EAS Build e EAS Update

**Portal administrativo**

- React, Vite e TypeScript
- Firebase Hosting

**Backend**

- Firebase Authentication
- Cloud Firestore, com regras de segurança por perfil
- Plano gratuito (Spark): o projeto não usa Cloud Functions nem Cloud Storage

## Estrutura do projeto

```
app/             telas do aplicativo (Expo Router)
assets/          imagens e fontes
components/      componentes reutilizáveis
constants/       cores, textos e configurações
hooks/           hooks do React
services/        Firebase, YouTube, Google Calendar e notificações
admin-portal/    portal administrativo (React + Vite)
docs/            documentação e política de privacidade
firestore.rules  regras de segurança do Firestore
firebase.json    configuração do Firebase (Firestore e Hosting)
```

## Como executar

1. Clone o projeto:

```bash
git clone https://github.com/abcttecnologia/ip-providencia-app.git
cd ip-providencia-app
```

2. Crie o arquivo `.env` a partir do modelo e preencha as chaves:

```bash
cp .env.example .env
```

3. Instale as dependências e inicie o aplicativo:

```bash
npm install
npx expo start
```

**Portal administrativo**

```bash
cd admin-portal
cp .env.example .env
npm install
npm run dev
```

O portal abre em `http://localhost:5173`.

> Notificações push não funcionam no Expo Go. Para testá-las, use uma build de desenvolvimento ou de produção.

## Publicação

```bash
# Regras do Firestore
firebase deploy --only firestore:rules

# Portal administrativo
cd admin-portal && npm run build && cd ..
firebase deploy --only hosting

# Aplicativo
eas build --platform all --profile production
eas submit --platform all --latest
```

Use sempre `--only`, para publicar apenas o que mudou.

## Plataformas

- Android
- iOS
- Web (portal administrativo)

## Privacidade e LGPD

O aplicativo trata dados pessoais sensíveis, como a convicção religiosa e informações pastorais. Por isso:

- o cadastro exige o aceite da Política de Privacidade;
- cada perfil vê apenas o que precisa para a sua função;
- o usuário pode excluir a própria conta e os seus dados pelo app;
- as alterações feitas no portal ficam registradas em auditoria.

Política de Privacidade: https://igrejapresbiterianaprovidencia-arch.github.io/boletins-igreja/privacy.html

**Nunca** envie para o repositório arquivos `.env`, chaves de serviço ou dados reais de membros.

## Roadmap

**Versão 1.0**

- ✅ Página inicial
- ✅ Boletim
- ✅ Sermões
- ✅ Agenda e eventos
- ✅ Avisos
- ✅ Biblioteca
- ✅ Hinário Novo Cântico
- ✅ Dízimos e ofertas
- ✅ Política de Privacidade

**Versão 2.0**

-  Login, cadastro e recuperação de senha
-  Área do membro: perfil, família, ministérios, pedidos de oração e anotações
-  Pequenos Grupos
-  Notificações push e lembretes da agenda
-  Portal administrativo web
-  Perfis de acesso e funções
-  Exclusão de conta e anonimização (LGPD)

**Próximas versões**

-  Cadastro de visitantes por QR Code e pela recepção
-  Departamentos e ministérios com aprovação
-  Consentimento dos pais para menores de 18 anos
-  Tesouraria
-  Inscrição em eventos
-  Favoritos no hinário
-  Foto de perfil

## Contato

Igreja Presbiteriana Providência
SHIN CA 07, Lote 23, Lago Norte, Brasília (DF)
ipprovidencia@ipn.org.br

## Licença

Este projeto foi desenvolvido para uso da Igreja Presbiteriana Providência.
A identidade visual, os logotipos e os demais conteúdos pertencem aos seus respectivos titulares.

---

<p align="center">
IP Providência
<br>
Deus guia. Deus sustenta. Deus provê.
</p>

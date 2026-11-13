<p align="center">
  <img src="assets/images/icon.png" width="140" alt="IP Providência"/>
</p>

<h1 align="center">IP Providência</h1>

<p align="center">
Aplicativo oficial da Igreja Presbiteriana Providência.
</p>

<p align="center">
Deus guia. Deus sustenta. Deus provê.
</p>

---

# Sobre o projeto

O **IP Providência** é o aplicativo oficial da Igreja Presbiteriana Providência, desenvolvido para facilitar o acesso às informações, conteúdos e recursos da igreja em um único lugar.

O aplicativo oferece uma experiência simples, rápida e intuitiva, permitindo que membros e visitantes acompanhem a vida da igreja de qualquer lugar.

---

# Funcionalidades

- Boletim semanal
- Sermões
- Agenda de eventos
- Avisos
- Biblioteca
- Hinário Novo Cântico
- Dizimos e Ofertas
- Como chegar
- Redes sociais
- Informações da igreja

---

# Tecnologias

- React Native
- Expo SDK 58
- Expo Router
- TypeScript
- Firebase
- Firebase Cloud Functions
- React Navigation
- Expo Notifications

## Pequenos Grupos

Membros solicitam participação pelo app. Líderes aprovam solicitações, consultam
participantes e pedidos de oração compartilhados e registram presença. A
administração e a secretaria vinculam líderes no portal; a secretaria também
pode aprovar solicitações. A lista do app usa documentos mínimos de nome e foto,
sem dar acesso aos demais dados cadastrais.

As notificações push e a sincronização da lista de participantes dependem das
Cloud Functions em `functions/`. O projeto Firebase precisa estar selecionado
na CLI e habilitado para Functions antes da implantação:

```bash
firebase deploy --only functions
firebase deploy --only firestore:rules
```

---

# Estrutura do projeto

```text
app/
assets/
components/
constants/
hooks/
services/
```

---

# Como executar

Clone o projeto:

```bash
git clone https://github.com/abcttecnologia/ip-providencia-app.git
```

Instale as dependências:

```bash
npm install
```

Inicie o projeto:

```bash
npx expo start
```

---

# Plataformas

- Android
- iOS

---

# Roadmap

## Versão 1.0

- ✅ Página Inicial
- ✅ Boletim
- ✅ Sermões
- ✅ Agenda
- ✅ Eventos
- ✅ Avisos
- ✅ Biblioteca
- ✅ Hinário Novo Cântico
- ✅ Dízimos e Ofertas
- ✅ Política de Privacidade

## Próximas versões

- ⏳ Painel Administrativo
- ⏳ Notificações Push
- ⏳ Área do Membro
- ⏳ Inscrição em Eventos
- ⏳ Favoritos no Hinário
- ⏳ Campanhas
- ⏳ Área Administrativa Web

---

# Licença

Este projeto foi desenvolvido para uso da **Igreja Presbiteriana Providência**.

A identidade visual, logotipos e demais conteúdos pertencem aos seus respectivos titulares.

---

<p align="center">
IP Providência
<br>
Deus guia. Deus sustenta. Deus provê.
</p>
# Portal administrativo

Aplicação web independente para gestão de pessoas, famílias, histórico, visitas e acompanhamentos pastorais da IP Providência.

## Executar localmente

```sh
cd admin-portal
npm install
npm run dev
```

Durante o desenvolvimento, o Vite lê as variáveis `EXPO_PUBLIC_FIREBASE_*` do `.env.local` na raiz do repositório. Para outros ambientes, configure as variáveis `VITE_FIREBASE_*` listadas em `.env.example`.

O acesso exige uma conta existente e ativa na coleção `users`: perfil `ADMINISTRADOR` ou as funções `SECRETARIA`, `PASTORAL` ou `TESOURARIA`. As contas são criadas somente pelo aplicativo; o portal não cria usuários nem contas no Firebase Authentication. Somente administradores ativos podem alterar `perfil`, `ativo` e as funções de outras pessoas. Ninguém pode alterar as próprias funções.

## Dados e permissões

O portal reutiliza as coleções `users` e `familias`. Histórico, visitas e acompanhamentos são armazenados em `historicoMembros`, `visitas` e `acompanhamentos`. A função `TESOURARIA` vê somente a área “Em breve”; acompanhamentos são carregados apenas para `PASTORAL`. As solicitações de exclusão são tratadas separadamente pela Administração e pela Pastoral. As regras correspondentes estão em `../firestore.rules` e precisam ser publicadas no Firebase antes de usar esses recursos.

Registros de histórico podem ser editados quanto ao tipo, data e descrição, mas não excluídos — exceto durante a anonimização LGPD. Visitas e acompanhamentos podem ser atualizados, mas não excluídos. As alterações em usuários, famílias, histórico, visitas e acompanhamentos geram registros de auditoria.

## Verificação de produção

```sh
npm run typecheck
npm run build
```

As regras também podem ser compiladas localmente com o emulador do Firebase
(requer Java 21 ou superior):

```sh
npx firebase-tools emulators:exec --project demo-ip-providencia --only firestore "echo Regras compiladas"
```

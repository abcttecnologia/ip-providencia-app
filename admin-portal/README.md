# Portal administrativo

Aplicação web independente para gestão de pessoas, famílias, histórico, visitas e acompanhamentos pastorais da IP Providência.

## Executar localmente

```sh
cd admin-portal
npm install
npm run dev
```

Durante o desenvolvimento, o Vite lê as variáveis `EXPO_PUBLIC_FIREBASE_*` do `.env.local` na raiz do repositório. Para outros ambientes, configure as variáveis `VITE_FIREBASE_*` listadas em `.env.example`.

O acesso exige uma conta autenticada com perfil `ADMINISTRADOR` e `ativo: true` na coleção `users`. O cadastro de uma pessoa cria uma conta de visitante e envia um e-mail para definir a senha; o provedor de autenticação por e-mail e senha do Firebase precisa estar habilitado.

## Dados e permissões

O portal reutiliza as coleções `users` e `familias`. Histórico, visitas e acompanhamentos são armazenados em `historicoMembros`, `visitas` e `acompanhamentos`. As regras correspondentes estão em `../firestore.rules` e precisam ser publicadas no Firebase antes de usar esses recursos.

Os registros de histórico são imutáveis no portal; visitas e acompanhamentos podem ser atualizados, mas não excluídos. O acesso às novas coleções e a criação de contas pelo portal são restritos a administradores ativos.

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

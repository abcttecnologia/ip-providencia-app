# Modelo de dados do app

Este documento descreve os dados do Firestore para as próximas etapas do app.
As telas ainda não foram criadas. As coleções e documentos existentes são
mantidos: não há migração automática, exclusão ou renomeação neste trabalho.

## Perfis e vínculos

Os únicos valores novos aceitos para `users/{uid}.perfil` são:

- `VISITANTE`
- `MEMBRO`
- `ADMINISTRADOR`

O cadastro cria somente o perfil básico de visitante. O perfil antigo de cada
pessoa não é convertido automaticamente; a administração deve revisar e
promover manualmente quem for membro. Até essa revisão, perfis antigos não
recebem acesso de membro ou administrador pelas novas regras.

O app não procura `users/admin` nem usa campos `role`, `tipo` ou
`permissions` para decidir permissões. O documento `users/admin`, se existir,
permanece intacto e não funciona como conta administrativa. O acesso
administrativo é verificado em `users/{uid}` pelo campo `perfil`.

## Coleções e permissões

| Coleção/documento | Campos principais | Quem lê | Quem grava |
| --- | --- | --- | --- |
| `users/{uid}` | `uid`, `email`, `nome`, `perfil`, `ativo`, `ministerios`, `criadoEm`, `atualizadoEm`; opcionais `telefone`, `endereco`, `dataNascimento`, `estadoCivil`, `membroDesde`, `fotoUrl`, `familiaId`, `pequenoGrupoId`, `salaEbdId` | A própria pessoa lê seu documento; administrador lê todos | Cadastro cria apenas o próprio perfil básico `VISITANTE`; a pessoa altera somente dados pessoais; administrador altera ou exclui o documento |
| `Avisos/{id}` | `titulo`, `descricao`, `data`, `importante`, `categoria`, `publico`, `alvoId`, datas de criação/atualização | Público indicado por `publico` | Administrador cria, edita e exclui |
| `eventos/{id}` | `titulo`, `categoria`, `subtitulo`, `descricao`, `imagem`, `tipo`, `ordem`, `ativo`, `data`, `publico`, `alvoId`, datas de criação/atualização | Público indicado por `publico` | Administrador cria, edita e exclui |
| `biblioteca/{id}` | `titulo`, `descricao`, `url`, `ativo`, `ordem`, `tipo` (`material` ou `sermao`) | Público | Administrador cria, edita e exclui |
| `campanha/casaNova` | Campos atuais do documento, preservados sem alteração | Público | Administrador |
| `config/links` | Campos de links já usados pelo app: `instagram`, `clubeBiblia`, `mapa` e `boletim` | Público | Administrador |
| `versiculo/versiculo` | `titulo`, `texto`, `referencia`, `versao`, `oracao`, `atualizadoEm` | Público | Administrador |
| `pushTokens/{token}` | `uid`, `plataforma`, `ativo`, `atualizadoEm` | Dono do token e administrador | Dono do token e administrador |
| `ministerios/{id}` | `nome`, `descricao`, `ativo`, datas de criação/atualização | Membro vinculado ao ministério e administrador | Administrador |
| `pequenosGrupos/{id}` | `nome`, `descricao`, `bairro`, `diaSemana`, `horario`, `local`, `liderId`, `ativo`, datas de criação/atualização | Lista de grupos ativos é pública; membros veem também seu próprio grupo | Administrador |
| `salasEbd/{id}` | `nome`, `descricao`, `faixaEtaria`, `diaSemana`, `horario`, `ativo`, datas de criação/atualização | Membro vinculado à sala e administrador | Administrador |
| `familias/{id}` | `nome`, `membrosUids`, datas de criação/atualização | Membros vinculados à família e administrador | Administrador |
| `pedidosOracao/{id}` | `autorUid`, `texto`, `compartilhadoComPg`, `pequenoGrupoId`, `status`, datas de criação/atualização | Autor, administrador e membros do PG quando compartilhado com aquele PG | Qualquer pessoa pode criar; autor e administrador podem editar/excluir |
| `anotacoes/{id}` | `uid`, `titulo`, `conteudo`, `referenciaBiblica`, datas de criação/atualização | Somente o dono | Somente o dono |

`campanha/casaNova` é lido como dado opaco pelo serviço atual, então seus
campos existentes não são renomeados nem substituídos por um formato inventado.
Os sermões da tela atual continuam vindo do YouTube. `biblioteca` é um fluxo
separado; nela, novos sermões podem usar `tipo: "sermao"`. A agenda principal
continua usando o Google Calendar; `eventos` é a coleção Firestore da tela de
eventos.

### Perfil `users/{uid}`

O cadastro grava exatamente o conjunto básico abaixo, sem substituir um
documento que já exista:

```text
uid, email, nome, perfil, ativo, ministerios, criadoEm, atualizadoEm
```

O perfil criado é `VISITANTE`, `ativo` é `true` e `ministerios` começa vazio.
Os campos adicionais são opcionais:

```text
telefone, endereco, dataNascimento, estadoCivil, membroDesde, fotoUrl,
familiaId, pequenoGrupoId, salaEbdId
```

O dono pode editar `nome`, `telefone`, `endereco`, `dataNascimento`,
`estadoCivil` e `fotoUrl`. O e-mail é administrado pelo Firebase Authentication.
Somente o administrador pode alterar `perfil`, `ativo`, `ministerios`,
`pequenoGrupoId`, `salaEbdId`, `familiaId` e `membroDesde` (data/hora do
Firestore).

`foto` continua reconhecido apenas como campo legado no tipo TypeScript; não é
gravado pelo fluxo novo nem substitui automaticamente `fotoUrl`.

### Público de avisos e eventos

`publico` aceita exatamente `todos`, `membros`, `ministerio` ou `pg`.
`alvoId` é omitido ou nulo para `todos` e `membros`; para `ministerio` ou `pg`,
contém o ID correspondente. Em avisos, `categoria` aceita `geral`,
`ministerio` ou `comunhao`. A categoria organiza as abas; ela não concede
permissão por si só.

As regras do Firestore não filtram os resultados de uma consulta. Por isso, os
serviços consultam separadamente cada público ao qual a pessoa tem acesso.
As consultas atuais exigem o campo `publico`, inclusive nos documentos que
antes eram públicos por padrão.

### Pedidos de oração

Uma pessoa sem login pode enviar um pedido com `autorUid: null` e sem
compartilhamento com PG. Por decisão de privacidade, ela não pode ler o pedido
depois do envio. Uma pessoa autenticada lê os próprios pedidos; se marcar
compartilhamento com PG, os membros daquele mesmo PG também podem lê-lo.

### Anotações

Cada documento de `anotacoes` contém o UID do dono. Nem mesmo o administrador
tem acesso às anotações de outra pessoa.

## Preparação dos documentos existentes

Antes de publicar as novas regras, acrescente o campo de público aos documentos
atuais. Não altere IDs, não renomeie e não exclua documentos.

1. Abra o Console do Firebase e selecione o projeto `ip-providencia-b003b`.
2. Entre em **Firestore Database → Dados → Avisos**.
3. Abra cada documento existente, escolha **Adicionar campo**, informe o nome
   `publico`, selecione o tipo **string** e grave o valor `todos`.
4. Se um aviso ainda não tiver `categoria`, acrescente também o campo
   `categoria` do tipo **string** com valor `geral`. Preserve a categoria já
   existente quando houver.
5. Repita o processo em **Firestore Database → Dados → eventos**, acrescentando
   `publico` do tipo **string** com valor `todos` em cada documento.
6. Confira se todos os documentos das duas coleções já têm `publico`. Só então
   publique o conteúdo de `firestore.rules`.

O campo `publico` deve existir antes da publicação porque os serviços de
avisos e eventos consultam esse campo. As regras tratam documentos sem ele
como públicos para leituras diretas, mas uma consulta Firestore não encontra
documentos sem o campo quando filtra por `publico == "todos"`.

## Publicação das regras

O arquivo completo é [firestore.rules](../firestore.rules), apontado por
`firebase.json`. Depois de concluir o preenchimento de `publico`, publique as
regras pela aba **Firestore Database → Regras** do Console do Firebase ou, no
terminal do projeto e com o projeto correto selecionado, usando:

```bash
firebase deploy --only firestore:rules
```

Este trabalho não publicou regras nem alterou dados no Firebase. A publicação
deve ser feita somente depois do preenchimento descrito acima.

## Checklist de teste por perfil

### Sem login e `VISITANTE`

- Ler versículo, agenda pública, sermões atuais, avisos `todos` e eventos
  `todos`.
- Ver a lista de pequenos grupos ativos, sem ler dados privados dos membros.
- Criar um pedido de oração; sem login, confirmar que ele não pode ser lido
  posteriormente pelo autor.
- Como `VISITANTE` autenticado, confirmar leitura do próprio perfil e edição
  dos dados pessoais.
- Confirmar que avisos/eventos `membros`, `ministerio` e `pg`, famílias,
  ministérios, salas EBD e anotações de outras pessoas são negados.

### `MEMBRO`

- Ler o próprio perfil e editar dados pessoais, mas não alterar `perfil`,
  `ativo` ou vínculos.
- Ler avisos e eventos `membros`, os do próprio ministério e os do próprio PG;
  confirmar que um alvo diferente é negado.
- Ler apenas a própria família, sala EBD e ministérios vinculados.
- Criar e ler seus pedidos de oração; compartilhar com o próprio PG e testar
  leitura por outro membro desse PG.
- Criar e ler anotações próprias; confirmar que outro usuário não consegue
  consultá-las.

### `ADMINISTRADOR`

- Confirmar que o documento de perfil administrativo é `users/{uid}`, com
  `perfil: "ADMINISTRADOR"` e `ativo: true`.
- Ler e editar avisos, eventos, materiais/sermões da biblioteca e versículo.
- Promover um visitante manualmente e vincular ministério, PG, sala EBD e
  família pelo perfil do usuário.
- Confirmar que não existe leitura administrativa de anotações alheias.

Para validar as permissões, use contas de teste distintas e não promova a conta
real de produção apenas para executar o checklist.

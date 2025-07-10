# Backend - Sistema de Gerenciamento de Atividades

Este projeto consiste em uma API RESTful desenvolvida com Node.js, Express e Prisma ORM, criada para gerenciar atividades e grupos de usuários, com sistema de níveis, conquistas e experiência.

## Funcionalidades Principais

### Autenticação e Gerenciamento de Usuários

- **Registro de Usuário**: Criação de contas com nome, email, senha e CPF
- **Login**: Autenticação via JWT
- **Perfil de Usuário**: Visualização e edição de dados pessoais
- **Avatar**: Upload e atualização de imagens de perfil
- **Exclusão Lógica**: Possibilidade de desativar conta (soft delete)

### Sistema de Progressão

- **Experiência (XP)**: Usuários ganham XP por realizar ações no sistema
- **Níveis**: Progressão automática baseada no acúmulo de XP
- **Conquistas**: Badges concedidas por ações específicas:
  - Primeiro Check-in
  - Criador de Atividade
  - Conclusão de Atividade
  - Subida de Nível
  - Personalização de Perfil

### Gerenciamento de Atividades

- **Criação de Atividades**: Com título, descrição, data, localização e imagem
- **Tipos de Atividades**: Categorização por tipo (esporte, educação, etc.)
- **Atividades Privadas/Públicas**: Controle de visibilidade e aprovação de participantes
- **Gerenciamento de Participantes**: Visualização, aprovação/rejeição de solicitações
- **Check-in**: Confirmação de presença via código
- **Conclusão de Atividades**: Marcação de atividades como concluídas
- **Busca Geolocalizada**: Encontrar atividades próximas por raio de distância

## Tecnologias Utilizadas

- **Node.js**: Ambiente de execução JavaScript
- **Express**: Framework web
- **TypeScript**: Linguagem de programação tipada
- **Prisma ORM**: ORM para comunicação com o banco de dados
- **PostgreSQL**: Banco de dados relacional
- **JWT**: Autenticação e autorização
- **Bcrypt**: Criptografia de senhas
- **Swagger**: Documentação da API
- **Zod**: Validação de dados
- **LocalStack/AWS S3**: Armazenamento de imagens

## Configuração do Ambiente

### Pré-requisitos

- Node.js (versão 16+)
- PostgreSQL
- Docker (opcional, para LocalStack)

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public"
JWT_SECRET="seu_segredo_jwt"
PORT=3000
S3_BUCKET="nome-do-bucket"
AWS_ACCESS_KEY_ID="sua_access_key"
AWS_SECRET_ACCESS_KEY="sua_secret_key"
AWS_REGION="sa-east-1"
```

### Instalação

1. Clone o repositório:

```bash
git clone https://github.com/seu-usuario/seu-repositorio.git
cd seu-repositorio
```

2. Instale as dependências:

```bash
npm install
```

3. Configure o banco de dados:

```bash
npx prisma migrate dev
```

4. Construa o projeto:

```bash
npm run build
```

5. Inicie o servidor:

```bash
npm run start
```

### Passos para rodar com Docker:

1. Build da imagem:

```bash
docker compose build
```

2. Subir os containers:

```bash
docker compose up
```

## Uso da API

### Documentação

A documentação completa da API está disponível em `/api-docs` quando o servidor está em execução.

### Principais Endpoints

#### Autenticação

- `POST /auth/register`: Registrar um novo usuário
- `POST /auth/login`: Autenticar usuário

#### Usuários

- `GET /users/:id`: Obter dados do usuário
- `PUT /users/:id`: Atualizar dados do usuário
- `DELETE /users/:id`: Desativar usuário (soft delete)
- `PUT /users/avatar`: Atualizar avatar do usuário
- `GET /users/:id/preferences`: Obter preferências do usuário
- `PUT /users/:id/preferences`: Atualizar preferências do usuário
- `GET /users/:id/achievements`: Obter conquistas do usuário
- `GET /users/:id/statistics`: Obter estatísticas do usuário (XP, nível)

#### Atividades

- `GET /atividades/types`: Listar todos os tipos de atividades
- `POST /atividades/types`: Criar uma nova atividade
- `GET /atividades`: Listar atividades (com paginação)
- `GET /atividades/all`: Listar todas as atividades (sem paginação)
- `GET /atividades/participant/all`: Obter todas as atividades que o usuário participa
- `GET /atividades/user/participant`: Listar histórico de participações (com paginação)
- `GET /atividades/user/creator/all`: Listar todas as atividades criadas pelo usuário
- `GET /atividades/user/creator`: Listar atividades criadas pelo usuário (com paginação)
- `GET /atividades/:id`: Obter atividade específica
- `PUT /atividades/:id`: Atualizar atividade
- `DELETE /atividades/:id`: Excluir atividade
- `GET /atividades/:id/participants`: Listar participantes de uma atividade
- `POST /atividades/:id/subscribe`: Inscrever-se em uma atividade
- `DELETE /atividades/:id/unsubscribe`: Cancelar participação em uma atividade
- `PUT /atividades/:id/approve`: Aprovar/rejeitar solicitação de participante
- `PUT /atividades/:id/check-in`: Fazer check-in com código de confirmação
- `POST /atividades/:id/confirm-presence`: Confirmar presença
- `PUT /atividades/:id/conclude`: Concluir atividade (alternativo)
- `POST /atividades/:id/complete`: Concluir atividade

## Sistema de XP e Níveis

Os usuários ganham XP pelas seguintes ações:

- Criar atividade: 50 XP
- Confirmar presença: 30 XP
- Criar tipo de atividade: 20 XP
- Completar atividade: Pontuação variável

A progressão de níveis é automática baseada na quantidade de XP acumulada.

## Testes

O projeto contém testes unitários e de integração para garantir o funcionamento correto das funcionalidades.

Para executar os testes:

```bash
npm test
```

## Estrutura do Projeto

```
├── prisma/              # Modelos do banco de dados
├── src/
│   ├── controllers/     # Controladores da API
│   ├── middlewares/     # Middlewares personalizados
│   ├── repository/      # Acesso ao banco de dados
│   ├── services/        # Lógica de negócio
│   ├── types/           # Definições de tipos TypeScript
│   ├── utils/           # Utilitários
│   └── index.ts         # Ponto de entrada
├── tests/               # Testes automatizados
└── package.json
```

## Licença

Este projeto está sob a licença MIT.

# DevTrack

Uma ferramenta abrangente de gerenciamento de projetos e tarefas para desenvolvedores, projetada para ser executada diretamente no terminal. O DevTrack começa como um script simples usando Node.js readline e evolui para uma aplicação CLI profissional com Commander.js, uma API REST local, integração com GitHub, estruturas de dados avançadas e está preparado para publicação no npm.

## Funcionalidades

- **Gerenciamento de Tarefas**: Adicionar, listar, atualizar e rastrear tarefas com prioridades, status e tags
- **Organização de Projetos**: Agrupar tarefas em projetos para melhor organização
- **Interface CLI**: Interface interativa baseada em terminal para acesso fácil
- **API REST**: Servidor local para acesso programático
- **Integração com GitHub**: Conectar com GitHub para rastreamento de repositórios
- **Estruturas de Dados**: Implementa várias estruturas de dados (Listas Encadeadas, Grafos, Cache LRU, etc.) para manipulação eficiente de dados
- **Funcionalidade de Exportação**: Exportar dados em vários formatos
- **Agendamento**: Agendamento integrado de tarefas e notificações
- **Monitoramento de Performance**: Rastrear e analisar métricas de performance

## Instalação

### Pré-requisitos

- Node.js >= 18.0.0

### Instalar a partir do código-fonte

1. Clone o repositório:

   ```bash
   git clone <repository-url>
   cd devTrack
   ```

2. Instale as dependências:

   ```bash
   npm install
   ```

3. Execute a aplicação:
   ```bash
   npm start
   # ou
   node cli.js
   ```

### Instalar via npm (quando publicado)

```bash
npm install -g devtrack
```

## Uso

### Uso Básico da CLI

Execute a CLI e siga o menu interativo:

```bash
npm start
```

Opções disponíveis:

1. Adicionar uma nova tarefa
2. Listar tarefas
3. Atualizar status da tarefa
4. Sair

### Comandos Avançados

O DevTrack suporta argumentos de linha de comando para uso avançado (quando totalmente implementado):

```bash
devtrack add --title "Nova Tarefa" --priority high --tags feature,urgent
devtrack list --filter '{"status": "pending"}'
devtrack update --id <task-id> --status completed
```

## API

O DevTrack inclui um servidor de API REST local para acesso programático. Inicie o servidor e acesse os endpoints em `http://localhost:3000`.

### Endpoints

- `GET /tasks` - Listar todas as tarefas
- `POST /tasks` - Criar uma nova tarefa
- `PUT /tasks/:id` - Atualizar uma tarefa
- `GET /projects` - Listar todos os projetos

## Estrutura do Projeto

```
devTrack/
├── cli.js                 # Ponto de entrada principal da CLI
├── src/
│   ├── commands/          # Implementações de comandos CLI
│   ├── server/            # Servidor da API REST
│   ├── services/          # Serviços de lógica de negócio
│   ├── storage/           # Camada de persistência de dados
│   ├── structures/        # Implementações de estruturas de dados
│   └── utils/             # Funções utilitárias
├── data/                  # Arquivos de armazenamento de dados
├── exports/               # Funcionalidade de exportação
├── plugins/               # Sistema de plugins
├── scripts/               # Scripts de build e teste
└── workers/               # Workers em segundo plano
```

## Desenvolvimento

### Scripts

- `npm start` - Executar a aplicação CLI
- `npm run lint` - Verificar o código com lint

### Contribuição

1. Faça um fork do repositório
2. Crie uma branch de funcionalidade
3. Faça suas alterações
4. Envie um pull request

## Licença

Licença ISC

## Versão

1.0.0

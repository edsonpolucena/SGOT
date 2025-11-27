# 📊 SGOT - Sistema de Gestão de Obrigações Tributárias

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-green.svg)
![License](https://img.shields.io/badge/license-MIT-yellow.svg)
![Status](https://img.shields.io/badge/status-em%20desenvolvimento-orange.svg)

<div align="center">
  <img src="https://via.placeholder.com/800x400/1e293b/ffffff?text=SGOT+-+Sistema+de+Gestão+de+Obrigações+Tributárias" alt="SGOT Banner" />
</div>

---

## 📑 Índice

- [Descrição do Projeto](#-descrição-do-projeto)
- [Status do Projeto](#-status-do-projeto)
- [Funcionalidades](#-funcionalidades)
- [Demonstração da Aplicação](#-demonstração-da-aplicação)
- [Acesso ao Projeto](#-acesso-ao-projeto)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Como Usar](#-como-usar)
- [Testes](#-testes)
- [Deploy](#-deploy)
- [Pessoas Contribuidoras](#-pessoas-contribuidoras)
- [Pessoas Desenvolvedoras do Projeto](#-pessoas-desenvolvedoras-do-projeto)
- [Licença](#-licença)

---

## 📝 Descrição do Projeto

O **SGOT (Sistema de Gestão de Obrigações Tributárias)** é uma plataforma web completa desenvolvida para auxiliar empresas e escritórios de contabilidade no gerenciamento eficiente de obrigações tributárias. 

O sistema oferece uma solução centralizada para:
- **Controle de prazos** de vencimento de impostos
- **Gestão de documentos** tributários
- **Monitoramento** de cumprimento de obrigações
- **Alertas automáticos** de vencimentos próximos
- **Relatórios analíticos** e dashboards interativos
- **Calendário fiscal** personalizado por tipo de imposto
- **Matriz de status** de impostos por empresa


---

## 🚀 Status do Projeto

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-orange.svg)
![CI/CD](https://img.shields.io/badge/CI%2FCD-ativo-success.svg)
![Coverage](https://img.shields.io/badge/coverage-%3E80%25-green.svg)

O projeto está em **desenvolvimento ativo** com as seguintes características:

- ✅ **Backend completo** com API RESTful
- ✅ **Frontend responsivo** com React
- ✅ **Sistema de autenticação** e autorização por roles
- ✅ **Integração com AWS S3** para armazenamento de arquivos
- ✅ **Notificações por email** via AWS SES
- ✅ **Monitoramento** com New Relic APM
- ✅ **CI/CD automatizado** com GitHub Actions
- ✅ **Testes automatizados** (Jest + Vitest)
- 🔄 **Melhorias contínuas** e novas funcionalidades

---

## ✨ Funcionalidades

### 🔐 Autenticação e Autorização
- Login seguro com JWT
- Recuperação de senha por email
- Sistema de roles (Super Admin, Contabilidade, Cliente)
- Proteção de rotas baseada em permissões

### 📋 Gestão de Obrigações
- Cadastro e edição de obrigações tributárias
- Upload de documentos (integração com AWS S3)
- Controle de status (Pendente, Postado, Não Aplicável)
- Filtros avançados e busca
- Histórico completo de alterações

### 📊 Dashboard e Analytics
- Dashboard principal com visão geral
- Estatísticas por tipo de imposto
- Taxa de cumprimento de prazos
- Gráficos interativos (Chart.js, Recharts)
- Alertas de vencimentos próximos e atrasados

### 🏢 Gestão de Empresas
- Cadastro de empresas/clientes
- Perfis fiscais personalizados
- Calendário de vencimentos por empresa
- Relatórios de impostos por período

### 📅 Calendário Fiscal
- Configuração de dias de vencimento por tipo de imposto
- Alertas de vencimentos próximos (3, 2, 1 dia)

### 📧 Notificações
- Email automático ao criar nova obrigação
- Lembretes de vencimentos próximos
- Notificações de documentos não visualizados
- Integração com AWS SES

### 🔍 Auditoria
- Log completo de todas as ações do sistema
- Rastreamento de alterações
- Histórico de uploads e downloads
- Filtros por usuário, ação e data

### 👥 Gestão de Usuários
- Cadastro e edição de usuários
- Atribuição de roles e permissões
- Controle de acesso granular

---

## 🎬 Demonstração da Aplicação

### Tela de Login
Interface moderna e intuitiva com autenticação segura.

### Dashboard Principal
- Visão geral de obrigações
- Estatísticas em tempo real
- Gráficos de cumprimento de prazos
- Lista de impostos atrasados e próximos ao vencimento

### Gestão de Obrigações
- Tabela completa com filtros
- Formulário de cadastro/edição
- Upload de documentos
- Visualização de histórico

### Calendário Fiscal
- Visualização mensal de vencimentos
- Destaque para obrigações pendentes
- Filtros por empresa e tipo de imposto

---

## 🌐 Acesso ao Projeto

### Produção
🔗 **URL:** [https://www.sgot.com.br](https://www.sgot.com.br)

### Desenvolvimento Local
```bash
# Clone o repositório
git clone https://github.com/edsonpolucena/SGOT.git

# Entre na pasta do projeto
cd SGOT

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

O frontend estará disponível em: `http://localhost:5173`  
O backend estará disponível em: `http://localhost:3333`

---

## 🛠 Tecnologias Utilizadas

### Frontend
- **React 18.3.1** - Biblioteca JavaScript para construção de interfaces
- **Vite 5.4.0** - Build tool e dev server
- **React Router DOM 6.26.1** - Roteamento
- **Styled Components 6.1.19** - CSS-in-JS
- **Axios 1.7.2** - Cliente HTTP
- **Chart.js 4.5.0** - Gráficos e visualizações
- **Recharts 3.2.1** - Biblioteca de gráficos React
- **React Icons 5.5.0** - Ícones
- **Vitest 2.0.5** - Framework de testes

### Backend
- **Node.js 20+** - Runtime JavaScript
- **Express 4.19.2** - Framework web
- **Prisma 5.16.1** - ORM e gerenciamento de banco de dados
- **PostgreSQL** - Banco de dados relacional
- **JWT (jsonwebtoken 9.0.2)** - Autenticação
- **Joi 18.0.1** - Validação de dados
- **Bcrypt 6.0.0** - Hash de senhas
- **Multer 2.0.2** - Upload de arquivos
- **Node Cron 4.2.1** - Agendamento de tarefas
- **Jest 29.7.0** - Framework de testes
- **New Relic 13.6.4** - Monitoramento APM

### Infraestrutura e DevOps
- **Docker** - Containerização
- **Docker Compose** - Orquestração de containers
- **AWS S3** - Armazenamento de arquivos
- **AWS SES** - Envio de emails
- **Nginx** - Servidor web e reverse proxy
- **PM2** - Gerenciador de processos Node.js
- **GitHub Actions** - CI/CD
- **Certbot** - Certificados SSL/TLS

### Ferramentas de Desenvolvimento
- **ESLint** - Linter JavaScript
- **Prettier** - Formatador de código
- **SonarCloud** - Análise de qualidade de código
- **Git** - Controle de versão

---

## 📁 Estrutura do Projeto

```
SGOT/
├── apps/
│   ├── backend/          # API Backend (Node.js + Express)
│   │   ├── src/
│   │   │   ├── modules/   # Módulos da aplicação
│   │   │   ├── middleware/# Middlewares
│   │   │   ├── services/  # Serviços (email, S3)
│   │   │   └── utils/     # Utilitários
│   │   ├── prisma/        # Schema e migrations
│   │   └── __tests__/     # Testes do backend
│   │
│   └── frontend/          # Frontend (React + Vite)
│       ├── src/
│       │   ├── modules/   # Módulos da aplicação
│       │   ├── shared/    # Componentes compartilhados
│       │   ├── routes/    # Rotas protegidas
│       │   └── styles/   # Estilos globais
│       └── __tests__/     # Testes do frontend
│
├── infra/                 # Configurações de infraestrutura
│   └── compose/           # Docker Compose
│
├── .github/
│   └── workflows/         # GitHub Actions CI/CD
│
└── ecosystem.config.js    # Configuração PM2
```

---

## 📋 Pré-requisitos

Antes de começar, você precisa ter instalado:

- **Node.js** (versão 20 ou superior)
- **npm** ou **yarn**
- **Docker** e **Docker Compose** (para banco de dados)
- **Git**

---

## 💻 Instalação

### 1. Clone o repositório
```bash
git clone https://github.com/edsonpolucena/SGOT.git
cd SGOT
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente

#### Backend (`apps/backend/.env`)
```env
DATABASE_URL="postgresql://username:password@localhost:5432/sgot"
JWT_SECRET="your-super-secret-jwt-key-here"
PORT=3333
NODE_ENV="development"

# AWS S3
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="sa-east-1"
S3_BUCKET_NAME="your-s3-bucket-name"

# AWS SES (opcional)
AWS_SES_REGION="sa-east-1"
AWS_SES_FROM_EMAIL="noreply@sgot.com.br"
```

#### Frontend (`apps/frontend/.env`)
```env
VITE_API_URL=http://localhost:3333
```

### 4. Inicie o banco de dados
```bash
npm run docker:start
```

### 5. Execute as migrations
```bash
cd apps/backend
npx prisma migrate dev
npx prisma generate
```

### 6. (Opcional) Popule o banco com dados de exemplo
```bash
cd apps/backend
npx prisma db seed
```

### 7. Inicie a aplicação
```bash
# Na raiz do projeto
npm run dev
```

---

## 🚀 Como Usar

### Desenvolvimento

```bash
# Iniciar backend e frontend simultaneamente
npm run dev

# Apenas backend
npm run backend

# Apenas frontend
npm run frontend
```

### Produção

```bash
# Backend
cd apps/backend
npm run start:prod

# Frontend
cd apps/frontend
npm run build
npm run preview
```

### Com Docker

```bash
# Iniciar banco de dados
docker compose -f infra/compose/docker-compose.yml up -d
```

---

## 🧪 Testes

### Backend
```bash
cd apps/backend
npm test              # Executar testes
npm run test:watch    # Modo watch
npm run test:coverage # Com cobertura
```

### Frontend
```bash
cd apps/frontend
npm test              # Executar testes
npm run test:ui       # Interface interativa
npm run test:ci       # Com cobertura
```

### Todos os testes
```bash
npm run test:all
```

---

## 🚢 Deploy

O projeto está configurado com CI/CD automatizado via GitHub Actions. 

### Deploy Manual

1. **Backend (EC2)**
   ```bash
   # No servidor
   cd /home/ubuntu/SGOT
   git pull origin main
   cd apps/backend
   npm install
   npx prisma generate
   npx prisma migrate deploy
   pm2 restart backend-api
   ```

2. **Frontend**
   ```bash
   cd apps/frontend
   npm install
   npm run build
   # Copiar dist/ para servidor Nginx
   ```

### CI/CD Automatizado

O workflow GitHub Actions executa automaticamente ao fazer push para `main`:
- Instala dependências
- Executa testes
- Gera Prisma Client
- Aplica migrations
- Faz build do frontend
- Reinicia serviços

---

## 👥 Pessoas Contribuidoras

Este projeto está aberto para contribuições! Se você deseja contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Contribuidores

- [Edson Polucena](https://github.com/edsonpolucena) - Desenvolvedor Principal

---

## 👨‍💻 Pessoas Desenvolvedoras do Projeto

### Desenvolvedor Principal
- **Edson Borges Polucena**
  - GitHub: [@edsonpolucena](https://github.com/edsonpolucena)
  - Email: edsonpolucena@hotmail.com

---

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

```
MIT License

Copyright (c) 2025 SGOT

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 📞 Contato

Para dúvidas, sugestões ou problemas, abra uma [issue](https://github.com/edsonpolucena/SGOT/issues) no GitHub.

---

<div align="center">
  <p>Desenvolvido para facilitar a gestão tributária</p>
  <p>© 2025 SGOT - Sistema de Gestão de Obrigações Tributárias</p>
</div>





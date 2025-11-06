# 🗺️ SGOT - Roadmap de Funcionalidades

## 📊 PRIORIDADE 1: Sistema de Controle de Documentos Enviados

### 🎯 Objetivo
Ter controle **completo** de quais impostos foram postados/não postados por empresa, incluindo situações onde o imposto "não se aplica" no mês.

### 🔧 Mudanças Necessárias

#### 1. **Banco de Dados - Nova Estrutura**

```prisma
// apps/backend/prisma/schema.prisma

enum ObligationStatus {
  PENDING          // Criada, aguardando arquivo
  POSTED           // Arquivo anexado
  NOT_APPLICABLE   // Não se aplica este mês (nova)
  OVERDUE          // Vencida sem arquivo
}

model Obligation {
  id              String            @id @default(cuid())
  companyId       String
  company         Company           @relation(fields: [companyId], references: [id])
  taxType         String            // ICMS, ISS, IRPJ, etc
  referenceMonth  String            // "2025-01"
  dueDate         DateTime
  description     String?
  status          ObligationStatus  @default(PENDING)
  files           ObligationFile[]
  views           DocumentView[]
  createdBy       String
  creator         User              @relation("CreatedObligations", fields: [createdBy], references: [id])
  notApplicableReason String?       // Motivo quando NOT_APPLICABLE
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@index([companyId, referenceMonth])
  @@index([status])
  @@index([dueDate])
}

// Nova tabela para definir quais impostos cada empresa deve ter
model CompanyTaxProfile {
  id          String   @id @default(cuid())
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id])
  taxType     String   // ICMS, ISS, IRPJ, CSLL, PIS/COFINS, etc
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  
  @@unique([companyId, taxType])
}
```

#### 2. **Backend - Novos Endpoints**

##### **Gerenciamento de Perfil Fiscal da Empresa**
```javascript
// apps/backend/src/modules/company/company-tax-profile.routes.js

GET    /api/companies/:companyId/tax-profile
  // Retorna lista de impostos que a empresa deve ter
  Response: [
    { taxType: "ICMS", isActive: true },
    { taxType: "ISS", isActive: true },
    { taxType: "IRPJ", isActive: false }
  ]

POST   /api/companies/:companyId/tax-profile
  Body: { taxType: "ICMS" }
  // Adiciona um tipo de imposto ao perfil da empresa

DELETE /api/companies/:companyId/tax-profile/:taxType
  // Remove um tipo de imposto do perfil
```

##### **Obrigações com Status**
```javascript
// apps/backend/src/modules/obligations/obligation.controller.js

POST   /api/obligations
  Body: {
    companyId: "EMP002",
    taxType: "ICMS",
    referenceMonth: "2025-01",
    dueDate: "2025-01-20",
    status: "NOT_APPLICABLE", // NOVO: pode criar já como não aplicável
    notApplicableReason: "Empresa sem movimento no mês"
  }

PATCH  /api/obligations/:id/mark-not-applicable
  Body: { reason: "Empresa sem movimento" }
  // Marca obrigação como não aplicável (sem precisar anexar arquivo)

GET    /api/obligations/monthly-control
  Query: ?companyId=EMP002&month=2025-01
  Response: {
    companyId: "EMP002",
    companyName: "Cliente XYZ",
    month: "2025-01",
    expectedTaxes: ["ICMS", "ISS", "IRPJ", "CSLL", "PIS"],
    obligations: [
      { taxType: "ICMS", status: "POSTED", dueDate: "2025-01-20" },
      { taxType: "ISS", status: "PENDING", dueDate: "2025-01-15" },
      { taxType: "IRPJ", status: "NOT_APPLICABLE", reason: "..." },
      { taxType: "CSLL", status: "PENDING", dueDate: "2025-01-30" }
    ],
    missing: ["PIS"], // Impostos que ainda não têm obrigação criada
    completionRate: 0.8 // 4 de 5 foram tratados
  }
```

##### **Dashboard de Controle**
```javascript
// apps/backend/src/modules/analytics/analytics.controller.js

GET    /api/analytics/document-control-dashboard
  Query: ?month=2025-01
  Response: {
    month: "2025-01",
    companies: [
      {
        companyId: "EMP002",
        companyName: "Cliente A",
        expectedTaxes: 5,
        posted: 3,
        notApplicable: 1,
        pending: 1,
        missing: 0,
        completionRate: 1.0, // 100% (todos tratados)
        status: "COMPLETE"
      },
      {
        companyId: "EMP003",
        companyName: "Cliente B",
        expectedTaxes: 5,
        posted: 2,
        notApplicable: 0,
        pending: 2,
        missing: 1, // Falta criar obrigação do PIS
        completionRate: 0.8, // 80% (falta 1)
        status: "INCOMPLETE"
      }
    ],
    summary: {
      totalCompanies: 50,
      completeCompanies: 35,
      incompleteCompanies: 15,
      totalObligations: 250,
      posted: 180,
      notApplicable: 30,
      pending: 40,
      overallCompletion: 0.84
    }
  }

GET    /api/analytics/pending-documents-alert
  Query: ?daysUntilDue=2
  Response: {
    urgentDocuments: [
      {
        companyId: "EMP003",
        companyName: "Cliente B",
        taxType: "ISS",
        dueDate: "2025-01-15",
        daysRemaining: 1,
        status: "PENDING"
      }
    ]
  }
```

#### 3. **Frontend - Novos Componentes**

##### **Formulário de Obrigação Modificado**
```jsx
// apps/frontend/src/modules/obligations/view/ObligationForm.jsx

// Adicionar botão "Marcar como Não Aplicável"
<FormSection>
  <Button onClick={handleUploadFile}>
    📎 Anexar Arquivo
  </Button>
  
  <Button 
    variant="secondary" 
    onClick={() => setShowNotApplicableModal(true)}
  >
    🚫 Este Imposto Não Se Aplica Este Mês
  </Button>
</FormSection>

// Modal para justificar
<Modal show={showNotApplicableModal}>
  <ModalTitle>Por que não se aplica?</ModalTitle>
  <TextArea 
    value={notApplicableReason}
    onChange={setNotApplicableReason}
    placeholder="Ex: Empresa sem movimento no mês"
  />
  <Button onClick={handleMarkNotApplicable}>
    Confirmar
  </Button>
</Modal>
```

##### **Dashboard de Controle de Documentos**
```jsx
// apps/frontend/src/modules/document-control/view/DocumentControlDashboard.jsx

import React, { useState, useEffect } from 'react';

const DocumentControlDashboard = () => {
  const [month, setMonth] = useState('2025-01');
  const [data, setData] = useState(null);

  return (
    <Container>
      <Header>
        <Title>📊 Controle de Documentos Mensais</Title>
        <MonthPicker value={month} onChange={setMonth} />
      </Header>

      <SummaryCards>
        <Card color="green">
          <CardValue>{data.summary.completeCompanies}</CardValue>
          <CardLabel>Empresas Completas</CardLabel>
        </Card>
        <Card color="orange">
          <CardValue>{data.summary.incompleteCompanies}</CardValue>
          <CardLabel>Empresas Pendentes</CardLabel>
        </Card>
        <Card color="blue">
          <CardValue>{(data.summary.overallCompletion * 100).toFixed(1)}%</CardValue>
          <CardLabel>Taxa de Conclusão</CardLabel>
        </Card>
      </SummaryCards>

      <CompanyList>
        {data.companies.map(company => (
          <CompanyCard key={company.companyId} complete={company.status === 'COMPLETE'}>
            <CompanyHeader>
              <CompanyName>{company.companyName}</CompanyName>
              <Badge status={company.status}>
                {company.status === 'COMPLETE' ? '✅ Completo' : '⏳ Pendente'}
              </Badge>
            </CompanyHeader>
            
            <ProgressBar 
              value={company.completionRate * 100} 
              color={company.completionRate === 1 ? 'green' : 'orange'}
            />
            
            <Stats>
              <Stat color="green">
                ✅ Postados: {company.posted}
              </Stat>
              <Stat color="gray">
                🚫 Não Aplicável: {company.notApplicable}
              </Stat>
              <Stat color="orange">
                ⏳ Pendentes: {company.pending}
              </Stat>
              {company.missing > 0 && (
                <Stat color="red">
                  ❌ Faltam Criar: {company.missing}
                </Stat>
              )}
            </Stats>

            <Button onClick={() => navigate(`/company/${company.companyId}/obligations?month=${month}`)}>
              Ver Detalhes
            </Button>
          </CompanyCard>
        ))}
      </CompanyList>
    </Container>
  );
};
```

##### **Tela de Status por Empresa/Imposto**
```jsx
// apps/frontend/src/modules/document-control/view/CompanyTaxMatrix.jsx

const CompanyTaxMatrix = () => {
  // Tabela matricial: Empresas x Impostos
  
  return (
    <Table>
      <thead>
        <tr>
          <th>Empresa</th>
          <th>ICMS</th>
          <th>ISS</th>
          <th>IRPJ</th>
          <th>CSLL</th>
          <th>PIS/COFINS</th>
        </tr>
      </thead>
      <tbody>
        {companies.map(company => (
          <tr key={company.id}>
            <td>{company.name}</td>
            <td><StatusIcon status={company.taxes.ICMS} /></td>
            <td><StatusIcon status={company.taxes.ISS} /></td>
            <td><StatusIcon status={company.taxes.IRPJ} /></td>
            <td><StatusIcon status={company.taxes.CSLL} /></td>
            <td><StatusIcon status={company.taxes.PIS} /></td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

// StatusIcon: ✅ (POSTED), 🚫 (NOT_APPLICABLE), ⏳ (PENDING), ❌ (MISSING)
```

---

## 🔐 PRIORIDADE 2: Sistema de Recuperação de Senha

### 🎯 Melhor Abordagem
**✅ Enviar link com token temporário** (padrão da indústria)
**❌ NÃO enviar senha por email** (inseguro)

### 🔧 Implementação

#### 1. **Banco de Dados**
```prisma
model PasswordResetToken {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  token     String   @unique
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())
  
  @@index([token])
  @@index([userId])
}
```

#### 2. **Backend - Endpoints**
```javascript
POST   /api/auth/forgot-password
  Body: { email: "user@example.com" }
  // 1. Verifica se usuário existe
  // 2. Gera token único (crypto.randomBytes)
  // 3. Salva token com expiração de 1 hora
  // 4. Envia email com link
  Response: { message: "Email enviado" }

POST   /api/auth/reset-password
  Body: { 
    token: "abc123...",
    newPassword: "novasenha123"
  }
  // 1. Valida token (existe, não expirou, não foi usado)
  // 2. Hash da nova senha
  // 3. Atualiza senha do usuário
  // 4. Marca token como usado
  Response: { message: "Senha alterada com sucesso" }

GET    /api/auth/validate-reset-token/:token
  // Verifica se token é válido (para UI)
  Response: { valid: true, email: "u***@example.com" }
```

#### 3. **Frontend - Componentes**
```jsx
// apps/frontend/src/modules/auth/view/ForgotPassword.jsx
// Tela simples: campo de email + botão "Enviar Link"

// apps/frontend/src/modules/auth/view/ResetPassword.jsx
// Lê token da URL (?token=abc123)
// 2 campos: nova senha + confirmar senha
// Validações: mínimo 8 caracteres, confirmação igual
```

#### 4. **Email Template**
```javascript
// apps/backend/src/templates/password-reset.html

<div style="font-family: Arial;">
  <h2>🔐 Recuperação de Senha - SGOT</h2>
  <p>Olá, {userName}!</p>
  <p>Recebemos uma solicitação para redefinir sua senha.</p>
  <p>
    <a href="{resetLink}" style="...">
      Redefinir Senha
    </a>
  </p>
  <p><small>Este link expira em 1 hora.</small></p>
  <p><small>Se você não solicitou, ignore este email.</small></p>
</div>
```

---

## 📧 PRIORIDADE 3: Sistema de Notificações por Email

### 📬 Email ao Cadastrar Obrigação
```javascript
// apps/backend/src/modules/obligations/obligation.service.js

async function createObligation(data, userId) {
  const obligation = await prisma.obligation.create({ ... });
  
  // Buscar usuários da empresa que devem ser notificados
  const companyUsers = await prisma.user.findMany({
    where: {
      companyId: data.companyId,
      role: { in: ['CLIENT_ADMIN', 'CLIENT_NORMAL'] },
      status: 'ACTIVE'
    }
  });

  // Enviar email para cada um
  for (const user of companyUsers) {
    await emailService.sendNewDocumentNotification({
      to: user.email,
      userName: user.name,
      taxType: data.taxType,
      dueDate: data.dueDate,
      companyName: obligation.company.name
    });
  }

  return obligation;
}
```

### ⏰ Email Automático (3 dias antes, não visualizado)

#### **Cron Job**
```javascript
// apps/backend/src/jobs/notification.job.js

const cron = require('node-cron');

// Roda todos os dias às 9h da manhã
cron.schedule('0 9 * * *', async () => {
  console.log('🔔 Verificando documentos não visualizados...');
  
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  
  // Buscar obrigações que:
  // 1. Vencem em 3 dias
  // 2. Ainda não foram visualizadas
  // 3. Têm arquivo anexado (POSTED)
  const obligations = await prisma.obligation.findMany({
    where: {
      dueDate: {
        gte: new Date(),
        lte: threeDaysFromNow
      },
      status: 'POSTED',
      views: {
        none: {} // Nenhuma visualização
      }
    },
    include: {
      company: {
        include: {
          users: {
            where: { 
              role: { in: ['CLIENT_ADMIN', 'CLIENT_NORMAL'] },
              status: 'ACTIVE'
            }
          }
        }
      }
    }
  });

  for (const obligation of obligations) {
    for (const user of obligation.company.users) {
      await emailService.sendDocumentReminderEmail({
        to: user.email,
        userName: user.name,
        taxType: obligation.taxType,
        dueDate: obligation.dueDate,
        daysRemaining: 3,
        documentLink: `${process.env.FRONTEND_URL}/obligations/${obligation.id}`
      });
    }
  }
  
  console.log(`✅ ${obligations.length} lembretes enviados`);
});

module.exports = { startNotificationJob: () => cron };
```

#### **Inicializar Cron**
```javascript
// apps/backend/src/app.js

const { startNotificationJob } = require('./jobs/notification.job');

// Após configurar todas as rotas:
if (process.env.NODE_ENV === 'production') {
  startNotificationJob();
  console.log('✅ Cron job de notificações iniciado');
}
```

### 📨 Email Templates Adicionais
```javascript
// apps/backend/src/services/email.service.js

async sendDocumentReminderEmail({ to, userName, taxType, dueDate, daysRemaining, documentLink }) {
  const subject = `⏰ Lembrete: ${taxType} vence em ${daysRemaining} dias`;
  
  const html = `
    <div>
      <h2>⏰ Documento Pendente de Visualização</h2>
      <p>Olá, ${userName}!</p>
      <p>O documento <strong>${taxType}</strong> foi postado e ainda não foi visualizado.</p>
      <p><strong>Vencimento:</strong> ${formatDate(dueDate)} (em ${daysRemaining} dias)</p>
      <p>
        <a href="${documentLink}">Ver Documento</a>
      </p>
    </div>
  `;
  
  return this.sendEmail({ to, subject, html });
}

async sendUnviewedDocumentAlert({ to, userName, obligations }) {
  const subject = `🚨 Documentos não visualizados em 2 dias`;
  
  const html = `
    <div>
      <h2>🚨 Alerta de Documentos Não Visualizados</h2>
      <p>Olá, ${userName}!</p>
      <p>Os seguintes documentos foram postados há 2 dias e ainda não foram visualizados:</p>
      <ul>
        ${obligations.map(o => `
          <li>
            <strong>${o.taxType}</strong> - Vence em ${formatDate(o.dueDate)}
            <br><a href="${process.env.FRONTEND_URL}/obligations/${o.id}">Ver Agora</a>
          </li>
        `).join('')}
      </ul>
    </div>
  `;
  
  return this.sendEmail({ to, subject, html });
}
```

---

## 📊 PRIORIDADE 4: Dashboards e Totalizadores

### 🎯 Já Implementado (Melhorar)
- ✅ `getMonthlyVariationByTax()` - Variação mês a mês
- ✅ `getMonthlySummary()` - Resumo mensal

### 🆕 Novos Dashboards

#### **Dashboard por Tipo de Imposto**
```javascript
// GET /api/analytics/tax-type-dashboard?taxType=ICMS&month=2025-01

Response: {
  taxType: "ICMS",
  month: "2025-01",
  totalCompanies: 50, // Empresas que devem ter ICMS
  posted: 35,
  notApplicable: 5,
  pending: 10,
  completionRate: 0.8,
  companies: [
    { name: "Empresa A", status: "POSTED" },
    { name: "Empresa B", status: "PENDING" },
    ...
  ]
}
```

#### **Relatório de Variação para Clientes**
```javascript
// GET /api/analytics/client-monthly-report?companyId=EMP002&startMonth=2024-01&endMonth=2025-01

Response: {
  companyName: "Cliente XYZ",
  period: { start: "2024-01", end: "2025-01" },
  monthlyData: [
    {
      month: "2024-01",
      totalObligations: 5,
      posted: 5,
      onTime: 5,
      late: 0
    },
    {
      month: "2024-02",
      totalObligations: 5,
      posted: 4,
      onTime: 3,
      late: 1
    },
    ...
  ],
  summary: {
    avgCompletionRate: 0.92,
    totalDocuments: 60,
    onTimePercentage: 0.85
  }
}
```

---

## 🚨 PRIORIDADE 5: Sistema de Alertas

### 🔔 Alertas no Frontend

#### **Badge de Notificações**
```jsx
// apps/frontend/src/shared/ui/NotificationBadge.jsx

const NotificationBadge = () => {
  const { data } = useQuery('/api/notifications/alerts');
  
  return (
    <Badge count={data.totalAlerts}>
      <BellIcon />
    </Badge>
  );
};
```

#### **Painel de Alertas**
```jsx
// apps/frontend/src/modules/notifications/view/AlertsPanel.jsx

const AlertsPanel = () => {
  return (
    <Container>
      <AlertSection type="urgent">
        <Title>🚨 Urgente - Vence em 2 dias</Title>
        {urgentDocs.map(doc => (
          <AlertCard key={doc.id}>
            <CompanyName>{doc.companyName}</CompanyName>
            <TaxType>{doc.taxType}</TaxType>
            <DueDate>{doc.dueDate}</DueDate>
            <Action onClick={() => navigate(`/obligations/${doc.id}`)}>
              Anexar Arquivo
            </Action>
          </AlertCard>
        ))}
      </AlertSection>

      <AlertSection type="warning">
        <Title>👁️ Não visualizados (2+ dias)</Title>
        {unviewedDocs.map(doc => (
          <AlertCard key={doc.id}>
            <CompanyName>{doc.companyName}</CompanyName>
            <TaxType>{doc.taxType}</TaxType>
            <PostedDate>{doc.createdAt}</PostedDate>
            <Action onClick={() => navigate(`/obligations/${doc.id}`)}>
              Visualizar
            </Action>
          </AlertCard>
        ))}
      </AlertSection>
    </Container>
  );
};
```

---

## 📅 CRONOGRAMA DE IMPLEMENTAÇÃO

### **FASE 1: Controle de Documentos (3-4 dias)**
1. ✅ Migration: `ObligationStatus`, `CompanyTaxProfile`
2. ✅ Backend: Endpoints de controle
3. ✅ Frontend: Dashboard de controle
4. ✅ Frontend: Botão "Não Aplicável" no formulário
5. ✅ Testes

### **FASE 2: Recuperação de Senha (1 dia)**
1. ✅ Migration: `PasswordResetToken`
2. ✅ Backend: Endpoints de reset
3. ✅ Frontend: Telas de forgot/reset
4. ✅ Email template
5. ✅ Testes

### **FASE 3: Notificações por Email (2 dias)**
1. ✅ Email ao criar obrigação
2. ✅ Cron job de lembretes
3. ✅ Email de alertas
4. ✅ Templates HTML bonitos
5. ✅ Testes

### **FASE 4: Dashboards e Relatórios (2 dias)**
1. ✅ Dashboard por tipo de imposto
2. ✅ Relatório mensal para clientes
3. ✅ Componentes visuais (gráficos)
4. ✅ Testes

### **FASE 5: Sistema de Alertas (1 dia)**
1. ✅ Badge de notificações
2. ✅ Painel de alertas
3. ✅ Integração com emails
4. ✅ Testes

### **FASE 6: Matriz de Status (1 dia)**
1. ✅ Tela Empresa x Impostos
2. ✅ Filtros e exportação
3. ✅ Testes

---

## ✅ PRÓXIMOS PASSOS

1. **AGORA**: Aguardar CI do PR de testes terminar
2. **DEPOIS**: Mergear PR de testes para `main`
3. **IMPLEMENTAÇÃO**: Seguir fases acima em ordem

---

## 📝 NOTAS TÉCNICAS

### Tipos de Impostos Sugeridos
```javascript
const TAX_TYPES = [
  'ICMS',
  'ISS',
  'IRPJ',
  'CSLL',
  'PIS/COFINS',
  'IPI',
  'INSS',
  'FGTS',
  'SIMPLES_NACIONAL'
];
```

### Status da Obrigação
- `PENDING`: Criada, aguardando arquivo
- `POSTED`: Arquivo anexado, disponível para cliente
- `NOT_APPLICABLE`: Não se aplica este mês (com justificativa)
- `OVERDUE`: Vencida sem arquivo

### Lógica de Completude
```javascript
// Uma empresa está "completa" quando:
completionRate = (posted + notApplicable) / expectedTaxes
status = completionRate === 1 ? 'COMPLETE' : 'INCOMPLETE'
```

---

**Estimativa Total: 9-11 dias de desenvolvimento**


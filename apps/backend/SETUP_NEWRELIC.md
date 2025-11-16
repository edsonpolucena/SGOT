# 🔍 New Relic APM - Guia de Configuração

## ✅ O que foi instalado automaticamente:

1. ✅ Pacote `newrelic` instalado (130 pacotes adicionados)
2. ✅ Arquivo `newrelic.js` criado na raiz do backend
3. ✅ Integração no `src/server.js` configurada
4. ✅ Script `start:prod` adicionado ao `package.json`
5. ✅ Variáveis adicionadas ao `env.example`

---

## 📝 PASSO FINAL: Adicionar ao arquivo `.env`

**Abra o arquivo `apps/backend/.env` e adicione estas linhas:**

```env
# ===================================
# NEW RELIC APM - Monitoramento
# ===================================
NEW_RELIC_LICENSE_KEY=fda5c6cf7c4dddde520d840df6bbf7dbFFFFNRAL
NEW_RELIC_APP_NAME=SGOT-Backend
NEW_RELIC_ENABLED=true
NEW_RELIC_LOG_LEVEL=info
NEW_RELIC_AI_MONITORING_ENABLED=false
```

---

## 🚀 Como usar:

### **Desenvolvimento (SEM New Relic):**
```bash
npm run dev:server
```

### **Produção (COM New Relic):**
```bash
npm run start:prod
```

Ou defina manualmente:
```bash
NEW_RELIC_ENABLED=true node src/server.js
```

---

## 📊 Verificar se está funcionando:

Quando o servidor iniciar **COM** New Relic ativado, você verá:

```
🔍 New Relic APM ativado
API on http://localhost:3001
```

---

## 🌐 Acessar Dashboard do New Relic:

1. Vá para: https://one.newrelic.com
2. Faça login na sua conta
3. No menu, procure por **APM & Services**
4. Você verá **SGOT-Backend** listado
5. Clique para ver métricas em tempo real:
   - Response time
   - Throughput
   - Error rate
   - Transações
   - Database queries
   - Logs

---

## ⚙️ Configurações Avançadas:

### Alterar nome da aplicação:
```env
NEW_RELIC_APP_NAME=SGOT-Production
```

### Desativar temporariamente:
```env
NEW_RELIC_ENABLED=false
```

### Nível de log (debug para troubleshooting):
```env
NEW_RELIC_LOG_LEVEL=debug
```

### Ativar monitoramento de IA (se usar OpenAI, etc):
```env
NEW_RELIC_AI_MONITORING_ENABLED=true
```

---

## 📋 O que o New Relic monitora automaticamente:

✅ **Requests HTTP** (GET, POST, PUT, DELETE)  
✅ **Response time** de cada endpoint  
✅ **Queries do Prisma** (tempo de execução)  
✅ **Erros e exceptions**  
✅ **Uso de memória**  
✅ **CPU**  
✅ **Logs da aplicação**  
✅ **Distributed tracing** (se tiver microserviços)  

---

## 🔧 Arquivo de configuração:

Todas as configurações estão em: `apps/backend/newrelic.js`

Você pode personalizar:
- Distributed tracing
- Logging level
- Headers a serem capturados/excluídos
- AI monitoring
- Application logging

---

## 🧪 Testar em desenvolvimento:

```bash
# No terminal, defina a variável e inicie o servidor
cd apps/backend
$env:NEW_RELIC_ENABLED="true"; npm run dev:server

# Você verá: "🔍 New Relic APM ativado"
```

---

## ⚠️ IMPORTANTE:

- **Não commitepara o git** o arquivo `.env` (já está no `.gitignore`)
- A chave de licença é sensível, mantenha em segredo
- Em testes (`npm test`), o New Relic é automaticamente desabilitado
- O agente New Relic **DEVE** ser o primeiro `require()` no `server.js` (já configurado)

---

## 🎯 Próximos passos:

1. ✅ Adicionar variáveis ao `.env` (ver acima)
2. ✅ Iniciar servidor: `npm run start:prod`
3. ✅ Fazer algumas requisições na API
4. ✅ Aguardar 2-3 minutos
5. ✅ Acessar https://one.newrelic.com
6. ✅ Ver dados em tempo real! 📊

---

**Configuração completa! 🎉**



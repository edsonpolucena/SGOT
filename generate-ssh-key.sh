#!/bin/bash

# Script para gerar chave SSH para deploy GitHub

echo "🔑 Gerando chave SSH ED25519 para deploy GitHub..."
echo ""

# Gerar chave ED25519 (mais segura e recomendada)
ssh-keygen -t ed25519 -C "github-deploy-key-$(date +%Y%m%d)" -f ~/.ssh/github_deploy_key -N ""

echo ""
echo "✅ Chave gerada com sucesso!"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "📋 CHAVE PÚBLICA (copie TUDO abaixo para o GitHub):"
echo "═══════════════════════════════════════════════════════════════"
cat ~/.ssh/github_deploy_key.pub
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📋 CHAVE PRIVADA (copie TUDO abaixo para o GitHub Secret EC2_SSH_KEY):"
echo "═══════════════════════════════════════════════════════════════"
cat ~/.ssh/github_deploy_key
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   1. Adicione a chave PÚBLICA no GitHub → Settings → Deploy keys"
echo "   2. Adicione a chave PRIVADA no GitHub → Settings → Secrets → EC2_SSH_KEY"
echo "   3. Adicione a chave PÚBLICA no servidor EC2 (~/.ssh/authorized_keys)"
echo ""

# Perguntar se deseja adicionar automaticamente ao authorized_keys
read -p "Deseja adicionar esta chave pública ao ~/.ssh/authorized_keys? (s/n): " add_to_auth
if [[ "$add_to_auth" == "s" || "$add_to_auth" == "S" ]]; then
    cat ~/.ssh/github_deploy_key.pub >> ~/.ssh/authorized_keys
    chmod 600 ~/.ssh/authorized_keys
    echo "✅ Chave pública adicionada ao authorized_keys!"
fi

echo ""
echo "✨ Concluído!"


#!/bin/bash

# Script para obter IPs do GitHub Actions e configurar Security Group

echo "🔍 Obtendo IPs do GitHub Actions..."

# Obter IPs do GitHub Actions via API
curl -s https://api.github.com/meta | grep -E '"actions"' | head -20

echo ""
echo "📋 Lista completa de IPs do GitHub Actions:"
curl -s https://api.github.com/meta | jq -r '.actions[]' 2>/dev/null || curl -s https://api.github.com/meta | grep -o '"actions":\[.*\]' | grep -o '[0-9.]*/[0-9]*' | sort -u





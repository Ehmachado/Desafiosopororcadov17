#!/bin/bash

# Script para fazer build e testar localmente antes do deploy

set -e

echo "🏗️  Fazendo build da aplicação..."
cd /app/frontend

echo "📦 Instalando dependências..."
yarn install

echo "🔨 Building..."
CI=false yarn build

echo "✅ Build concluído com sucesso!"
echo ""
echo "📂 Arquivos gerados em: /app/frontend/build/"
echo ""
echo "Para testar localmente, execute:"
echo "  cd /app/frontend/build"
echo "  python3 -m http.server 8080"
echo "  Acesse: http://localhost:8080"
echo ""
echo "Para fazer deploy no GitHub Pages:"
echo "  cd /app/frontend"
echo "  yarn deploy"

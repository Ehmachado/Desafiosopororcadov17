#!/bin/bash

# Script para fazer deploy no GitHub Pages usando branch gh-pages

set -e

echo "🚀 Iniciando deploy para GitHub Pages..."
echo ""

# Verifica se está em um repositório git
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Erro: Este diretório não é um repositório git!"
    echo "Execute: git init && git remote add origin SEU_REPOSITORIO_URL"
    exit 1
fi

# Verifica se tem remote configurado
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "❌ Erro: Nenhum remote 'origin' configurado!"
    echo "Execute: git remote add origin SEU_REPOSITORIO_URL"
    exit 1
fi

echo "📦 Instalando dependências..."
cd /app/frontend
yarn install

echo ""
echo "🔨 Fazendo build da aplicação..."
CI=false yarn build

echo ""
echo "📤 Fazendo deploy para branch gh-pages..."
yarn gh-pages -d build -m "Deploy $(date '+%Y-%m-%d %H:%M:%S')"

echo ""
echo "✅ Deploy concluído com sucesso!"
echo ""
echo "⚙️  Configure o GitHub Pages:"
echo "   1. Acesse: Settings → Pages"
echo "   2. Source: Deploy from a branch"
echo "   3. Branch: gh-pages → /root"
echo "   4. Save"
echo ""
echo "🌐 Sua aplicação estará disponível em:"
REPO_URL=$(git remote get-url origin)
REPO_NAME=$(basename -s .git $REPO_URL)
USER_NAME=$(basename $(dirname $REPO_URL))
echo "   https://${USER_NAME}.github.io/${REPO_NAME}/"

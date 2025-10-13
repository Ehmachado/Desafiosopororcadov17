#!/bin/bash

# ============================================
# SCRIPT DEFINITIVO PARA GITHUB PAGES
# ============================================

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 DEPLOY PARA GITHUB PAGES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verifica se está no diretório correto
if [ ! -d "/app/frontend" ]; then
    echo "❌ Erro: Execute este script da pasta /app"
    exit 1
fi

# Passo 1: Build da aplicação
echo "📦 Passo 1/4: Fazendo build da aplicação..."
cd /app/frontend
yarn install --silent
CI=false yarn build

if [ ! -f "build/index.html" ]; then
    echo "❌ Erro: Build falhou - index.html não foi criado"
    exit 1
fi
echo "✅ Build concluído"
echo ""

# Passo 2: Cria pasta docs com os arquivos buildados
echo "📁 Passo 2/4: Copiando arquivos para /docs..."
cd /app
rm -rf docs
cp -r frontend/build docs

if [ ! -f "docs/index.html" ]; then
    echo "❌ Erro: Falha ao copiar arquivos"
    exit 1
fi
echo "✅ Arquivos copiados para /docs"
echo ""

# Passo 3: Commit e push
echo "💾 Passo 3/4: Fazendo commit..."

# Verifica se é um repositório git
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "⚠️  Não é um repositório git. Inicializando..."
    git init
    git branch -M main
fi

# Verifica se tem remote
if ! git remote get-url origin > /dev/null 2>&1; then
    echo ""
    echo "❌ Remote 'origin' não configurado!"
    echo ""
    echo "Execute primeiro:"
    echo "  git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git"
    echo ""
    exit 1
fi

# Add e commit
git add docs/
git add .
git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M:%S')" || echo "Nada para commitar"

echo "✅ Commit realizado"
echo ""

# Passo 4: Push
echo "🌐 Passo 4/4: Enviando para GitHub..."
git push origin main

echo "✅ Push concluído!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DEPLOY CONCLUÍDO COM SUCESSO!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 PRÓXIMO PASSO (IMPORTANTE):"
echo ""
echo "   Configure o GitHub Pages:"
echo "   1. Acesse seu repositório no GitHub"
echo "   2. Vá em: Settings → Pages"
echo "   3. Em 'Build and deployment':"
echo "      - Source: Deploy from a branch"
echo "      - Branch: main"
echo "      - Folder: /docs"
echo "   4. Clique Save"
echo ""
echo "🌐 Sua aplicação estará em:"
REPO_URL=$(git remote get-url origin)
REPO_NAME=$(basename -s .git "$REPO_URL")
USER_NAME=$(echo "$REPO_URL" | cut -d'/' -f4)
echo "   https://${USER_NAME}.github.io/${REPO_NAME}/"
echo ""
echo "⏱️  Aguarde 1-2 minutos após configurar o GitHub Pages"
echo ""

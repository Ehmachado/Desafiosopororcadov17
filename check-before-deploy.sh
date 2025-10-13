#!/bin/bash

# Script para verificar se tudo está pronto para deploy

echo "🔍 Verificando configuração para deploy no GitHub Pages..."
echo ""

ERRORS=0

# 1. Verifica se é um repositório git
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Não é um repositório git"
    echo "   Execute: git init"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ Repositório git configurado"
fi

# 2. Verifica se tem remote origin
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "❌ Remote 'origin' não configurado"
    echo "   Execute: git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git"
    ERRORS=$((ERRORS + 1))
else
    REPO_URL=$(git remote get-url origin)
    echo "✅ Remote configurado: $REPO_URL"
fi

# 3. Verifica se package.json tem homepage
if grep -q '"homepage"' /app/frontend/package.json; then
    HOMEPAGE=$(grep '"homepage"' /app/frontend/package.json | cut -d'"' -f4)
    echo "✅ Homepage configurado: $HOMEPAGE"
else
    echo "❌ Homepage não configurado no package.json"
    ERRORS=$((ERRORS + 1))
fi

# 4. Verifica se gh-pages está instalado
if grep -q '"gh-pages"' /app/frontend/package.json; then
    echo "✅ gh-pages instalado"
else
    echo "❌ gh-pages não instalado"
    echo "   Execute: cd frontend && yarn add -D gh-pages"
    ERRORS=$((ERRORS + 1))
fi

# 5. Verifica se .gitignore tem /build
if grep -q '/build' /app/.gitignore; then
    echo "✅ .gitignore configurado (ignora /build)"
else
    echo "⚠️  Warning: /build não está no .gitignore"
fi

# 6. Verifica se node_modules existe
if [ -d "/app/frontend/node_modules" ]; then
    echo "✅ Dependências instaladas"
else
    echo "❌ Dependências não instaladas"
    echo "   Execute: cd frontend && yarn install"
    ERRORS=$((ERRORS + 1))
fi

# 7. Testa se o build funciona
echo ""
echo "🔨 Testando build..."
cd /app/frontend
if CI=false yarn build > /tmp/build-test.log 2>&1; then
    echo "✅ Build funciona corretamente"
    
    # Verifica se index.html foi criado
    if [ -f "build/index.html" ]; then
        echo "✅ index.html gerado com sucesso"
    else
        echo "❌ index.html não foi gerado"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "❌ Build falhou"
    echo "   Veja os logs em: /tmp/build-test.log"
    ERRORS=$((ERRORS + 1))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
    echo "✅ TUDO PRONTO PARA DEPLOY!"
    echo ""
    echo "Execute agora:"
    echo "  ./deploy-gh-pages.sh"
    echo ""
    echo "Depois configure no GitHub:"
    echo "  Settings → Pages → Deploy from a branch → gh-pages → /root"
else
    echo "❌ Encontrados $ERRORS erro(s)"
    echo ""
    echo "Corrija os erros acima antes de fazer deploy"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

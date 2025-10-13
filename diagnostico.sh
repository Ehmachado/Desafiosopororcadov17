#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 DIAGNÓSTICO GITHUB PAGES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ERRORS=0

# 1. Pasta docs
echo "1️⃣  Pasta /docs existe?"
if [ -d "/app/docs" ]; then
    echo "   ✅ SIM"
    FILE_COUNT=$(ls -1 /app/docs | wc -l)
    echo "   📁 $FILE_COUNT arquivos/pastas"
else
    echo "   ❌ NÃO - Execute: ./deploy-para-github.sh"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 2. index.html
echo "2️⃣  index.html existe?"
if [ -f "/app/docs/index.html" ]; then
    echo "   ✅ SIM"
    SIZE=$(stat -f%z "/app/docs/index.html" 2>/dev/null || stat -c%s "/app/docs/index.html" 2>/dev/null)
    echo "   📄 Tamanho: $SIZE bytes"
else
    echo "   ❌ NÃO"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 3. .nojekyll
echo "3️⃣  .nojekyll existe?"
if [ -f "/app/docs/.nojekyll" ]; then
    echo "   ✅ SIM (evita processamento Jekyll)"
else
    echo "   ⚠️  NÃO - Será criado no próximo deploy"
fi
echo ""

# 4. Arquivos estáticos
echo "4️⃣  Arquivos JavaScript?"
JS_FILES=$(ls /app/docs/static/js/*.js 2>/dev/null | wc -l)
if [ "$JS_FILES" -gt 0 ]; then
    echo "   ✅ SIM ($JS_FILES arquivos)"
else
    echo "   ❌ NÃO"
    ERRORS=$((ERRORS + 1))
fi
echo ""

echo "5️⃣  Arquivos CSS?"
CSS_FILES=$(ls /app/docs/static/css/*.css 2>/dev/null | wc -l)
if [ "$CSS_FILES" -gt 0 ]; then
    echo "   ✅ SIM ($CSS_FILES arquivos)"
else
    echo "   ❌ NÃO"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 5. Git configurado
echo "6️⃣  Git configurado?"
if git rev-parse --git-dir > /dev/null 2>&1; then
    echo "   ✅ SIM"
else
    echo "   ❌ NÃO - Execute: git init"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 6. Remote configurado
echo "7️⃣  Remote configurado?"
if git remote get-url origin > /dev/null 2>&1; then
    REPO_URL=$(git remote get-url origin)
    echo "   ✅ SIM"
    echo "   🔗 $REPO_URL"
    
    # Extrai usuário e repo
    REPO_NAME=$(basename -s .git "$REPO_URL")
    if [[ "$REPO_URL" =~ github.com[:/]([^/]+) ]]; then
        USER_NAME="${BASH_REMATCH[1]}"
        echo ""
        echo "   🌐 URL esperada:"
        echo "      https://${USER_NAME}.github.io/${REPO_NAME}/"
    fi
else
    echo "   ❌ NÃO"
    echo "   Execute: git remote add origin https://github.com/USUARIO/REPO.git"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 7. HashRouter
echo "8️⃣  HashRouter configurado?"
if grep -q "HashRouter" /app/frontend/src/App.js; then
    echo "   ✅ SIM (melhor para GitHub Pages)"
else
    echo "   ⚠️  NÃO - Usando BrowserRouter"
    echo "   (Pode causar problemas no GitHub Pages)"
fi
echo ""

# 8. Homepage no package.json
echo "9️⃣  Homepage configurado?"
if grep -q '"homepage"' /app/frontend/package.json; then
    HOMEPAGE=$(grep '"homepage"' /app/frontend/package.json | cut -d'"' -f4)
    echo "   ✅ SIM: $HOMEPAGE"
else
    echo "   ❌ NÃO"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 9. Teste de build local
echo "🔟 Testando arquivos buildados..."
if [ -f "/app/docs/index.html" ]; then
    # Verifica se tem os scripts
    if grep -q "static/js/main" /app/docs/index.html; then
        echo "   ✅ index.html referencia JavaScript"
    else
        echo "   ❌ index.html NÃO referencia JavaScript"
        ERRORS=$((ERRORS + 1))
    fi
    
    if grep -q "static/css/main" /app/docs/index.html; then
        echo "   ✅ index.html referencia CSS"
    else
        echo "   ❌ index.html NÃO referencia CSS"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "   ⏭️  Pulado (index.html não existe)"
fi
echo ""

# Resumo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
    echo "✅ DIAGNÓSTICO OK!"
    echo ""
    echo "📋 PRÓXIMOS PASSOS:"
    echo ""
    echo "1. Se ainda não fez, execute:"
    echo "   ./deploy-para-github.sh"
    echo ""
    echo "2. No GitHub, configure Pages:"
    echo "   Settings → Pages → Deploy from a branch"
    echo "   Branch: main | Folder: /docs"
    echo ""
    echo "3. Aguarde 2-3 minutos"
    echo ""
    echo "4. Limpe cache do navegador (Ctrl+Shift+Del)"
    echo ""
    echo "5. Acesse em aba anônima"
else
    echo "❌ ENCONTRADOS $ERRORS PROBLEMA(S)"
    echo ""
    echo "Corrija os problemas acima antes de fazer deploy"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 🔧 Corrigir Página em Branco - GitHub Pages

Se sua aplicação aparece em branco no GitHub Pages, siga este guia.

---

## ✅ Correções Aplicadas no Código

Já foram aplicadas as seguintes correções:

1. ✅ **HashRouter** ao invés de BrowserRouter (melhor para GitHub Pages)
2. ✅ **Arquivo .nojekyll** criado (evita processamento Jekyll)
3. ✅ **homepage: "."** configurado (caminhos relativos)

---

## 🔍 Diagnóstico Passo a Passo

### 1. Verifique se os arquivos estão no lugar certo

```bash
# Execute no seu terminal
ls -la /app/docs/

# Deve mostrar:
# - index.html
# - .nojekyll
# - static/
```

Se `/docs` não existe, execute:
```bash
./deploy-para-github.sh
```

---

### 2. Verifique a configuração do GitHub Pages

**No seu repositório do GitHub:**

1. Vá em **Settings** → **Pages**
2. Verifique:
   - ✅ Source: **Deploy from a branch**
   - ✅ Branch: **main**
   - ✅ Folder: **/docs** (NÃO `/root` ou `/`)
3. Se não estiver assim, corrija e clique **Save**
4. Aguarde 1-2 minutos

---

### 3. Verifique o Console do Navegador

1. Acesse seu site no GitHub Pages
2. Abra o **Console do navegador** (F12)
3. Vá na aba **Console**
4. Procure por erros em vermelho

**Erros comuns:**

#### Erro: "Failed to load resource: net::ERR_FILE_NOT_FOUND"
**Causa:** Arquivos JS/CSS não encontrados

**Solução:**
```bash
# Refaça o deploy
cd /app
./deploy-para-github.sh
```

#### Erro: "Uncaught SyntaxError" ou "Unexpected token"
**Causa:** Build corrompido

**Solução:**
```bash
# Limpe e rebuilde
cd /app/frontend
rm -rf build node_modules
yarn install
cd /app
./deploy-para-github.sh
```

---

### 4. Teste Localmente Primeiro

Antes de fazer deploy, teste se funciona localmente:

```bash
cd /app/docs
python3 -m http.server 8000
```

Abra: http://localhost:8000

**Se funciona local mas não no GitHub:**
- Problema é na configuração do GitHub Pages
- Verifique Settings → Pages

**Se não funciona nem local:**
- Problema é no build
- Veja logs: `cd /app/frontend && yarn build`

---

### 5. Verifique se o Repositório é Público

GitHub Pages gratuito só funciona em repositórios **públicos**.

**Verificar:**
1. Vá no seu repositório
2. Settings → General
3. "Danger Zone" → Veja se diz "Public" ou "Private"

**Se for Private:**
- Torne público: Settings → General → Change visibility → Make public
- OU upgrade para GitHub Pro (Pages em repos privados)

---

### 6. Limpe o Cache do Navegador

Às vezes o navegador cacheia a página em branco.

**Como limpar:**
- Chrome/Edge: Ctrl + Shift + Delete → Limpar cache
- Firefox: Ctrl + Shift + Delete → Cache
- Safari: Cmd + Option + E

**Ou teste em:**
- Aba anônima/privada
- Navegador diferente
- Dispositivo diferente

---

### 7. Verifique a URL Correta

A URL deve ser:
```
https://SEU_USUARIO.github.io/SEU_REPOSITORIO/
```

**NÃO deve ser:**
- ❌ https://github.com/SEU_USUARIO/SEU_REPO (página do repositório)
- ❌ https://SEU_USUARIO.github.io/ (sem o nome do repo)

**Como descobrir a URL correta:**
1. Settings → Pages
2. Veja "Your site is live at..."

---

## 🛠️ Script de Diagnóstico

Execute este comando para diagnóstico completo:

```bash
cd /app

echo "=== DIAGNÓSTICO GITHUB PAGES ==="
echo ""
echo "1. Pasta /docs existe?"
ls -la docs/ 2>/dev/null && echo "✅ SIM" || echo "❌ NÃO - Execute ./deploy-para-github.sh"
echo ""
echo "2. index.html existe?"
test -f docs/index.html && echo "✅ SIM" || echo "❌ NÃO"
echo ""
echo "3. .nojekyll existe?"
test -f docs/.nojekyll && echo "✅ SIM" || echo "❌ NÃO"
echo ""
echo "4. Arquivos JS existem?"
ls docs/static/js/*.js 2>/dev/null && echo "✅ SIM" || echo "❌ NÃO"
echo ""
echo "5. Remote configurado?"
git remote -v 2>/dev/null && echo "✅ SIM" || echo "❌ NÃO"
echo ""
echo "6. HashRouter configurado?"
grep -q "HashRouter" /app/frontend/src/App.js && echo "✅ SIM" || echo "❌ NÃO"
```

---

## 🔄 Solução Completa do Zero

Se nada funcionar, faça do zero:

```bash
cd /app

# 1. Limpe tudo
rm -rf docs frontend/build frontend/node_modules

# 2. Reinstale
cd frontend
yarn install

# 3. Build limpo
cd /app
./deploy-para-github.sh

# 4. No GitHub: Settings → Pages
#    - Source: Deploy from a branch
#    - Branch: main
#    - Folder: /docs
#    - Save

# 5. Aguarde 2-3 minutos

# 6. Limpe cache do navegador (Ctrl+Shift+Del)

# 7. Acesse em aba anônima
```

---

## 🎯 Checklist Final

Antes de considerar que está funcionando:

- [ ] `/docs` existe e tem index.html
- [ ] `.nojekyll` existe em `/docs`
- [ ] GitHub Pages: main → /docs
- [ ] Repositório é público (ou tem GitHub Pro)
- [ ] Aguardou 2-3 minutos após configurar
- [ ] Limpou cache do navegador
- [ ] Testou em aba anônima
- [ ] Console do navegador sem erros (F12)
- [ ] URL está correta: `https://USUARIO.github.io/REPO/`

---

## 🆘 Ainda Não Funciona?

**Teste este HTML básico:**

Crie `/app/docs/test.html`:
```html
<!DOCTYPE html>
<html>
<head><title>Teste</title></head>
<body>
<h1>Teste OK!</h1>
<p>Se você vê isto, GitHub Pages está funcionando!</p>
</body>
</html>
```

Acesse: `https://SEU_USUARIO.github.io/SEU_REPO/test.html`

**Se test.html funciona mas index.html não:**
- Problema é no build React
- Execute: `cd /app/frontend && yarn build` e veja erros

**Se test.html também não funciona:**
- Problema é configuração do GitHub Pages
- Verifique Settings → Pages → /docs

---

## 📝 Informações Úteis

**Ver logs do GitHub Pages:**
1. Vá em **Actions** no repositório
2. Se tiver workflows rodando, veja os logs
3. (Mas se usar Deploy from branch, não terá Actions)

**Forçar atualização:**
```bash
# Faça uma mudança mínima
echo "<!-- update $(date) -->" >> /app/docs/index.html
git add docs/
git commit -m "Force update"
git push
```

**Tempo de propagação:**
- Primeira vez: 2-5 minutos
- Atualizações: 30-90 segundos

---

## ✅ Resumo das Correções

Já aplicado no código:

1. ✅ `HashRouter` ao invés de `BrowserRouter`
2. ✅ `.nojekyll` criado automaticamente
3. ✅ `homepage: "."` configurado
4. ✅ Script de deploy atualizado

**Execute:**
```bash
./deploy-para-github.sh
```

**Configure:**
Settings → Pages → main → /docs

**Aguarde:**
2-3 minutos

**Teste:**
Em aba anônima, com cache limpo

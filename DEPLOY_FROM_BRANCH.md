# 🚀 Deploy no GitHub Pages - Deploy from a branch

Este guia mostra como fazer deploy usando a opção **"Deploy from a branch"** do GitHub Pages.

## 📋 Método: Branch gh-pages

Este método cria uma branch separada (`gh-pages`) apenas com os arquivos compilados (pasta build).

---

## 🎯 Passo a Passo Completo

### 1️⃣ Prepare Seu Repositório no GitHub

**Crie o repositório:**
1. Acesse https://github.com/new
2. Nome: `ranking-desafios-bb` (ou outro nome)
3. **NÃO** marque "Initialize with README"
4. Clique "Create repository"

**Conecte ao repositório local:**
```bash
cd /app

# Se ainda não inicializou o git
git init

# Adicione o remote (substitua SEU_USUARIO e SEU_REPO)
git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git

# Faça commit do código fonte
git add .
git commit -m "Initial commit"

# Envie para o GitHub
git branch -M main
git push -u origin main
```

### 2️⃣ Faça o Deploy

**Opção A - Usando o Script Automático (Recomendado):**
```bash
cd /app
./deploy-gh-pages.sh
```

**Opção B - Comandos Manuais:**
```bash
cd /app/frontend

# Instale dependências
yarn install

# Faça o build
yarn build

# Faça deploy para branch gh-pages
yarn gh-pages -d build
```

Este comando irá:
- ✅ Fazer build da aplicação
- ✅ Criar a branch `gh-pages`
- ✅ Fazer push apenas da pasta `build/` para essa branch

### 3️⃣ Configure GitHub Pages

**No seu repositório GitHub:**

1. Vá em **Settings** (Configurações)
2. No menu lateral, clique em **Pages**
3. Em **"Build and deployment"**:
   - **Source**: Selecione **"Deploy from a branch"**
   - **Branch**: Selecione **"gh-pages"** → **"/root"** (ou "/ (root)")
   - Clique **Save**

### 4️⃣ Aguarde e Acesse

1. Aguarde 1-2 minutos
2. Recarregue a página de Settings → Pages
3. Verá uma mensagem: **"Your site is live at..."**
4. Clique no link ou acesse:
   ```
   https://SEU_USUARIO.github.io/SEU_REPO/
   ```

---

## 🔄 Fazendo Atualizações

Quando você fizer mudanças no código:

### Passo 1: Commit das mudanças no código fonte
```bash
cd /app

# Adicione as mudanças
git add .
git commit -m "Descrição das mudanças"
git push origin main
```

### Passo 2: Faça novo deploy
```bash
# Usando o script
./deploy-gh-pages.sh

# OU manualmente
cd frontend
yarn build
yarn gh-pages -d build
```

**Importante:** Você precisa rodar o script de deploy toda vez que fizer mudanças!

---

## 📁 Estrutura das Branches

Seu repositório terá **2 branches**:

### Branch `main` (código fonte):
```
/app/
├── frontend/
│   ├── src/              ← Código React
│   ├── public/
│   └── package.json
├── backend/
├── README.md
└── ...
```

### Branch `gh-pages` (arquivos compilados):
```
/ (raiz da branch gh-pages)
├── index.html            ← HTML compilado
├── static/
│   ├── css/
│   ├── js/
│   └── media/
├── asset-manifest.json
└── ...
```

---

## 🎯 Como Funciona

```
1. Você: git push origin main (código fonte)
                ↓
2. Você: ./deploy-gh-pages.sh
                ↓
3. Script: yarn build (cria pasta build/)
                ↓
4. Script: gh-pages -d build (push para branch gh-pages)
                ↓
5. GitHub Pages: Serve arquivos da branch gh-pages
                ↓
6. Usuários: Acessam https://SEU_USUARIO.github.io/SEU_REPO/
```

---

## ✅ Vantagens deste Método

- ✅ Não precisa configurar GitHub Actions
- ✅ Código fonte e build em branches separadas
- ✅ Controle total sobre quando fazer deploy
- ✅ Build é feito no seu computador (mais rápido para depuração)

---

## ⚠️ Importante

### O que commitar na branch main:
- ✅ Código fonte (`frontend/src/`)
- ✅ `package.json`, `README.md`, etc
- ❌ **NÃO** commitar `frontend/build/`
- ❌ **NÃO** commitar `node_modules/`

### O que vai para a branch gh-pages:
- ✅ Apenas os arquivos da pasta `build/`
- ✅ Gerenciado automaticamente pelo `gh-pages`

---

## 🐛 Solução de Problemas

### Problema 1: "Failed to get remote.origin.url"

**Causa:** Remote não configurado

**Solução:**
```bash
git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
```

### Problema 2: Página em branco após deploy

**Causa:** Homepage incorreto no package.json

**Solução:** Verifique se está assim:
```json
{
  "homepage": "."
}
```

Se precisar usar com nome do repositório:
```json
{
  "homepage": "https://SEU_USUARIO.github.io/SEU_REPO"
}
```

### Problema 3: Arquivos não encontrados (404)

**Causa:** Branch ou pasta incorreta no GitHub Pages

**Solução:**
1. Settings → Pages
2. Branch: `gh-pages`
3. Folder: `/root` ou `/ (root)` (não `/docs`)

### Problema 4: Deploy falha com erro de permissão

**Causa:** Não tem permissão de push

**Solução:**
```bash
# Configure suas credenciais do GitHub
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"

# Use token de acesso pessoal ao invés de senha
# Gere um token em: https://github.com/settings/tokens
```

---

## 🔄 Workflow Completo

### Primeira vez:

```bash
# 1. Configure o repositório
cd /app
git init
git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
git add .
git commit -m "Initial commit"
git push -u origin main

# 2. Faça o deploy
./deploy-gh-pages.sh

# 3. Configure GitHub Pages
# Settings → Pages → Deploy from a branch → gh-pages → /root
```

### Atualizações:

```bash
# 1. Faça suas mudanças no código

# 2. Commit na branch main
git add .
git commit -m "Descrição das mudanças"
git push origin main

# 3. Deploy para gh-pages
./deploy-gh-pages.sh
```

---

## 📊 Comparação: GitHub Actions vs Deploy from Branch

| Aspecto | GitHub Actions | Deploy from Branch |
|---------|----------------|-------------------|
| Setup inicial | Automático | Manual |
| Deploy | Automático (cada push) | Manual (rodar script) |
| Build | No servidor GitHub | No seu computador |
| Velocidade | Mais lento (2-5 min) | Mais rápido (1-2 min) |
| Controle | Menos controle | Mais controle |
| Melhor para | Deploy contínuo | Deploy sob demanda |

---

## 🎯 Comandos Úteis

```bash
# Ver qual branch está usando
git branch

# Ver branches remotas
git branch -r

# Ver conteúdo da branch gh-pages (sem mudar de branch)
git show gh-pages:index.html

# Deletar branch gh-pages (se precisar recomeçar)
git push origin --delete gh-pages

# Fazer deploy com mensagem customizada
cd frontend
yarn gh-pages -d build -m "Versão 2.0 - Novos recursos"
```

---

## ✅ Checklist de Deploy

- [ ] Repositório criado no GitHub
- [ ] Remote configurado: `git remote -v`
- [ ] Código commitado na branch main
- [ ] Script executado: `./deploy-gh-pages.sh`
- [ ] GitHub Pages configurado: gh-pages + /root
- [ ] Aguardou 1-2 minutos
- [ ] Testou o URL: https://SEU_USUARIO.github.io/SEU_REPO/

---

## 🆘 Precisa de Ajuda?

Se tiver problemas:

1. **Verifique as branches:**
   ```bash
   git branch -r
   ```
   Deve aparecer `origin/gh-pages`

2. **Veja o conteúdo da branch gh-pages:**
   ```bash
   git show gh-pages:index.html
   ```
   Deve mostrar HTML compilado

3. **Teste o build localmente:**
   ```bash
   cd /app/frontend
   yarn build
   cd build
   python3 -m http.server 8080
   # Acesse: http://localhost:8080
   ```

---

## 🎉 Pronto!

Sua aplicação está no ar em:
```
https://SEU_USUARIO.github.io/SEU_REPO/
```

**Exemplo:**
- Usuário: `joaosilva`
- Repositório: `ranking-bb`
- URL: `https://joaosilva.github.io/ranking-bb/`

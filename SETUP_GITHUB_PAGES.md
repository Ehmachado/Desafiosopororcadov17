# 🚀 Setup GitHub Pages - Passo a Passo

## ⚠️ IMPORTANTE: Não commite a pasta `frontend/build/`!

O GitHub Actions irá fazer o build automaticamente. Você só precisa fazer push do código fonte.

---

## 📋 Passo a Passo Completo

### 1️⃣ Prepare o Repositório Git

```bash
cd /app

# Inicializa o repositório (se ainda não foi feito)
git init

# Adiciona todos os arquivos
git add .

# Faz o primeiro commit
git commit -m "Initial commit - Ranking Desafios Seguridade BB"

# Renomeia a branch para main
git branch -M main
```

### 2️⃣ Crie um Repositório no GitHub

1. Acesse https://github.com/new
2. Dê um nome (ex: `ranking-desafios-bb`)
3. **NÃO** marque "Add a README file"
4. **NÃO** marque "Add .gitignore"
5. Clique em "Create repository"

### 3️⃣ Conecte o Repositório Local ao GitHub

```bash
# Substitua SEU_USUARIO e SEU_REPOSITORIO
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git

# Faça o primeiro push
git push -u origin main
```

### 4️⃣ Configure GitHub Pages (CRÍTICO!)

**No seu repositório do GitHub:**

1. Clique em **Settings** (Configurações)
2. No menu lateral, clique em **Pages**
3. Em **"Build and deployment"**:
   - **Source**: Selecione **"GitHub Actions"** ⚠️ IMPORTANTE!
   - (NÃO selecione "Deploy from a branch")
4. Clique em **Save** se aparecer

### 5️⃣ Aguarde o Deploy

1. Vá para a aba **Actions** do seu repositório
2. Você verá um workflow "Deploy to GitHub Pages" rodando
3. Aguarde até aparecer um ✅ verde (leva 2-5 minutos)
4. Clique no workflow concluído
5. Veja a URL no final: `https://SEU_USUARIO.github.io/SEU_REPOSITORIO/`

### 6️⃣ Acesse Sua Aplicação

```
https://SEU_USUARIO.github.io/SEU_REPOSITORIO/
```

---

## 🔍 Verificando se Está Correto

### ✅ Checklist Obrigatório

- [ ] Repositório criado no GitHub
- [ ] Código enviado com `git push`
- [ ] GitHub Pages configurado como **"GitHub Actions"** (não "Deploy from a branch")
- [ ] Workflow rodou e completou com sucesso (✅ verde na aba Actions)
- [ ] URL acessível e mostra a aplicação

### ❌ Problemas Comuns

#### 1. README aparece ao invés da aplicação

**Causa**: GitHub Pages não está configurado como "GitHub Actions"

**Solução**:
1. Vá em Settings → Pages
2. Source: **GitHub Actions** (não "Deploy from a branch")
3. Se não aparecer a opção, certifique-se que o arquivo `.github/workflows/deploy.yml` existe

#### 2. Página 404 Not Found

**Causa**: Workflow ainda não rodou ou falhou

**Solução**:
1. Vá em Actions
2. Se houver erro (❌ vermelho), clique e veja os logs
3. Tente rodar novamente: Actions → Workflow com erro → "Re-run all jobs"

#### 3. Workflow falha no build

**Causa**: Dependências ou erro no código

**Solução**:
```bash
# Teste o build localmente primeiro
cd /app/frontend
yarn install
yarn build

# Se funcionar localmente, faça push novamente
git add .
git commit -m "Fix build"
git push
```

#### 4. Página em branco após deploy

**Causa**: Problema no `homepage` do package.json

**Solução**: Verifique se está assim:
```json
{
  "homepage": "."
}
```

Se estiver diferente, corrija e faça push novamente.

---

## 🔄 Fazendo Atualizações

Sempre que fizer mudanças no código:

```bash
cd /app

# Verifique as mudanças
git status

# Adicione os arquivos modificados
git add .

# Faça commit
git commit -m "Descrição da mudança"

# Envie para o GitHub
git push
```

O GitHub Actions irá fazer deploy automaticamente! 🚀

---

## 📁 O Que NÃO Commitar

Estas pastas/arquivos são gerados automaticamente:

```
frontend/node_modules/  ← NÃO commitar (muito grande)
frontend/build/         ← NÃO commitar (gerado pelo Actions)
backend/__pycache__/    ← NÃO commitar
*.log                   ← NÃO commitar
```

O `.gitignore` já está configurado para ignorar estes arquivos.

---

## 🛠️ Testando Localmente Antes de Fazer Push

```bash
cd /app

# Rode o script de teste
./build-and-test.sh

# OU manualmente:
cd frontend
yarn install
yarn build

# Teste o build
cd build
python3 -m http.server 8080
# Acesse: http://localhost:8080
```

---

## 📊 Estrutura do Projeto

```
/app/
├── .github/
│   └── workflows/
│       └── deploy.yml          ← Configuração do GitHub Actions
├── frontend/
│   ├── public/
│   │   └── index.html          ← Template HTML
│   ├── src/                    ← Código fonte React
│   ├── build/                  ← Gerado após build (não commitar)
│   └── package.json
├── backend/                    ← Não usado no GitHub Pages
├── README.md
└── SETUP_GITHUB_PAGES.md       ← Este arquivo
```

---

## 🎯 Resumo do Fluxo

```
1. Você faz código → git push
                      ↓
2. GitHub Actions → yarn install
                      ↓
3. GitHub Actions → yarn build (cria pasta build/)
                      ↓
4. GitHub Actions → Publica pasta build/ no GitHub Pages
                      ↓
5. Aplicação fica disponível em: https://SEU_USUARIO.github.io/SEU_REPO/
```

---

## 🆘 Ainda com Problemas?

### Ver logs detalhados do GitHub Actions:

1. Acesse seu repositório no GitHub
2. Vá em **Actions**
3. Clique no workflow que falhou
4. Veja os logs de cada step
5. Procure por linhas em vermelho (erros)

### Comandos úteis:

```bash
# Ver status do git
git status

# Ver histórico de commits
git log --oneline

# Ver URL remoto
git remote -v

# Forçar push (use com cuidado!)
git push -f origin main
```

---

## ✅ Tudo Pronto!

Após seguir todos os passos, sua aplicação estará disponível em:

```
https://SEU_USUARIO.github.io/SEU_REPOSITORIO/
```

**Exemplo:**
- Usuário: `joaosilva`
- Repositório: `ranking-bb`
- URL: `https://joaosilva.github.io/ranking-bb/`

🎉 **Parabéns! Sua aplicação está no ar!**

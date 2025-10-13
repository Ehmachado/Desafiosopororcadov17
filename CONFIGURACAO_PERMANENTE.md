# ⚙️ Configuração Permanente do Projeto

Este documento registra todas as configurações aplicadas para garantir que o deploy funcione sempre.

---

## 📦 Configurações Aplicadas

### 1. **React Router - HashRouter**

**Arquivo:** `/app/frontend/src/App.js`

```javascript
import { HashRouter } from 'react-router-dom'; // NÃO BrowserRouter

function App() {
  return (
    <HashRouter>  {/* ← HashRouter para GitHub Pages */}
      <Routes>
        <Route path="/" element={<Dashboard />} />
      </Routes>
    </HashRouter>
  );
}
```

**Por quê:** HashRouter funciona melhor com GitHub Pages pois não depende de configuração do servidor.

---

### 2. **Package.json - Homepage**

**Arquivo:** `/app/frontend/package.json`

```json
{
  "homepage": ".",
  "scripts": {
    "build": "craco build",
    "deploy": "gh-pages -d build"
  }
}
```

**Por quê:** `"homepage": "."` usa caminhos relativos, funcionando em qualquer URL.

---

### 3. **Estrutura de Deploy - Pasta /docs**

**Estrutura:**
```
/app/
├── frontend/
│   ├── src/           ← Código fonte (você edita aqui)
│   └── build/         ← Build temporário (não commitado)
├── docs/              ← Build para GitHub Pages (commitado)
│   ├── index.html
│   ├── .nojekyll      ← Desabilita Jekyll
│   └── static/
└── README.md
```

**Por quê:** GitHub Pages pode servir de `/docs` sem configuração extra.

---

### 4. **Arquivo .nojekyll**

**Arquivo:** `/app/docs/.nojekyll`

Este arquivo é criado automaticamente pelo script de deploy.

**Por quê:** Evita que o GitHub Pages processe os arquivos com Jekyll, que pode quebrar SPAs React.

---

### 5. **Script de Deploy Automático**

**Arquivo:** `/app/deploy-para-github.sh`

**O que faz:**
1. ✅ Build da aplicação com `CI=false`
2. ✅ Copia `frontend/build/` → `/docs/`
3. ✅ Cria `.nojekyll`
4. ✅ Commit automático
5. ✅ Push para GitHub

**Uso:**
```bash
./deploy-para-github.sh
```

---

### 6. **Gitignore Configurado**

**Arquivo:** `/app/.gitignore`

```gitignore
frontend/build     ← Não commitar (temporário)
# /docs           ← DEVE ser commitado (comentado)
node_modules/
```

**Por quê:** `/docs` DEVE estar no git para GitHub Pages funcionar.

---

### 7. **Campo 7 - Preenche Valores do Campo 5**

**Arquivo:** `/app/frontend/src/components/ControleDiario.jsx`

**Função adicionada:**
```javascript
const getValorDoCampo5 = (prefixo, produto) => {
  const realizadoSemDia = realizadosTipo.find(
    r => r.prefixo === prefixo && r.produto === produto && !r.dia
  );
  return realizadoSemDia ? realizadoSemDia.valor : '';
};
```

**Por quê:** Preenche automaticamente os inputs com valores já salvos no Campo 5.

---

## 🚀 Fluxo de Deploy

### Para Fazer Deploy:

```bash
cd /app
./deploy-para-github.sh
```

### No GitHub (Apenas uma vez):

1. **Settings** → **Pages**
2. Source: `Deploy from a branch`
3. Branch: `main`
4. Folder: `/docs`
5. Save

### Resultado:

- ✅ Aplicação disponível em: `https://USUARIO.github.io/REPO/`
- ✅ README aparece como documentação
- ✅ Deploy automático com 1 comando

---

## 🔧 Comandos Úteis

### Verificar configuração:
```bash
./diagnostico.sh
```

### Build manual:
```bash
cd /app/frontend
yarn build
```

### Testar localmente:
```bash
cd /app/docs
python3 -m http.server 8000
# Acesse: http://localhost:8000
```

### Verificar estrutura:
```bash
ls -la /app/docs/
# Deve ter: index.html, .nojekyll, static/
```

---

## 📋 Checklist de Configuração

- [x] HashRouter ao invés de BrowserRouter
- [x] `homepage: "."` no package.json
- [x] Script de deploy criado
- [x] .nojekyll automático
- [x] Pasta /docs commitada
- [x] Gitignore correto
- [x] Campo 7 busca valores do Campo 5
- [x] Diagnóstico automático

---

## ⚠️ NÃO MUDE

**Estas configurações garantem que tudo funcione:**

1. ❌ NÃO mude HashRouter para BrowserRouter
2. ❌ NÃO mude `homepage` para URL absoluta
3. ❌ NÃO delete `.nojekyll`
4. ❌ NÃO ignore `/docs` no gitignore
5. ❌ NÃO mude a estrutura de pastas

---

## 🔄 Se Precisar Resetar

```bash
cd /app

# 1. Limpa tudo
rm -rf docs frontend/build frontend/node_modules

# 2. Reinstala
cd frontend
yarn install

# 3. Deploy limpo
cd /app
./deploy-para-github.sh

# 4. No GitHub: Configure Pages (main → /docs)
```

---

## 📖 Documentação de Referência

- **GUIA_DEPLOY_SIMPLES.md** - Como fazer deploy
- **CORRIGIR_PAGINA_BRANCA.md** - Troubleshooting
- **diagnostico.sh** - Verificação automática
- **deploy-para-github.sh** - Script de deploy

---

## ✅ Resumo

**Comando único para deploy:**
```bash
./deploy-para-github.sh
```

**Configuração única no GitHub:**
Settings → Pages → main → /docs

**Resultado:**
✅ Deploy funciona sempre  
✅ Página em branco corrigida  
✅ Campo 7 preenche do Campo 5  
✅ 1 comando, sem complicação

---

**Data da configuração:** 2025-10-13  
**Versão:** 1.0 - Configuração estável e testada

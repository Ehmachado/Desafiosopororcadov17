# Guia de Deploy para GitHub Pages

Este guia mostra como publicar a aplicação no GitHub Pages.

## 📋 Pré-requisitos

- Repositório no GitHub
- Git configurado localmente
- Node.js e Yarn instalados (para deploy manual)

## 🚀 Método 1: Deploy Automático (Recomendado)

Este método usa GitHub Actions para fazer build e deploy automaticamente a cada push.

### Passos:

1. **Faça push do código para o GitHub**:
   ```bash
   cd /app
   git init
   git add .
   git commit -m "Initial commit - Ranking Desafios BB"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
   git push -u origin main
   ```

2. **Configure GitHub Pages no repositório**:
   - Vá em: `Settings` → `Pages`
   - Em **Source**, selecione: `GitHub Actions`
   - Salve

3. **Pronto!** O GitHub Actions irá:
   - Detectar o push
   - Instalar dependências
   - Fazer build da aplicação
   - Publicar automaticamente

4. **Acesse sua aplicação**:
   ```
   https://SEU_USUARIO.github.io/SEU_REPOSITORIO/
   ```

### Arquivo de Workflow

O arquivo `.github/workflows/deploy.yml` já está configurado e irá:
- ✅ Rodar a cada push na branch main/master
- ✅ Instalar dependências com cache
- ✅ Fazer build otimizado para produção
- ✅ Publicar na GitHub Pages

---

## 🔧 Método 2: Deploy Manual

Use este método para fazer deploy manualmente do seu computador.

### Passos:

1. **Certifique-se que o código está no GitHub**:
   ```bash
   git push origin main
   ```

2. **Execute o comando de deploy**:
   ```bash
   cd /app/frontend
   yarn deploy
   ```

3. **Configure GitHub Pages** (primeira vez):
   - Vá em: `Settings` → `Pages`
   - Em **Source**, selecione: `Deploy from a branch`
   - Em **Branch**, selecione: `gh-pages` → `/root`
   - Salve

4. **Aguarde alguns minutos** e acesse:
   ```
   https://SEU_USUARIO.github.io/SEU_REPOSITORIO/
   ```

---

## 🔄 Atualizações Futuras

### Deploy Automático (Método 1):
Apenas faça push das mudanças:
```bash
git add .
git commit -m "Descrição das mudanças"
git push
```

### Deploy Manual (Método 2):
```bash
cd /app/frontend
yarn deploy
```

---

## ⚙️ Configurações Aplicadas

As seguintes configurações foram adicionadas ao `package.json`:

```json
{
  "homepage": ".",
  "scripts": {
    "predeploy": "yarn build",
    "deploy": "gh-pages -d build"
  }
}
```

- **homepage: "."** - Permite que a aplicação funcione em qualquer caminho (raiz ou subpasta)
- **predeploy** - Faz build antes de fazer deploy
- **deploy** - Publica a pasta `build` na branch `gh-pages`

---

## 🐛 Solução de Problemas

### Erro: "Failed to get remote.origin.url"
```bash
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
```

### Página em branco após deploy
1. Verifique se `"homepage": "."` está no package.json
2. Limpe o cache do navegador (Ctrl + F5)
3. Verifique o console do navegador (F12) para erros

### GitHub Actions falhando
1. Verifique se o Node.js 18 está especificado no workflow
2. Certifique-se que `CI: false` está nas variáveis de ambiente do build
3. Verifique logs em: `Actions` → Clique no workflow com erro

### Deploy manual não funciona
```bash
cd /app/frontend
yarn install
yarn build
yarn deploy
```

---

## 📝 Notas Importantes

### localStorage
- Os dados da aplicação são salvos no **localStorage** do navegador
- Cada usuário tem seus próprios dados locais
- Para compartilhar dados, use a funcionalidade de **Exportar Backup** (botão no topo)

### Domínio Customizado (Opcional)
Para usar seu próprio domínio (ex: ranking.meusite.com):

1. Adicione arquivo `CNAME` em `/app/frontend/public/CNAME`:
   ```
   ranking.meusite.com
   ```

2. Configure DNS do seu domínio:
   ```
   CNAME record: ranking.meusite.com → SEU_USUARIO.github.io
   ```

3. No GitHub: `Settings` → `Pages` → `Custom domain` → Digite seu domínio

---

## ✅ Checklist de Deploy

- [ ] Código está no GitHub
- [ ] GitHub Pages está configurado
- [ ] Workflow está ativo (Método 1) OU branch gh-pages existe (Método 2)
- [ ] Aplicação está acessível no URL
- [ ] Todas as funcionalidades funcionam (teste os 8 campos)
- [ ] localStorage está funcionando
- [ ] Exportação PNG funciona
- [ ] Backup/Restore funciona

---

## 🆘 Precisa de Ajuda?

Se encontrar problemas:
1. Verifique os logs do GitHub Actions (se usando Método 1)
2. Teste o build localmente: `cd /app/frontend && yarn build`
3. Verifique se não há erros no console do navegador (F12)
4. Confirme que todas as dependências estão instaladas

---

**URL da aplicação após deploy:**
```
https://SEU_USUARIO.github.io/SEU_REPOSITORIO/
```

**Exemplo:**
```
https://joaosilva.github.io/ranking-bb/
```

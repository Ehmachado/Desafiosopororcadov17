# Ranking de Desafios de Seguridade — Banco do Brasil

Sistema de gestão e acompanhamento de desafios de seguridade para o Banco do Brasil.

## 🎯 Funcionalidades Principais

### 1. Configuração do Desafio
- Multi-seleção de produtos de seguridade
- Produtos customizáveis
- Definição de duração em dias

### 2. Gestão de Carteiras
- Importação via TAB/CSV (até 100 colunas)
- Mapeamento automático de colunas
- Preview de dados antes de salvar

### 3. Orçamentos
- Por tipo de carteira
- Por carteira individual
- Cálculo automático de potencial
- Ajuste de % meta

### 4. Configuração de Redes
- Mapeamento Prefixo → Rede
- Agrupamento automático no ranking

### 5. Registro de Realizados
- Por tipo de seguro
- Por carteira individual
- Suporte para Vida Total (Vida + Vidinha)

### 6. Controle Diário
- Registro de valores por dia
- Acumulados automáticos
- Filtro retroativo

### 7. Ranking & Exportação
- 10 temas visuais
- Exportação PNG (geral e por rede)
- Ordenação por score médio
- Cores dinâmicas de atingimento

## 💾 Backup & Restauração

- **Exportar Backup**: salva todos os dados em JSON
- **Importar Backup**: restaura dados completos
- Dados em localStorage do navegador

## 🎨 Design

- Paleta oficial Banco do Brasil
- Interface responsiva moderna
- Tabelas com sticky header
- Animações suaves
- Feedback visual claro

## 📊 Regras de Cálculo

**Orçado por Agência**: soma dos orçamentos das carteiras  
**% Atingimento**: (Realizado / Orçado) × 100  
**Potencial**: Nº Carteiras × Orçamentos  
**Ranking**: ordenado por score médio (decrescente)

## 🚀 Stack Técnica

- React 19 + JavaScript
- Shadcn UI (Radix UI)
- Tailwind CSS
- html2canvas (exportação PNG)
- localStorage (persistência)

## 📝 Como Usar

1. Configure produtos e dias (Campo 1)
2. Carregue carteiras (Campo 2)
3. Configure orçamentos (Campo 3)
4. Defina redes (Campo 4)
5. Registre realizados (Campos 5-6)
6. Gere ranking e exporte (Campo 8)

## 🚀 Deploy no GitHub Pages

### Opção 1: Deploy from a branch (Recomendado)
```bash
./deploy-gh-pages.sh
```
Depois configure: Settings → Pages → gh-pages → /root

📖 **Guia completo**: `DEPLOY_FROM_BRANCH.md`

### Opção 2: GitHub Actions (Automático)
```bash
git push origin main
```
Configure: Settings → Pages → GitHub Actions

📖 **Guia completo**: `DEPLOY_GITHUB_PAGES.md`

## 🔧 Entrada de Dados

- Copie do Excel (Ctrl+C)
- Cole na textarea (Ctrl+V)
- Sistema detecta colunas automaticamente
- Ajuste mapeamento se necessário

---

**Desenvolvido para Banco do Brasil**  
Sistema de Ranking de Desafios de Seguridade

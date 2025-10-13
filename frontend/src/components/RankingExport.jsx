import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { FileDown, Image, Layers, RefreshCw } from 'lucide-react';
import { formatCurrency, formatPercentage } from '../utils/dataParser';
import { 
  calculateOrcadoPorAgencia, 
  calculateRealizadoPorAgencia,
  calculateRealizadoPorCarteira,
  calculateAtingimento,
  getAtingimentoColor,
  getAtingimentoClass,
  groupByRede,
  sortByScoreMedio
} from '../utils/calculations';
import { exportToPNG, exportAllRedes, THEME_VARIANTS } from '../utils/exportUtils';
import { toast } from 'sonner';

const RankingExport = () => {
  const [produtos] = useLocalStorage('challenge_produtos', []);
  const [carteiras] = useLocalStorage('carteiras_master', []);
  const [orcadosPorTipo] = useLocalStorage('orcamento_por_tipo', {}); // NOVO FORMATO
  const [orcadosPorCarteira] = useLocalStorage('orcados_por_carteira', []);
  const [redes] = useLocalStorage('redes', []);
  const [realizadosTipo] = useLocalStorage('realizados_tipo', []);
  const [realizadosCarteira] = useLocalStorage('realizados_carteira', []);
  const [realizadosDiariosTipo] = useLocalStorage('realizados_tipo_diarios', []);
  const [realizadosDiariosCarteira] = useLocalStorage('realizados_carteira_diarios', []);
  const [diasDesafio] = useLocalStorage('challenge_dias', 30);

  const [unidade, setUnidade] = useState('agencia');
  const [nomeDesafio, setNomeDesafio] = useLocalStorage('nome_desafio', ''); // Auto-save no localStorage
  const [nomeSuper, setNomeSuper] = useLocalStorage('nome_super', ''); // Nome da Super Regional
  const [simboloSuper, setSimboloSuper] = useLocalStorage('simbolo_super', ''); // Imagem da Super (base64)
  const [temaIndex, setTemaIndex] = useState(0);
  const [baseCalculo, setBaseCalculo] = useState('carteira');
  const [rankingData, setRankingData] = useState([]);
  const [diaFiltro, setDiaFiltro] = useState(null);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null); // Data e hora da última atualização

  // Função para fazer upload da imagem do símbolo
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tamanho (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Imagem muito grande! Máximo 2MB.');
        return;
      }

      // Validar tipo
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione uma imagem válida.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setSimboloSuper(event.target.result);
        toast.success('Imagem carregada com sucesso!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSimboloSuper('');
    toast.success('Imagem removida!');
  };

  const hasCarteirasData = realizadosCarteira.length > 0;
  const tema = THEME_VARIANTS[temaIndex];

  // Garantir que produtos seja um array
  const produtosArray = Array.isArray(produtos) ? produtos : [];
  const produtosRanking = [...produtosArray];
  if (produtosArray.includes('Vida')) {
    const vidaIndex = produtosRanking.indexOf('Vida');
    produtosRanking[vidaIndex] = 'Vida Total';
  }

  // Calcula tamanhos dinâmicos baseado no número de produtos
  const numProdutos = unidade === 'agencia' ? produtosRanking.length : 1;
  const numColunas = 3 + (numProdutos * 3); // Posição, Prefixo, Dependência + (Orçado + Realizado + % para cada produto)
  
  // Ajusta tamanho de fonte e padding baseado no número de produtos
  const getFontSize = () => {
    if (numProdutos <= 3) return '14px';
    if (numProdutos <= 5) return '12px';
    return '10px';
  };
  
  const getPadding = () => {
    if (numProdutos <= 3) return '12px';
    if (numProdutos <= 5) return '10px';
    return '8px';
  };
  
  const getHeaderFontSize = () => {
    if (numProdutos <= 3) return '42px';
    if (numProdutos <= 5) return '36px';
    return '32px';
  };
  
  const getSubHeaderFontSize = () => {
    if (numProdutos <= 3) return '28px';
    if (numProdutos <= 5) return '24px';
    return '20px';
  };
  
  const fontSize = getFontSize();
  const padding = getPadding();
  const headerFontSize = getHeaderFontSize();
  const subHeaderFontSize = getSubHeaderFontSize();

  const calculateRanking = () => {
    if (unidade === 'agencia') {
      const prefixosUnicos = [...new Set(carteiras.map(c => c.prefixo).filter(Boolean))];
      
      const rankings = prefixosUnicos.map(prefixo => {
        const carteirasPrefixo = carteiras.filter(c => c.prefixo === prefixo);
        const agencia = carteirasPrefixo[0]?.agencia || prefixo;
        const redeInfo = redes.find(r => r.prefixo === prefixo);
        const rede = redeInfo?.rede || 'Sem Rede';

        const useCarteiraBase = baseCalculo === 'carteira' && orcadosPorCarteira.length > 0;
        const orcado = calculateOrcadoPorAgencia(prefixo, carteiras, orcadosPorTipo, orcadosPorCarteira, useCarteiraBase);

        const atingimentos = {};
        const valores = {};
        const orcadosPorProduto = {};

        // Calcular orçado por produto
        // Primeiro, contar quantas carteiras de cada tipo esta agência tem
        const tiposCount = {};
        carteirasPrefixo.forEach(cart => {
          const tipo = cart.tipoCarteira;
          if (tipo) {
            tiposCount[tipo] = (tiposCount[tipo] || 0) + 1;
          }
        });
        
        produtosRanking.forEach(produto => {
          // Calcular orçado para este produto específico
          let orcadoProduto = 0;
          
          // Mapear "Vida Total" para "Vida" nos orçamentos
          const produtoBusca = produto === 'Vida Total' ? 'Vida' : produto;
          
          // NOVO FORMATO: orcadosPorTipo é um objeto { tipoCarteira: valor }
          if (typeof orcadosPorTipo === 'object' && !Array.isArray(orcadosPorTipo)) {
            // Para cada tipo de carteira, multiplicar orçado × quantidade
            Object.entries(tiposCount).forEach(([tipo, qtd]) => {
              const orcadoTipo = orcadosPorTipo[tipo] || 0;
              orcadoProduto += (parseFloat(orcadoTipo) || 0) * qtd;
            });
          } else {
            // FORMATO ANTIGO: orcadosPorTipo é um array
            Object.entries(tiposCount).forEach(([tipo, qtd]) => {
              const orcadoTipo = orcadosPorTipo.find(o => 
                o.tipoCarteira === tipo && o.produto === produtoBusca
              );
              if (orcadoTipo) {
                orcadoProduto += (parseFloat(orcadoTipo.valor) || 0) * qtd;
              }
            });
          }
          
          orcadosPorProduto[produto] = orcadoProduto;
          
          // Usa realizadosDiariosTipo se houver dados, senão usa realizadosTipo
          let realizado = 0;
          if (realizadosDiariosTipo.length > 0) {
            // Soma todos os dias salvos até diaFiltro para este prefixo e produto
            const diaLimite = diaFiltro || diasDesafio;
            realizado = realizadosDiariosTipo
              .filter(r => r.prefixo === prefixo && r.produto === produto && r.dia <= diaLimite)
              .reduce((sum, r) => sum + (parseFloat(r.valor) || 0), 0);
            
            // Se for Vida Total, soma Vida + Vidinha
            if (produto === 'Vida Total') {
              const vida = realizadosDiariosTipo
                .filter(r => r.prefixo === prefixo && r.produto === 'Vida' && r.dia <= diaLimite)
                .reduce((sum, r) => sum + (parseFloat(r.valor) || 0), 0);
              const vidinha = realizadosDiariosTipo
                .filter(r => r.prefixo === prefixo && r.produto === 'Vidinha' && r.dia <= diaLimite)
                .reduce((sum, r) => sum + (parseFloat(r.valor) || 0), 0);
              realizado = vida + vidinha;
            }
          } else {
            // Fallback para realizadosTipo (compatibilidade)
            realizado = calculateRealizadoPorAgencia(prefixo, produto, realizadosTipo, diaFiltro);
          }
          
          valores[produto] = realizado;
          atingimentos[produto] = calculateAtingimento(realizado, orcadoProduto);
        });

        return {
          prefixo,
          agencia,
          rede,
          orcado,
          valores,
          atingimentos,
          orcadosPorProduto
        };
      });

      return sortByScoreMedio(rankings);
    } else {
      const rankingsCarteira = [];

      carteiras.forEach(c => {
        const redeInfo = redes.find(r => r.prefixo === c.prefixo);
        const rede = redeInfo?.rede || 'Sem Rede';

        const orcadoCarteira = orcadosPorCarteira.find(o => 
          o.prefixo === c.prefixo && o.carteira === c.carteira
        );
        const orcado = orcadoCarteira ? orcadoCarteira.valor * (orcadoCarteira.fatorMeta || 100) / 100 : 0;

        // Usa realizadosDiariosCarteira se houver dados, senão usa realizadosCarteira
        let realizado = 0;
        if (realizadosDiariosCarteira.length > 0) {
          // Soma todos os dias salvos até diaFiltro para esta carteira
          const diaLimite = diaFiltro || diasDesafio;
          realizado = realizadosDiariosCarteira
            .filter(r => r.prefixo === c.prefixo && r.carteira === c.carteira && r.dia <= diaLimite)
            .reduce((sum, r) => sum + (parseFloat(r.valor) || 0), 0);
        } else {
          // Fallback para realizadosCarteira (compatibilidade)
          realizado = calculateRealizadoPorCarteira(c.prefixo, c.carteira, realizadosCarteira, diaFiltro);
        }
        
        const atingimento = calculateAtingimento(realizado, orcado);

        rankingsCarteira.push({
          prefixo: c.prefixo,
          agencia: c.agencia,
          carteira: c.carteira,
          rede,
          orcado,
          valores: { Total: realizado },
          atingimentos: { Total: atingimento }
        });
      });

      return sortByScoreMedio(rankingsCarteira);
    }
  };

  const handleAtualizarRanking = () => {
    const data = calculateRanking();
    setRankingData(data);
    setUltimaAtualizacao(new Date()); // Captura data e hora da atualização
    toast.success('Ranking atualizado!');
  };

  const handleExportPNGGeral = async () => {
    await exportToPNG('ranking-export-all', `ranking-geral-${nomeDesafio || 'desafio'}.png`);
    toast.success('Exportação concluída!');
  };

  const handleExportPNGRedes = async () => {
    const redesUnicas = [...new Set(redes.map(r => r.rede).filter(Boolean))];
    if (redesUnicas.length === 0) {
      toast.error('Nenhuma rede configurada');
      return;
    }
    await exportAllRedes(redesUnicas);
    toast.success('Exportação de todas as redes concluída!');
  };

  // Função para exportar versão simplificada (CSV)
  const handleExportSimplificado = () => {
    if (rankingData.length === 0) {
      toast.error('Atualize o ranking primeiro!');
      return;
    }

    // Cabeçalho CSV
    let csv = 'Prefixo;Agência';
    
    // Adicionar produtos como colunas
    produtosRanking.forEach(produto => {
      csv += `;Orçado ${produto};Realizado ${produto};% Atingimento ${produto}`;
    });
    csv += '\n';

    // Dados
    rankingData.forEach(row => {
      csv += `${row.prefixo};${row.agencia || row.dependencia}`;
      
      produtosRanking.forEach(produto => {
        const orcado = row.orcadosPorProduto?.[produto] || 0;
        const realizado = row.valores?.[produto] || 0;
        const atingimento = row.atingimentos?.[produto] || 0;
        
        csv += `;${orcado.toFixed(2)};${realizado.toFixed(2)};${atingimento.toFixed(2)}%`;
      });
      
      csv += '\n';
    });

    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ranking-simplificado-${nomeDesafio || 'desafio'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Exportação simplificada concluída!');
  };

  useEffect(() => {
    if (carteiras.length > 0) {
      handleAtualizarRanking();
    }
  }, [unidade, baseCalculo, diaFiltro]);

  const redesAgrupadas = groupByRede(rankingData, redes);
  const redesUnicas = Object.keys(redesAgrupadas);

  return (
    <div>
      <div className="bb-card">
        <div className="bb-card-header">
          <h2 className="bb-card-title" data-testid="ranking-export-title">Campo 8 — Ranking & Exportação</h2>
          <p className="bb-card-subtitle">Configure, visualize e exporte o ranking do desafio</p>
        </div>

        {/* Configurações */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--bb-gray-700)', fontSize: '14px' }}>
              Unidade do Ranking:
            </label>
            <select
              value={unidade}
              onChange={(e) => setUnidade(e.target.value)}
              className="bb-input"
              data-testid="unidade-select"
            >
              <option value="agencia">Agência (Prefixo)</option>
              <option value="carteiras" disabled={!hasCarteirasData}>
                Carteiras {!hasCarteirasData ? '(sem dados)' : ''}
              </option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--bb-gray-700)', fontSize: '14px' }}>
              Nome do Desafio:
            </label>
            <input
              type="text"
              value={nomeDesafio}
              onChange={(e) => setNomeDesafio(e.target.value)}
              className="bb-input"
              placeholder="Ex: Desafio Q1 2025"
              data-testid="nome-desafio-input"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--bb-gray-700)', fontSize: '14px' }}>
              Nome da Super Regional:
            </label>
            <input
              type="text"
              value={nomeSuper}
              onChange={(e) => setNomeSuper(e.target.value)}
              className="bb-input"
              placeholder="Ex: Super Regional Sul"
              data-testid="nome-super-input"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--bb-gray-700)', fontSize: '14px' }}>
              Logotipo da Super:
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {simboloSuper ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1 }}>
                  <img 
                    src={simboloSuper} 
                    alt="Logo Super" 
                    style={{ 
                      height: '50px', 
                      width: 'auto', 
                      maxWidth: '150px',
                      objectFit: 'contain',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      padding: '4px',
                      background: 'white'
                    }} 
                  />
                  <button
                    onClick={handleRemoveImage}
                    className="bb-btn"
                    style={{ background: '#dc3545', color: 'white', padding: '6px 12px' }}
                    type="button"
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="bb-input"
                  data-testid="simbolo-super-input"
                  style={{ flex: 1 }}
                />
              )}
            </div>
            <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
              Recomendado: imagem quadrada ou horizontal, máximo 2MB
            </p>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--bb-gray-700)', fontSize: '14px' }}>
              Tema Visual:
            </label>
            <select
              value={temaIndex}
              onChange={(e) => setTemaIndex(parseInt(e.target.value))}
              className="bb-input"
              data-testid="tema-select"
            >
              {THEME_VARIANTS.map((t, idx) => (
                <option key={idx} value={idx}>{t.name}</option>
              ))}
            </select>
          </div>

          {unidade === 'agencia' && (
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--bb-gray-700)', fontSize: '14px' }}>
                Base de Cálculo:
              </label>
              <select
                value={baseCalculo}
                onChange={(e) => setBaseCalculo(e.target.value)}
                className="bb-input"
                data-testid="base-calculo-select"
              >
                <option value="carteira">Por Carteira</option>
                <option value="tipo">Por Tipo</option>
              </select>
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--bb-gray-700)', fontSize: '14px' }}>
              Filtrar até o Dia:
            </label>
            <select
              value={diaFiltro || ''}
              onChange={(e) => setDiaFiltro(e.target.value ? parseInt(e.target.value) : null)}
              className="bb-input"
              data-testid="dia-filtro-select"
            >
              <option value="">Todos os dias</option>
              {Array.from({ length: diasDesafio }, (_, i) => i + 1).map(dia => (
                <option key={dia} value={dia}>Até Dia {dia}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Última Atualização */}
        {ultimaAtualizacao && (
          <div style={{ 
            padding: '12px 16px', 
            background: '#e8f4f8', 
            borderRadius: '8px', 
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            color: '#2c5282'
          }}>
            <span style={{ fontWeight: 600 }}>Última atualização:</span>
            <span>
              {ultimaAtualizacao.toLocaleDateString('pt-BR')} às {ultimaAtualizacao.toLocaleTimeString('pt-BR')}
            </span>
          </div>
        )}

        {/* Botões de Ação */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
          <button
            onClick={handleAtualizarRanking}
            className="bb-btn bb-btn-primary"
            data-testid="atualizar-ranking-btn"
          >
            <RefreshCw size={16} />
            Atualizar Ranking
          </button>
          <button
            onClick={handleExportPNGGeral}
            className="bb-btn bb-btn-secondary"
            disabled={rankingData.length === 0}
            data-testid="export-png-geral-btn"
          >
            <Image size={16} />
            Exportar PNG (Geral)
          </button>
          <button
            onClick={handleExportPNGRedes}
            className="bb-btn bb-btn-secondary"
            disabled={redesUnicas.length === 0}
            data-testid="export-png-redes-btn"
          >
            <Layers size={16} />
            Exportar PNG (Todas as Redes)
          </button>
          <button
            onClick={handleExportSimplificado}
            className="bb-btn bb-btn-secondary"
            disabled={rankingData.length === 0}
            data-testid="export-simplificado-btn"
            title="Exportar apenas Prefixo, Agência, Orçados, Realizados e % Atingimento"
          >
            <FileDown size={16} />
            Exportar Simplificado (CSV)
          </button>
        </div>
      </div>

      {/* Área de Exportação */}
      {rankingData.length > 0 && (
        <div id="ranking-export-all" className="export-container" style={{ 
          background: 'white', 
          padding: numProdutos > 5 ? '20px' : '40px', 
          borderRadius: '12px',
          width: 'fit-content',
          minWidth: '100%'
        }}>
          {redesUnicas.map(rede => {
            const dadosRede = redesAgrupadas[rede] || [];
            if (dadosRede.length === 0) return null;

            return (
              <div key={rede} id={`ranking-rede-${rede.replace(/\s+/g, '-')}`} style={{ marginBottom: '48px', pageBreakAfter: 'always' }}>
                {/* Cabeçalho */}
                <div style={{ 
                  background: tema.headerBg,
                  color: tema.headerColor,
                  padding: numProdutos > 5 ? '24px 20px' : '32px 24px',
                  borderRadius: '12px 12px 0 0',
                  marginBottom: '0'
                }}>
                  {/* Super Regional com Logo */}
                  {(nomeSuper || simboloSuper) && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      gap: '20px',
                      marginBottom: '20px', 
                      borderBottom: '2px solid rgba(255,255,255,0.3)', 
                      paddingBottom: '16px' 
                    }}>
                      {simboloSuper && (
                        <img 
                          src={simboloSuper} 
                          alt="Logo Super Regional"
                          style={{ 
                            height: '60px', 
                            width: 'auto',
                            maxWidth: '120px',
                            objectFit: 'contain'
                          }}
                        />
                      )}
                      {nomeSuper && (
                        <div style={{ 
                          fontSize: headerFontSize, 
                          fontWeight: '700', 
                          textAlign: simboloSuper ? 'left' : 'center',
                          lineHeight: '1.2'
                        }}>
                          {nomeSuper}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Título do Desafio */}
                  <h1 style={{ fontSize: headerFontSize, fontWeight: '700', marginBottom: '12px', textAlign: 'center', lineHeight: '1.2' }}>
                    {nomeDesafio || 'Ranking de Desafios de Seguridade'}
                  </h1>
                  <p style={{ fontSize: subHeaderFontSize, fontWeight: '600', textAlign: 'center', color: tema.accentColor, lineHeight: '1.3' }}>
                    Rede {rede}
                  </p>
                </div>

                {/* Tabela de Ranking */}
                <div style={{ overflowX: 'auto', border: '2px solid #e8eef7', borderTop: 'none', borderRadius: '0 0 12px 12px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', fontSize }}>
                    <thead>
                      <tr style={{ background: 'var(--bb-blue)', color: 'white' }}>
                        <th style={{ padding, textAlign: 'left', fontSize, fontWeight: '600', position: 'sticky', top: 0, background: 'var(--bb-blue)', whiteSpace: 'nowrap' }}>Pos.</th>
                        <th style={{ padding, textAlign: 'left', fontSize, fontWeight: '600', position: 'sticky', top: 0, background: 'var(--bb-blue)', whiteSpace: 'nowrap' }}>Prefixo</th>
                        <th style={{ padding, textAlign: 'left', fontSize, fontWeight: '600', position: 'sticky', top: 0, background: 'var(--bb-blue)', whiteSpace: 'nowrap' }}>Dependência</th>
                        {unidade === 'carteiras' && (
                          <th style={{ padding, textAlign: 'left', fontSize, fontWeight: '600', position: 'sticky', top: 0, background: 'var(--bb-blue)', whiteSpace: 'nowrap' }}>Carteira</th>
                        )}
                        {(unidade === 'agencia' ? produtosRanking : ['Total']).map((produto, pIdx) => {
                          // Cores mais escuras para os cabeçalhos dos produtos
                          const headerCores = [
                            '#1976d2', // Azul
                            '#f57c00', // Laranja
                            '#388e3c', // Verde
                            '#7b1fa2', // Roxo
                            '#fbc02d', // Amarelo
                            '#c2185b', // Rosa
                            '#00796b', // Ciano
                          ];
                          const headerBg = headerCores[pIdx % headerCores.length];
                          
                          return (
                            <React.Fragment key={produto}>
                              <th style={{ padding, textAlign: 'right', fontSize, fontWeight: '600', position: 'sticky', top: 0, background: headerBg, whiteSpace: 'nowrap' }}>
                                {produto}<br/>Orçado
                              </th>
                              <th style={{ padding, textAlign: 'right', fontSize, fontWeight: '600', position: 'sticky', top: 0, background: headerBg, whiteSpace: 'nowrap' }}>
                                {produto}<br/>Realizado
                              </th>
                              <th style={{ padding, textAlign: 'right', fontSize, fontWeight: '600', position: 'sticky', top: 0, background: headerBg, whiteSpace: 'nowrap' }}>
                                {produto}<br/>%
                              </th>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {dadosRede.map((item, idx) => {
                        // Cores alternadas mais visíveis para as linhas
                        const rowBgColor = idx % 2 === 0 ? '#ffffff' : '#f0f4f8';
                        
                        // Array de cores suaves para cada produto
                        const produtoCores = [
                          { bg: '#e3f2fd', bgAlt: '#d1e7f7' }, // Azul claro
                          { bg: '#fff3e0', bgAlt: '#ffe4c4' }, // Laranja claro
                          { bg: '#e8f5e9', bgAlt: '#d4ead5' }, // Verde claro
                          { bg: '#f3e5f5', bgAlt: '#e1d4e3' }, // Roxo claro
                          { bg: '#fff9c4', bgAlt: '#ffeb99' }, // Amarelo claro
                          { bg: '#fce4ec', bgAlt: '#f8d0dd' }, // Rosa claro
                          { bg: '#e0f2f1', bgAlt: '#c8e6e4' }, // Ciano claro
                        ];
                        
                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid #e8eef7', background: rowBgColor }}>
                            <td style={{ padding, fontSize, fontWeight: '600', background: rowBgColor }}>{idx + 1}º</td>
                            <td style={{ padding, fontSize, background: rowBgColor }}>{item.prefixo}</td>
                            <td style={{ padding, fontSize, background: rowBgColor }}>{item.agencia}</td>
                            {unidade === 'carteiras' && (
                              <td style={{ padding, fontSize, background: rowBgColor }}>{item.carteira}</td>
                            )}
                            {(unidade === 'agencia' ? produtosRanking : ['Total']).map((produto, pIdx) => {
                              // Usa uma cor diferente para cada produto, com variação para linhas alternadas
                              const corProduto = produtoCores[pIdx % produtoCores.length];
                              const bgProduto = idx % 2 === 0 ? corProduto.bg : corProduto.bgAlt;
                              
                              return (
                                <React.Fragment key={produto}>
                                  <td style={{ 
                                    padding, 
                                    fontSize, 
                                    textAlign: 'right',
                                    fontWeight: '600',
                                    background: bgProduto
                                  }}>
                                    {formatCurrency(item.orcadosPorProduto?.[produto] || 0)}
                                  </td>
                                  <td style={{ 
                                    padding, 
                                    fontSize, 
                                    textAlign: 'right',
                                    background: bgProduto
                                  }}>
                                    {formatCurrency(item.valores[produto] || 0)}
                                  </td>
                                  <td style={{ 
                                    padding, 
                                    fontSize, 
                                    textAlign: 'right',
                                    fontWeight: '600',
                                    color: getAtingimentoColor(item.atingimentos[produto] || 0),
                                    background: bgProduto
                                  }}>
                                    {formatPercentage(item.atingimentos[produto] || 0)}
                                  </td>
                                </React.Fragment>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {rankingData.length === 0 && (
        <div className="bb-card">
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--bb-gray-600)' }}>
            <FileDown size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p style={{ fontSize: '16px' }}>Clique em "Atualizar Ranking" para gerar os dados</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RankingExport;

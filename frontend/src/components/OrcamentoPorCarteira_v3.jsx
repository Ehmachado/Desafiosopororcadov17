import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Save, Trash2, Upload, DollarSign, Percent, Calendar } from 'lucide-react';
import { formatCurrency, parseNumericValue } from '../utils/dataParser';
import { toast } from 'sonner';

const OrcamentoPorCarteira = () => {
  const [carteiras] = useLocalStorage('carteiras_master', []);
  const [produtos] = useLocalStorage('challenge_produtos', []);
  const [challengeDias] = useLocalStorage('challenge_dias', 30);
  const [orcadosPorCarteira, setOrcadosPorCarteira] = useLocalStorage('orcados_por_carteira_v2', []);
  
  // Dia atual GERAL
  const [diaAtual, setDiaAtual] = useState(1);
  
  // Estado por produto: { produto: { pastedData, parsedRows, headers, columnMapping, metaPercentual } }
  const [estadoPorProduto, setEstadoPorProduto] = useState({});

  // Produtos em array garantido
  const produtosArray = useMemo(() => 
    Array.isArray(produtos) ? produtos : [],
    [produtos]
  );

  // Inicializar estado para cada produto
  useEffect(() => {
    const novoEstado = {};
    produtosArray.forEach(produto => {
      if (!estadoPorProduto[produto]) {
        novoEstado[produto] = {
          pastedData: '',
          parsedRows: [],
          headers: [],
          columnMapping: {
            prefixo: '',
            agencia: '',
            carteira: '',
            tipoCarteira: '',
            orcado: '',
            realizado: ''
          },
          metaPercentual: 100
        };
      }
    });
    
    if (Object.keys(novoEstado).length > 0) {
      setEstadoPorProduto(prev => ({ ...prev, ...novoEstado }));
    }
  }, [produtosArray]);

  // Se não houver produtos
  if (produtosArray.length === 0) {
    return (
      <div className="bb-card">
        <div className="bb-card-header">
          <h2 className="bb-card-title">Campo 3.1 — Orçamento Por % Atingimento</h2>
        </div>
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--bb-gray-600)' }}>
          <Upload size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <p style={{ fontSize: '16px' }}>Configure os produtos primeiro no Campo 1</p>
        </div>
      </div>
    );
  }

  // Função para parsear dados de um produto
  const handlePasteDataProduto = useCallback((produto) => {
    const estado = estadoPorProduto[produto];
    if (!estado || !estado.pastedData.trim()) {
      toast.error('Cole os dados na área de texto primeiro');
      return;
    }

    const lines = estado.pastedData.trim().split('\n');
    if (lines.length < 2) {
      toast.error('Dados insuficientes. Cole pelo menos uma linha de cabeçalho e uma de dados.');
      return;
    }

    const headerLine = lines[0].split('\t');
    const rows = lines.slice(1).map(line => line.split('\t'));

    // Auto-detect columns
    const autoMapping = {
      prefixo: '',
      agencia: '',
      carteira: '',
      tipoCarteira: '',
      orcado: '',
      realizado: ''
    };

    headerLine.forEach((header, idx) => {
      const headerLower = header.toLowerCase().trim();
      
      if (headerLower.includes('prefixo') || headerLower.includes('prefix')) {
        autoMapping.prefixo = idx.toString();
      }
      if (headerLower.includes('agência') || headerLower.includes('agencia') || 
          headerLower.includes('dependência') || headerLower.includes('dependencia') ||
          headerLower.includes('nome')) {
        autoMapping.agencia = idx.toString();
      }
      if (headerLower.includes('carteira') && !headerLower.includes('tipo')) {
        autoMapping.carteira = idx.toString();
      }
      if (headerLower.includes('tipo') && headerLower.includes('carteira')) {
        autoMapping.tipoCarteira = idx.toString();
      }
      if (headerLower.includes('orçado') || headerLower.includes('orcado') || 
          headerLower.includes('conexão') || headerLower.includes('conexao')) {
        if (!autoMapping.orcado) autoMapping.orcado = idx.toString();
      }
      if (headerLower.includes('realizado')) {
        if (!autoMapping.realizado) autoMapping.realizado = idx.toString();
      }
    });

    setEstadoPorProduto(prev => ({
      ...prev,
      [produto]: {
        ...prev[produto],
        headers: headerLine,
        parsedRows: rows,
        columnMapping: autoMapping
      }
    }));

    toast.success(`${produto}: ${rows.length} linhas carregadas!`);
  }, [estadoPorProduto]);

  // Função para salvar dados de um produto
  const handleSalvarDadosProduto = useCallback((produto) => {
    const estado = estadoPorProduto[produto];
    if (!estado || estado.parsedRows.length === 0) {
      toast.error('Carregue os dados primeiro');
      return;
    }

    if (!estado.columnMapping.prefixo || !estado.columnMapping.carteira) {
      toast.error('Mapeie pelo menos as colunas Prefixo e Carteira');
      return;
    }

    if (!estado.columnMapping.orcado) {
      toast.error('Mapeie a coluna de Orçado');
      return;
    }

    const processedData = [];

    estado.parsedRows.forEach((row) => {
      if (row.length < 2) return;

      const prefixo = row[parseInt(estado.columnMapping.prefixo)] || '';
      const agencia = estado.columnMapping.agencia ? row[parseInt(estado.columnMapping.agencia)] : '';
      const carteira = row[parseInt(estado.columnMapping.carteira)] || '';
      const tipoCarteira = estado.columnMapping.tipoCarteira ? row[parseInt(estado.columnMapping.tipoCarteira)] : '';

      if (!prefixo || !carteira) return;

      const orcadoValor = parseNumericValue(row[parseInt(estado.columnMapping.orcado)]) || 0;
      const realizadoValor = estado.columnMapping.realizado ? 
        (parseNumericValue(row[parseInt(estado.columnMapping.realizado)]) || 0) : 0;

      // Orçado Efetivo = (Orçado × Meta% / 100) - Realizado
      const orcadoEfetivo = Math.max(0, (orcadoValor * estado.metaPercentual / 100) - realizadoValor);

      processedData.push({
        prefixo,
        agencia,
        carteira,
        tipoCarteira,
        produto,
        orcado: orcadoValor,
        realizado: realizadoValor,
        orcadoEfetivo,
        metaPercentual: estado.metaPercentual,
        dia: diaAtual
      });
    });

    // Remover dados do mesmo dia e mesmo produto, adicionar novos
    const dadosOutros = orcadosPorCarteira.filter(item => 
      !(item.dia === diaAtual && item.produto === produto)
    );
    
    setOrcadosPorCarteira([...dadosOutros, ...processedData]);
    toast.success(`${produto} - Dia ${diaAtual}: ${processedData.length} carteiras salvas!`);
  }, [estadoPorProduto, diaAtual, orcadosPorCarteira, setOrcadosPorCarteira]);

  // Função para limpar todos os dados
  const handleLimparTudo = useCallback(() => {
    if (window.confirm('Tem certeza que deseja limpar TODOS os dados do Campo 3.1?')) {
      setOrcadosPorCarteira([]);
      
      // Limpar estado de cada produto
      const novoEstado = {};
      produtosArray.forEach(produto => {
        novoEstado[produto] = {
          pastedData: '',
          parsedRows: [],
          headers: [],
          columnMapping: {
            prefixo: '',
            agencia: '',
            carteira: '',
            tipoCarteira: '',
            orcado: '',
            realizado: ''
          },
          metaPercentual: 100
        };
      });
      setEstadoPorProduto(novoEstado);
      
      toast.success('Todos os dados limpos!');
    }
  }, [setOrcadosPorCarteira, produtosArray]);

  // Calcular totais por agência
  const orcamentoPorAgencia = useMemo(() => {
    if (orcadosPorCarteira.length === 0) return [];

    const agrupado = {};

    orcadosPorCarteira.forEach(item => {
      const key = item.prefixo;
      
      if (!agrupado[key]) {
        agrupado[key] = {
          prefixo: item.prefixo,
          agencia: item.agencia,
          orcadoEfetivoPorProduto: {}
        };
        
        produtosArray.forEach(produto => {
          agrupado[key].orcadoEfetivoPorProduto[produto] = 0;
        });
      }

      agrupado[key].orcadoEfetivoPorProduto[item.produto] = 
        (agrupado[key].orcadoEfetivoPorProduto[item.produto] || 0) + item.orcadoEfetivo;
    });

    return Object.values(agrupado).sort((a, b) => a.prefixo.localeCompare(b.prefixo));
  }, [orcadosPorCarteira, produtosArray]);

  // Calcular totais por tipo
  const orcamentoPorTipo = useMemo(() => {
    if (orcadosPorCarteira.length === 0) return [];

    const agrupado = {};

    orcadosPorCarteira.forEach(item => {
      const tipo = item.tipoCarteira || 'Sem Tipo';
      
      if (!agrupado[tipo]) {
        agrupado[tipo] = {
          tipo,
          qtdCarteiras: new Set(),
          orcadoEfetivoPorProduto: {}
        };
        
        produtosArray.forEach(produto => {
          agrupado[tipo].orcadoEfetivoPorProduto[produto] = 0;
        });
      }

      agrupado[tipo].qtdCarteiras.add(`${item.prefixo}-${item.carteira}`);
      agrupado[tipo].orcadoEfetivoPorProduto[item.produto] = 
        (agrupado[tipo].orcadoEfetivoPorProduto[item.produto] || 0) + item.orcadoEfetivo;
    });

    return Object.values(agrupado).map(g => ({
      ...g,
      qtdCarteiras: g.qtdCarteiras.size
    })).sort((a, b) => a.tipo.localeCompare(b.tipo));
  }, [orcadosPorCarteira, produtosArray]);

  // Consolidar dados por produto para mostrar na interface
  const dadosPorProduto = useMemo(() => {
    const consolidado = {};
    
    produtosArray.forEach(produto => {
      consolidado[produto] = orcadosPorCarteira.filter(item => item.produto === produto);
    });
    
    return consolidado;
  }, [orcadosPorCarteira, produtosArray]);

  return (
    <div>
      {/* Controle de Dia GERAL */}
      <div className="bb-card">
        <div className="bb-card-header">
          <h2 className="bb-card-title">Campo 3.1 — Orçamento Por % Atingimento (por Carteira)</h2>
          <p className="bb-card-subtitle">
            Configure o orçamento por carteira para cada produto separadamente
          </p>
        </div>

        <div style={{ marginBottom: '16px', padding: '16px', background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', borderRadius: '8px', border: '2px solid #2196f3' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Calendar size={24} color="#1565c0" />
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '4px', color: '#1565c0' }}>
                  Dia do Desafio Atual:
                </label>
                <select
                  value={diaAtual}
                  onChange={(e) => setDiaAtual(Number(e.target.value))}
                  className="bb-input"
                  style={{ maxWidth: '150px', fontSize: '16px', fontWeight: 600 }}
                >
                  {Array.from({ length: challengeDias }, (_, i) => i + 1).map(dia => (
                    <option key={dia} value={dia}>Dia {dia}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <button onClick={handleLimparTudo} className="bb-btn" style={{ background: '#dc3545', color: 'white' }}>
              <Trash2 size={16} />
              Limpar Tudo
            </button>
          </div>
        </div>
      </div>

      {/* Seção para cada produto */}
      {produtosArray.map((produto, produtoIdx) => {
        const estado = estadoPorProduto[produto] || {};
        const dadosDoProduto = dadosPorProduto[produto] || [];
        
        return (
          <div key={produto} className="bb-card" style={{ borderLeft: `4px solid ${['#1976d2', '#f57c00', '#388e3c', '#7b1fa2'][produtoIdx % 4]}` }}>
            <div className="bb-card-header" style={{ background: `${['#e3f2fd', '#fff3e0', '#e8f5e9', '#f3e5f5'][produtoIdx % 4]}` }}>
              <h2 className="bb-card-title" style={{ color: `${['#1565c0', '#e65100', '#2e7d32', '#6a1b9a'][produtoIdx % 4]}` }}>
                {produto}
              </h2>
              <p className="bb-card-subtitle">
                Cole a planilha específica para {produto}
              </p>
            </div>

            {/* Textarea */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                Cole os dados (separados por TAB):
              </label>
              <textarea
                value={estado.pastedData || ''}
                onChange={(e) => setEstadoPorProduto(prev => ({
                  ...prev,
                  [produto]: { ...prev[produto], pastedData: e.target.value }
                }))}
                placeholder={`Cole aqui dados de ${produto}:\nPrefixo\tAgência\tCarteira\tTipo\tOrçado\tRealizado\n0001\tCentral\t001\tPF\t50000\t30000`}
                className="bb-input"
                style={{ 
                  minHeight: '120px', 
                  fontFamily: 'monospace', 
                  fontSize: '12px',
                  whiteSpace: 'pre',
                  overflowX: 'auto'
                }}
              />
            </div>

            <button 
              onClick={() => handlePasteDataProduto(produto)} 
              className="bb-btn bb-btn-primary"
              style={{ marginBottom: '16px' }}
            >
              <Upload size={16} />
              Carregar Dados de {produto}
            </button>

            {/* Mapeamento de Colunas */}
            {estado.headers && estado.headers.length > 0 && (
              <div style={{ marginTop: '16px', marginBottom: '16px', padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
                  Mapeamento de Colunas - {produto}
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                  {['prefixo', 'agencia', 'carteira', 'tipoCarteira', 'orcado', 'realizado'].map(field => (
                    <div key={field}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                        {field === 'prefixo' ? 'Prefixo *' : 
                         field === 'agencia' ? 'Agência' :
                         field === 'carteira' ? 'Carteira *' : 
                         field === 'tipoCarteira' ? 'Tipo' :
                         field === 'orcado' ? 'Orçado *' : 'Realizado'}
                      </label>
                      <select
                        value={estado.columnMapping?.[field] || ''}
                        onChange={(e) => setEstadoPorProduto(prev => ({
                          ...prev,
                          [produto]: {
                            ...prev[produto],
                            columnMapping: {
                              ...prev[produto].columnMapping,
                              [field]: e.target.value
                            }
                          }
                        }))}
                        className="bb-input"
                        style={{ fontSize: '11px' }}
                      >
                        <option value="">-- Selecione --</option>
                        {estado.headers.map((h, idx) => (
                          <option key={idx} value={idx}>{h}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* % Meta do produto */}
            {estado.headers && estado.headers.length > 0 && (
              <div style={{ marginTop: '16px', marginBottom: '16px', padding: '16px', background: '#fff3e0', borderRadius: '8px', border: '2px solid #ff9800' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: '#e65100' }}>
                  <Percent size={16} style={{ display: 'inline', marginRight: '8px' }} />
                  % Meta do Desafio - {produto}
                </h4>
                
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '16px', color: '#e65100' }}>
                      {estado.metaPercentual || 100}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={estado.metaPercentual || 100}
                      onChange={(e) => setEstadoPorProduto(prev => ({
                        ...prev,
                        [produto]: { ...prev[produto], metaPercentual: Number(e.target.value) }
                      }))}
                      style={{ width: '100%', height: '8px' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#666', marginTop: '4px' }}>
                      <span>0%</span>
                      <span>100%</span>
                      <span>200%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Botão Salvar */}
            {estado.headers && estado.headers.length > 0 && (
              <button 
                onClick={() => handleSalvarDadosProduto(produto)} 
                className="bb-btn bb-btn-primary"
                style={{ width: '100%' }}
              >
                <Save size={16} />
                Salvar {produto} - Dia {diaAtual}
              </button>
            )}

            {/* Mostrar quantos registros salvos */}
            {dadosDoProduto.length > 0 && (
              <div style={{ marginTop: '16px', padding: '12px', background: '#e8f5e9', borderRadius: '8px' }}>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#2e7d32' }}>
                  ✅ {dadosDoProduto.length} carteiras salvas para {produto}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                  {Array.from(new Set(dadosDoProduto.map(d => d.dia))).sort((a, b) => a - b).map(dia => {
                    const count = dadosDoProduto.filter(d => d.dia === dia).length;
                    return (
                      <span key={dia} className="bb-badge bb-badge-success">
                        Dia {dia}: {count}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Tabelas de Resumo */}
      {orcamentoPorAgencia.length > 0 && (
        <>
          {/* Orçamento por Agência */}
          <div className="bb-card">
            <div className="bb-card-header">
              <h2 className="bb-card-title">Orçamento por Agência</h2>
              <p className="bb-card-subtitle">Soma dos orçamentos efetivos por agência</p>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Prefixo</th>
                    <th>Agência</th>
                    {produtosArray.map(produto => (
                      <th key={produto} style={{ textAlign: 'right' }}>
                        {produto}<br/>
                        <span style={{ fontSize: '11px', fontWeight: 'normal' }}>Orçado Efetivo</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orcamentoPorAgencia.map((agencia, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{agencia.prefixo}</td>
                      <td>{agencia.agencia}</td>
                      {produtosArray.map(produto => (
                        <td key={produto} style={{ textAlign: 'right', fontWeight: 600, color: 'var(--bb-blue)' }}>
                          {formatCurrency(agencia.orcadoEfetivoPorProduto[produto] || 0)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Orçamento por Tipo × Produto */}
          <div className="bb-card">
            <div className="bb-card-header">
              <h2 className="bb-card-title">Orçamento por Tipo × Produto</h2>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tipo de Carteira</th>
                    <th>Qtd. Carteiras</th>
                    {produtosArray.map(produto => (
                      <th key={produto} style={{ textAlign: 'right' }}>
                        {produto}<br/>
                        <span style={{ fontSize: '11px', fontWeight: 'normal' }}>Total Efetivo</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orcamentoPorTipo.map((tipo, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{tipo.tipo}</td>
                      <td>{tipo.qtdCarteiras} carteiras</td>
                      {produtosArray.map(produto => (
                        <td key={produto} style={{ textAlign: 'right', fontWeight: 600, color: 'var(--bb-blue)' }}>
                          {formatCurrency(tipo.orcadoEfetivoPorProduto[produto] || 0)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OrcamentoPorCarteira;

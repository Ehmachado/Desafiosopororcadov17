import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Save, Trash2, Upload, DollarSign, Percent } from 'lucide-react';
import { formatCurrency, parseNumericValue } from '../utils/dataParser';
import { toast } from 'sonner';

const OrcamentoPorCarteira = () => {
  const [carteiras] = useLocalStorage('carteiras_master', []);
  const [produtos] = useLocalStorage('challenge_produtos', []);
  const [orcadosPorCarteira, setOrcadosPorCarteira] = useLocalStorage('orcados_por_carteira_v2', []);
  const [metaPercentual, setMetaPercentual] = useLocalStorage('meta_percentual_desafio', 100);
  
  // Estados locais para textarea e mapeamento
  const [pastedData, setPastedData] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [columnMapping, setColumnMapping] = useState({
    prefixo: '',
    agencia: '',
    carteira: '',
    tipoCarteira: '',
    orcado: {}, // Objeto: { produto: colIndex }
    realizado: {} // Objeto: { produto: colIndex }
  });
  
  // Estado para slider de meta
  const [tempMetaPercentual, setTempMetaPercentual] = useState(metaPercentual);

  // Extrair tipos únicos das carteiras
  const tiposCarteira = useMemo(() => 
    [...new Set(carteiras.map(c => c.tipoCarteira).filter(Boolean))],
    [carteiras]
  );

  // Produtos em array garantido
  const produtosArray = useMemo(() => 
    Array.isArray(produtos) ? produtos : [],
    [produtos]
  );

  // Função para parsear dados colados
  const handlePasteData = useCallback(() => {
    if (!pastedData.trim()) {
      toast.error('Cole os dados na área de texto primeiro');
      return;
    }

    const lines = pastedData.trim().split('\n');
    if (lines.length < 2) {
      toast.error('Dados insuficientes. Cole pelo menos uma linha de cabeçalho e uma de dados.');
      return;
    }

    // Primeira linha = cabeçalho
    const headerLine = lines[0].split('\t');
    setHeaders(headerLine);

    // Demais linhas = dados
    const rows = lines.slice(1).map(line => {
      const cells = line.split('\t');
      return cells;
    });

    setParsedRows(rows);

    // Tentar detectar automaticamente as colunas por nome parcial
    const autoMapping = {
      prefixo: '',
      agencia: '',
      carteira: '',
      tipoCarteira: '',
      orcado: {},
      realizado: {}
    };

    headerLine.forEach((header, idx) => {
      const headerLower = header.toLowerCase().trim();
      
      // Prefixo
      if (headerLower.includes('prefixo') || headerLower.includes('prefix')) {
        autoMapping.prefixo = idx.toString();
      }
      // Agência
      if (headerLower.includes('agência') || headerLower.includes('agencia') || 
          headerLower.includes('dependência') || headerLower.includes('dependencia') ||
          headerLower.includes('nome')) {
        autoMapping.agencia = idx.toString();
      }
      // Carteira
      if (headerLower.includes('carteira') && !headerLower.includes('tipo')) {
        autoMapping.carteira = idx.toString();
      }
      // Tipo de Carteira
      if (headerLower.includes('tipo') && headerLower.includes('carteira')) {
        autoMapping.tipoCarteira = idx.toString();
      }
      
      // Orçado e Realizado por produto
      produtosArray.forEach(produto => {
        const produtoLower = produto.toLowerCase();
        
        // Orçado
        if ((headerLower.includes('orçado') || headerLower.includes('orcado') || 
             headerLower.includes('conexão') || headerLower.includes('conexao')) && 
            headerLower.includes(produtoLower)) {
          autoMapping.orcado[produto] = idx.toString();
        }
        
        // Realizado
        if (headerLower.includes('realizado') && headerLower.includes(produtoLower)) {
          autoMapping.realizado[produto] = idx.toString();
        }
      });
    });

    setColumnMapping(autoMapping);
    toast.success(`${rows.length} linhas carregadas com sucesso!`);
  }, [pastedData, produtosArray]);

  // Função para processar e salvar os dados mapeados
  const handleSalvarDados = useCallback(() => {
    if (parsedRows.length === 0) {
      toast.error('Carregue os dados primeiro');
      return;
    }

    // Validar mapeamento essencial
    if (!columnMapping.prefixo || !columnMapping.carteira) {
      toast.error('Mapeie pelo menos as colunas Prefixo e Carteira');
      return;
    }

    // Se houver produtos, deve ter pelo menos uma coluna de orçado
    if (produtosArray.length > 0 && Object.keys(columnMapping.orcado).length === 0) {
      toast.error('Mapeie pelo menos uma coluna de Orçado para os produtos');
      return;
    }

    const processedData = [];

    parsedRows.forEach((row, rowIdx) => {
      if (row.length < 2) return; // Pula linhas vazias

      const prefixo = row[parseInt(columnMapping.prefixo)] || '';
      const agencia = columnMapping.agencia ? row[parseInt(columnMapping.agencia)] : '';
      const carteira = row[parseInt(columnMapping.carteira)] || '';
      const tipoCarteira = columnMapping.tipoCarteira ? row[parseInt(columnMapping.tipoCarteira)] : '';

      if (!prefixo || !carteira) return; // Pula se não tiver essenciais

      const orcadoPorProduto = {};
      const realizadoPorProduto = {};
      const orcadoEfetivoPorProduto = {};

      produtosArray.forEach(produto => {
        // Orçado
        const orcadoColIdx = columnMapping.orcado[produto];
        const orcadoValor = orcadoColIdx ? parseNumericValue(row[parseInt(orcadoColIdx)]) : 0;
        orcadoPorProduto[produto] = orcadoValor;

        // Realizado
        const realizadoColIdx = columnMapping.realizado[produto];
        const realizadoValor = realizadoColIdx ? parseNumericValue(row[parseInt(realizadoColIdx)]) : 0;
        realizadoPorProduto[produto] = realizadoValor;

        // Orçado Efetivo = (Orçado × Meta% / 100) - Realizado
        const orcadoEfetivo = Math.max(0, (orcadoValor * metaPercentual / 100) - realizadoValor);
        orcadoEfetivoPorProduto[produto] = orcadoEfetivo;
      });

      processedData.push({
        prefixo,
        agencia,
        carteira,
        tipoCarteira,
        orcadoPorProduto,
        realizadoPorProduto,
        orcadoEfetivoPorProduto,
        metaPercentual
      });
    });

    setOrcadosPorCarteira(processedData);
    toast.success(`${processedData.length} carteiras processadas e salvas!`);
  }, [parsedRows, columnMapping, produtosArray, metaPercentual, setOrcadosPorCarteira]);

  // Função para limpar todos os dados
  const handleLimparDados = useCallback(() => {
    if (window.confirm('Tem certeza que deseja limpar todos os dados do Campo 3.1?')) {
      setOrcadosPorCarteira([]);
      setPastedData('');
      setParsedRows([]);
      setHeaders([]);
      setColumnMapping({
        prefixo: '',
        agencia: '',
        carteira: '',
        tipoCarteira: '',
        orcado: {},
        realizado: {}
      });
      toast.success('Dados limpos com sucesso!');
    }
  }, [setOrcadosPorCarteira]);

  // Atualizar meta percentual
  const handleSalvarMeta = useCallback(() => {
    setMetaPercentual(tempMetaPercentual);
    
    // Recalcular orcadoEfetivo de todos os dados existentes
    const updatedData = orcadosPorCarteira.map(item => {
      const orcadoEfetivoPorProduto = {};
      
      produtosArray.forEach(produto => {
        const orcadoValor = item.orcadoPorProduto[produto] || 0;
        const realizadoValor = item.realizadoPorProduto[produto] || 0;
        const orcadoEfetivo = Math.max(0, (orcadoValor * tempMetaPercentual / 100) - realizadoValor);
        orcadoEfetivoPorProduto[produto] = orcadoEfetivo;
      });

      return {
        ...item,
        orcadoEfetivoPorProduto,
        metaPercentual: tempMetaPercentual
      };
    });

    setOrcadosPorCarteira(updatedData);
    toast.success('Meta atualizada e orçamentos recalculados!');
  }, [tempMetaPercentual, setMetaPercentual, orcadosPorCarteira, setOrcadosPorCarteira, produtosArray]);

  // Calcular orçamento por agência (soma das carteiras)
  const orcamentoPorAgencia = useMemo(() => {
    if (orcadosPorCarteira.length === 0) return [];

    const agrupado = {};

    orcadosPorCarteira.forEach(item => {
      const key = item.prefixo;
      
      if (!agrupado[key]) {
        agrupado[key] = {
          prefixo: item.prefixo,
          agencia: item.agencia,
          totalPorProduto: {},
          orcadoEfetivoPorProduto: {}
        };
        
        produtosArray.forEach(produto => {
          agrupado[key].totalPorProduto[produto] = 0;
          agrupado[key].orcadoEfetivoPorProduto[produto] = 0;
        });
      }

      produtosArray.forEach(produto => {
        agrupado[key].totalPorProduto[produto] += item.orcadoPorProduto[produto] || 0;
        agrupado[key].orcadoEfetivoPorProduto[produto] += item.orcadoEfetivoPorProduto[produto] || 0;
      });
    });

    return Object.values(agrupado).sort((a, b) => a.prefixo.localeCompare(b.prefixo));
  }, [orcadosPorCarteira, produtosArray]);

  // Calcular orçamento por tipo de carteira × produto (como Campo 3)
  const orcamentoPorTipo = useMemo(() => {
    if (orcadosPorCarteira.length === 0 || produtosArray.length === 0) return [];

    const agrupado = {};

    orcadosPorCarteira.forEach(item => {
      const tipo = item.tipoCarteira || 'Sem Tipo';
      
      if (!agrupado[tipo]) {
        agrupado[tipo] = {
          tipo,
          qtdCarteiras: 0,
          totalPorProduto: {}
        };
        
        produtosArray.forEach(produto => {
          agrupado[tipo].totalPorProduto[produto] = 0;
        });
      }

      agrupado[tipo].qtdCarteiras += 1;

      // Distribuir o orçado efetivo igualmente entre todos os produtos
      const orcadoPorProduto = item.orcadoEfetivo / produtosArray.length;
      produtosArray.forEach(produto => {
        agrupado[tipo].totalPorProduto[produto] += orcadoPorProduto;
      });
    });

    return Object.values(agrupado).sort((a, b) => a.tipo.localeCompare(b.tipo));
  }, [orcadosPorCarteira, produtosArray]);

  return (
    <div>
      {/* Seção 1: Carregar Dados */}
      <div className="bb-card">
        <div className="bb-card-header">
          <h2 className="bb-card-title">Campo 3.1 — Orçamento Por % Atingimento (Carteira/Agência)</h2>
          <p className="bb-card-subtitle">Cole a planilha com dados de orçamento e realizado por carteira</p>
        </div>

        {produtosArray.length === 0 ? (
          <div style={{ padding: '16px', background: '#fff3cd', borderRadius: '8px', color: '#856404' }}>
            Configure os produtos primeiro no Campo 1
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--bb-gray-700)' }}>
                Cole os dados da planilha (separados por TAB):
              </label>
              <textarea
                value={pastedData}
                onChange={(e) => setPastedData(e.target.value)}
                placeholder="Cole aqui os dados copiados do Excel/Sheets...&#10;Exemplo:&#10;Prefixo	Agência	Carteira	Tipo Carteira	Orçado	Realizado&#10;0001	Agência Central	001	Pessoa Física	50000	30000&#10;0001	Agência Central	002	Pessoa Jurídica	80000	45000"
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

            <button onClick={handlePasteData} className="bb-btn bb-btn-primary" style={{ marginBottom: '24px' }}>
              <Upload size={16} />
              Carregar e Detectar Colunas
            </button>

            {/* Seção de Mapeamento de Colunas */}
            {headers.length > 0 && (
              <div style={{ marginTop: '24px', padding: '16px', background: '#f8f9fc', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--bb-blue)' }}>
                  Mapeamento de Colunas
                </h3>
                <p style={{ fontSize: '14px', color: '#6c757d', marginBottom: '16px' }}>
                  {parsedRows.length} linhas detectadas. Verifique ou ajuste o mapeamento abaixo:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  {/* Prefixo */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                      Prefixo *
                    </label>
                    <select
                      value={columnMapping.prefixo}
                      onChange={(e) => setColumnMapping(prev => ({ ...prev, prefixo: e.target.value }))}
                      className="bb-input"
                      style={{ fontSize: '12px' }}
                    >
                      <option value="">-- Selecione --</option>
                      {headers.map((h, idx) => (
                        <option key={idx} value={idx}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Agência */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                      Agência/Dependência
                    </label>
                    <select
                      value={columnMapping.agencia}
                      onChange={(e) => setColumnMapping(prev => ({ ...prev, agencia: e.target.value }))}
                      className="bb-input"
                      style={{ fontSize: '12px' }}
                    >
                      <option value="">-- Selecione --</option>
                      {headers.map((h, idx) => (
                        <option key={idx} value={idx}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Carteira */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                      Carteira *
                    </label>
                    <select
                      value={columnMapping.carteira}
                      onChange={(e) => setColumnMapping(prev => ({ ...prev, carteira: e.target.value }))}
                      className="bb-input"
                      style={{ fontSize: '12px' }}
                    >
                      <option value="">-- Selecione --</option>
                      {headers.map((h, idx) => (
                        <option key={idx} value={idx}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Tipo de Carteira */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                      Tipo de Carteira
                    </label>
                    <select
                      value={columnMapping.tipoCarteira}
                      onChange={(e) => setColumnMapping(prev => ({ ...prev, tipoCarteira: e.target.value }))}
                      className="bb-input"
                      style={{ fontSize: '12px' }}
                    >
                      <option value="">-- Selecione --</option>
                      {headers.map((h, idx) => (
                        <option key={idx} value={idx}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Orçado */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                      Orçado/Conexão *
                    </label>
                    <select
                      value={columnMapping.orcado}
                      onChange={(e) => setColumnMapping(prev => ({ ...prev, orcado: e.target.value }))}
                      className="bb-input"
                      style={{ fontSize: '12px' }}
                    >
                      <option value="">-- Selecione --</option>
                      {headers.map((h, idx) => (
                        <option key={idx} value={idx}>{h}</option>
                      ))}
                    </select>
                  </div>

                  {/* Realizado */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                      Realizado
                    </label>
                    <select
                      value={columnMapping.realizado}
                      onChange={(e) => setColumnMapping(prev => ({ ...prev, realizado: e.target.value }))}
                      className="bb-input"
                      style={{ fontSize: '12px' }}
                    >
                      <option value="">-- Selecione --</option>
                      {headers.map((h, idx) => (
                        <option key={idx} value={idx}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button onClick={handleSalvarDados} className="bb-btn bb-btn-primary">
                    <Save size={16} />
                    Processar e Salvar Dados
                  </button>
                  <button onClick={handleLimparDados} className="bb-btn" style={{ background: '#dc3545', color: 'white' }}>
                    <Trash2 size={16} />
                    Limpar Tudo
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Seção 2: Controle de % Meta do Desafio */}
      {orcadosPorCarteira.length > 0 && (
        <div className="bb-card">
          <div className="bb-card-header">
            <h2 className="bb-card-title">
              <Percent size={20} style={{ display: 'inline', marginRight: '8px' }} />
              % Meta do Desafio
            </h2>
            <p className="bb-card-subtitle">
              Ajuste o percentual da meta para personalizar o orçamento efetivo
            </p>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
              <input
                type="range"
                min="0"
                max="200"
                step="1"
                value={tempMetaPercentual}
                onChange={(e) => setTempMetaPercentual(parseInt(e.target.value))}
                style={{ flex: 1, height: '8px' }}
              />
              <input
                type="number"
                min="0"
                max="200"
                value={tempMetaPercentual}
                onChange={(e) => setTempMetaPercentual(parseInt(e.target.value) || 0)}
                className="bb-input"
                style={{ width: '100px', textAlign: 'center', fontWeight: 600, fontSize: '18px' }}
              />
              <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--bb-blue)' }}>%</span>
            </div>

            <p style={{ fontSize: '13px', color: '#6c757d', marginBottom: '12px' }}>
              <strong>Cálculo:</strong> Orçado Efetivo = (Orçado × {tempMetaPercentual}% / 100) - Realizado
            </p>

            <button onClick={handleSalvarMeta} className="bb-btn bb-btn-primary">
              <Save size={16} />
              Aplicar Meta e Recalcular
            </button>
          </div>
        </div>
      )}

      {/* Seção 3: Orçamento por Agência */}
      {orcamentoPorAgencia.length > 0 && (
        <div className="bb-card">
          <div className="bb-card-header">
            <h2 className="bb-card-title">Orçamento por Agência</h2>
            <p className="bb-card-subtitle">Soma dos orçamentos efetivos de todas as carteiras por agência</p>
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
                        {formatCurrency(agencia.totalPorProduto[produto] || 0)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Seção 4: Orçamento por Tipo de Carteira × Produto (similar ao Campo 3) */}
      {orcamentoPorTipo.length > 0 && (
        <div className="bb-card">
          <div className="bb-card-header">
            <h2 className="bb-card-title">Orçamento por Tipo de Carteira × Produto</h2>
            <p className="bb-card-subtitle">Distribuição dos orçamentos efetivos por tipo e produto (similar ao Campo 3)</p>
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
                      <span style={{ fontSize: '11px', fontWeight: 'normal' }}>Orçado Efetivo</span>
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
                        {formatCurrency(tipo.totalPorProduto[produto] || 0)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mensagem quando não há dados */}
      {orcadosPorCarteira.length === 0 && headers.length === 0 && (
        <div className="bb-card">
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--bb-gray-600)' }}>
            <DollarSign size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>Nenhum dado carregado</p>
            <p style={{ fontSize: '14px' }}>Cole os dados da planilha acima para começar</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrcamentoPorCarteira;

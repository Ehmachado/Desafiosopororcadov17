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
  const [metaPercentual, setMetaPercentual] = useLocalStorage('meta_percentual_desafio', 100);
  
  // Estados locais
  const [pastedData, setPastedData] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [diaAtual, setDiaAtual] = useState(1);
  const [columnMapping, setColumnMapping] = useState({
    prefixo: '',
    agencia: '',
    carteira: '',
    tipoCarteira: '',
    orcado: {},
    realizado: {}
  });
  
  const [tempMetaPercentual, setTempMetaPercentual] = useState(metaPercentual);

  // Produtos em array garantido
  const produtosArray = useMemo(() => 
    Array.isArray(produtos) ? produtos : [],
    [produtos]
  );

  // Se não houver produtos, mostrar mensagem
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

    const headerLine = lines[0].split('\t');
    setHeaders(headerLine);

    const rows = lines.slice(1).map(line => line.split('\t'));
    setParsedRows(rows);

    // Auto-detect columns
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
      
      produtosArray.forEach(produto => {
        const produtoLower = produto.toLowerCase();
        
        if ((headerLower.includes('orçado') || headerLower.includes('orcado') || 
             headerLower.includes('conexão') || headerLower.includes('conexao')) && 
            headerLower.includes(produtoLower)) {
          autoMapping.orcado[produto] = idx.toString();
        }
        
        if (headerLower.includes('realizado') && headerLower.includes(produtoLower)) {
          autoMapping.realizado[produto] = idx.toString();
        }
      });
    });

    setColumnMapping(autoMapping);
    toast.success(`${rows.length} linhas carregadas com sucesso!`);
  }, [pastedData, produtosArray]);

  // Função para salvar dados
  const handleSalvarDados = useCallback(() => {
    if (parsedRows.length === 0) {
      toast.error('Carregue os dados primeiro');
      return;
    }

    if (!columnMapping.prefixo || !columnMapping.carteira) {
      toast.error('Mapeie pelo menos as colunas Prefixo e Carteira');
      return;
    }

    if (produtosArray.length > 0 && Object.keys(columnMapping.orcado || {}).length === 0) {
      toast.error('Mapeie pelo menos uma coluna de Orçado para os produtos');
      return;
    }

    const processedData = [];

    parsedRows.forEach((row) => {
      if (row.length < 2) return;

      const prefixo = row[parseInt(columnMapping.prefixo)] || '';
      const agencia = columnMapping.agencia ? row[parseInt(columnMapping.agencia)] : '';
      const carteira = row[parseInt(columnMapping.carteira)] || '';
      const tipoCarteira = columnMapping.tipoCarteira ? row[parseInt(columnMapping.tipoCarteira)] : '';

      if (!prefixo || !carteira) return;

      const orcadoPorProduto = {};
      const realizadoPorProduto = {};
      const orcadoEfetivoPorProduto = {};

      produtosArray.forEach(produto => {
        const orcadoColIdx = columnMapping.orcado?.[produto];
        const orcadoValor = orcadoColIdx ? parseNumericValue(row[parseInt(orcadoColIdx)]) : 0;
        orcadoPorProduto[produto] = orcadoValor;

        const realizadoColIdx = columnMapping.realizado?.[produto];
        const realizadoValor = realizadoColIdx ? parseNumericValue(row[parseInt(realizadoColIdx)]) : 0;
        realizadoPorProduto[produto] = realizadoValor;

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
        metaPercentual,
        dia: diaAtual
      });
    });

    // Remover dados do mesmo dia e adicionar novos
    const dadosOutrosDias = orcadosPorCarteira.filter(item => item.dia !== diaAtual);
    setOrcadosPorCarteira([...dadosOutrosDias, ...processedData]);
    toast.success(`${processedData.length} carteiras do Dia ${diaAtual} salvas!`);
  }, [parsedRows, columnMapping, produtosArray, metaPercentual, diaAtual, orcadosPorCarteira, setOrcadosPorCarteira]);

  // Função para limpar dados
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

  // Função para atualizar meta
  const handleSalvarMeta = useCallback(() => {
    setMetaPercentual(tempMetaPercentual);
    
    const updatedData = orcadosPorCarteira.map(item => {
      const orcadoEfetivoPorProduto = {};
      
      produtosArray.forEach(produto => {
        const orcadoValor = item.orcadoPorProduto?.[produto] || 0;
        const realizadoValor = item.realizadoPorProduto?.[produto] || 0;
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

      produtosArray.forEach(produto => {
        agrupado[key].orcadoEfetivoPorProduto[produto] += item.orcadoEfetivoPorProduto?.[produto] || 0;
      });
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
          qtdCarteiras: 0,
          orcadoEfetivoPorProduto: {}
        };
        
        produtosArray.forEach(produto => {
          agrupado[tipo].orcadoEfetivoPorProduto[produto] = 0;
        });
      }

      agrupado[tipo].qtdCarteiras += 1;

      produtosArray.forEach(produto => {
        agrupado[tipo].orcadoEfetivoPorProduto[produto] += item.orcadoEfetivoPorProduto?.[produto] || 0;
      });
    });

    return Object.values(agrupado).sort((a, b) => a.tipo.localeCompare(b.tipo));
  }, [orcadosPorCarteira, produtosArray]);

  return (
    <div>
      {/* Seção 1: Carregar Dados */}
      <div className="bb-card">
        <div className="bb-card-header">
          <h2 className="bb-card-title">Campo 3.1 — Orçamento Por % Atingimento (por Carteira)</h2>
          <p className="bb-card-subtitle">
            Cole dados da planilha com orçado e realizado por carteira e produto
          </p>
        </div>

        {/* Controle de Dia */}
        <div style={{ marginBottom: '16px', padding: '16px', background: '#e3f2fd', borderRadius: '8px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Calendar size={20} color="#1976d2" />
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
                Dia do Desafio:
              </label>
              <select
                value={diaAtual}
                onChange={(e) => setDiaAtual(Number(e.target.value))}
                className="bb-input"
                style={{ maxWidth: '150px' }}
              >
                {Array.from({ length: challengeDias }, (_, i) => i + 1).map(dia => (
                  <option key={dia} value={dia}>Dia {dia}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
            Cole os dados (separados por TAB):
          </label>
          <textarea
            value={pastedData}
            onChange={(e) => setPastedData(e.target.value)}
            placeholder="Cole aqui os dados copiados do Excel/Sheets...&#10;Exemplo (múltiplos produtos):&#10;Prefixo	Agência	Carteira	Tipo	Orçado Vida	Realizado Vida	Orçado Prestamista	Realizado Prestamista&#10;0001	Central	001	PF	5000	3000	8000	6000"
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

        <button onClick={handlePasteData} className="bb-btn bb-btn-primary">
          <Upload size={16} />
          Carregar e Detectar Colunas
        </button>

        {/* Mapeamento de Colunas */}
        {headers.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>
              Mapeamento de Colunas
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              {['prefixo', 'agencia', 'carteira', 'tipoCarteira'].map(field => (
                <div key={field}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    {field === 'prefixo' ? 'Prefixo *' : 
                     field === 'agencia' ? 'Agência/Dependência' :
                     field === 'carteira' ? 'Carteira *' : 
                     'Tipo de Carteira'}
                  </label>
                  <select
                    value={columnMapping[field]}
                    onChange={(e) => setColumnMapping(prev => ({ ...prev, [field]: e.target.value }))}
                    className="bb-input"
                    style={{ fontSize: '12px' }}
                  >
                    <option value="">-- Selecione --</option>
                    {headers.map((h, idx) => (
                      <option key={idx} value={idx}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Mapeamento por Produto */}
            {produtosArray.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--bb-blue)' }}>
                  Orçado e Realizado por Produto
                </h4>
                
                {produtosArray.map(produto => (
                  <div key={produto} style={{ 
                    marginBottom: '12px', 
                    padding: '12px', 
                    background: 'white', 
                    borderRadius: '6px',
                    border: '1px solid #e0e0e0'
                  }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#333' }}>
                      {produto}
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', color: '#666' }}>
                          Orçado
                        </label>
                        <select
                          value={columnMapping.orcado?.[produto] || ''}
                          onChange={(e) => setColumnMapping(prev => ({
                            ...prev,
                            orcado: { ...(prev.orcado || {}), [produto]: e.target.value }
                          }))}
                          className="bb-input"
                          style={{ fontSize: '12px' }}
                        >
                          <option value="">-- Selecione --</option>
                          {headers.map((h, idx) => (
                            <option key={idx} value={idx}>{h}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', color: '#666' }}>
                          Realizado
                        </label>
                        <select
                          value={columnMapping.realizado?.[produto] || ''}
                          onChange={(e) => setColumnMapping(prev => ({
                            ...prev,
                            realizado: { ...(prev.realizado || {}), [produto]: e.target.value }
                          }))}
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
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button onClick={handleSalvarDados} className="bb-btn bb-btn-primary">
                <Save size={16} />
                Salvar Dia {diaAtual}
              </button>
              <button onClick={handleLimparDados} className="bb-btn" style={{ background: '#dc3545', color: 'white' }}>
                <Trash2 size={16} />
                Limpar Tudo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Seção 2: Controle de % Meta */}
      {orcadosPorCarteira.length > 0 && (
        <div className="bb-card">
          <div className="bb-card-header">
            <h2 className="bb-card-title">% Meta do Desafio</h2>
            <p className="bb-card-subtitle">Ajuste o percentual de meta aplicado aos orçamentos</p>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                Percentual: {tempMetaPercentual}%
              </label>
              <input
                type="range"
                min="0"
                max="200"
                value={tempMetaPercentual}
                onChange={(e) => setTempMetaPercentual(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
            <button onClick={handleSalvarMeta} className="bb-btn bb-btn-primary">
              <Save size={16} />
              Aplicar Meta
            </button>
          </div>
        </div>
      )}

      {/* Seção 3: Orçamento por Agência */}
      {orcamentoPorAgencia.length > 0 && (
        <div className="bb-card">
          <div className="bb-card-header">
            <h2 className="bb-card-title">Orçamento por Agência</h2>
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
                        {formatCurrency(agencia.orcadoEfetivoPorProduto?.[produto] || 0)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Seção 4: Orçamento por Tipo × Produto */}
      {orcamentoPorTipo.length > 0 && (
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
                        {formatCurrency(tipo.orcadoEfetivoPorProduto?.[produto] || 0)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resumo de Dados Salvos */}
      {orcadosPorCarteira.length > 0 && (
        <div className="bb-card">
          <div className="bb-card-header">
            <h2 className="bb-card-title">Dados Salvos por Dia</h2>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {Array.from({ length: challengeDias }, (_, i) => i + 1).map(dia => {
              const count = orcadosPorCarteira.filter(item => item.dia === dia).length;
              return count > 0 ? (
                <span key={dia} className="bb-badge bb-badge-success">
                  Dia {dia}: {count} registros
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrcamentoPorCarteira;

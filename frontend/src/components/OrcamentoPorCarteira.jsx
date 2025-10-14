import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Save, Trash2, FileText, Percent, AlertCircle } from 'lucide-react';
import { formatCurrency, parseNumericValue } from '../utils/dataParser';
import { toast } from 'sonner';

const OrcamentoPorCarteira = () => {
  const [orcadosPorCarteira, setOrcadosPorCarteira] = useLocalStorage('orcados_por_carteira', []);
  const [fatorMeta, setFatorMeta] = useLocalStorage('fator_meta_desafio', 100);
  
  const [rawData, setRawData] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);

  // Detectar colunas automaticamente
  const detectColumns = useCallback((headers) => {
    const autoMapping = {};
    
    headers.forEach((header, index) => {
      const normalized = header.toLowerCase().trim();
      
      if (!autoMapping.prefixo && (normalized.includes('prefixo') || normalized.includes('pref'))) {
        autoMapping.prefixo = index;
      } else if (!autoMapping.agencia && (normalized.includes('agencia') || normalized.includes('agência') || normalized.includes('depend'))) {
        autoMapping.agencia = index;
      } else if (!autoMapping.carteira && normalized.includes('carteira') && !normalized.includes('tipo')) {
        autoMapping.carteira = index;
      } else if (!autoMapping.tipoCarteira && normalized.includes('tipo')) {
        autoMapping.tipoCarteira = index;
      } else if (!autoMapping.orcado && (normalized.includes('orcado') || normalized.includes('orçado') || normalized.includes('conexao') || normalized.includes('conexão'))) {
        autoMapping.orcado = index;
      } else if (!autoMapping.realizado && (normalized.includes('realizado') || normalized.includes('realizada'))) {
        autoMapping.realizado = index;
      }
    });
    
    return autoMapping;
  }, []);

  // Processar dados com debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (rawData.trim()) {
        setIsProcessing(true);
        
        // Processar de forma assíncrona
        setTimeout(() => {
          try {
            const lines = rawData.trim().split('\n');
            const parsed = lines.slice(0, 1000).map(line => line.split('\t')); // Limitar a 1000 linhas
            
            setParsedRows(parsed);
            
            if (parsed.length > 0) {
              const headers = parsed[0];
              const mapping = detectColumns(headers);
              
              if (Object.keys(mapping).length >= 5) {
                setColumnMapping(mapping);
              }
            }
          } catch (error) {
            console.error('Erro ao processar dados:', error);
            toast.error('Erro ao processar dados. Verifique o formato.');
          } finally {
            setIsProcessing(false);
          }
        }, 100);
      } else {
        setParsedRows([]);
        setColumnMapping({});
      }
    }, 500); // Debounce de 500ms

    return () => clearTimeout(timer);
  }, [rawData, detectColumns]);

  const handleSave = useCallback(() => {
    if (parsedRows.length === 0) {
      toast.error('Cole os dados primeiro');
      return;
    }

    if (Object.keys(columnMapping).length < 5) {
      toast.error('Configure todas as colunas obrigatórias');
      return;
    }

    setIsProcessing(true);
    
    // Processar em chunks para não travar
    setTimeout(() => {
      try {
        const data = [];
        const dataRows = parsedRows.slice(1); // Pular cabeçalho
        
        for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i];
          if (row.length < 2) continue;

          const prefixo = row[columnMapping.prefixo] || '';
          const agencia = row[columnMapping.agencia] || '';
          const carteira = row[columnMapping.carteira] || '';
          const tipoCarteira = row[columnMapping.tipoCarteira] || '';
          const orcadoStr = row[columnMapping.orcado] || '0';
          const realizadoStr = row[columnMapping.realizado] || '0';

          if (prefixo && carteira) {
            const orcadoBruto = parseNumericValue(orcadoStr);
            const realizado = parseNumericValue(realizadoStr);
            const orcadoComMeta = orcadoBruto * (fatorMeta / 100);
            const orcadoEfetivo = Math.max(0, orcadoComMeta - realizado);

            data.push({
              prefixo: prefixo.trim(),
              agencia: agencia.trim(),
              carteira: carteira.trim(),
              tipoCarteira: tipoCarteira.trim(),
              orcadoBruto,
              realizado,
              orcadoEfetivo,
              fatorMeta
            });
          }
        }

        setOrcadosPorCarteira(data);
        toast.success(`${data.length} carteiras salvas com sucesso!`);
      } catch (error) {
        console.error('Erro ao salvar:', error);
        toast.error('Erro ao salvar dados');
      } finally {
        setIsProcessing(false);
      }
    }, 100);
  }, [parsedRows, columnMapping, fatorMeta, setOrcadosPorCarteira]);

  const handleClear = useCallback(() => {
    if (window.confirm('Tem certeza que deseja limpar todos os dados?')) {
      setRawData('');
      setParsedRows([]);
      setColumnMapping({});
      setOrcadosPorCarteira([]);
      toast.success('Dados limpos!');
    }
  }, [setOrcadosPorCarteira]);

  // Calcular agregações usando useMemo para performance
  const { orcamentosAgencia, porTipo, totalGeral } = useMemo(() => {
    const orcamentosAgencia = {};
    const porTipo = {};

    orcadosPorCarteira.forEach(item => {
      // Por agência
      const prefixo = item.prefixo;
      if (!orcamentosAgencia[prefixo]) {
        orcamentosAgencia[prefixo] = {
          prefixo,
          agencia: item.agencia,
          totalOrcadoBruto: 0,
          totalRealizado: 0,
          totalOrcadoEfetivo: 0,
          qtdCarteiras: 0
        };
      }
      orcamentosAgencia[prefixo].totalOrcadoBruto += item.orcadoBruto;
      orcamentosAgencia[prefixo].totalRealizado += item.realizado;
      orcamentosAgencia[prefixo].totalOrcadoEfetivo += item.orcadoEfetivo;
      orcamentosAgencia[prefixo].qtdCarteiras += 1;

      // Por tipo
      const tipo = item.tipoCarteira;
      if (!porTipo[tipo]) {
        porTipo[tipo] = {
          tipo,
          qtdCarteiras: 0,
          totalOrcadoBruto: 0,
          totalRealizado: 0,
          totalOrcadoEfetivo: 0
        };
      }
      porTipo[tipo].qtdCarteiras += 1;
      porTipo[tipo].totalOrcadoBruto += item.orcadoBruto;
      porTipo[tipo].totalRealizado += item.realizado;
      porTipo[tipo].totalOrcadoEfetivo += item.orcadoEfetivo;
    });

    const agenciasList = Object.values(orcamentosAgencia).sort((a, b) => a.prefixo.localeCompare(b.prefixo));
    const totalGeral = agenciasList.reduce((sum, a) => sum + a.totalOrcadoEfetivo, 0);

    return {
      orcamentosAgencia: agenciasList,
      porTipo,
      totalGeral
    };
  }, [orcadosPorCarteira]);

  const requiredFields = [
    { id: 'prefixo', label: 'Prefixo', mapped: columnMapping.prefixo !== undefined },
    { id: 'agencia', label: 'Agência', mapped: columnMapping.agencia !== undefined },
    { id: 'carteira', label: 'Carteira', mapped: columnMapping.carteira !== undefined },
    { id: 'tipoCarteira', label: 'Tipo', mapped: columnMapping.tipoCarteira !== undefined },
    { id: 'orcado', label: 'Orçado', mapped: columnMapping.orcado !== undefined },
    { id: 'realizado', label: 'Realizado', mapped: columnMapping.realizado !== undefined }
  ];

  return (
    <div>
      <div className="bb-card">
        <div className="bb-card-header">
          <h2 className="bb-card-title">Campo 3.1 — Orçamento Por % Atingimento (por Carteira/Agência)</h2>
          <p className="bb-card-subtitle">Cole planilha com orçamento e realizado por carteira | Suporta até 1000 linhas</p>
        </div>

        {/* Loading indicator */}
        {isProcessing && (
          <div style={{ padding: '12px', background: '#fff3cd', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            Processando dados... Aguarde.
          </div>
        )}

        {/* Textarea para colar dados */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
            Cole os dados da planilha (Tab separado):
          </label>
          <textarea
            value={rawData}
            onChange={(e) => setRawData(e.target.value)}
            className="bb-input"
            placeholder="Prefixo  Agência  Carteira  Tipo  Orçado  Realizado"
            rows={6}
            style={{ fontFamily: 'monospace', fontSize: '12px' }}
            data-testid="orcamento-carteira-textarea"
            disabled={isProcessing}
          />
          <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
            {parsedRows.length > 0 && `${parsedRows.length - 1} linhas detectadas (${parsedRows.length > 1000 ? 'limitado a 1000' : 'ok'})`}
          </p>
        </div>

        {/* Mapeamento de colunas simplificado */}
        {parsedRows.length > 0 && (
          <div style={{ marginBottom: '24px', padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Mapeamento de Colunas:</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {requiredFields.map(field => (
                <div key={field.id}>
                  <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>{field.label}:</label>
                  <select
                    value={columnMapping[field.id] !== undefined ? columnMapping[field.id] : ''}
                    onChange={(e) => setColumnMapping(prev => ({ ...prev, [field.id]: parseInt(e.target.value) }))}
                    className="bb-input"
                    style={{ fontSize: '12px' }}
                  >
                    <option value="">Selecione...</option>
                    {parsedRows[0]?.map((col, idx) => (
                      <option key={idx} value={idx}>Col {idx + 1}: {col.substring(0, 20)}</option>
                    ))}
                  </select>
                  {field.mapped && <span style={{ fontSize: '11px', color: 'green' }}>✓</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* % Meta do Desafio */}
        <div style={{ marginBottom: '24px', padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
          <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600, fontSize: '14px' }}>
            <Percent size={16} style={{ display: 'inline', marginRight: '8px' }} />
            % Meta do Desafio:
          </label>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <input
              type="range"
              min="0"
              max="200"
              value={fatorMeta}
              onChange={(e) => setFatorMeta(parseInt(e.target.value))}
              style={{ flex: 1 }}
            />
            <input
              type="number"
              value={fatorMeta}
              onChange={(e) => setFatorMeta(parseInt(e.target.value) || 100)}
              className="bb-input"
              min="0"
              max="200"
              style={{ width: '80px' }}
            />
            <span style={{ fontWeight: 600, fontSize: '18px', minWidth: '50px' }}>{fatorMeta}%</span>
          </div>
          <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '8px' }}>
            Fórmula: (Orçado × {fatorMeta}%) - Realizado = Orçado Efetivo
          </p>
        </div>

        {/* Botões */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleSave} className="bb-btn bb-btn-primary" disabled={isProcessing} data-testid="save-orcamento-carteira-btn">
            <Save size={16} />
            {isProcessing ? 'Processando...' : 'Salvar Orçamentos'}
          </button>
          <button onClick={handleClear} className="bb-btn" style={{ background: '#dc3545', color: 'white' }} disabled={isProcessing}>
            <Trash2 size={16} />
            Limpar Dados
          </button>
        </div>
      </div>

      {/* Planilha: Orçamento por Tipo */}
      {Object.keys(porTipo).length > 0 && (
        <div className="bb-card">
          <div className="bb-card-header">
            <h2 className="bb-card-title">Orçamento por Tipo de Carteira</h2>
            <p className="bb-card-subtitle">Fórmula: (Orçado × {fatorMeta}%) - Realizado</p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tipo de Carteira</th>
                  <th>Qtd. Carteiras</th>
                  <th>Orçado Bruto</th>
                  <th>Realizado</th>
                  <th>Orçado Efetivo</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(porTipo).map(item => (
                  <tr key={item.tipo}>
                    <td style={{ fontWeight: 600 }}>{item.tipo}</td>
                    <td>{item.qtdCarteiras}</td>
                    <td>{formatCurrency(item.totalOrcadoBruto)}</td>
                    <td>{formatCurrency(item.totalRealizado)}</td>
                    <td style={{ fontWeight: 600, color: 'var(--bb-blue)' }}>
                      {formatCurrency(item.totalOrcadoEfetivo)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Planilha: Orçamento por Agência */}
      {orcamentosAgencia.length > 0 && (
        <div className="bb-card">
          <div className="bb-card-header">
            <h2 className="bb-card-title">Orçamento por Agência</h2>
            <p className="bb-card-subtitle">Fórmula: (Orçado × {fatorMeta}%) - Realizado</p>
          </div>

          <div style={{ padding: '16px', background: '#e3f2fd', borderRadius: '8px', marginBottom: '16px' }}>
            <p style={{ fontSize: '14px', marginBottom: '4px' }}>Total Geral (Orçado Efetivo):</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--bb-blue)' }}>
              {formatCurrency(totalGeral)}
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Prefixo</th>
                  <th>Agência</th>
                  <th>Qtd. Carteiras</th>
                  <th>Orçado Bruto</th>
                  <th>Realizado</th>
                  <th>Orçado Efetivo</th>
                </tr>
              </thead>
              <tbody>
                {orcamentosAgencia.slice(0, 100).map(agencia => (
                  <tr key={agencia.prefixo}>
                    <td style={{ fontWeight: 600 }}>{agencia.prefixo}</td>
                    <td>{agencia.agencia}</td>
                    <td>{agencia.qtdCarteiras}</td>
                    <td>{formatCurrency(agencia.totalOrcadoBruto)}</td>
                    <td>{formatCurrency(agencia.totalRealizado)}</td>
                    <td style={{ fontWeight: 600, color: 'var(--bb-blue)' }}>
                      {formatCurrency(agencia.totalOrcadoEfetivo)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orcamentosAgencia.length > 100 && (
              <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '8px', textAlign: 'center' }}>
                Mostrando primeiras 100 agências de {orcamentosAgencia.length} total
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrcamentoPorCarteira;

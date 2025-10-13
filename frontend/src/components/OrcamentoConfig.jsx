import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { TrendingUp, Save, DollarSign } from 'lucide-react';
import { parseTabDelimited, detectColumns, mapRowsToObjects, parseNumericValue, formatCurrency } from '../utils/dataParser';
import { calculatePotencialPorTipo, calculatePotencialTotal } from '../utils/calculations';
import ColumnMapper from './ColumnMapper';
import DataPreview from './DataPreview';
import { toast } from 'sonner';

const OrcamentoConfig = () => {
  const [produtos] = useLocalStorage('challenge_produtos', []);
  const [carteiras] = useLocalStorage('carteiras_master', []);
  const [orcadosPorTipo, setOrcadosPorTipo] = useLocalStorage('orcados_por_tipo', []);
  const [orcadosPorCarteira, setOrcadosPorCarteira] = useLocalStorage('orcados_por_carteira', []);
  const [metaPercentual, setMetaPercentual] = useLocalStorage('meta_percentual', 100);
  
  // Usar localStorage para auto-save dos valores digitados
  const [tipoOrcamentos, setTipoOrcamentos] = useLocalStorage('tipo_orcamentos_temp', {});
  const [inputTextCarteira, setInputTextCarteira] = useState('');
  const [parsedRowsCarteira, setParsedRowsCarteira] = useState([]);
  const [columnMappingCarteira, setColumnMappingCarteira] = useState({});
  const [previewDataCarteira, setPreviewDataCarteira] = useState([]);

  const tiposCarteira = [...new Set(carteiras.map(c => c.tipoCarteira).filter(Boolean))];

  // Sincronizar com orcadosPorTipo quando houver mudanças (carregar valores salvos)
  useEffect(() => {
    // Apenas sincronizar se tipoOrcamentos estiver vazio
    if (Object.keys(tipoOrcamentos).length === 0 && orcadosPorTipo.length > 0) {
      const existing = {};
      orcadosPorTipo.forEach(o => {
        const key = `${o.produto}-${o.tipoCarteira}`;
        existing[key] = o.valor;
      });
      setTipoOrcamentos(existing);
    }
  }, [orcadosPorTipo]);

  // Adicionar chaves para novos produtos quando mudarem
  useEffect(() => {
    if (produtos.length > 0 && tiposCarteira.length > 0) {
      setTipoOrcamentos(prev => {
        const updated = { ...prev };
        produtos.forEach(produto => {
          tiposCarteira.forEach(tipo => {
            const key = `${produto}-${tipo}`;
            if (!(key in updated)) {
              updated[key] = 0;
            }
          });
        });
        return updated;
      });
    }
  }, [produtos, tiposCarteira]);

  useEffect(() => {
    if (inputTextCarteira.trim()) {
      const rows = parseTabDelimited(inputTextCarteira);
      setParsedRowsCarteira(rows);
      const detected = detectColumns(rows, ['Prefixo', 'Carteira', 'TipoCarteira', 'Conexao']);
      setColumnMappingCarteira(detected);
    } else {
      setParsedRowsCarteira([]);
      setColumnMappingCarteira({});
      setPreviewDataCarteira([]);
    }
  }, [inputTextCarteira]);

  useEffect(() => {
    if (parsedRowsCarteira.length > 0 && Object.keys(columnMappingCarteira).length > 0) {
      const mapped = mapRowsToObjects(parsedRowsCarteira, columnMappingCarteira);
      const formatted = mapped.map(row => ({
        prefixo: row.Prefixo || '',
        carteira: row.Carteira || '',
        tipoCarteira: row.TipoCarteira || '',
        valor: parseNumericValue(row.Conexao),
        fatorMeta: metaPercentual
      }));
      setPreviewDataCarteira(formatted);
    }
  }, [parsedRowsCarteira, columnMappingCarteira, metaPercentual]);

  const handleTipoOrcamentoChange = (produto, tipo, valor) => {
    const key = `${produto}-${tipo}`;
    setTipoOrcamentos(prev => ({
      ...prev,
      [key]: parseNumericValue(valor)
    }));
  };

  const handleSaveTipo = () => {
    const orcados = [];
    Object.entries(tipoOrcamentos).forEach(([key, valor]) => {
      const [produto, tipoCarteira] = key.split('-');
      if (valor > 0) {
        orcados.push({ produto, tipoCarteira, valor });
      }
    });
    setOrcadosPorTipo(orcados);
    toast.success('Orçamentos por tipo salvos com sucesso!');
  };

  const handleSaveCarteira = () => {
    if (previewDataCarteira.length === 0) {
      toast.error('Nenhum dado para salvar');
      return;
    }
    setOrcadosPorCarteira(previewDataCarteira);
    setInputTextCarteira('');
    toast.success(`${previewDataCarteira.length} orçamentos por carteira salvos!`);
  };

  const potencialTotal = calculatePotencialTotal(carteiras, orcadosPorTipo);

  return (
    <div>
      {/* Seção 1: Orçamento por Tipo de Carteira + Produtos */}
      <div className="bb-card">
        <div className="bb-card-header">
          <h2 className="bb-card-title" data-testid="orcamento-tipo-title">Campo 3.1 — Orçamento por Tipo de Carteira</h2>
          <p className="bb-card-subtitle">Defina o orçamento para cada tipo de carteira e produto</p>
        </div>

        {produtos.length === 0 && (
          <div style={{ padding: '16px', background: '#fff3cd', borderRadius: '8px', color: '#856404' }}>
            Configure os produtos primeiro no Campo 1
          </div>
        )}

        {produtos.length > 0 && tiposCarteira.length === 0 && (
          <div style={{ padding: '16px', background: '#fff3cd', borderRadius: '8px', color: '#856404' }}>
            Carregue as carteiras primeiro no Campo 2
          </div>
        )}

        {produtos.length > 0 && tiposCarteira.length > 0 && (
          <div>
            {produtos.map(produto => (
              <div key={produto} style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--bb-blue)', marginBottom: '12px' }}>
                  {produto}
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Tipo de Carteira</th>
                        <th style={{ minWidth: '200px' }}>Orçado (R$)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tiposCarteira.map(tipo => {
                        const key = `${produto}-${tipo}`;
                        return (
                          <tr key={tipo}>
                            <td>{tipo}</td>
                            <td>
                              <input
                                type="number"
                                value={tipoOrcamentos[key] || ''}
                                onChange={(e) => handleTipoOrcamentoChange(produto, tipo, e.target.value)}
                                className="bb-input"
                                placeholder="0.00"
                                step="0.01"
                                style={{ maxWidth: '180px' }}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            <button
              onClick={handleSaveTipo}
              className="bb-btn bb-btn-primary"
              data-testid="save-orcamento-tipo-btn"
            >
              <Save size={16} />
              Salvar Orçamentos por Tipo
            </button>
          </div>
        )}
      </div>

      {/* Seção 2: Orçamento Por % Atingimento (por Carteira) */}
      <div className="bb-card">
        <div className="bb-card-header">
          <h2 className="bb-card-title" data-testid="orcamento-carteira-title">Campo 3.2 — Orçamento Por % Atingimento (por Carteira)</h2>
          <p className="bb-card-subtitle">Cole os dados de orçamento por carteira e defina o % Meta</p>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--bb-gray-700)' }}>
            % Meta do Desafio:
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <input
              type="range"
              min="0"
              max="200"
              value={metaPercentual}
              onChange={(e) => setMetaPercentual(parseInt(e.target.value))}
              style={{ flex: 1, maxWidth: '400px' }}
            />
            <input
              type="number"
              value={metaPercentual}
              onChange={(e) => setMetaPercentual(parseInt(e.target.value) || 100)}
              className="bb-input"
              style={{ maxWidth: '100px' }}
              min="0"
              max="200"
            />
            <span style={{ fontWeight: 600, color: 'var(--bb-blue)' }}>%</span>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--bb-gray-700)' }}>
            Cole os dados (TAB delimitado):
          </label>
          <textarea
            value={inputTextCarteira}
            onChange={(e) => setInputTextCarteira(e.target.value)}
            placeholder="Cole aqui: Prefixo, Agência, Carteira, Tipo de Carteira, Conexão/Orçado"
            className="bb-textarea"
            rows={6}
            data-testid="orcamento-carteira-textarea"
          />
        </div>

        {parsedRowsCarteira.length > 0 && (
          <ColumnMapper
            targetColumns={['Prefixo', 'Carteira', 'TipoCarteira', 'Conexao']}
            detectedMapping={columnMappingCarteira}
            availableColumns={parsedRowsCarteira[0] || []}
            onMappingChange={setColumnMappingCarteira}
          />
        )}

        {previewDataCarteira.length > 0 && (
          <DataPreview
            data={previewDataCarteira}
            columns={[
              { key: 'prefixo', label: 'Prefixo' },
              { key: 'carteira', label: 'Carteira' },
              { key: 'tipoCarteira', label: 'Tipo' },
              { key: 'valor', label: 'Orçado' }
            ]}
            maxRows={10}
          />
        )}

        <button
          onClick={handleSaveCarteira}
          className="bb-btn bb-btn-primary"
          disabled={previewDataCarteira.length === 0}
          data-testid="save-orcamento-carteira-btn"
        >
          <Save size={16} />
          Salvar Orçamentos por Carteira ({previewDataCarteira.length})
        </button>
      </div>

      {/* Seção 3: Legenda de Potencial */}
      <div className="bb-card">
        <div className="bb-card-header">
          <h2 className="bb-card-title" data-testid="potencial-title">Campo 3.3 — Potencial de Seguridade</h2>
          <p className="bb-card-subtitle">Cálculo automático baseado em carteiras e orçamentos</p>
        </div>

        <div style={{ padding: '20px', background: 'linear-gradient(135deg, var(--bb-blue) 0%, var(--bb-blue-light) 100%)', borderRadius: '12px', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <DollarSign size={32} />
            <div>
              <p style={{ fontSize: '14px', opacity: 0.9 }}>Potencial Total de Seguridade</p>
              <p style={{ fontSize: '32px', fontWeight: 700 }}>{formatCurrency(potencialTotal)}</p>
            </div>
          </div>
          <p style={{ fontSize: '13px', opacity: 0.8, marginTop: '8px' }}>
            {carteiras.length} carteiras × orçamentos por produto
          </p>
        </div>

        {tiposCarteira.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--bb-gray-700)', marginBottom: '12px' }}>
              Potencial por Tipo de Carteira:
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
              {tiposCarteira.map(tipo => {
                const numCarteiras = carteiras.filter(c => c.tipoCarteira === tipo).length;
                const potencial = calculatePotencialPorTipo(tipo, carteiras, orcadosPorTipo);
                return (
                  <div key={tipo} style={{ padding: '12px', background: 'var(--bb-gray-50)', borderRadius: '8px', border: '1px solid var(--bb-gray-200)' }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--bb-blue)', marginBottom: '4px' }}>{tipo}</p>
                    <p style={{ fontSize: '13px', color: 'var(--bb-gray-600)' }}>
                      {numCarteiras} carteiras × {formatCurrency(potencial / numCarteiras || 0)}
                    </p>
                    <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--bb-gray-900)', marginTop: '4px' }}>
                      {formatCurrency(potencial)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrcamentoConfig;

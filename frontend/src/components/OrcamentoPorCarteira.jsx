import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Save, Trash2, FileText, Percent } from 'lucide-react';
import { formatCurrency, parseNumericValue } from '../utils/dataParser';
import { toast } from 'sonner';
import ColumnMapper from './ColumnMapper';
import DataPreview from './DataPreview';

const OrcamentoPorCarteira = () => {
  const [produtos] = useLocalStorage('challenge_produtos', []);
  const [carteiras] = useLocalStorage('carteiras_master', []);
  const [orcadosPorCarteira, setOrcadosPorCarteira] = useLocalStorage('orcados_por_carteira', []);
  const [fatorMeta, setFatorMeta] = useLocalStorage('fator_meta_desafio', 100);
  
  const [rawData, setRawData] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [showMapper, setShowMapper] = useState(false);

  const requiredFields = [
    { id: 'prefixo', label: 'Prefixo' },
    { id: 'agencia', label: 'Agência/Dependência' },
    { id: 'carteira', label: 'Carteira' },
    { id: 'tipoCarteira', label: 'Tipo de Carteira' },
    { id: 'valor', label: 'Orçado/Conexão' }
  ];

  useEffect(() => {
    if (rawData.trim()) {
      const lines = rawData.trim().split('\n');
      const parsed = lines.map(line => {
        const cols = line.split('\t');
        return cols;
      });
      setParsedRows(parsed);

      // Auto-detect columns
      if (parsed.length > 0) {
        const headers = parsed[0];
        const autoMapping = {};

        headers.forEach((header, index) => {
          const normalized = header.toLowerCase().trim();
          
          if (normalized.includes('prefixo') || normalized.includes('pref')) {
            autoMapping.prefixo = index;
          } else if (normalized.includes('agencia') || normalized.includes('agência') || normalized.includes('depend')) {
            autoMapping.agencia = index;
          } else if (normalized.includes('carteira')) {
            autoMapping.carteira = index;
          } else if (normalized.includes('tipo')) {
            autoMapping.tipoCarteira = index;
          } else if (normalized.includes('orcado') || normalized.includes('orçado') || normalized.includes('conexao') || normalized.includes('conexão') || normalized.includes('valor')) {
            autoMapping.valor = index;
          }
        });

        if (Object.keys(autoMapping).length >= 4) {
          setColumnMapping(autoMapping);
          setShowMapper(false);
        } else {
          setShowMapper(true);
        }
      }
    }
  }, [rawData]);

  const handleSave = () => {
    if (parsedRows.length === 0 || Object.keys(columnMapping).length === 0) {
      toast.error('Cole os dados e configure as colunas primeiro');
      return;
    }

    const data = [];
    parsedRows.slice(1).forEach(row => {
      if (row.length < 2) return;

      const prefixo = row[columnMapping.prefixo] || '';
      const agencia = row[columnMapping.agencia] || '';
      const carteira = row[columnMapping.carteira] || '';
      const tipoCarteira = row[columnMapping.tipoCarteira] || '';
      const valorStr = row[columnMapping.valor] || '0';

      if (prefixo && carteira) {
        data.push({
          prefixo: prefixo.trim(),
          agencia: agencia.trim(),
          carteira: carteira.trim(),
          tipoCarteira: tipoCarteira.trim(),
          valor: parseNumericValue(valorStr),
          fatorMeta: fatorMeta
        });
      }
    });

    setOrcadosPorCarteira(data);
    toast.success(`${data.length} carteiras salvas com sucesso!`);
  };

  const handleClear = () => {
    if (window.confirm('Tem certeza que deseja limpar todos os dados?')) {
      setRawData('');
      setParsedRows([]);
      setColumnMapping({});
      setOrcadosPorCarteira([]);
      toast.success('Dados limpos!');
    }
  };

  // Calcular orçamento por agência
  const calcularOrcamentoPorAgencia = () => {
    const orcamentosAgencia = {};

    orcadosPorCarteira.forEach(item => {
      const prefixo = item.prefixo;
      const metaEfetiva = item.valor * (item.fatorMeta / 100);

      if (!orcamentosAgencia[prefixo]) {
        orcamentosAgencia[prefixo] = {
          prefixo,
          agencia: item.agencia,
          total: 0,
          carteiras: []
        };
      }

      orcamentosAgencia[prefixo].total += metaEfetiva;
      orcamentosAgencia[prefixo].carteiras.push({
        carteira: item.carteira,
        tipo: item.tipoCarteira,
        orcado: item.valor,
        meta: metaEfetiva
      });
    });

    return Object.values(orcamentosAgencia).sort((a, b) => a.prefixo.localeCompare(b.prefixo));
  };

  // Calcular orçamento por tipo × produto
  const calcularPorTipoProduto = () => {
    const resultado = {};

    // Agrupar por tipo de carteira
    const porTipo = {};
    orcadosPorCarteira.forEach(item => {
      const tipo = item.tipoCarteira;
      if (!porTipo[tipo]) {
        porTipo[tipo] = [];
      }
      porTipo[tipo].push(item);
    });

    // Para cada tipo, calcular total
    Object.entries(porTipo).forEach(([tipo, carteiras]) => {
      const totalOrcado = carteiras.reduce((sum, c) => sum + c.valor, 0);
      const totalMeta = carteiras.reduce((sum, c) => sum + (c.valor * (c.fatorMeta / 100)), 0);

      resultado[tipo] = {
        tipo,
        qtdCarteiras: carteiras.length,
        totalOrcado,
        totalMeta
      };
    });

    return resultado;
  };

  const orcamentosAgencia = calcularOrcamentoPorAgencia();
  const porTipo = calcularPorTipoProduto();
  const totalGeral = orcamentosAgencia.reduce((sum, a) => sum + a.total, 0);

  return (
    <div>
      <div className="bb-card">
        <div className="bb-card-header">
          <h2 className="bb-card-title">Campo 3.1 — Orçamento Por % Atingimento (por Carteira/Agência)</h2>
          <p className="bb-card-subtitle">Cole planilha com orçamento por carteira e defina % de meta</p>
        </div>

        {/* Textarea para colar dados */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
            Cole os dados da planilha (Tab/CSV):
          </label>
          <textarea
            value={rawData}
            onChange={(e) => setRawData(e.target.value)}
            className="bb-input"
            placeholder="Cole aqui os dados: Prefixo  Agência  Carteira  Tipo  Orçado"
            rows={8}
            style={{ fontFamily: 'monospace', fontSize: '12px' }}
            data-testid="orcamento-carteira-textarea"
          />
        </div>

        {/* Column Mapper */}
        {showMapper && parsedRows.length > 0 && (
          <ColumnMapper
            parsedRows={parsedRows}
            columnMapping={columnMapping}
            setColumnMapping={setColumnMapping}
            requiredFields={requiredFields}
          />
        )}

        {/* Data Preview */}
        {parsedRows.length > 0 && Object.keys(columnMapping).length > 0 && (
          <DataPreview
            parsedRows={parsedRows}
            columnMapping={columnMapping}
            requiredFields={requiredFields}
          />
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
              style={{ width: '100px' }}
            />
            <span style={{ fontWeight: 600, fontSize: '18px', minWidth: '60px' }}>{fatorMeta}%</span>
          </div>
          <p style={{ fontSize: '12px', color: '#6c757d', marginTop: '8px' }}>
            Meta efetiva = Orçado × {fatorMeta}%
          </p>
        </div>

        {/* Botões */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleSave} className="bb-btn bb-btn-primary" data-testid="save-orcamento-carteira-btn">
            <Save size={16} />
            Salvar Orçamentos
          </button>
          <button onClick={handleClear} className="bb-btn" style={{ background: '#dc3545', color: 'white' }}>
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
            <p className="bb-card-subtitle">Resumo por tipo com meta efetiva ({fatorMeta}%)</p>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Tipo de Carteira</th>
                <th>Qtd. Carteiras</th>
                <th>Total Orçado</th>
                <th>Meta Efetiva ({fatorMeta}%)</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(porTipo).map(item => (
                <tr key={item.tipo}>
                  <td style={{ fontWeight: 600 }}>{item.tipo}</td>
                  <td>{item.qtdCarteiras}</td>
                  <td>{formatCurrency(item.totalOrcado)}</td>
                  <td style={{ fontWeight: 600, color: 'var(--bb-blue)' }}>
                    {formatCurrency(item.totalMeta)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Planilha: Orçamento por Agência */}
      {orcamentosAgencia.length > 0 && (
        <div className="bb-card">
          <div className="bb-card-header">
            <h2 className="bb-card-title">Orçamento por Agência</h2>
            <p className="bb-card-subtitle">Meta efetiva por agência ({fatorMeta}%)</p>
          </div>

          <div style={{ padding: '16px', background: '#e3f2fd', borderRadius: '8px', marginBottom: '16px' }}>
            <p style={{ fontSize: '14px', marginBottom: '4px' }}>Total Geral (Meta Efetiva):</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--bb-blue)' }}>
              {formatCurrency(totalGeral)}
            </p>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Prefixo</th>
                <th>Agência</th>
                <th>Qtd. Carteiras</th>
                <th>Meta Efetiva</th>
              </tr>
            </thead>
            <tbody>
              {orcamentosAgencia.map(agencia => (
                <tr key={agencia.prefixo}>
                  <td style={{ fontWeight: 600 }}>{agencia.prefixo}</td>
                  <td>{agencia.agencia}</td>
                  <td>{agencia.carteiras.length}</td>
                  <td style={{ fontWeight: 600, color: 'var(--bb-blue)' }}>
                    {formatCurrency(agencia.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OrcamentoPorCarteira;

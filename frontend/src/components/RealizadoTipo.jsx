import React, { useState, useEffect, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { TrendingUp, Save, Trash2, Calendar } from 'lucide-react';
import { parseTabDelimited, detectColumns, mapRowsToObjects, parseNumericValue } from '../utils/dataParser';
import ColumnMapper from './ColumnMapper';
import DataPreview from './DataPreview';
import { toast } from 'sonner';

const RealizadoTipo = () => {
  const [produtos] = useLocalStorage('challenge_produtos', []);
  const [diasDesafio] = useLocalStorage('challenge_dias', 1);
  const [realizados, setRealizados] = useLocalStorage('realizados_tipo', []);
  const [realizadosDiarios, setRealizadosDiarios] = useLocalStorage('realizados_tipo_diarios', []);
  const [selectedDay, setSelectedDay] = useState(1);
  const [currentProduto, setCurrentProduto] = useState('');
  const [inputText, setInputText] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [previewData, setPreviewData] = useState([]);

  const produtosComVidinha = [...produtos];
  if (produtos.includes('Vida') && !produtosComVidinha.includes('Vidinha')) {
    const vidaIndex = produtosComVidinha.indexOf('Vida');
    produtosComVidinha.splice(vidaIndex + 1, 0, 'Vidinha');
  }

  useEffect(() => {
    if (inputText.trim()) {
      const rows = parseTabDelimited(inputText);
      setParsedRows(rows);
      const detected = detectColumns(rows, ['Prefixo', 'Valor']);
      setColumnMapping(detected);
    } else {
      setParsedRows([]);
      setColumnMapping({});
      setPreviewData([]);
    }
  }, [inputText]);

  useEffect(() => {
    if (parsedRows.length > 0 && Object.keys(columnMapping).length > 0 && currentProduto) {
      const mapped = mapRowsToObjects(parsedRows, columnMapping);
      const formatted = mapped.map(row => ({
        prefixo: row.Prefixo || '',
        produto: currentProduto,
        valor: parseNumericValue(row.Valor)
      }));
      setPreviewData(formatted);
    }
  }, [parsedRows, columnMapping, currentProduto]);

  const handleSave = () => {
    if (previewData.length === 0) {
      toast.error('Nenhum dado para salvar');
      return;
    }
    
    const updated = realizados.filter(r => r.produto !== currentProduto);
    setRealizados([...updated, ...previewData]);
    setInputText('');
    toast.success(`Realizado de ${currentProduto} salvo com sucesso!`);
  };

  return (
    <div className="bb-card">
      <div className="bb-card-header">
        <h2 className="bb-card-title" data-testid="realizado-tipo-title">Campo 5 — Realizado por Tipo de Seguro</h2>
        <p className="bb-card-subtitle">Cole os dados de realizado por produto (Prefixo, Valor)</p>
      </div>

      {produtos.length === 0 && (
        <div style={{ padding: '16px', background: '#fff3cd', borderRadius: '8px', color: '#856404' }}>
          Configure os produtos primeiro no Campo 1
        </div>
      )}

      {produtos.length > 0 && (
        <div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--bb-gray-700)' }}>
              Selecione o Produto:
            </label>
            <select
              value={currentProduto}
              onChange={(e) => setCurrentProduto(e.target.value)}
              className="bb-input"
              style={{ maxWidth: '300px' }}
              data-testid="produto-select"
            >
              <option value="">Selecione um produto</option>
              {produtosComVidinha.map(produto => (
                <option key={produto} value={produto}>{produto}</option>
              ))}
            </select>
          </div>

          {currentProduto && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--bb-gray-700)' }}>
                  Cole os dados (TAB delimitado):
                </label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Cole aqui: Prefixo, Valor"
                  className="bb-textarea"
                  rows={8}
                  data-testid="realizado-tipo-textarea"
                />
              </div>

              {parsedRows.length > 0 && (
                <ColumnMapper
                  targetColumns={['Prefixo', 'Valor']}
                  detectedMapping={columnMapping}
                  availableColumns={parsedRows[0] || []}
                  onMappingChange={setColumnMapping}
                />
              )}

              {previewData.length > 0 && (
                <DataPreview
                  data={previewData}
                  columns={[
                    { key: 'prefixo', label: 'Prefixo' },
                    { key: 'produto', label: 'Produto' },
                    { key: 'valor', label: 'Valor' }
                  ]}
                  maxRows={10}
                />
              )}

              <button
                onClick={handleSave}
                className="bb-btn bb-btn-primary"
                disabled={previewData.length === 0}
                data-testid="save-realizado-tipo-btn"
              >
                <Save size={16} />
                Salvar Realizado de {currentProduto} ({previewData.length})
              </button>
            </div>
          )}
        </div>
      )}

      {realizados.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--bb-blue)', marginBottom: '12px' }}>
            Dados Salvos ({realizados.length} registros)
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            {produtosComVidinha.map(produto => {
              const count = realizados.filter(r => r.produto === produto).length;
              if (count === 0) return null;
              return (
                <span key={produto} className="bb-badge bb-badge-success">
                  {produto}: {count} registros
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default RealizadoTipo;

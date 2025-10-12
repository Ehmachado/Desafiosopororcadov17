import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { BarChart3, Save, Trash2 } from 'lucide-react';
import { parseTabDelimited, detectColumns, mapRowsToObjects } from '../utils/dataParser';
import ColumnMapper from './ColumnMapper';
import DataPreview from './DataPreview';
import { toast } from 'sonner';

const TARGET_COLUMNS = ['Prefixo', 'Agencia', 'Rede'];

const RedesConfig = () => {
  const [redes, setRedes] = useLocalStorage('redes', []);
  const [inputText, setInputText] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [previewData, setPreviewData] = useState([]);

  useEffect(() => {
    if (inputText.trim()) {
      const rows = parseTabDelimited(inputText);
      setParsedRows(rows);
      const detected = detectColumns(rows, TARGET_COLUMNS);
      setColumnMapping(detected);
    } else {
      setParsedRows([]);
      setColumnMapping({});
      setPreviewData([]);
    }
  }, [inputText]);

  useEffect(() => {
    if (parsedRows.length > 0 && Object.keys(columnMapping).length > 0) {
      const mapped = mapRowsToObjects(parsedRows, columnMapping);
      const formatted = mapped.map(row => ({
        prefixo: row.Prefixo || '',
        agencia: row.Agencia || '',
        rede: row.Rede || ''
      }));
      setPreviewData(formatted);
    }
  }, [parsedRows, columnMapping]);

  const handleSave = () => {
    if (previewData.length === 0) {
      toast.error('Nenhum dado para salvar');
      return;
    }
    setRedes(previewData);
    setInputText('');
    toast.success(`${previewData.length} redes salvas com sucesso!`);
  };

  const handleClear = () => {
    setRedes([]);
    setInputText('');
    setParsedRows([]);
    setColumnMapping({});
    setPreviewData([]);
    toast.success('Dados limpos');
  };

  const redesUnicas = [...new Set(redes.map(r => r.rede).filter(Boolean))];

  return (
    <div className="bb-card">
      <div className="bb-card-header">
        <h2 className="bb-card-title" data-testid="redes-config-title">Campo 4 — Redes da Super Regional</h2>
        <p className="bb-card-subtitle">Relacione cada prefixo/agência com sua rede</p>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--bb-gray-700)' }}>
          Cole os dados (TAB delimitado):
        </label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Cole aqui os dados com colunas: Prefixo, Agência, Rede"
          className="bb-textarea"
          rows={8}
          data-testid="redes-textarea"
        />
      </div>

      {parsedRows.length > 0 && (
        <ColumnMapper
          targetColumns={TARGET_COLUMNS}
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
            { key: 'agencia', label: 'Agência' },
            { key: 'rede', label: 'Rede' }
          ]}
          maxRows={10}
        />
      )}

      <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
        <button
          onClick={handleSave}
          className="bb-btn bb-btn-primary"
          disabled={previewData.length === 0}
          data-testid="save-redes-btn"
        >
          <Save size={16} />
          Salvar Redes ({previewData.length})
        </button>
        <button
          onClick={handleClear}
          className="bb-btn bb-btn-outline"
          disabled={redes.length === 0}
          data-testid="clear-redes-btn"
        >
          <Trash2 size={16} />
          Limpar Dados
        </button>
      </div>

      {redes.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <div style={{ padding: '16px', background: 'var(--bb-gray-50)', borderRadius: '8px', borderLeft: '4px solid var(--bb-blue)' }}>
            <p style={{ fontSize: '14px', color: 'var(--bb-gray-700)', marginBottom: '8px' }}>
              <strong>Total de registros:</strong> {redes.length}
            </p>
            <p style={{ fontSize: '14px', color: 'var(--bb-gray-700)', marginBottom: '8px' }}>
              <strong>Redes únicas:</strong> {redesUnicas.length}
            </p>
            <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {redesUnicas.map(rede => (
                <span key={rede} className="bb-badge bb-badge-info">
                  {rede} ({redes.filter(r => r.rede === rede).length})
                </span>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '16px', maxHeight: '300px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Prefixo</th>
                  <th>Agência</th>
                  <th>Rede</th>
                </tr>
              </thead>
              <tbody>
                {redes.slice(0, 50).map((r, idx) => (
                  <tr key={idx}>
                    <td>{r.prefixo}</td>
                    <td>{r.agencia}</td>
                    <td>{r.rede}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {redes.length > 50 && (
              <p style={{ textAlign: 'center', padding: '12px', color: 'var(--bb-gray-600)', fontSize: '14px' }}>
                Mostrando 50 de {redes.length} registros
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RedesConfig;

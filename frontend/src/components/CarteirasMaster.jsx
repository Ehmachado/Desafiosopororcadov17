import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Database, Trash2, Save } from 'lucide-react';
import { parseTabDelimited, detectColumns, mapRowsToObjects } from '../utils/dataParser';
import ColumnMapper from './ColumnMapper';
import DataPreview from './DataPreview';
import { toast } from 'sonner';

const TARGET_COLUMNS = ['Prefixo', 'Agência', 'Carteira', 'TipoCarteira'];

const CarteirasMaster = () => {
  const [carteiras, setCarteiras] = useLocalStorage('carteiras_master', []);
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
        agencia: row.Agência || '',
        carteira: row.Carteira || '',
        tipoCarteira: row.TipoCarteira || ''
      }));
      setPreviewData(formatted);
    }
  }, [parsedRows, columnMapping]);

  const handleSave = () => {
    if (previewData.length === 0) {
      toast.error('Nenhum dado para salvar');
      return;
    }
    setCarteiras(previewData);
    setInputText('');
    toast.success(`${previewData.length} carteiras salvas com sucesso!`);
  };

  const handleClear = () => {
    setCarteiras([]);
    setInputText('');
    setParsedRows([]);
    setColumnMapping({});
    setPreviewData([]);
    toast.success('Dados limpos');
  };

  const tiposCarteira = [...new Set(carteiras.map(c => c.tipoCarteira).filter(Boolean))];

  return (
    <div className="bb-card">
      <div className="bb-card-header">
        <h2 className="bb-card-title" data-testid="carteiras-master-title">Campo 2 — Carteiras da Regional (Base Mestre)</h2>
        <p className="bb-card-subtitle">Cole os dados das carteiras no formato TAB/CSV</p>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--bb-gray-700)' }}>
          Cole os dados (TAB delimitado):
        </label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Cole aqui os dados com colunas: Prefixo, Agência/Dependência/Nome, Carteira, Tipo de Carteira"
          className="bb-textarea"
          rows={8}
          data-testid="carteiras-textarea"
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
            { key: 'carteira', label: 'Carteira' },
            { key: 'tipoCarteira', label: 'Tipo de Carteira' }
          ]}
          maxRows={10}
        />
      )}

      <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
        <button
          onClick={handleSave}
          className="bb-btn bb-btn-primary"
          disabled={previewData.length === 0}
          data-testid="save-carteiras-btn"
        >
          <Save size={16} />
          Salvar Carteiras ({previewData.length})
        </button>
        <button
          onClick={handleClear}
          className="bb-btn bb-btn-outline"
          disabled={carteiras.length === 0}
          data-testid="clear-carteiras-btn"
        >
          <Trash2 size={16} />
          Limpar Dados
        </button>
      </div>

      {carteiras.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <div style={{ padding: '16px', background: 'var(--bb-gray-50)', borderRadius: '8px', borderLeft: '4px solid var(--bb-blue)' }}>
            <p style={{ fontSize: '14px', color: 'var(--bb-gray-700)', marginBottom: '8px' }}>
              <strong>Total de carteiras:</strong> {carteiras.length}
            </p>
            <p style={{ fontSize: '14px', color: 'var(--bb-gray-700)', marginBottom: '8px' }}>
              <strong>Tipos de carteira:</strong> {tiposCarteira.length}
            </p>
            <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {tiposCarteira.map(tipo => (
                <span key={tipo} className="bb-badge bb-badge-info">
                  {tipo}
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
                  <th>Carteira</th>
                  <th>Tipo</th>
                </tr>
              </thead>
              <tbody>
                {carteiras.slice(0, 50).map((c, idx) => (
                  <tr key={idx}>
                    <td>{c.prefixo}</td>
                    <td>{c.agencia}</td>
                    <td>{c.carteira}</td>
                    <td>{c.tipoCarteira}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {carteiras.length > 50 && (
              <p style={{ textAlign: 'center', padding: '12px', color: 'var(--bb-gray-600)', fontSize: '14px' }}>
                Mostrando 50 de {carteiras.length} carteiras
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CarteirasMaster;

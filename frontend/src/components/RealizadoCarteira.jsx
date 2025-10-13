import React, { useState, useEffect, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Database, Save, Trash2, Calendar, TrendingUp } from 'lucide-react';
import { parseTabDelimited, detectColumns, mapRowsToObjects, parseNumericValue } from '../utils/dataParser';
import ColumnMapper from './ColumnMapper';
import DataPreview from './DataPreview';
import { toast } from 'sonner';

const TARGET_COLUMNS = ['Prefixo', 'Carteira', 'TipoCarteira', 'Valor'];

const RealizadoCarteira = () => {
  const [diasDesafio] = useLocalStorage('challenge_dias', 1);
  const [realizados, setRealizados] = useLocalStorage('realizados_carteira', []);
  const [realizadosDiarios, setRealizadosDiarios] = useLocalStorage('realizados_carteira_diarios', []);
  const [selectedDay, setSelectedDay] = useState(1);
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
        carteira: row.Carteira || '',
        tipoCarteira: row.TipoCarteira || '',
        valor: parseNumericValue(row.Valor)
      }));
      setPreviewData(formatted);
    }
  }, [parsedRows, columnMapping]);

  const handleSave = () => {
    if (previewData.length === 0) {
      toast.error('Nenhum dado para salvar');
      return;
    }
    setRealizados(previewData);
    setInputText('');
    toast.success(`${previewData.length} realizados por carteira salvos!`);
  };

  return (
    <div className="bb-card">
      <div className="bb-card-header">
        <h2 className="bb-card-title" data-testid="realizado-carteira-title">Campo 6 — Realizado por Carteira</h2>
        <p className="bb-card-subtitle">Cole os dados de realizado por carteira</p>
      </div>

      <div style={{ marginBottom: '16px', padding: '12px', background: '#d1ecf1', borderRadius: '8px', color: '#0c5460', fontSize: '14px' }}>
        <strong>Importante:</strong> Os dados deste campo habilitam a unidade "Carteiras" no Ranking. Sem dados, apenas "Agência" estará disponível.
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--bb-gray-700)' }}>
          Cole os dados (TAB delimitado):
        </label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Cole aqui: Prefixo, Carteira, Tipo de Carteira, Valor"
          className="bb-textarea"
          rows={8}
          data-testid="realizado-carteira-textarea"
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
            { key: 'carteira', label: 'Carteira' },
            { key: 'tipoCarteira', label: 'Tipo' },
            { key: 'valor', label: 'Valor' }
          ]}
          maxRows={10}
        />
      )}

      <button
        onClick={handleSave}
        className="bb-btn bb-btn-primary"
        disabled={previewData.length === 0}
        data-testid="save-realizado-carteira-btn"
      >
        <Save size={16} />
        Salvar Realizado por Carteira ({previewData.length})
      </button>

      {realizados.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <div style={{ padding: '16px', background: 'var(--bb-gray-50)', borderRadius: '8px', borderLeft: '4px solid var(--bb-blue)' }}>
            <p style={{ fontSize: '14px', color: 'var(--bb-gray-700)' }}>
              <strong>Total de registros:</strong> {realizados.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealizadoCarteira;

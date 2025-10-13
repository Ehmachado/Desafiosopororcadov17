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

  const handleSaveDiario = () => {
    if (previewData.length === 0) {
      toast.error('Nenhum dado para salvar');
      return;
    }

    // Remove dados do mesmo dia antes de salvar
    const updated = realizadosDiarios.filter(r => r.dia !== selectedDay);

    const dailyData = previewData.map(item => ({
      ...item,
      dia: selectedDay
    }));

    setRealizadosDiarios([...updated, ...dailyData]);
    setInputText('');
    toast.success(`Realizado diário do Dia ${selectedDay} por carteira salvo!`);
  };

  const handleClearDiario = () => {
    const updated = realizadosDiarios.filter(r => r.dia !== selectedDay);
    setRealizadosDiarios(updated);
    toast.success(`Dados do Dia ${selectedDay} por carteira removidos!`);
  };

  // Calcular acumulado total por carteira
  const realizadoAcumulado = useMemo(() => {
    const acumulado = [];
    const porCarteira = {};

    realizadosDiarios
      .filter(r => r.dia <= selectedDay)
      .forEach(r => {
        const key = `${r.prefixo}_${r.carteira}_${r.tipoCarteira}`;
        if (!porCarteira[key]) {
          porCarteira[key] = {
            prefixo: r.prefixo,
            carteira: r.carteira,
            tipoCarteira: r.tipoCarteira,
            valor: 0
          };
        }
        porCarteira[key].valor += r.valor;
      });

    return Object.values(porCarteira);
  }, [realizadosDiarios, selectedDay]);

  return (
    <div className="bb-card">
      <div className="bb-card-header">
        <h2 className="bb-card-title" data-testid="realizado-carteira-title">Campo 6 — Realizado por Carteira</h2>
        <p className="bb-card-subtitle">Cole os dados de realizado por carteira</p>
      </div>

      <div style={{ marginBottom: '16px', padding: '12px', background: '#d1ecf1', borderRadius: '8px', color: '#0c5460', fontSize: '14px' }}>
        <strong>Importante:</strong> Os dados deste campo habilitam a unidade "Carteiras" no Ranking. Sem dados, apenas "Agência" estará disponível.
      </div>

      {/* Controle Diário */}
      <div style={{ 
        marginBottom: '24px', 
        padding: '20px', 
        background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
        borderRadius: '12px',
        border: '2px solid #2196f3'
      }}>
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: 700, 
          color: '#1565c0', 
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Calendar size={20} />
          Controle Diário do Desafio
        </h3>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#1565c0' }}>
              Dia do Desafio:
            </label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(Number(e.target.value))}
              className="bb-input"
              style={{ maxWidth: '150px' }}
              data-testid="day-select-carteira"
            >
              {Array.from({ length: diasDesafio }, (_, i) => i + 1).map(day => (
                <option key={day} value={day}>Dia {day}</option>
              ))}
            </select>
          </div>
          <div style={{ 
            padding: '12px 20px', 
            background: 'white', 
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <span style={{ fontSize: '14px', color: '#666', display: 'block' }}>
              Visualizando até:
            </span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#1565c0' }}>
              Dia {selectedDay} de {diasDesafio}
            </span>
          </div>
        </div>
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

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={handleSaveDiario}
          className="bb-btn bb-btn-primary"
          disabled={previewData.length === 0}
          data-testid="save-realizado-carteira-diario-btn"
        >
          <Save size={16} />
          Salvar Dia {selectedDay} - Carteira ({previewData.length})
        </button>
        <button
          onClick={handleClearDiario}
          className="bb-btn"
          style={{ 
            background: '#dc3545', 
            color: 'white',
            border: 'none'
          }}
          data-testid="clear-realizado-carteira-diario-btn"
        >
          <Trash2 size={16} />
          Limpar Dia {selectedDay} - Carteira
        </button>
      </div>

      {/* Realizado Acumulado */}
      {realizadoAcumulado.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
            padding: '20px',
            borderRadius: '12px',
            border: '2px solid #ff9800',
            marginBottom: '16px'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: 700, 
              color: '#e65100', 
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <TrendingUp size={20} />
              Realizado Total Acumulado até Dia {selectedDay}
            </h3>
            <p style={{ fontSize: '14px', color: '#bf360c' }}>
              Este é o valor que será usado no Ranking (Campo 8)
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="bb-table">
              <thead>
                <tr>
                  <th>Prefixo</th>
                  <th>Carteira</th>
                  <th>Tipo Carteira</th>
                  <th>Valor Acumulado</th>
                </tr>
              </thead>
              <tbody>
                {realizadoAcumulado
                  .sort((a, b) => a.prefixo.localeCompare(b.prefixo))
                  .map((item, index) => (
                    <tr key={index}>
                      <td>{item.prefixo}</td>
                      <td>{item.carteira}</td>
                      <td>
                        <span className="bb-badge bb-badge-primary">
                          {item.tipoCarteira}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--bb-blue)' }}>
                        {item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dados Diários Salvos */}
      {realizadosDiarios.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--bb-blue)', marginBottom: '12px' }}>
            Dados Diários Salvos
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {Array.from({ length: diasDesafio }, (_, i) => i + 1).map(dia => {
              const countDia = realizadosDiarios.filter(r => r.dia === dia).length;
              if (countDia === 0) return null;
              return (
                <span key={dia} className="bb-badge bb-badge-success">
                  Dia {dia}: {countDia} registros
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default RealizadoCarteira;

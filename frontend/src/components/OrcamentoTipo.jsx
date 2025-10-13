import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { DollarSign, Save, Trash2 } from 'lucide-react';
import { parseNumericValue, formatCurrency } from '../utils/dataParser';
import { toast } from 'sonner';

const OrcamentoTipo = () => {
  const [produtos] = useLocalStorage('challenge_produtos', []);
  const [carteiras] = useLocalStorage('carteiras_master', []);
  const [orcadosPorTipo, setOrcadosPorTipo] = useLocalStorage('orcados_por_tipo', []);
  
  const [orcamentos, setOrcamentos] = useState({});

  const tiposCarteira = [...new Set(carteiras.map(c => c.tipoCarteira).filter(Boolean))];

  // Carregar orçamentos salvos
  useEffect(() => {
    const loaded = {};
    orcadosPorTipo.forEach(o => {
      loaded[o.tipoCarteira] = o.valor;
    });
    setOrcamentos(loaded);
  }, []);

  const handleOrcamentoChange = (tipo, valor) => {
    setOrcamentos(prev => ({
      ...prev,
      [tipo]: parseNumericValue(valor)
    }));
  };

  const handleSave = () => {
    const orcados = [];
    Object.entries(orcamentos).forEach(([tipo, valor]) => {
      if (valor > 0) {
        orcados.push({
          tipoCarteira: tipo,
          valor: parseFloat(valor)
        });
      }
    });
    
    if (orcados.length === 0) {
      toast.error('Defina pelo menos um orçamento');
      return;
    }
    
    setOrcadosPorTipo(orcados);
    toast.success(`${orcados.length} orçamentos salvos!`);
  };

  const handleClear = () => {
    setOrcamentos({});
    setOrcadosPorTipo([]);
    toast.success('Orçamentos limpos!');
  };

  if (produtos.length === 0) {
    return (
      <div className="bb-card">
        <div className="bb-card-header">
          <h2 className="bb-card-title">Campo 3.1 — Orçamento por Tipo de Carteira</h2>
        </div>
        <div style={{ padding: '16px', background: '#fff3cd', borderRadius: '8px', color: '#856404' }}>
          Configure os produtos primeiro no Campo 1
        </div>
      </div>
    );
  }

  if (tiposCarteira.length === 0) {
    return (
      <div className="bb-card">
        <div className="bb-card-header">
          <h2 className="bb-card-title">Campo 3.1 — Orçamento por Tipo de Carteira</h2>
        </div>
        <div style={{ padding: '16px', background: '#fff3cd', borderRadius: '8px', color: '#856404' }}>
          Carregue as carteiras primeiro no Campo 2
        </div>
      </div>
    );
  }

  return (
    <div className="bb-card">
      <div className="bb-card-header">
        <h2 className="bb-card-title">Campo 3.1 — Orçamento por Tipo de Carteira</h2>
        <p className="bb-card-subtitle">
          Defina o orçamento base para cada tipo de carteira. Este valor será multiplicado pela quantidade de carteiras no cálculo do potencial.
        </p>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <div style={{
          padding: '16px',
          background: '#e3f2fd',
          borderRadius: '8px',
          marginBottom: '16px',
          border: '1px solid #2196f3'
        }}>
          <strong style={{ color: '#1565c0' }}>Produtos Selecionados:</strong>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
            {produtos.map(p => (
              <span key={p} className="bb-badge bb-badge-primary">{p}</span>
            ))}
          </div>
        </div>

        <table className="bb-table">
          <thead>
            <tr>
              <th>Tipo de Carteira</th>
              <th>Quantidade</th>
              <th style={{ minWidth: '200px' }}>Orçamento Base (R$)</th>
            </tr>
          </thead>
          <tbody>
            {tiposCarteira.map(tipo => {
              const qtd = carteiras.filter(c => c.tipoCarteira === tipo).length;
              return (
                <tr key={tipo}>
                  <td style={{ fontWeight: 600 }}>{tipo}</td>
                  <td>{qtd} carteiras</td>
                  <td>
                    <input
                      type="number"
                      value={orcamentos[tipo] || ''}
                      onChange={(e) => handleOrcamentoChange(tipo, e.target.value)}
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

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={handleSave}
          className="bb-btn bb-btn-primary"
          data-testid="save-orcamento-tipo-btn"
        >
          <Save size={16} />
          Salvar Orçamentos
        </button>
        <button
          onClick={handleClear}
          className="bb-btn"
          style={{ background: '#dc3545', color: 'white', border: 'none' }}
        >
          <Trash2 size={16} />
          Limpar Tudo
        </button>
      </div>

      {/* Tabela de Orçamentos Salvos */}
      {orcadosPorTipo.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
            padding: '20px',
            borderRadius: '12px',
            border: '2px solid #4caf50',
            marginBottom: '16px'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: 700, 
              color: '#2e7d32', 
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <DollarSign size={20} />
              Orçamentos Salvos
            </h3>
            <p style={{ fontSize: '14px', color: '#1b5e20' }}>
              Total de {orcadosPorTipo.length} tipo(s) de carteira configurado(s)
            </p>
          </div>

          <table className="bb-table">
            <thead>
              <tr>
                <th>Tipo de Carteira</th>
                <th style={{ textAlign: 'right' }}>Orçamento Base (R$)</th>
              </tr>
            </thead>
            <tbody>
              {orcadosPorTipo
                .sort((a, b) => a.tipoCarteira.localeCompare(b.tipoCarteira))
                .map((item, index) => (
                  <tr key={index}>
                    <td style={{ fontWeight: 600 }}>{item.tipoCarteira}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--bb-blue)' }}>
                      {formatCurrency(item.valor)}
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

export default OrcamentoTipo;

import React, { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Calendar, Save } from 'lucide-react';
import { formatCurrency } from '../utils/dataParser';
import { toast } from 'sonner';

const ControleDiario = () => {
  const [diasDesafio] = useLocalStorage('challenge_dias', 30);
  const [produtos] = useLocalStorage('challenge_produtos', []);
  const [realizadosTipo, setRealizadosTipo] = useLocalStorage('realizados_tipo', []);
  const [diaAtual, setDiaAtual] = useState(1);
  const [valoresDia, setValoresDia] = useState({});

  const produtosComVidinha = [...produtos];
  if (produtos.includes('Vida') && !produtosComVidinha.includes('Vidinha')) {
    const vidaIndex = produtosComVidinha.indexOf('Vida');
    produtosComVidinha.splice(vidaIndex + 1, 0, 'Vidinha');
  }

  const handleSaveDia = () => {
    const novosRealizados = [];
    Object.entries(valoresDia).forEach(([key, valor]) => {
      const [prefixo, produto] = key.split('-');
      if (valor > 0) {
        novosRealizados.push({
          prefixo,
          produto,
          valor: parseFloat(valor),
          dia: diaAtual
        });
      }
    });

    if (novosRealizados.length === 0) {
      toast.error('Nenhum valor informado');
      return;
    }

    const filteredRealizados = realizadosTipo.filter(r => r.dia !== diaAtual);
    setRealizadosTipo([...filteredRealizados, ...novosRealizados]);
    setValoresDia({});
    toast.success(`Dados do dia ${diaAtual} salvos!`);
  };

  const prefixosUnicos = [...new Set(realizadosTipo.map(r => r.prefixo).filter(Boolean))];

  const getRealizadoAcumulado = (prefixo, produto, ateDia) => {
    return realizadosTipo
      .filter(r => r.prefixo === prefixo && r.produto === produto && (!r.dia || r.dia <= ateDia))
      .reduce((sum, r) => sum + r.valor, 0);
  };

  return (
    <div className="bb-card">
      <div className="bb-card-header">
        <h2 className="bb-card-title" data-testid="controle-diario-title">Campo 7 — Controle Diário do Desafio</h2>
        <p className="bb-card-subtitle">Acompanhe e registre os valores diários do desafio</p>
      </div>

      {diasDesafio === 0 && (
        <div style={{ padding: '16px', background: '#fff3cd', borderRadius: '8px', color: '#856404' }}>
          Configure o número de dias no Campo 1
        </div>
      )}

      {diasDesafio > 0 && (
        <div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--bb-gray-700)' }}>
              Selecione o Dia:
            </label>
            <select
              value={diaAtual}
              onChange={(e) => setDiaAtual(parseInt(e.target.value))}
              className="bb-input"
              style={{ maxWidth: '200px' }}
              data-testid="dia-select"
            >
              {Array.from({ length: diasDesafio }, (_, i) => i + 1).map(dia => (
                <option key={dia} value={dia}>Dia {dia}</option>
              ))}
            </select>
          </div>

          {prefixosUnicos.length === 0 && (
            <div style={{ padding: '16px', background: '#d1ecf1', borderRadius: '8px', color: '#0c5460', fontSize: '14px' }}>
              Adicione dados de realizado no Campo 5 primeiro para habilitar o controle diário
            </div>
          )}

          {prefixosUnicos.length > 0 && produtosComVidinha.length > 0 && (
            <div>
              <div style={{ marginBottom: '16px', maxHeight: '400px', overflowY: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Prefixo</th>
                      {produtosComVidinha.map(produto => (
                        <th key={produto}>{produto}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {prefixosUnicos.map(prefixo => (
                      <tr key={prefixo}>
                        <td style={{ fontWeight: 600 }}>{prefixo}</td>
                        {produtosComVidinha.map(produto => {
                          const key = `${prefixo}-${produto}`;
                          return (
                            <td key={produto}>
                              <input
                                type="number"
                                value={valoresDia[key] || ''}
                                onChange={(e) => setValoresDia(prev => ({
                                  ...prev,
                                  [key]: e.target.value
                                }))}
                                className="bb-input"
                                placeholder="0.00"
                                step="0.01"
                                style={{ minWidth: '120px' }}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={handleSaveDia}
                className="bb-btn bb-btn-primary"
                data-testid="save-dia-btn"
              >
                <Save size={16} />
                Salvar Dia {diaAtual}
              </button>
            </div>
          )}

          {realizadosTipo.filter(r => r.dia).length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--bb-blue)', marginBottom: '12px' }}>
                Acumulado por Dia
              </h3>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Dia</th>
                      <th>Prefixo</th>
                      <th>Produto</th>
                      <th>Valor do Dia</th>
                      <th>Acumulado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {realizadosTipo
                      .filter(r => r.dia)
                      .sort((a, b) => (b.dia || 0) - (a.dia || 0))
                      .slice(0, 50)
                      .map((r, idx) => (
                        <tr key={idx}>
                          <td>{r.dia}</td>
                          <td>{r.prefixo}</td>
                          <td>{r.produto}</td>
                          <td>{formatCurrency(r.valor)}</td>
                          <td>{formatCurrency(getRealizadoAcumulado(r.prefixo, r.produto, r.dia))}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ControleDiario;

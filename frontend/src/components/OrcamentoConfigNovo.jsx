import React, { useState, useEffect, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { DollarSign, Save, Trash2, Building2, TrendingUp } from 'lucide-react';
import { parseNumericValue, formatCurrency } from '../utils/dataParser';
import { toast } from 'sonner';

const OrcamentoConfigNovo = () => {
  const [produtos] = useLocalStorage('challenge_produtos', []);
  const [carteiras] = useLocalStorage('carteiras_master', []);
  const [orcadosPorTipo, setOrcadosPorTipo] = useLocalStorage('orcados_por_tipo', []);
  
  const [orcamentos, setOrcamentos] = useState({});

  const tiposCarteira = [...new Set(carteiras.map(c => c.tipoCarteira).filter(Boolean))];

  // Carregar orçamentos salvos
  useEffect(() => {
    const loaded = {};
    orcadosPorTipo.forEach(o => {
      const key = `${o.produto}-${o.tipoCarteira}`;
      loaded[key] = o.valor;
    });
    setOrcamentos(loaded);
  }, []);

  // Adicionar chaves para novos produtos
  useEffect(() => {
    if (produtos.length > 0 && tiposCarteira.length > 0) {
      setOrcamentos(prev => {
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

  const handleOrcamentoChange = (produto, tipo, valor) => {
    const key = `${produto}-${tipo}`;
    setOrcamentos(prev => ({
      ...prev,
      [key]: parseNumericValue(valor)
    }));
  };

  const handleSave = () => {
    const orcados = [];
    Object.entries(orcamentos).forEach(([key, valor]) => {
      const [produto, tipoCarteira] = key.split('-');
      if (valor > 0) {
        orcados.push({
          produto,
          tipoCarteira,
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

  // Calcular orçamento por tipo de carteira (soma de todos os produtos)
  const orcamentoPorTipo = useMemo(() => {
    const porTipo = {};
    
    tiposCarteira.forEach(tipo => {
      let total = 0;
      produtos.forEach(produto => {
        const key = `${produto}-${tipo}`;
        total += parseFloat(orcamentos[key]) || 0;
      });
      
      const qtdCarteiras = carteiras.filter(c => c.tipoCarteira === tipo).length;
      porTipo[tipo] = {
        orcamento: total,
        qtdCarteiras,
        potencial: total * qtdCarteiras
      };
    });
    
    return porTipo;
  }, [orcamentos, produtos, tiposCarteira, carteiras]);

  // Calcular orçamento por agência
  const orcamentoPorAgencia = useMemo(() => {
    const porAgencia = {};
    
    carteiras.forEach(cart => {
      const key = cart.prefixo;
      if (!porAgencia[key]) {
        porAgencia[key] = {
          prefixo: cart.prefixo,
          agencia: cart.agencia,
          tipos: {},
          orcadoTotal: 0
        };
      }
      
      const tipo = cart.tipoCarteira;
      if (tipo) {
        if (!porAgencia[key].tipos[tipo]) {
          porAgencia[key].tipos[tipo] = 0;
        }
        porAgencia[key].tipos[tipo]++;
      }
    });

    // Calcular orçado total por agência
    Object.values(porAgencia).forEach(ag => {
      let total = 0;
      Object.entries(ag.tipos).forEach(([tipo, qtd]) => {
        const orcadoTipo = orcamentoPorTipo[tipo];
        if (orcadoTipo) {
          total += qtd * orcadoTipo.orcamento;
        }
      });
      ag.orcadoTotal = total;
    });

    return Object.values(porAgencia).sort((a, b) => a.prefixo.localeCompare(b.prefixo));
  }, [carteiras, orcamentoPorTipo]);

  const potencialTotal = Object.values(orcamentoPorTipo).reduce((sum, t) => sum + t.potencial, 0);

  if (produtos.length === 0) {
    return (
      <div className="bb-card">
        <div className="bb-card-header">
          <h2 className="bb-card-title">Campo 3 — Orçamento e Potencial</h2>
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
          <h2 className="bb-card-title">Campo 3 — Orçamento e Potencial</h2>
        </div>
        <div style={{ padding: '16px', background: '#fff3cd', borderRadius: '8px', color: '#856404' }}>
          Carregue as carteiras primeiro no Campo 2
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Campo 3.1 - Orçamento por Tipo de Carteira e Produto */}
      <div className="bb-card" style={{ marginBottom: '24px' }}>
        <div className="bb-card-header">
          <h2 className="bb-card-title">Campo 3.1 — Orçamento por Tipo de Carteira</h2>
          <p className="bb-card-subtitle">
            Defina o orçamento para cada produto e tipo de carteira
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

          {produtos.map(produto => (
            <div key={produto} style={{ marginBottom: '32px' }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: 600, 
                color: 'var(--bb-blue)', 
                marginBottom: '12px',
                padding: '8px 12px',
                background: '#f0f4f8',
                borderRadius: '8px'
              }}>
                {produto}
              </h3>
              
              <table className="bb-table">
                <thead>
                  <tr>
                    <th>Tipo de Carteira</th>
                    <th style={{ textAlign: 'center' }}>Qtd Carteiras</th>
                    <th style={{ minWidth: '200px' }}>Orçamento (R$)</th>
                  </tr>
                </thead>
                <tbody>
                  {tiposCarteira.map(tipo => {
                    const key = `${produto}-${tipo}`;
                    const qtd = carteiras.filter(c => c.tipoCarteira === tipo).length;
                    return (
                      <tr key={tipo}>
                        <td style={{ fontWeight: 600 }}>{tipo}</td>
                        <td style={{ textAlign: 'center' }}>{qtd}</td>
                        <td>
                          <input
                            type="number"
                            value={orcamentos[key] || ''}
                            onChange={(e) => handleOrcamentoChange(produto, tipo, e.target.value)}
                            className="bb-input"
                            placeholder="0.00"
                            step="0.01"
                            style={{ maxWidth: '180px' }}
                            data-testid={`orcamento-${produto}-${tipo}`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleSave}
            className="bb-btn bb-btn-primary"
            data-testid="save-orcamento-btn"
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

        {/* Tabelas de Orçamento e Potencial */}
        {orcadosPorTipo.length > 0 && (
          <div style={{ marginTop: '32px' }}>
            {/* Orçamento Total de Seguridade */}
            <div style={{
              background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px',
              color: 'white',
              textAlign: 'center',
              boxShadow: '0 8px 24px rgba(76, 175, 80, 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
                <TrendingUp size={28} />
                <p style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Potencial Total de Seguridade</p>
              </div>
              <p style={{ fontSize: '42px', fontWeight: 700, margin: '8px 0 0 0' }}>
                {formatCurrency(potencialTotal)}
              </p>
            </div>

            {/* Tabela: Orçamento por Tipo de Carteira */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{
                background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                padding: '16px',
                borderRadius: '12px',
                border: '2px solid #4caf50',
                marginBottom: '16px'
              }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: 700, 
                  color: '#2e7d32', 
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <DollarSign size={20} />
                  Orçamento e Potencial por Tipo de Carteira
                </h3>
              </div>

              <table className="bb-table">
                <thead>
                  <tr>
                    <th>Tipo de Carteira</th>
                    <th style={{ textAlign: 'center' }}>Qtd Carteiras</th>
                    <th style={{ textAlign: 'right' }}>Orçamento Base</th>
                    <th style={{ textAlign: 'right' }}>Potencial</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(orcamentoPorTipo).map(([tipo, dados]) => (
                    <tr key={tipo}>
                      <td style={{ fontWeight: 600 }}>{tipo}</td>
                      <td style={{ textAlign: 'center' }}>{dados.qtdCarteiras}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {formatCurrency(dados.orcamento)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--bb-blue)', fontSize: '16px' }}>
                        {formatCurrency(dados.potencial)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f5f5f5' }}>
                    <td colSpan="3" style={{ textAlign: 'right', fontWeight: 700, paddingRight: '16px' }}>
                      Total:
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--bb-blue)', fontSize: '18px' }}>
                      {formatCurrency(potencialTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Tabela: Orçado por Agência */}
            <div>
              <div style={{
                background: 'linear-gradient(135deg, #2196f3 0%, #42a5f5 100%)',
                padding: '16px',
                borderRadius: '12px',
                marginBottom: '16px',
                color: 'white'
              }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: 700, 
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Building2 size={20} />
                  Orçado por Agência (usado no Ranking do Campo 8)
                </h3>
              </div>

              <table className="bb-table">
                <thead>
                  <tr>
                    <th>Prefixo</th>
                    <th>Agência</th>
                    <th>Distribuição por Tipo</th>
                    <th style={{ textAlign: 'right' }}>Orçado Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orcamentoPorAgencia.map((ag, index) => (
                    <tr key={index}>
                      <td style={{ fontWeight: 600 }}>{ag.prefixo}</td>
                      <td>{ag.agencia}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {Object.entries(ag.tipos).map(([tipo, qtd]) => (
                            <span key={tipo} style={{
                              padding: '4px 8px',
                              background: '#e3f2fd',
                              borderRadius: '4px',
                              fontSize: '12px',
                              color: '#1565c0',
                              fontWeight: 600
                            }}>
                              {tipo}: {qtd}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--bb-blue)', fontSize: '16px' }}>
                        {formatCurrency(ag.orcadoTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f5f5f5' }}>
                    <td colSpan="3" style={{ textAlign: 'right', fontWeight: 700, paddingRight: '16px' }}>
                      Total Geral:
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--bb-blue)', fontSize: '18px' }}>
                      {formatCurrency(orcamentoPorAgencia.reduce((sum, ag) => sum + ag.orcadoTotal, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrcamentoConfigNovo;

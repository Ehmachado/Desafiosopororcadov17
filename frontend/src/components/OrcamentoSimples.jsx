import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Save, Trash2, DollarSign, Building2 } from 'lucide-react';
import { formatCurrency, parseNumericValue } from '../utils/dataParser';
import { toast } from 'sonner';

const OrcamentoSimples = () => {
  const [carteiras] = useLocalStorage('carteiras_master', []);
  const [produtos] = useLocalStorage('challenge_produtos', []);
  const [orcamentoPorTipo, setOrcamentoPorTipo] = useLocalStorage('orcamento_por_tipo', {});
  
  // Estado local para inputs
  const [inputValues, setInputValues] = useState({});

  // Extrair tipos únicos das carteiras
  const tiposCarteira = [...new Set(carteiras.map(c => c.tipoCarteira).filter(Boolean))];

  // Carregar valores salvos ao montar
  useEffect(() => {
    setInputValues(orcamentoPorTipo);
  }, []);

  // Calcular potencial por tipo × produto
  const calcularPotencialPorTipo = () => {
    const potenciais = {};
    
    tiposCarteira.forEach(tipo => {
      const qtdCarteiras = carteiras.filter(c => c.tipoCarteira === tipo).length;
      
      produtos.forEach(produto => {
        const key = `${tipo}-${produto}`;
        const orcamento = orcamentoPorTipo[key] || 0;
        
        const compositeKey = `${tipo}|${produto}`;
        potenciais[compositeKey] = {
          tipo,
          produto,
          qtdCarteiras,
          orcamento,
          potencial: orcamento * qtdCarteiras
        };
      });
    });
    
    return potenciais;
  };

  // Calcular orçamento por agência
  const calcularOrcamentoPorAgencia = () => {
    const orcamentosAgencia = {};
    
    carteiras.forEach(carteira => {
      const prefixo = carteira.prefixo;
      const tipo = carteira.tipoCarteira;
      
      if (!orcamentosAgencia[prefixo]) {
        orcamentosAgencia[prefixo] = {
          prefixo,
          agencia: carteira.agencia,
          total: 0,
          detalhes: []
        };
      }
      
      // Soma orçamento de todos os produtos para este tipo
      produtos.forEach(produto => {
        const key = `${tipo}-${produto}`;
        const orcamento = orcamentoPorTipo[key] || 0;
        orcamentosAgencia[prefixo].total += orcamento;
        
        if (orcamento > 0) {
          orcamentosAgencia[prefixo].detalhes.push({
            tipo,
            produto,
            orcamento
          });
        }
      });
    });
    
    return Object.values(orcamentosAgencia).sort((a, b) => a.prefixo.localeCompare(b.prefixo));
  };

  const handleInputChange = (tipo, produto, valor) => {
    const key = `${tipo}-${produto}`;
    setInputValues(prev => ({
      ...prev,
      [key]: parseNumericValue(valor)
    }));
  };

  const handleSalvar = () => {
    setOrcamentoPorTipo(inputValues);
    toast.success('Orçamentos salvos com sucesso!');
  };

  const handleLimpar = () => {
    if (window.confirm('Tem certeza que deseja limpar todos os dados de orçamento?')) {
      setInputValues({});
      setOrcamentoPorTipo({});
      toast.success('Dados limpos com sucesso!');
    }
  };

  const potenciais = calcularPotencialPorTipo();
  const orcamentosAgencia = calcularOrcamentoPorAgencia();
  const potencialTotal = Object.values(potenciais).reduce((sum, p) => sum + p.potencial, 0);
      
      if (!orcamentosAgencia[prefixo]) {
        orcamentosAgencia[prefixo] = {
          prefixo,
          agencia: carteira.agencia,
          total: 0,
          carteiras: []
        };
      }
      
      orcamentosAgencia[prefixo].total += orcamento;
      orcamentosAgencia[prefixo].carteiras.push({
        carteira: carteira.carteira,
        tipo: tipo,
        orcamento: orcamento
      });
    });
    
    return Object.values(orcamentosAgencia).sort((a, b) => a.prefixo.localeCompare(b.prefixo));
  };

  const handleInputChange = (tipo, valor) => {
    setInputValues(prev => ({
      ...prev,
      [tipo]: parseNumericValue(valor)
    }));
  };

  const handleSalvar = () => {
    setOrcamentoPorTipo(inputValues);
    toast.success('Orçamentos salvos com sucesso!');
  };

  const handleLimpar = () => {
    if (window.confirm('Tem certeza que deseja limpar todos os dados de orçamento?')) {
      setInputValues({});
      setOrcamentoPorTipo({});
      toast.success('Dados limpos com sucesso!');
    }
  };

  const potenciais = calcularPotencialPorTipo();
  const orcamentosAgencia = calcularOrcamentoPorAgencia();
  const potencialTotal = Object.values(potenciais).reduce((sum, p) => sum + p.potencial, 0);

  return (
    <div>
      {/* Seção 1: Definir Orçamento por Tipo de Carteira × Produto */}
      <div className="bb-card">
        <div className="bb-card-header">
          <h2 className="bb-card-title">Campo 3 — Orçamento por Tipo de Carteira × Produto</h2>
          <p className="bb-card-subtitle">Defina o orçamento para cada combinação de tipo de carteira e produto</p>
        </div>

        {carteiras.length === 0 ? (
          <div style={{ padding: '16px', background: '#fff3cd', borderRadius: '8px', color: '#856404' }}>
            Carregue as carteiras primeiro no Campo 2
          </div>
        ) : produtos.length === 0 ? (
          <div style={{ padding: '16px', background: '#fff3cd', borderRadius: '8px', color: '#856404' }}>
            Configure os produtos primeiro no Campo 1
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '24px', overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tipo de Carteira</th>
                    <th>Qtd. Carteiras</th>
                    {produtos.map(produto => (
                      <th key={produto} style={{ minWidth: '150px', textAlign: 'center' }}>
                        {produto}<br/>
                        <span style={{ fontSize: '12px', fontWeight: 'normal' }}>Orçamento (R$)</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tiposCarteira.map(tipo => {
                    const qtd = carteiras.filter(c => c.tipoCarteira === tipo).length;
                    return (
                      <tr key={tipo}>
                        <td style={{ fontWeight: 600 }}>{tipo}</td>
                        <td>{qtd} carteiras</td>
                        {produtos.map(produto => {
                          const key = `${tipo}-${produto}`;
                          return (
                            <td key={produto}>
                              <input
                                type="number"
                                value={inputValues[key] || ''}
                                onChange={(e) => handleInputChange(tipo, produto, e.target.value)}
                                className="bb-input"
                                placeholder="0.00"
                                step="0.01"
                                style={{ maxWidth: '140px' }}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleSalvar} className="bb-btn bb-btn-primary">
                <Save size={16} />
                Salvar Orçamentos
              </button>
              <button onClick={handleLimpar} className="bb-btn" style={{ background: '#dc3545', color: 'white' }}>
                <Trash2 size={16} />
                Limpar Dados
              </button>
            </div>
          </>
        )}
      </div>

      {/* Seção 2: Potencial de Seguridade */}
      {Object.keys(orcamentoPorTipo).length > 0 && (
        <div className="bb-card">
          <div className="bb-card-header">
            <h2 className="bb-card-title">Potencial de Seguridade</h2>
            <p className="bb-card-subtitle">Orçamento × Quantidade de Carteiras por Tipo × Produto</p>
          </div>

          <div style={{ padding: '20px', background: 'linear-gradient(135deg, var(--bb-blue) 0%, var(--bb-blue-light) 100%)', borderRadius: '12px', color: 'white', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <DollarSign size={32} />
              <div>
                <p style={{ fontSize: '14px', opacity: 0.9 }}>Potencial Total de Seguridade</p>
                <p style={{ fontSize: '32px', fontWeight: 700 }}>{formatCurrency(potencialTotal)}</p>
              </div>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tipo de Carteira</th>
                  <th>Produto</th>
                  <th>Qtd. Carteiras</th>
                  <th>Orçamento Unitário</th>
                  <th>Potencial Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(potenciais).map((dados) => (
                  <tr key={`${dados.tipo}|${dados.produto}`}>
                    <td style={{ fontWeight: 600 }}>{dados.tipo}</td>
                    <td>{dados.produto}</td>
                    <td>{dados.qtdCarteiras}</td>
                    <td>{formatCurrency(dados.orcamento)}</td>
                    <td style={{ fontWeight: 600, color: 'var(--bb-blue)' }}>
                      {formatCurrency(dados.potencial)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Seção 3: Orçamento por Agência */}
      {Object.keys(orcamentoPorTipo).length > 0 && orcamentosAgencia.length > 0 && (
        <div className="bb-card">
          <div className="bb-card-header">
            <h2 className="bb-card-title">Orçamento por Agência</h2>
            <p className="bb-card-subtitle">Soma dos orçamentos de todas as carteiras por agência</p>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Prefixo</th>
                <th>Agência</th>
                <th>Orçamento Total</th>
              </tr>
            </thead>
            <tbody>
              {orcamentosAgencia.map(agencia => (
                <tr key={agencia.prefixo}>
                  <td style={{ fontWeight: 600 }}>{agencia.prefixo}</td>
                  <td>{agencia.agencia}</td>
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

export default OrcamentoSimples;

import React, { useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { TrendingUp, Building2 } from 'lucide-react';
import { formatCurrency } from '../utils/dataParser';

const PotencialSeguridade = () => {
  const [carteiras] = useLocalStorage('carteiras_master', []);
  const [orcadosPorTipo] = useLocalStorage('orcados_por_tipo', []);

  // Calcular potencial por tipo
  const potencialPorTipo = useMemo(() => {
    const tipos = [...new Set(carteiras.map(c => c.tipoCarteira).filter(Boolean))];
    
    return tipos.map(tipo => {
      const qtdCarteiras = carteiras.filter(c => c.tipoCarteira === tipo).length;
      const orcadoTipo = orcadosPorTipo.find(o => o.tipoCarteira === tipo);
      const orcamentoBase = orcadoTipo ? parseFloat(orcadoTipo.valor) : 0;
      const potencial = qtdCarteiras * orcamentoBase;
      
      return {
        tipo,
        qtdCarteiras,
        orcamentoBase,
        potencial
      };
    });
  }, [carteiras, orcadosPorTipo]);

  // Calcular orçado por agência
  const orcadoPorAgencia = useMemo(() => {
    const agencias = {};
    
    carteiras.forEach(cart => {
      const key = cart.prefixo;
      if (!agencias[key]) {
        agencias[key] = {
          prefixo: cart.prefixo,
          agencia: cart.agencia,
          tipos: {},
          orcadoTotal: 0
        };
      }
      
      const tipo = cart.tipoCarteira;
      if (tipo) {
        if (!agencias[key].tipos[tipo]) {
          agencias[key].tipos[tipo] = 0;
        }
        agencias[key].tipos[tipo]++;
      }
    });

    // Calcular orçado total por agência
    Object.values(agencias).forEach(ag => {
      let total = 0;
      Object.entries(ag.tipos).forEach(([tipo, qtd]) => {
        const orcadoTipo = orcadosPorTipo.find(o => o.tipoCarteira === tipo);
        if (orcadoTipo) {
          total += qtd * parseFloat(orcadoTipo.valor);
        }
      });
      ag.orcadoTotal = total;
    });

    return Object.values(agencias).sort((a, b) => a.prefixo.localeCompare(b.prefixo));
  }, [carteiras, orcadosPorTipo]);

  const potencialTotal = potencialPorTipo.reduce((sum, p) => sum + p.potencial, 0);

  if (orcadosPorTipo.length === 0) {
    return (
      <div className="bb-card">
        <div className="bb-card-header">
          <h2 className="bb-card-title">Campo 3.3 — Potencial de Seguridade</h2>
        </div>
        <div style={{ padding: '16px', background: '#fff3cd', borderRadius: '8px', color: '#856404' }}>
          Defina os orçamentos no Campo 3.1 primeiro
        </div>
      </div>
    );
  }

  return (
    <div className="bb-card">
      <div className="bb-card-header">
        <h2 className="bb-card-title">Campo 3.3 — Potencial de Seguridade</h2>
        <p className="bb-card-subtitle">
          Potencial = Orçamento Base × Quantidade de Carteiras
        </p>
      </div>

      {/* Potencial Total */}
      <div style={{
        background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '24px',
        color: 'white',
        textAlign: 'center',
        boxShadow: '0 8px 24px rgba(76, 175, 80, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
          <TrendingUp size={32} />
          <p style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Potencial Total de Seguridade</p>
        </div>
        <p style={{ fontSize: '48px', fontWeight: 700, margin: '8px 0 0 0' }}>
          {formatCurrency(potencialTotal)}
        </p>
      </div>

      {/* Potencial por Tipo */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--bb-gray-700)', marginBottom: '12px' }}>
          Potencial por Tipo de Carteira:
        </h3>
        
        <table className="bb-table">
          <thead>
            <tr>
              <th>Tipo de Carteira</th>
              <th style={{ textAlign: 'center' }}>Quantidade</th>
              <th style={{ textAlign: 'right' }}>Orçamento Base</th>
              <th style={{ textAlign: 'right' }}>Potencial</th>
            </tr>
          </thead>
          <tbody>
            {potencialPorTipo.map((item, index) => (
              <tr key={index}>
                <td style={{ fontWeight: 600 }}>{item.tipo}</td>
                <td style={{ textAlign: 'center' }}>{item.qtdCarteiras}</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(item.orcamentoBase)}</td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--bb-blue)', fontSize: '16px' }}>
                  {formatCurrency(item.potencial)}
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

      {/* Orçado por Agência */}
      <div>
        <div style={{
          background: 'linear-gradient(135deg, #2196f3 0%, #42a5f5 100%)',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '16px',
          color: 'white'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: 700, 
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            margin: 0
          }}>
            <Building2 size={20} />
            Orçado por Agência (usado no Ranking)
          </h3>
          <p style={{ fontSize: '14px', opacity: 0.9, margin: '8px 0 0 0' }}>
            Este é o valor de "Orçado" que aparece no Campo 8 (Ranking)
          </p>
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
            {orcadoPorAgencia.map((ag, index) => (
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
                        color: '#1565c0'
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
        </table>
      </div>
    </div>
  );
};

export default PotencialSeguridade;

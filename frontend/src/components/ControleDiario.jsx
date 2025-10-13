import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Calendar, Save, Trash2, Copy, Info } from 'lucide-react';
import { formatCurrency, parseNumericValue } from '../utils/dataParser';
import { toast } from 'sonner';

const ControleDiario = () => {
  const [diasDesafio] = useLocalStorage('challenge_dias', 30);
  const [realizadosTipo] = useLocalStorage('realizados_tipo', []);
  const [realizadosCarteira] = useLocalStorage('realizados_carteira', []);
  const [realizadosDiarios, setRealizadosDiarios] = useLocalStorage('realizados_diarios', []);
  
  const [diaAtual, setDiaAtual] = useState(1);
  const [dadosTipoEditados, setDadosTipoEditados] = useState([]);
  const [dadosCarteiraEditados, setDadosCarteiraEditados] = useState([]);

  // Carrega dados do dia selecionado
  useEffect(() => {
    carregarDadosDoDia(diaAtual);
  }, [diaAtual, realizadosDiarios]);

  const carregarDadosDoDia = (dia) => {
    // Busca dados já salvos para este dia
    const dadosSalvosDia = realizadosDiarios.filter(r => r.dia === dia);
    
    if (dadosSalvosDia.length > 0) {
      // Se já tem dados salvos, carrega eles
      const dadosTipo = dadosSalvosDia.filter(r => r.tipo === 'tipo');
      const dadosCarteira = dadosSalvosDia.filter(r => r.tipo === 'carteira');
      
      setDadosTipoEditados(dadosTipo.map(d => ({
        prefixo: d.prefixo,
        produto: d.produto,
        valor: d.valor
      })));
      
      setDadosCarteiraEditados(dadosCarteira.map(d => ({
        prefixo: d.prefixo,
        carteira: d.carteira,
        tipoCarteira: d.tipoCarteira,
        valor: d.valor
      })));
    } else {
      // Se não tem dados salvos, copia do Campo 5 e 6
      copiarDosCampos5e6();
    }
  };

  const copiarDosCampos5e6 = () => {
    // Copia do Campo 5
    if (realizadosTipo.length > 0) {
      setDadosTipoEditados(realizadosTipo.map(r => ({
        prefixo: r.prefixo,
        produto: r.produto,
        valor: r.valor
      })));
    }
    
    // Copia do Campo 6
    if (realizadosCarteira.length > 0) {
      setDadosCarteiraEditados(realizadosCarteira.map(r => ({
        prefixo: r.prefixo,
        carteira: r.carteira,
        tipoCarteira: r.tipoCarteira,
        valor: r.valor
      })));
    }
  };

  const handleCopiarDosCampos = () => {
    copiarDosCampos5e6();
    toast.success('Dados copiados dos Campos 5 e 6');
  };

  const handleValorTipoChange = (index, valor) => {
    const novosDados = [...dadosTipoEditados];
    novosDados[index].valor = parseNumericValue(valor);
    setDadosTipoEditados(novosDados);
  };

  const handleValorCarteiraChange = (index, valor) => {
    const novosDados = [...dadosCarteiraEditados];
    novosDados[index].valor = parseNumericValue(valor);
    setDadosCarteiraEditados(novosDados);
  };

  const handleSalvar = () => {
    // Remove dados do dia atual
    const outrosDias = realizadosDiarios.filter(r => r.dia !== diaAtual);
    
    // Adiciona novos dados do dia atual
    const novosDadosTipo = dadosTipoEditados.map(d => ({
      ...d,
      dia: diaAtual,
      tipo: 'tipo'
    }));
    
    const novosDadosCarteira = dadosCarteiraEditados.map(d => ({
      ...d,
      dia: diaAtual,
      tipo: 'carteira'
    }));
    
    const todosNovos = [...outrosDias, ...novosDadosTipo, ...novosDadosCarteira];
    setRealizadosDiarios(todosNovos);
    
    toast.success(`Dia ${diaAtual} salvo com sucesso!`);
  };

  const handleLimpar = () => {
    // Remove apenas dados do dia atual
    const outrosDias = realizadosDiarios.filter(r => r.dia !== diaAtual);
    setRealizadosDiarios(outrosDias);
    
    // Limpa os campos
    setDadosTipoEditados([]);
    setDadosCarteiraEditados([]);
    
    toast.success(`Dia ${diaAtual} limpo`);
  };

  // Calcula totais acumulados até o dia atual
  const calcularAcumulados = () => {
    const acumuladoTipo = {};
    const acumuladoCarteira = {};
    
    realizadosDiarios
      .filter(r => r.dia <= diaAtual)
      .forEach(r => {
        if (r.tipo === 'tipo') {
          const key = `${r.prefixo}-${r.produto}`;
          acumuladoTipo[key] = (acumuladoTipo[key] || 0) + parseNumericValue(r.valor);
        } else if (r.tipo === 'carteira') {
          const key = `${r.prefixo}-${r.carteira}`;
          acumuladoCarteira[key] = (acumuladoCarteira[key] || 0) + parseNumericValue(r.valor);
        }
      });
    
    return { acumuladoTipo, acumuladoCarteira };
  };

  const { acumuladoTipo, acumuladoCarteira } = calcularAcumulados();
  
  const totalDiaAtualTipo = dadosTipoEditados.reduce((sum, d) => sum + parseNumericValue(d.valor), 0);
  const totalDiaAtualCarteira = dadosCarteiraEditados.reduce((sum, d) => sum + parseNumericValue(d.valor), 0);

  const diasSalvos = [...new Set(realizadosDiarios.map(r => r.dia))].sort((a, b) => a - b);

  return (
    <div className="bb-card">
      <div className="bb-card-header">
        <h2 className="bb-card-title" data-testid="controle-diario-title">
          Campo 7 — Controle Diário do Desafio
        </h2>
        <p className="bb-card-subtitle">
          Registre os realizados dia a dia. O Campo 8 usará a soma acumulada dos dias.
        </p>
      </div>

      {/* Informação importante */}
      <div style={{ 
        padding: '16px', 
        background: '#d1ecf1', 
        borderRadius: '8px', 
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px'
      }}>
        <Info size={20} style={{ flexShrink: 0, marginTop: '2px', color: '#0c5460' }} />
        <div style={{ fontSize: '14px', color: '#0c5460' }}>
          <p style={{ marginBottom: '8px' }}><strong>Como funciona:</strong></p>
          <ul style={{ marginLeft: '20px', marginTop: '4px' }}>
            <li>Selecione o dia do desafio</li>
            <li>Edite os valores de realizado para aquele dia</li>
            <li>Clique "Salvar Dia X" para guardar</li>
            <li>Repita para cada dia do desafio</li>
            <li><strong>O Campo 8 usará a SOMA de todos os dias salvos</strong></li>
          </ul>
        </div>
      </div>

      {/* Seletor de Dia */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: '0 0 auto' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--bb-gray-700)' }}>
            <Calendar size={16} style={{ display: 'inline', marginRight: '6px' }} />
            Selecione o Dia:
          </label>
          <select
            value={diaAtual}
            onChange={(e) => setDiaAtual(parseInt(e.target.value))}
            className="bb-input"
            style={{ maxWidth: '200px' }}
            data-testid="dia-select"
          >
            {Array.from({ length: diasDesafio }, (_, i) => i + 1).map(dia => {
              const jaSalvo = diasSalvos.includes(dia);
              return (
                <option key={dia} value={dia}>
                  Dia {dia} {jaSalvo ? '✓' : ''}
                </option>
              );
            })}
          </select>
        </div>

        <div style={{ flex: '0 0 auto' }}>
          <button
            onClick={handleCopiarDosCampos}
            className="bb-btn bb-btn-outline"
            style={{ marginTop: '28px' }}
            data-testid="copiar-campos-btn"
          >
            <Copy size={16} />
            Copiar dos Campos 5 e 6
          </button>
        </div>

        {diasSalvos.length > 0 && (
          <div style={{ flex: '1 1 auto', marginTop: '28px' }}>
            <span style={{ fontSize: '14px', color: 'var(--bb-gray-600)' }}>
              Dias salvos: <strong>{diasSalvos.join(', ')}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Seção 1: Realizado por Tipo */}
      {(realizadosTipo.length > 0 || dadosTipoEditados.length > 0) && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: 600, 
            color: 'var(--bb-blue)', 
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: '2px solid var(--bb-yellow)'
          }}>
            Realizado por Agência/Tipo (Dia {diaAtual})
          </h3>

          {dadosTipoEditados.length === 0 ? (
            <div style={{ padding: '16px', background: 'var(--bb-gray-50)', borderRadius: '8px', color: 'var(--bb-gray-600)' }}>
              Clique em "Copiar dos Campos 5 e 6" para carregar os dados
            </div>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '16px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Prefixo</th>
                    <th>Produto</th>
                    <th>Valor Dia {diaAtual} (R$)</th>
                    <th>Acumulado até Dia {diaAtual}</th>
                  </tr>
                </thead>
                <tbody>
                  {dadosTipoEditados.map((item, idx) => {
                    const key = `${item.prefixo}-${item.produto}`;
                    const acumulado = (acumuladoTipo[key] || 0) - parseNumericValue(item.valor);
                    return (
                      <tr key={idx}>
                        <td>{item.prefixo}</td>
                        <td>{item.produto}</td>
                        <td>
                          <input
                            type="number"
                            value={item.valor}
                            onChange={(e) => handleValorTipoChange(idx, e.target.value)}
                            className="bb-input"
                            step="0.01"
                            style={{ maxWidth: '150px' }}
                          />
                        </td>
                        <td style={{ color: 'var(--bb-gray-600)', fontSize: '13px' }}>
                          {formatCurrency(acumulado + parseNumericValue(item.valor))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {dadosTipoEditados.length > 0 && (
            <div style={{ padding: '12px', background: 'var(--bb-gray-50)', borderRadius: '8px', marginBottom: '16px' }}>
              <p style={{ fontSize: '14px', color: 'var(--bb-gray-700)' }}>
                <strong>Total do Dia {diaAtual}:</strong> {formatCurrency(totalDiaAtualTipo)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Seção 2: Realizado por Carteira */}
      {(realizadosCarteira.length > 0 || dadosCarteiraEditados.length > 0) && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: 600, 
            color: 'var(--bb-blue)', 
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: '2px solid var(--bb-yellow)'
          }}>
            Realizado por Carteira (Dia {diaAtual})
          </h3>

          {dadosCarteiraEditados.length === 0 ? (
            <div style={{ padding: '16px', background: 'var(--bb-gray-50)', borderRadius: '8px', color: 'var(--bb-gray-600)' }}>
              Clique em "Copiar dos Campos 5 e 6" para carregar os dados
            </div>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '16px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Prefixo</th>
                    <th>Carteira</th>
                    <th>Tipo</th>
                    <th>Valor Dia {diaAtual} (R$)</th>
                    <th>Acumulado até Dia {diaAtual}</th>
                  </tr>
                </thead>
                <tbody>
                  {dadosCarteiraEditados.map((item, idx) => {
                    const key = `${item.prefixo}-${item.carteira}`;
                    const acumulado = (acumuladoCarteira[key] || 0) - parseNumericValue(item.valor);
                    return (
                      <tr key={idx}>
                        <td>{item.prefixo}</td>
                        <td>{item.carteira}</td>
                        <td>{item.tipoCarteira}</td>
                        <td>
                          <input
                            type="number"
                            value={item.valor}
                            onChange={(e) => handleValorCarteiraChange(idx, e.target.value)}
                            className="bb-input"
                            step="0.01"
                            style={{ maxWidth: '150px' }}
                          />
                        </td>
                        <td style={{ color: 'var(--bb-gray-600)', fontSize: '13px' }}>
                          {formatCurrency(acumulado + parseNumericValue(item.valor))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {dadosCarteiraEditados.length > 0 && (
            <div style={{ padding: '12px', background: 'var(--bb-gray-50)', borderRadius: '8px', marginBottom: '16px' }}>
              <p style={{ fontSize: '14px', color: 'var(--bb-gray-700)' }}>
                <strong>Total do Dia {diaAtual}:</strong> {formatCurrency(totalDiaAtualCarteira)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Botões de Ação */}
      {(dadosTipoEditados.length > 0 || dadosCarteiraEditados.length > 0) && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <button
            onClick={handleSalvar}
            className="bb-btn bb-btn-primary"
            data-testid="salvar-dia-btn"
          >
            <Save size={16} />
            Salvar Dia {diaAtual}
          </button>
          <button
            onClick={handleLimpar}
            className="bb-btn bb-btn-outline"
            data-testid="limpar-dia-btn"
          >
            <Trash2 size={16} />
            Limpar Dia {diaAtual}
          </button>
        </div>
      )}

      {/* Resumo dos Dias Salvos */}
      {diasSalvos.length > 0 && (
        <div style={{ 
          marginTop: '32px', 
          padding: '20px', 
          background: 'linear-gradient(135deg, var(--bb-blue) 0%, var(--bb-blue-light) 100%)', 
          borderRadius: '12px',
          color: 'white'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>
            Resumo do Desafio
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <p style={{ fontSize: '14px', opacity: 0.9, marginBottom: '4px' }}>Dias Salvos</p>
              <p style={{ fontSize: '24px', fontWeight: 700 }}>{diasSalvos.length} de {diasDesafio}</p>
            </div>
            <div>
              <p style={{ fontSize: '14px', opacity: 0.9, marginBottom: '4px' }}>Total Acumulado (Tipo)</p>
              <p style={{ fontSize: '24px', fontWeight: 700 }}>
                {formatCurrency(Object.values(acumuladoTipo).reduce((sum, val) => sum + val, 0))}
              </p>
            </div>
            {Object.keys(acumuladoCarteira).length > 0 && (
              <div>
                <p style={{ fontSize: '14px', opacity: 0.9, marginBottom: '4px' }}>Total Acumulado (Carteira)</p>
                <p style={{ fontSize: '24px', fontWeight: 700 }}>
                  {formatCurrency(Object.values(acumuladoCarteira).reduce((sum, val) => sum + val, 0))}
                </p>
              </div>
            )}
          </div>
          <p style={{ fontSize: '13px', opacity: 0.8, marginTop: '12px' }}>
            ℹ️ O Campo 8 (Ranking) usará estes valores acumulados
          </p>
        </div>
      )}
    </div>
  );
};

export default ControleDiario;

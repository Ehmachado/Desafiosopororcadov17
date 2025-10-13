import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Save, Trash2, Copy } from 'lucide-react';
import { formatCurrency, parseNumericValue } from '../utils/dataParser';
import { toast } from 'sonner';

const ControleDiario = () => {
  const [produtos] = useLocalStorage('challenge_produtos', []);
  const [realizadosTipo, setRealizadosTipo] = useLocalStorage('realizados_tipo', []);
  const [realizadosCarteira, setRealizadosCarteira] = useLocalStorage('realizados_carteira', []);
  
  // Estados para edição
  const [dadosTipoEditados, setDadosTipoEditados] = useState([]);
  const [dadosCarteiraEditados, setDadosCarteiraEditados] = useState([]);

  const produtosComVidinha = [...produtos];
  if (produtos.includes('Vida') && !produtosComVidinha.includes('Vidinha')) {
    const vidaIndex = produtosComVidinha.indexOf('Vida');
    produtosComVidinha.splice(vidaIndex + 1, 0, 'Vidinha');
  }

  // Carrega dados do Campo 5 quando monta o componente
  useEffect(() => {
    if (realizadosTipo.length > 0) {
      setDadosTipoEditados([...realizadosTipo]);
    }
  }, []);

  // Carrega dados do Campo 6 quando monta o componente
  useEffect(() => {
    if (realizadosCarteira.length > 0) {
      setDadosCarteiraEditados([...realizadosCarteira]);
    }
  }, []);

  // Handlers para Realizado por Tipo
  const handleCopiarDoCampo5 = () => {
    setDadosTipoEditados([...realizadosTipo]);
    toast.success('Dados copiados do Campo 5');
  };

  const handleValorTipoChange = (index, valor) => {
    const novosDados = [...dadosTipoEditados];
    novosDados[index].valor = parseNumericValue(valor);
    setDadosTipoEditados(novosDados);
  };

  const handleSalvarTipo = () => {
    setRealizadosTipo(dadosTipoEditados);
    toast.success('Realizado por Tipo salvo!');
  };

  const handleLimparTipo = () => {
    setDadosTipoEditados([]);
    setRealizadosTipo([]);
    toast.success('Realizado por Tipo limpo');
  };

  // Handlers para Realizado por Carteira
  const handleCopiarDoCampo6 = () => {
    setDadosCarteiraEditados([...realizadosCarteira]);
    toast.success('Dados copiados do Campo 6');
  };

  const handleValorCarteiraChange = (index, valor) => {
    const novosDados = [...dadosCarteiraEditados];
    novosDados[index].valor = parseNumericValue(valor);
    setDadosCarteiraEditados(novosDados);
  };

  const handleSalvarCarteira = () => {
    setRealizadosCarteira(dadosCarteiraEditados);
    toast.success('Realizado por Carteira salvo!');
  };

  const handleLimparCarteira = () => {
    setDadosCarteiraEditados([]);
    setRealizadosCarteira([]);
    toast.success('Realizado por Carteira limpo');
  };

  return (
    <div>
      {/* Seção 1: Realizado por Agência (espelha Campo 5) */}
      <div className="bb-card">
        <div className="bb-card-header">
          <h2 className="bb-card-title" data-testid="controle-diario-tipo-title">
            Campo 7.1 — Realizado por Agência/Tipo
          </h2>
          <p className="bb-card-subtitle">Espelha os dados do Campo 5 (Realizado por Tipo de Seguro)</p>
        </div>

        {realizadosTipo.length === 0 && (
          <div style={{ padding: '16px', background: '#d1ecf1', borderRadius: '8px', color: '#0c5460' }}>
            Nenhum dado no Campo 5. Adicione realizados por tipo primeiro.
          </div>
        )}

        {realizadosTipo.length > 0 && (
          <div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <button
                onClick={handleCopiarDoCampo5}
                className="bb-btn bb-btn-outline"
                data-testid="copiar-campo5-btn"
              >
                <Copy size={16} />
                Copiar do Campo 5
              </button>
            </div>

            <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '16px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Prefixo</th>
                    <th>Produto</th>
                    <th>Valor (R$)</th>
                  </tr>
                </thead>
                <tbody>
                  {dadosTipoEditados.map((item, idx) => (
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleSalvarTipo}
                className="bb-btn bb-btn-primary"
                data-testid="salvar-tipo-btn"
              >
                <Save size={16} />
                Salvar
              </button>
              <button
                onClick={handleLimparTipo}
                className="bb-btn bb-btn-outline"
                data-testid="limpar-tipo-btn"
              >
                <Trash2 size={16} />
                Limpar
              </button>
            </div>

            <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bb-gray-50)', borderRadius: '8px' }}>
              <p style={{ fontSize: '14px', color: 'var(--bb-gray-700)' }}>
                <strong>Total de registros:</strong> {dadosTipoEditados.length}
              </p>
              <p style={{ fontSize: '14px', color: 'var(--bb-gray-700)' }}>
                <strong>Soma total:</strong> {formatCurrency(dadosTipoEditados.reduce((sum, item) => sum + parseNumericValue(item.valor), 0))}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Seção 2: Realizado por Carteira (espelha Campo 6) */}
      <div className="bb-card">
        <div className="bb-card-header">
          <h2 className="bb-card-title" data-testid="controle-diario-carteira-title">
            Campo 7.2 — Realizado por Carteira
          </h2>
          <p className="bb-card-subtitle">Espelha os dados do Campo 6 (Realizado por Carteira)</p>
        </div>

        {realizadosCarteira.length === 0 && (
          <div style={{ padding: '16px', background: '#d1ecf1', borderRadius: '8px', color: '#0c5460' }}>
            Nenhum dado no Campo 6. Adicione realizados por carteira se necessário.
          </div>
        )}

        {realizadosCarteira.length > 0 && (
          <div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <button
                onClick={handleCopiarDoCampo6}
                className="bb-btn bb-btn-outline"
                data-testid="copiar-campo6-btn"
              >
                <Copy size={16} />
                Copiar do Campo 6
              </button>
            </div>

            <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '16px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Prefixo</th>
                    <th>Carteira</th>
                    <th>Tipo</th>
                    <th>Valor (R$)</th>
                  </tr>
                </thead>
                <tbody>
                  {dadosCarteiraEditados.map((item, idx) => (
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleSalvarCarteira}
                className="bb-btn bb-btn-primary"
                data-testid="salvar-carteira-btn"
              >
                <Save size={16} />
                Salvar
              </button>
              <button
                onClick={handleLimparCarteira}
                className="bb-btn bb-btn-outline"
                data-testid="limpar-carteira-btn"
              >
                <Trash2 size={16} />
                Limpar
              </button>
            </div>

            <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bb-gray-50)', borderRadius: '8px' }}>
              <p style={{ fontSize: '14px', color: 'var(--bb-gray-700)' }}>
                <strong>Total de registros:</strong> {dadosCarteiraEditados.length}
              </p>
              <p style={{ fontSize: '14px', color: 'var(--bb-gray-700)' }}>
                <strong>Soma total:</strong> {formatCurrency(dadosCarteiraEditados.reduce((sum, item) => sum + parseNumericValue(item.valor), 0))}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ControleDiario;

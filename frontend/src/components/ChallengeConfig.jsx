import React, { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Save, Check } from 'lucide-react';
import { toast } from 'sonner';

const PRODUTO_OPTIONS = [
  'Seguridade Total',
  'Vida',
  'Prestamista',
  'Patrimônio',
  'Capitalização',
  'Previdência'
];

const ChallengeConfig = () => {
  const [produtos, setProdutos] = useLocalStorage('challenge_produtos', []);
  const [diasDesafio, setDiasDesafio] = useLocalStorage('challenge_dias', 30);
  const [outroProduto, setOutroProduto] = useState('');
  const [saved, setSaved] = useState(false);

  const handleProdutoToggle = (produto) => {
    if (produtos.includes(produto)) {
      setProdutos(produtos.filter(p => p !== produto));
    } else {
      setProdutos([...produtos, produto]);
    }
  };

  const handleAddOutro = () => {
    if (outroProduto.trim() && !produtos.includes(outroProduto.trim())) {
      setProdutos([...produtos, outroProduto.trim()]);
      setOutroProduto('');
    }
  };

  const handleSave = () => {
    if (produtos.length === 0) {
      toast.error('Selecione pelo menos um produto');
      return;
    }
    if (diasDesafio < 1) {
      toast.error('Número de dias deve ser maior que zero');
      return;
    }
    setSaved(true);
    toast.success('Configuração salva com sucesso!');
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bb-card">
      <div className="bb-card-header">
        <h2 className="bb-card-title" data-testid="challenge-config-title">Campo 1 — Configuração do Desafio</h2>
        <p className="bb-card-subtitle">Defina os produtos e duração do desafio</p>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600, color: 'var(--bb-gray-700)' }}>
          Produtos do Desafio:
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          {PRODUTO_OPTIONS.map(produto => (
            <button
              key={produto}
              onClick={() => handleProdutoToggle(produto)}
              data-testid={`produto-${produto.toLowerCase().replace(/\s+/g, '-')}`}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: '2px solid',
                borderColor: produtos.includes(produto) ? 'var(--bb-blue)' : 'var(--bb-gray-300)',
                background: produtos.includes(produto) ? 'var(--bb-blue)' : 'white',
                color: produtos.includes(produto) ? 'white' : 'var(--bb-gray-700)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {produtos.includes(produto) && <Check size={16} />}
              {produto}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: 'var(--bb-gray-700)' }}>
              Outro Produto:
            </label>
            <input
              type="text"
              value={outroProduto}
              onChange={(e) => setOutroProduto(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddOutro()}
              placeholder="Digite o nome do produto"
              className="bb-input"
              data-testid="outro-produto-input"
            />
          </div>
          <button
            onClick={handleAddOutro}
            className="bb-btn bb-btn-outline"
            data-testid="add-outro-produto-btn"
          >
            Adicionar
          </button>
        </div>

        {produtos.filter(p => !PRODUTO_OPTIONS.includes(p)).length > 0 && (
          <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {produtos.filter(p => !PRODUTO_OPTIONS.includes(p)).map(p => (
              <span
                key={p}
                style={{
                  padding: '6px 12px',
                  background: 'var(--bb-yellow-light)',
                  color: 'var(--bb-blue)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {p}
                <button
                  onClick={() => setProdutos(produtos.filter(pr => pr !== p))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bb-blue)', fontSize: '16px' }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--bb-gray-700)' }}>
          Dias do Desafio:
        </label>
        <input
          type="number"
          min="1"
          value={diasDesafio}
          onChange={(e) => setDiasDesafio(parseInt(e.target.value) || 1)}
          className="bb-input"
          style={{ maxWidth: '200px' }}
          data-testid="dias-desafio-input"
        />
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button
          onClick={handleSave}
          className="bb-btn bb-btn-primary"
          data-testid="save-config-btn"
        >
          <Save size={16} />
          Salvar Configuração
        </button>
        {saved && (
          <span className="bb-badge bb-badge-success">
            <Check size={14} style={{ marginRight: '4px', display: 'inline' }} />
            Salvo!
          </span>
        )}
      </div>

      {produtos.length > 0 && (
        <div style={{ marginTop: '24px', padding: '16px', background: 'var(--bb-gray-50)', borderRadius: '8px', borderLeft: '4px solid var(--bb-blue)' }}>
          <p style={{ fontSize: '14px', color: 'var(--bb-gray-700)', marginBottom: '8px' }}>
            <strong>Produtos selecionados:</strong> {produtos.join(', ')}
          </p>
          <p style={{ fontSize: '14px', color: 'var(--bb-gray-700)' }}>
            <strong>Duração:</strong> {diasDesafio} dias
          </p>
        </div>
      )}
    </div>
  );
};

export default ChallengeConfig;

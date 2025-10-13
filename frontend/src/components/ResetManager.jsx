import React, { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const ResetManager = () => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleResetAll = () => {
    // Lista de todas as chaves do localStorage
    const keys = [
      'challenge_produtos',
      'challenge_dias',
      'carteiras_master',
      'orcados_por_tipo',
      'orcados_por_carteira',
      'meta_percentual',
      'redes',
      'realizados_tipo',
      'realizados_carteira',
      'realizados_tipo_diarios',
      'realizados_carteira_diarios'
    ];

    keys.forEach(key => localStorage.removeItem(key));
    
    toast.success('Todos os dados foram resetados!');
    setShowConfirm(false);
    
    // Recarregar a página
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleClearCurrentField = () => {
    toast.info('Use o botão "Limpar" específico de cada campo');
  };

  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <button
        onClick={() => setShowConfirm(true)}
        style={{
          padding: '10px 20px',
          background: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          transition: 'all 0.2s ease',
          boxShadow: '0 4px 12px rgba(220, 53, 69, 0.3)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#c82333';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#dc3545';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <Trash2 size={16} />
        Resetar Tudo
      </button>

      {showConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px',
              color: '#dc3545'
            }}>
              <AlertTriangle size={32} />
              <h2 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>
                Confirmar Reset
              </h2>
            </div>

            <p style={{ fontSize: '16px', color: '#666', marginBottom: '24px', lineHeight: '1.6' }}>
              Esta ação irá <strong>deletar TODOS os dados</strong> incluindo:
            </p>

            <ul style={{ 
              fontSize: '14px', 
              color: '#666', 
              marginBottom: '24px',
              paddingLeft: '20px'
            }}>
              <li>Produtos configurados</li>
              <li>Carteiras e tipos</li>
              <li>Orçamentos</li>
              <li>Redes</li>
              <li>Realizados (todos os dias)</li>
            </ul>

            <p style={{ 
              fontSize: '14px', 
              color: '#dc3545', 
              fontWeight: '600',
              marginBottom: '24px',
              padding: '12px',
              background: '#f8d7da',
              borderRadius: '8px'
            }}>
              ⚠️ Esta ação não pode ser desfeita!
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  padding: '10px 24px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleResetAll}
                style={{
                  padding: '10px 24px',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Trash2 size={16} />
                Sim, Resetar Tudo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResetManager;

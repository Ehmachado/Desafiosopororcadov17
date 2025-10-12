import React, { useRef } from 'react';
import { Download, Upload } from 'lucide-react';
import { exportBackup, importBackup } from '../utils/exportUtils';
import { toast } from 'sonner';

const BackupManager = () => {
  const fileInputRef = useRef(null);

  const handleExport = () => {
    const allData = {};
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
      'controle_diario'
    ];

    keys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          allData[key] = JSON.parse(value);
        } catch (e) {
          allData[key] = value;
        }
      }
    });

    const timestamp = new Date().toISOString().split('T')[0];
    exportBackup(allData, `backup-desafios-${timestamp}.json`);
    toast.success('Backup exportado com sucesso!');
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const data = await importBackup(file);
      
      Object.entries(data).forEach(([key, value]) => {
        localStorage.setItem(key, JSON.stringify(value));
      });

      toast.success('Backup importado com sucesso! Recarregue a página.');
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      toast.error('Erro ao importar backup: ' + error.message);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '12px' }}>
      <button
        onClick={handleExport}
        className="bb-btn bb-btn-secondary"
        data-testid="export-backup-btn"
      >
        <Download size={16} />
        Exportar Backup
      </button>
      <button
        onClick={() => fileInputRef.current?.click()}
        className="bb-btn bb-btn-secondary"
        data-testid="import-backup-btn"
      >
        <Upload size={16} />
        Importar Backup
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default BackupManager;

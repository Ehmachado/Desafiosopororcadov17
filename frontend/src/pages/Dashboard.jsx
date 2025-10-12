import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Database, TrendingUp, Calendar, BarChart3, FileDown } from 'lucide-react';
import ChallengeConfig from '../components/ChallengeConfig';
import CarteirasMaster from '../components/CarteirasMaster';
import OrcamentoConfig from '../components/OrcamentoConfig';
import RedesConfig from '../components/RedesConfig';
import RealizadoTipo from '../components/RealizadoTipo';
import RealizadoCarteira from '../components/RealizadoCarteira';
import ControleDiario from '../components/ControleDiario';
import RankingExport from '../components/RankingExport';
import BackupManager from '../components/BackupManager';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('config');

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8f9fc 0%, #e8eef7 100%)' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        {/* Header */}
        <header style={{ 
          background: 'linear-gradient(135deg, #003399 0%, #2a56c6 100%)',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '32px',
          boxShadow: '0 8px 24px rgba(0, 51, 153, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ 
                fontSize: '32px', 
                fontWeight: '700', 
                color: 'white',
                marginBottom: '8px',
                letterSpacing: '-0.5px'
              }}>
                Ranking de Desafios de Seguridade
              </h1>
              <p style={{ 
                fontSize: '16px', 
                color: '#ffe680',
                fontWeight: '500'
              }}>
                Banco do Brasil — Sistema de Gestão e Acompanhamento
              </p>
            </div>
            <BackupManager />
          </div>
        </header>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList style={{ 
            background: 'white',
            padding: '8px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 51, 153, 0.08)',
            marginBottom: '24px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px'
          }}>
            <TabsTrigger value="config" data-testid="tab-config">
              <Settings size={16} style={{ marginRight: '6px' }} />
              Configuração
            </TabsTrigger>
            <TabsTrigger value="carteiras" data-testid="tab-carteiras">
              <Database size={16} style={{ marginRight: '6px' }} />
              Carteiras
            </TabsTrigger>
            <TabsTrigger value="orcamento" data-testid="tab-orcamento">
              <TrendingUp size={16} style={{ marginRight: '6px' }} />
              Orçamento
            </TabsTrigger>
            <TabsTrigger value="redes" data-testid="tab-redes">
              <BarChart3 size={16} style={{ marginRight: '6px' }} />
              Redes
            </TabsTrigger>
            <TabsTrigger value="realizado-tipo" data-testid="tab-realizado-tipo">
              <TrendingUp size={16} style={{ marginRight: '6px' }} />
              Realizado Tipo
            </TabsTrigger>
            <TabsTrigger value="realizado-carteira" data-testid="tab-realizado-carteira">
              <Database size={16} style={{ marginRight: '6px' }} />
              Realizado Carteira
            </TabsTrigger>
            <TabsTrigger value="controle-diario" data-testid="tab-controle-diario">
              <Calendar size={16} style={{ marginRight: '6px' }} />
              Controle Diário
            </TabsTrigger>
            <TabsTrigger value="ranking" data-testid="tab-ranking">
              <FileDown size={16} style={{ marginRight: '6px' }} />
              Ranking & Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="fade-in">
            <ChallengeConfig />
          </TabsContent>

          <TabsContent value="carteiras" className="fade-in">
            <CarteirasMaster />
          </TabsContent>

          <TabsContent value="orcamento" className="fade-in">
            <OrcamentoConfig />
          </TabsContent>

          <TabsContent value="redes" className="fade-in">
            <RedesConfig />
          </TabsContent>

          <TabsContent value="realizado-tipo" className="fade-in">
            <RealizadoTipo />
          </TabsContent>

          <TabsContent value="realizado-carteira" className="fade-in">
            <RealizadoCarteira />
          </TabsContent>

          <TabsContent value="controle-diario" className="fade-in">
            <ControleDiario />
          </TabsContent>

          <TabsContent value="ranking" className="fade-in">
            <RankingExport />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;

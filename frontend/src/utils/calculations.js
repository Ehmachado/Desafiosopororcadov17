import { parseNumericValue } from './dataParser';

export const calculateOrcadoPorAgencia = (prefixo, carteiras, orcadosPorTipo, orcadosPorCarteira, useCarteiraBase) => {
  if (!prefixo) return 0;
  
  // Verificar se Campo 3 (orcamento_por_tipo) tem ALGUM dado
  let hasCampo3Data = false;
  if (orcadosPorTipo) {
    if (typeof orcadosPorTipo === 'object' && !Array.isArray(orcadosPorTipo)) {
      // É um objeto - verificar se tem chaves com valores > 0
      hasCampo3Data = Object.values(orcadosPorTipo).some(val => parseNumericValue(val) > 0);
    } else if (Array.isArray(orcadosPorTipo)) {
      // É um array - verificar se tem items
      hasCampo3Data = orcadosPorTipo.length > 0;
    }
  }
  
  // Verificar se Campo 3.1 (orcados_por_carteira) tem dados
  const hasCampo31Data = orcadosPorCarteira && orcadosPorCarteira.length > 0;
  
  console.log('🔍 calculateOrcadoPorAgencia:', {
    prefixo,
    hasCampo3Data,
    hasCampo31Data,
    useCarteiraBase,
    orcadosPorTipoType: typeof orcadosPorTipo,
    orcadosPorTipoKeys: typeof orcadosPorTipo === 'object' ? Object.keys(orcadosPorTipo).length : 0,
    orcadosPorCarteiraLength: orcadosPorCarteira?.length || 0
  });
  
  // ===============================================
  // DECISÃO: Qual fonte de dados usar?
  // ===============================================
  
  // SE: Usuário selecionou "Base = Carteira" OU Campo 3 está vazio
  // E: Campo 3.1 tem dados
  // ENTÃO: Usar Campo 3.1
  if ((useCarteiraBase || !hasCampo3Data) && hasCampo31Data) {
    console.log('✅ USANDO CAMPO 3.1 (orcados_por_carteira)');
    
    const carteirasDestePrefixo = orcadosPorCarteira.filter(o => o.prefixo === prefixo);
    
    const total = carteirasDestePrefixo.reduce((sum, carteira) => {
      // Usar orcadoEfetivo se já estiver calculado
      if (carteira.orcadoEfetivo !== undefined && carteira.orcadoEfetivo !== null) {
        return sum + parseNumericValue(carteira.orcadoEfetivo);
      }
      
      // Caso contrário, calcular: (orcado × meta%) - realizado
      const orcadoBruto = parseNumericValue(carteira.orcadoBruto || carteira.valor || 0);
      const realizado = parseNumericValue(carteira.realizado || 0);
      const fatorMeta = parseNumericValue(carteira.fatorMeta || 100) / 100;
      const orcadoEfetivo = Math.max(0, (orcadoBruto * fatorMeta) - realizado);
      
      return sum + orcadoEfetivo;
    }, 0);
    
    console.log(`💰 Total orçado para ${prefixo}: R$ ${total.toFixed(2)} (${carteirasDestePrefixo.length} carteiras)`);
    return total;
  }
  
  // ===============================================
  // CASO CONTRÁRIO: Usar Campo 3 (orcamento_por_tipo)
  // ===============================================
  
  console.log('✅ USANDO CAMPO 3 (orcamento_por_tipo)');
  
  const carteirasAgencia = carteiras.filter(c => c.prefixo === prefixo);
  
  // FORMATO NOVO: orcadosPorTipo é um objeto { "tipo-produto": valor }
  if (typeof orcadosPorTipo === 'object' && !Array.isArray(orcadosPorTipo)) {
    let totalOrcado = 0;
    carteirasAgencia.forEach(cart => {
      const tipo = cart.tipoCarteira;
      const orcamento = orcadosPorTipo[tipo] || 0;
      totalOrcado += parseNumericValue(orcamento);
    });
    console.log(`💰 Total orçado para ${prefixo}: R$ ${totalOrcado.toFixed(2)}`);
    return totalOrcado;
  }
  
  // FORMATO ANTIGO: orcadosPorTipo é um array
  const tiposCount = {};
  carteirasAgencia.forEach(cart => {
    const tipo = cart.tipoCarteira;
    if (tipo) {
      tiposCount[tipo] = (tiposCount[tipo] || 0) + 1;
    }
  });
  
  let totalOrcado = 0;
  Object.entries(tiposCount).forEach(([tipo, qtd]) => {
    const orcadosTipo = orcadosPorTipo.filter(o => o.tipoCarteira === tipo);
    const somaOrcados = orcadosTipo.reduce((sum, o) => sum + parseNumericValue(o.valor), 0);
    totalOrcado += somaOrcados * qtd;
  });
  
  console.log(`💰 Total orçado para ${prefixo}: R$ ${totalOrcado.toFixed(2)}`);
  return totalOrcado;
};

export const calculateRealizadoPorAgencia = (prefixo, produto, realizadosPorTipo, diaAtual) => {
  if (!prefixo || !produto) return 0;
  
  let realizados = realizadosPorTipo.filter(r => r.prefixo === prefixo);
  
  if (diaAtual) {
    realizados = realizados.filter(r => !r.dia || r.dia <= diaAtual);
  }
  
  if (produto === 'Vida Total') {
    const vida = realizados
      .filter(r => r.produto === 'Vida')
      .reduce((sum, r) => sum + parseNumericValue(r.valor), 0);
    const vidinha = realizados
      .filter(r => r.produto === 'Vidinha')
      .reduce((sum, r) => sum + parseNumericValue(r.valor), 0);
    return vida + vidinha;
  }
  
  return realizados
    .filter(r => r.produto === produto)
    .reduce((sum, r) => sum + parseNumericValue(r.valor), 0);
};

export const calculateRealizadoPorCarteira = (prefixo, carteira, realizadosPorCarteira, diaAtual) => {
  if (!prefixo || !carteira) return 0;
  
  let realizados = realizadosPorCarteira.filter(r => 
    r.prefixo === prefixo && r.carteira === carteira
  );
  
  if (diaAtual) {
    realizados = realizados.filter(r => !r.dia || r.dia <= diaAtual);
  }
  
  return realizados.reduce((sum, r) => sum + parseNumericValue(r.valor), 0);
};

export const calculateAtingimento = (realizado, orcado) => {
  if (!orcado || orcado === 0) return 0;
  return (parseNumericValue(realizado) / parseNumericValue(orcado)) * 100;
};

export const getAtingimentoColor = (percentage) => {
  if (percentage >= 90) return '#28a745'; // Green
  if (percentage >= 60) return '#ffc107'; // Yellow
  return '#dc3545'; // Red
};

export const getAtingimentoClass = (percentage) => {
  if (percentage >= 90) return 'status-excellent';
  if (percentage >= 60) return 'status-warning';
  return 'status-danger';
};

export const calculatePotencialPorTipo = (tipoCarteira, carteiras, orcadosPorTipo) => {
  const numCarteiras = carteiras.filter(c => c.tipoCarteira === tipoCarteira).length;
  const somaOrcados = orcadosPorTipo
    .filter(o => o.tipoCarteira === tipoCarteira)
    .reduce((sum, o) => sum + parseNumericValue(o.valor), 0);
  
  return numCarteiras * somaOrcados;
};

export const calculatePotencialTotal = (carteiras, orcadosPorTipo) => {
  const tiposUnicos = [...new Set(carteiras.map(c => c.tipoCarteira))];
  
  return tiposUnicos.reduce((total, tipo) => {
    return total + calculatePotencialPorTipo(tipo, carteiras, orcadosPorTipo);
  }, 0);
};

export const groupByRede = (data, redes) => {
  const grouped = {};
  
  data.forEach(item => {
    const redeInfo = redes.find(r => r.prefixo === item.prefixo);
    const rede = redeInfo?.rede || 'Sem Rede';
    
    if (!grouped[rede]) {
      grouped[rede] = [];
    }
    grouped[rede].push(item);
  });
  
  return grouped;
};

export const sortByScoreMedio = (rankings) => {
  return [...rankings].sort((a, b) => {
    const scoreA = a.atingimentos ? 
      Object.values(a.atingimentos).reduce((sum, val) => sum + val, 0) / Object.values(a.atingimentos).length : 0;
    const scoreB = b.atingimentos ? 
      Object.values(b.atingimentos).reduce((sum, val) => sum + val, 0) / Object.values(b.atingimentos).length : 0;
    
    return scoreB - scoreA;
  });
};

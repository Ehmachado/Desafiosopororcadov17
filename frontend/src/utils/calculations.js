import { parseNumericValue } from './dataParser';

export const calculateOrcadoPorAgencia = (prefixo, carteiras, orcadosPorTipo, orcadosPorCarteira, useCarteiraBase) => {
  if (!prefixo) return 0;
  
  if (useCarteiraBase && orcadosPorCarteira && orcadosPorCarteira.length > 0) {
    const orcados = orcadosPorCarteira.filter(o => o.prefixo === prefixo);
    return orcados.reduce((sum, o) => {
      const valor = parseNumericValue(o.valor);
      const fatorMeta = parseNumericValue(o.fatorMeta || 100) / 100;
      return sum + (valor * fatorMeta);
    }, 0);
  }
  
  const carteirasAgencia = carteiras.filter(c => c.prefixo === prefixo);
  
  // NOVO FORMATO: orcadosPorTipo é um objeto { tipoCarteira: valor }
  if (typeof orcadosPorTipo === 'object' && !Array.isArray(orcadosPorTipo)) {
    let totalOrcado = 0;
    carteirasAgencia.forEach(cart => {
      const tipo = cart.tipoCarteira;
      const orcamento = orcadosPorTipo[tipo] || 0;
      totalOrcado += parseNumericValue(orcamento);
    });
    return totalOrcado;
  }
  
  // FORMATO ANTIGO: orcadosPorTipo é um array
  // Contar quantas carteiras de cada tipo
  const tiposCount = {};
  carteirasAgencia.forEach(cart => {
    const tipo = cart.tipoCarteira;
    if (tipo) {
      tiposCount[tipo] = (tiposCount[tipo] || 0) + 1;
    }
  });
  
  let totalOrcado = 0;
  Object.entries(tiposCount).forEach(([tipo, qtd]) => {
    // Soma todos os produtos desse tipo
    const orcadosTipo = orcadosPorTipo.filter(o => o.tipoCarteira === tipo);
    const somaOrcados = orcadosTipo.reduce((sum, o) => sum + parseNumericValue(o.valor), 0);
    totalOrcado += somaOrcados * qtd;
  });
  
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

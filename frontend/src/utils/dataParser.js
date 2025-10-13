export const parseTabDelimited = (text) => {
  if (!text || !text.trim()) return [];
  
  const lines = text.trim().split('\n');
  const rows = lines.map(line => line.split('\t'));
  return rows;
};

export const detectColumns = (rows, targetColumns) => {
  if (!rows || rows.length === 0) return {};
  
  const headerRow = rows[0];
  const mapping = {};
  
  targetColumns.forEach(target => {
    const normalized = target.toLowerCase().replace(/[\s\/\-_]/g, '');
    
    const columnIndex = headerRow.findIndex(header => {
      const normalizedHeader = header.toLowerCase().replace(/[\s\/\-_]/g, '');
      return normalizedHeader.includes(normalized) || normalized.includes(normalizedHeader);
    });
    
    if (columnIndex !== -1) {
      mapping[target] = columnIndex;
    }
  });
  
  return mapping;
};

export const mapRowsToObjects = (rows, mapping, startRow = 1) => {
  if (!rows || rows.length <= startRow) return [];
  
  return rows.slice(startRow).map((row, idx) => {
    const obj = {};
    Object.entries(mapping).forEach(([key, index]) => {
      obj[key] = row[index] || '';
    });
    obj._rowIndex = idx;
    return obj;
  }).filter(obj => {
    // Filter out empty rows
    const values = Object.values(obj).filter(v => v && v !== obj._rowIndex);
    return values.length > 0;
  });
};

export const parseNumericValue = (value) => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  
  let str = String(value).trim();
  
  // Remove R$, espaços e outros caracteres não numéricos (exceto . , -)
  str = str.replace(/[^\d,.-]/g, '');
  
  // Detectar formato: se tem vírgula E ponto, determinar qual é decimal
  const hasComma = str.includes(',');
  const hasDot = str.includes('.');
  
  if (hasComma && hasDot) {
    // Ambos presentes: o último é o decimal
    const lastComma = str.lastIndexOf(',');
    const lastDot = str.lastIndexOf('.');
    
    if (lastComma > lastDot) {
      // Formato brasileiro: 1.500,50 -> remove pontos, troca vírgula por ponto
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // Formato americano: 1,500.50 -> remove vírgulas
      str = str.replace(/,/g, '');
    }
  } else if (hasComma) {
    // Só vírgula: pode ser 1,5 (decimal) ou 1500,00 (milhares + decimal)
    const parts = str.split(',');
    if (parts[0].length > 3 || (parts[1] && parts[1].length !== 2)) {
      // Provavelmente formato brasileiro com milhares: 1500,00 -> apenas troca vírgula
      str = str.replace(',', '.');
    } else {
      // Decimal simples: 1,5 -> troca vírgula
      str = str.replace(',', '.');
    }
  } else if (hasDot) {
    // Só ponto: pode ser 1.5 (decimal) ou 1.500 (milhares)
    const parts = str.split('.');
    if (parts.length === 2 && parts[1].length === 3 && parts[0].length <= 3) {
      // Formato brasileiro de milhares: 1.500 -> remove o ponto
      str = str.replace('.', '');
    }
    // Senão mantém o ponto como decimal: 1.5
  }
  
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
};

export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
};

export const formatPercentage = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format((value || 0) / 100);
};

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
  
  const cleaned = String(value)
    .replace(/[^0-9,.-]/g, '')
    .replace(',', '.');
  
  const parsed = parseFloat(cleaned);
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

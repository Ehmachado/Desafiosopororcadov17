import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ColumnMapper = ({ targetColumns, detectedMapping, availableColumns, onMappingChange }) => {
  const handleColumnChange = (targetCol, selectedIndex) => {
    onMappingChange({
      ...detectedMapping,
      [targetCol]: selectedIndex === 'none' ? undefined : parseInt(selectedIndex)
    });
  };

  return (
    <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--bb-gray-50)', borderRadius: '8px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--bb-blue)', marginBottom: '12px' }}>
        Mapeamento de Colunas
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
        {targetColumns.map(targetCol => (
          <div key={targetCol}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500, color: 'var(--bb-gray-700)' }}>
              {targetCol}:
            </label>
            <Select
              value={detectedMapping[targetCol]?.toString() || 'none'}
              onValueChange={(value) => handleColumnChange(targetCol, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a coluna" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                {availableColumns.map((col, idx) => (
                  <SelectItem key={idx} value={idx.toString()}>
                    Col {idx + 1}: {col.substring(0, 30)}{col.length > 30 ? '...' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ColumnMapper;

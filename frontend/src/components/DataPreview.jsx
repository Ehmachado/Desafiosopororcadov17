import React from 'react';

const DataPreview = ({ data, columns, maxRows = 5 }) => {
  const displayData = data.slice(0, maxRows);

  return (
    <div style={{ marginTop: '16px', marginBottom: '16px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--bb-blue)', marginBottom: '12px' }}>
        Preview dos Dados ({data.length} linhas)
      </h3>
      <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--bb-gray-200)', borderRadius: '8px' }}>
        <table className="data-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayData.map((row, idx) => (
              <tr key={idx}>
                {columns.map(col => (
                  <td key={col.key}>{row[col.key] || '-'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.length > maxRows && (
        <p style={{ textAlign: 'center', padding: '8px', color: 'var(--bb-gray-600)', fontSize: '13px' }}>
          Mostrando {maxRows} de {data.length} linhas
        </p>
      )}
    </div>
  );
};

export default DataPreview;

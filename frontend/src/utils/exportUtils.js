import html2canvas from 'html2canvas';

export const exportToPNG = async (elementId, filename = 'ranking.png') => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Element not found:', elementId);
    return;
  }
  
  try {
    // Calcula a largura real do elemento (incluindo scroll)
    const scrollWidth = element.scrollWidth;
    const scrollHeight = element.scrollHeight;
    
    // Ajusta scale baseado no tamanho do elemento
    let scale = 2;
    if (scrollWidth > 2000) {
      scale = 1.5; // Reduz scale para elementos muito largos
    }
    if (scrollWidth > 3000) {
      scale = 1.2; // Reduz ainda mais para elementos extremamente largos
    }
    
    const canvas = await html2canvas(element, {
      scale: scale,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      width: scrollWidth,
      height: scrollHeight,
      windowWidth: scrollWidth,
      windowHeight: scrollHeight,
      scrollX: 0,
      scrollY: 0
    });
    
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (error) {
    console.error('Error exporting to PNG:', error);
  }
};

export const exportAllRedes = async (redesList, elementPrefix = 'ranking-rede-') => {
  for (const rede of redesList) {
    const elementId = `${elementPrefix}${rede.replace(/\s+/g, '-')}`;
    await exportToPNG(elementId, `ranking-${rede}.png`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
};

export const exportBackup = (data, filename = 'backup-desafios.json') => {
  const dataStr = JSON.stringify(data, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
  
  URL.revokeObjectURL(url);
};

export const importBackup = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        resolve(data);
      } catch (error) {
        reject(new Error('Invalid JSON file'));
      }
    };
    
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsText(file);
  });
};

export const THEME_VARIANTS = [
  {
    name: 'Clássico BB',
    headerBg: 'linear-gradient(135deg, #003399 0%, #2a56c6 100%)',
    headerColor: 'white',
    accentColor: '#ffcc00'
  },
  {
    name: 'Moderno',
    headerBg: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
    headerColor: 'white',
    accentColor: '#fbbf24'
  },
  {
    name: 'Elegante',
    headerBg: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
    headerColor: 'white',
    accentColor: '#10b981'
  },
  {
    name: 'Vibrante',
    headerBg: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
    headerColor: 'white',
    accentColor: '#fbbf24'
  },
  {
    name: 'Ocean',
    headerBg: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
    headerColor: 'white',
    accentColor: '#fbbf24'
  },
  {
    name: 'Sunset',
    headerBg: 'linear-gradient(135deg, #dc2626 0%, #f97316 100%)',
    headerColor: 'white',
    accentColor: '#fef3c7'
  },
  {
    name: 'Forest',
    headerBg: 'linear-gradient(135deg, #065f46 0%, #059669 100%)',
    headerColor: 'white',
    accentColor: '#fde68a'
  },
  {
    name: 'Royal',
    headerBg: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)',
    headerColor: 'white',
    accentColor: '#fcd34d'
  },
  {
    name: 'Corporate',
    headerBg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    headerColor: 'white',
    accentColor: '#38bdf8'
  },
  {
    name: 'Professional',
    headerBg: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
    headerColor: 'white',
    accentColor: '#fbbf24'
  }
];

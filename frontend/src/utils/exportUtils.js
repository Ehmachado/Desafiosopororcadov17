import html2canvas from 'html2canvas';

export const exportToPNG = async (elementId, filename = 'ranking.png') => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Element not found:', elementId);
    return;
  }
  
  try {
    // Força o elemento a ter o tamanho do conteúdo sem espaço extra
    const originalOverflow = element.style.overflow;
    element.style.overflow = 'visible';
    
    // Aguarda um momento para garantir que o DOM foi atualizado
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Usa getBoundingClientRect para obter o tamanho exato do conteúdo
    const rect = element.getBoundingClientRect();
    const width = Math.ceil(rect.width);
    const height = Math.ceil(rect.height);
    
    // Ajusta scale baseado no tamanho do elemento
    let scale = 2;
    if (width > 2000) {
      scale = 1.5;
    }
    if (width > 3000) {
      scale = 1.2;
    }
    
    const canvas = await html2canvas(element, {
      scale: scale,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      allowTaint: true,
      width: width,
      height: height,
      windowWidth: width,
      windowHeight: height,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      foreignObjectRendering: false
    });
    
    // Restaura o overflow original
    element.style.overflow = originalOverflow;
    
    // Remove espaços em branco da imagem
    const trimmedCanvas = trimCanvas(canvas);
    
    const link = document.createElement('a');
    link.download = filename;
    link.href = trimmedCanvas.toDataURL('image/png');
    link.click();
  } catch (error) {
    console.error('Error exporting to PNG:', error);
  }
};

// Função auxiliar para remover bordas brancas do canvas
const trimCanvas = (canvas) => {
  const ctx = canvas.getContext('2d');
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = pixels.data;
  
  let top = 0, bottom = canvas.height, left = 0, right = canvas.width;
  
  // Encontrar top
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;
      // Se não for branco (255, 255, 255) ou transparente
      if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255 || data[i + 3] !== 255) {
        top = y;
        y = canvas.height;
        break;
      }
    }
  }
  
  // Encontrar bottom
  for (let y = canvas.height - 1; y >= 0; y--) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;
      if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255 || data[i + 3] !== 255) {
        bottom = y + 1;
        y = -1;
        break;
      }
    }
  }
  
  // Encontrar left
  for (let x = 0; x < canvas.width; x++) {
    for (let y = 0; y < canvas.height; y++) {
      const i = (y * canvas.width + x) * 4;
      if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255 || data[i + 3] !== 255) {
        left = x;
        x = canvas.width;
        break;
      }
    }
  }
  
  // Encontrar right
  for (let x = canvas.width - 1; x >= 0; x--) {
    for (let y = 0; y < canvas.height; y++) {
      const i = (y * canvas.width + x) * 4;
      if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255 || data[i + 3] !== 255) {
        right = x + 1;
        x = -1;
        break;
      }
    }
  }
  
  const trimWidth = right - left;
  const trimHeight = bottom - top;
  
  // Se não encontrou conteúdo, retorna o canvas original
  if (trimWidth <= 0 || trimHeight <= 0) {
    return canvas;
  }
  
  // Cria novo canvas com tamanho cortado
  const trimmedCanvas = document.createElement('canvas');
  trimmedCanvas.width = trimWidth;
  trimmedCanvas.height = trimHeight;
  const trimmedCtx = trimmedCanvas.getContext('2d');
  
  // Copia a parte relevante
  trimmedCtx.drawImage(canvas, left, top, trimWidth, trimHeight, 0, 0, trimWidth, trimHeight);
  
  return trimmedCanvas;
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

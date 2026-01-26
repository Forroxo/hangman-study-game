export const normalizeText = (text) => {
  if (!text) return '';
  
  return text
    .toUpperCase()
    .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^A-Z0-9]/g, ''); // Permite letras e números, remove o resto
};

// ✅ NOVO: Versão que preserve espaços para display
export const normalizeTextWithSpaces = (text) => {
  if (!text) return '';
  
  return text
    .toUpperCase()
    .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^A-Z0-9\s]/g, ''); // Permite letras, números e espaços
};

export const compareWords = (word1, word2) => {
  return normalizeText(word1) === normalizeText(word2);
};

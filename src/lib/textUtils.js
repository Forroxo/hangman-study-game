export const normalizeText = (text) => {
  if (!text) return '';
  
  return text
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^A-Z]/g, ''); // Remove TUDO que não é A-Z (incluindo espaços)
};

// ✅ NOVO: Versão que preserve espaços para display
export const normalizeTextWithSpaces = (text) => {
  if (!text) return '';
  
  return text
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^A-Z\s]/g, ''); // Remove tudo exceto A-Z e espaços
};

export const compareWords = (word1, word2) => {
  return normalizeText(word1) === normalizeText(word2);
};

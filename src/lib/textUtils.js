export const normalizeText = (text) => {
  if (!text) return '';
  
  return text
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^A-Z\s]/g, ''); // Remove caracteres especiais, mantém apenas A-Z e espaços
};

export const compareWords = (word1, word2) => {
  return normalizeText(word1) === normalizeText(word2);
};

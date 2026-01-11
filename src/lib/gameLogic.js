/**
 * Lógica principal do jogo da forca
 */

// Verifica se uma letra está na palavra
export function checkGuess(word, letter) {
  return word.toUpperCase().includes(letter.toUpperCase());
}

// Calcula tentativas restantes
export function calculateRemainingAttempts(word, guessedLetters) {
  const uniqueLetters = [...new Set(word.toUpperCase().replace(/[^A-ZÀ-Ü]/g, ''))];
  const wrongGuesses = guessedLetters.filter(
    letter => !uniqueLetters.includes(letter)
  );
  
  return Math.max(0, 6 - wrongGuesses.length);
}

// Verifica se o jogador venceu
export function checkWin(word, guessedLetters) {
  const uniqueLetters = [...new Set(word.toUpperCase().replace(/[^A-ZÀ-Ü]/g, ''))];
  return uniqueLetters.every(letter => guessedLetters.includes(letter));
}

// Calcula pontuação baseada no tempo e erros
export function calculateScore(word, guessedLetters, timeSpent) {
  const baseScore = 100;
  const wrongGuesses = guessedLetters.filter(
    letter => !word.toUpperCase().includes(letter)
  ).length;
  
  const wrongPenalty = wrongGuesses * 10;
  const timeBonus = Math.max(0, 300 - timeSpent) / 10; // Bônus por ser rápido
  const completionBonus = checkWin(word, guessedLetters) ? 50 : 0;
  
  return Math.max(0, baseScore - wrongPenalty + timeBonus + completionBonus);
}

// Gera uma dica baseada na palavra
export function generateHint(word, guessedLetters) {
  const wordUpper = word.toUpperCase();
  const revealedLetters = guessedLetters.filter(l => wordUpper.includes(l));
  
  if (revealedLetters.length === 0) {
    return `Palavra com ${word.length} letras`;
  }
  
  const positions = [];
  for (let i = 0; i < word.length; i++) {
    if (revealedLetters.includes(wordUpper[i])) {
      positions.push(`${i + 1}ª letra: ${word[i]}`);
    }
  }
  
  if (positions.length > 0) {
    return `Contém: ${positions.join(', ')}`;
  }
  
  return `Dica: ${word.length} letras`;
}

// Valida se uma letra é válida
export function isValidLetter(letter) {
  return /^[A-ZÀ-Ü]$/i.test(letter);
}

// Obtém o estado atual da palavra para exibição
export function getDisplayWord(word, guessedLetters, showAll = false) {
  return word
    .toUpperCase()
    .split('')
    .map(letter => {
      if (letter === ' ') return ' ';
      if (showAll || guessedLetters.includes(letter)) {
        return letter;
      }
      return '_';
    })
    .join(' ');
}
import { useState, useEffect } from 'react';
import { normalizeText } from '../../lib/textUtils';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export default function GameControls({ onGuess, guessedLetters, gameStatus, onSolve }) {
  const [quickGuess, setQuickGuess] = useState('');
  const [showKeyboard, setShowKeyboard] = useState(false);

  const handleLetterClick = (letter) => {
    if (gameStatus === 'playing' && !guessedLetters.includes(letter)) {
      onGuess(letter);
    }
  };

  const handleQuickGuessSubmit = (e) => {
    e.preventDefault();
    if (quickGuess.trim().length > 0) {
      const normalized = normalizeText(quickGuess);
      if (normalized.length === 1 && /^[A-Z]$/.test(normalized)) {
        const letter = normalized;
        if (!guessedLetters.includes(letter)) {
          onGuess(letter);
        }
        setQuickGuess('');
      }
    }
  };

  // Teclado físico - ✅ CORRIGIDO: Normaliza entrada de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameStatus !== 'playing') return;
      
      const normalized = normalizeText(e.key);
      if (normalized && /^[A-Z]$/.test(normalized) && !guessedLetters.includes(normalized)) {
        onGuess(normalized);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStatus, guessedLetters, onGuess]);

  const availableLetters = ALPHABET.split('').filter(
    letter => !guessedLetters.includes(letter)
  );

  return (
    <div className="space-y-6">
      {/* Input rápido - ✅ CORRIGIDO: Permite letra OU palavra completa */}
      <div className="bg-gray-50 rounded-xl p-4">
        <form onSubmit={handleQuickGuessSubmit} className="flex gap-2">
          <input
            type="text"
            value={quickGuess}
            onChange={(e) => {
              const val = normalizeText(e.target.value);
              // Aceita apenas letras (sem espaços, sem números)
              if (/^[A-Z]*$/.test(val)) {
                setQuickGuess(val);
              }
            }}
            placeholder="Digite uma letra ou palavra..."
            className="flex-1 input-field"
            disabled={gameStatus !== 'playing'}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={gameStatus !== 'playing' || !quickGuess}
            className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Tentar
          </button>
        </form>
        <p className="text-sm text-gray-500 mt-2">
          Pressione qualquer tecla do teclado, digite uma letra ou uma palavra completa
        </p>
      </div>

      {/* Teclado virtual opcional */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-700">Teclado Virtual</h3>
          <button
            onClick={() => setShowKeyboard(!showKeyboard)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showKeyboard ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        
        {showKeyboard && (
          <div className="grid grid-cols-9 sm:grid-cols-13 gap-1">
            {ALPHABET.split('').map((letter) => {
              const isGuessed = guessedLetters.includes(letter);
              const isDisabled = isGuessed || gameStatus !== 'playing';
              
              return (
                <button
                  key={letter}
                  onClick={() => handleLetterClick(letter)}
                  disabled={isDisabled}
                  className={`
                    h-12 rounded-lg font-medium text-lg
                    transition-all duration-200
                    ${isGuessed
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : gameStatus !== 'playing'
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200 hover:scale-105 active:scale-95'
                    }
                  `}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Botões de ação */}
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={() => {
            if (availableLetters.length > 0 && gameStatus === 'playing') {
              const randomLetter = availableLetters[
                Math.floor(Math.random() * availableLetters.length)
              ];
              onGuess(randomLetter);
            }
          }}
          disabled={gameStatus !== 'playing' || availableLetters.length === 0}
          className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Letra Aleatória
        </button>
        
        <button
          onClick={onSolve}
          disabled={gameStatus !== 'playing'}
          className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Revelar Palavra
        </button>
        
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          Novo Jogo
        </button>
      </div>
    </div>
  );
}
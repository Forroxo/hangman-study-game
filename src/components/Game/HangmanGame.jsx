import { useState, useEffect } from 'react';
import HangmanDrawing from './HangmanDrawing';
import WordDisplay from './WordDisplay';
import GameControls from './GameControls';
import GameStatus from './GameStatus';

export default function HangmanGame({ term, onGameEnd }) {
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [errors, setErrors] = useState(0);
  const [gameStatus, setGameStatus] = useState('playing');
  const [timeSpent, setTimeSpent] = useState(0);
  const [showHint, setShowHint] = useState(false);

  // Timer
  useEffect(() => {
    if (gameStatus !== 'playing') return;
    
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [gameStatus]);

  // Lógica simplificada do jogo
  useEffect(() => {
    if (!term?.word || gameStatus !== 'playing') return;
    
    const word = term.word.toUpperCase();
    const uniqueLetters = [...new Set(word.replace(/[^A-Z]/g, ''))];
    
    // Verifica vitória
    const hasWon = uniqueLetters.every(letter => 
      guessedLetters.includes(letter)
    );
    
    // Verifica derrota (6 erros)
    const wrongGuesses = guessedLetters.filter(
      letter => !word.includes(letter)
    ).length;
    
    if (hasWon) {
      setGameStatus('won');
      onGameEnd?.(term.id, 'won', timeSpent);
    } else if (wrongGuesses >= 6) {
      setGameStatus('lost');
      onGameEnd?.(term.id, 'lost', timeSpent);
    } else {
      setErrors(wrongGuesses);
    }
  }, [guessedLetters, term, timeSpent, gameStatus, onGameEnd]);

  const handleGuess = (letter) => {
    if (gameStatus !== 'playing' || guessedLetters.includes(letter)) return;
    setGuessedLetters(prev => [...prev, letter]);
  };

  // Teclado físico
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (gameStatus !== 'playing') return;
      
      const key = e.key.toUpperCase();
      if (/^[A-Z]$/.test(key)) {
        handleGuess(key);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStatus, guessedLetters]);

  const handleNext = () => {
    if (onGameEnd && gameStatus === 'playing') {
      onGameEnd(term.id, gameStatus, timeSpent);
    }
  };

  if (!term) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando jogo...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white rounded-2xl shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Jogo da Forca</h2>
          <div className="flex items-center gap-4 mt-2">
            <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              Erros: {errors}/6
            </div>
            <div className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
              Tempo: {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}
            </div>
          </div>
        </div>
        
        <button
          onClick={() => setShowHint(!showHint)}
          className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
        >
          {showHint ? 'Ocultar Dica' : 'Mostrar Dica'}
        </button>
      </div>

      {/* Dica */}
      {showHint && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700 font-medium">💡 {term.hint}</p>
        </div>
      )}

      {/* Jogo */}
      <div className="flex flex-col md:flex-row gap-8 items-center">
        <div className="flex-1">
          <HangmanDrawing errors={errors} status={gameStatus} />
        </div>
        
        <div className="flex-1">
          <WordDisplay 
            word={term.word}
            guessedLetters={guessedLetters}
            gameStatus={gameStatus}
          />
          
          {gameStatus !== 'playing' && (
            <GameStatus 
              status={gameStatus}
              timeSpent={timeSpent}
              word={term.word}
              onNext={handleNext}
              onReview={() => {}}
            />
          )}
        </div>
      </div>

      {/* Controles */}
      {gameStatus === 'playing' && (
        <div className="mt-8">
          <GameControls 
            onGuess={handleGuess}
            guessedLetters={guessedLetters}
            gameStatus={gameStatus}
            onSolve={() => setGameStatus('solved')}
          />
        </div>
      )}
    </div>
  );
}

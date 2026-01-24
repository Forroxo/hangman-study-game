import { useState, useEffect, useCallback } from 'react';
import HangmanDrawing from './HangmanDrawing';
import WordDisplay from './WordDisplay';
import GameStatus from './GameStatus';
import { normalizeText, compareWords } from '../../lib/textUtils';
import { submitGuess } from '../../lib/multiplayerService';

// ✅ NOVO: Componente com suporte a modo multiplayer via transações
export default function HangmanGame({ term, onGameEnd, isMultiplayer = false, roomCode = null, playerId = null, roomData = null }) {
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [errors, setErrors] = useState(0);
  const [gameStatus, setGameStatus] = useState('playing');
  const [timeSpent, setTimeSpent] = useState(0);
  const [wordInput, setWordInput] = useState('');
  const [letterInput, setLetterInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Se for multiplayer, sincroniza com Firebase
  useEffect(() => {
    if (!isMultiplayer || !roomData || !roomData.players || !playerId) return;
    
    const playerData = roomData.players[playerId];
    if (!playerData) return;
    
    // ✅ Sincroniza APENAS o estado do jogador atual
    // Não mais compartilhado entre jogadores
    setGuessedLetters(playerData.guessedLetters || []);
    setErrors(playerData.wrongGuesses || 0);
    
    // Se chegou ao final do jogo
    if (playerData.currentTermIndex >= roomData.terms.length) {
      setGameStatus('finished');
    }
  }, [roomData, isMultiplayer, playerId]);

  // ✅ NOVO: Reset quando termo muda (jogador avançou)
  useEffect(() => {
    if (!isMultiplayer || !term) return;
    
    // Reset do estado local quando entra num novo termo
    setGameStatus('playing');
    setWordInput('');
    setLetterInput('');
    setErrorMessage('');
  }, [term?.id, isMultiplayer]);

  // Timer - NÃO deve triggar verificação de vitória
  useEffect(() => {
    if (gameStatus !== 'playing') return;
    
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [gameStatus]);

  // ✅ CORRIGIDO: Separar lógica de vitória em useEffect diferente
  // Este efeito APENAS verifica vitória/derrota quando letras mudam
  // NÃO depende de timeSpent para evitar loop infinito
  useEffect(() => {
    if (!term?.word || gameStatus !== 'playing') return;
    
    const normalizedWord = normalizeText(term.word);
    const uniqueLetters = [...new Set(normalizedWord.replace(/[^A-Z]/g, ''))];
    
    // Verifica vitória
    const hasWon = uniqueLetters.every(letter => 
      guessedLetters.includes(letter)
    );
    
    // Verifica derrota (6 erros)
    const wrongGuesses = guessedLetters.filter(
      letter => !normalizedWord.includes(letter)
    ).length;
    
    if (hasWon) {
      setGameStatus('won');
      // ✅ CORRIGIDO: Callback agora é memoizado
      onGameEnd?.('won', timeSpent);
    } else if (wrongGuesses >= 6) {
      setGameStatus('lost');
      onGameEnd?.('lost', timeSpent);
    } else {
      setErrors(wrongGuesses);
    }
    // ❌ REMOVIDO: timeSpent da dependência
  }, [guessedLetters, term, gameStatus, onGameEnd]);

  // ✅ NOVO: Handler para palpites com transações (multiplayer)
  const handleMultiplayerGuess = useCallback(async (guess) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage('');
    
    try {
      const result = await submitGuess(roomCode, playerId, guess);
      
      if (result) {
        console.log('✅ Palpite enviado com sucesso');
        // Estado será sincronizado pelo listener do Firebase
      } else {
        // Transação foi cancelada (pode ser duplicada)
        console.log('⚠️ Palpite já processado ou jogo não ativo');
      }
    } catch (error) {
      console.error('❌ Erro ao enviar palpite:', error);
      setErrorMessage(error.message || 'Erro ao processar palpite');
    } finally {
      setIsSubmitting(false);
      setLetterInput('');
      setWordInput('');
    }
  }, [roomCode, playerId, isSubmitting]);

  // ✅ Handler unificado para palpites
  const handleGuess = useCallback((letter) => {
    if (gameStatus !== 'playing') {
      setErrorMessage('Jogo não está em andamento');
      return;
    }
    
    if (isMultiplayer) {
      // Modo multiplayer: usa transação
      handleMultiplayerGuess(letter);
    } else {
      // Modo single-player: lógica local
      if (guessedLetters.includes(letter)) return;
      setGuessedLetters(prev => [...prev, letter]);
    }
    setLetterInput('');
  }, [gameStatus, isMultiplayer, guessedLetters, handleMultiplayerGuess]);

  const handleWordGuess = (e) => {
    e.preventDefault();
    if (gameStatus !== 'playing' || !wordInput.trim()) return;
    
    if (isMultiplayer) {
      // Modo multiplayer: usa transação
      handleMultiplayerGuess(wordInput);
    } else {
      // Modo single-player
      const normalizedInput = normalizeText(wordInput);
      const normalizedWord = normalizeText(term.word);
      
      if (normalizedInput === normalizedWord) {
        // Acertou a palavra completa
        const allLetters = [...new Set(normalizedWord.replace(/[^A-Z]/g, ''))];
        setGuessedLetters(allLetters);
        setWordInput('');
      } else {
        // Errou - conta como erro
        setErrors(prev => prev + 1);
        setWordInput('');
        
        if (errors + 1 >= 6) {
          setGameStatus('lost');
          onGameEnd?.('lost', timeSpent);
        }
      }
    }
  };

  const handleLetterGuess = (e) => {
    e.preventDefault();
    if (gameStatus !== 'playing' || !letterInput.trim()) return;
    
    const letter = normalizeText(letterInput)[0];
    if (letter && /^[A-Z]$/.test(letter)) {
      handleGuess(letter);
    }
  };

  // Teclado físico - ✅ Agora com suporte a multiplayer
  useEffect(() => {
    if (typeof window === 'undefined' || gameStatus !== 'playing') return;
    
    const handleKeyPress = (e) => {
      if (gameStatus !== 'playing') return;
      
      const key = normalizeText(e.key)[0];
      if (key && /^[A-Z]$/.test(key)) {
        if (isMultiplayer) {
          handleMultiplayerGuess(key);
        } else {
          if (!guessedLetters.includes(key)) {
            handleGuess(key);
          }
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStatus, isMultiplayer, guessedLetters, handleMultiplayerGuess]);

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
      </div>

      {/* Dica sempre visível */}
      <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">💡</span>
          <span className="font-semibold text-blue-900">Dica:</span>
        </div>
        <p className="text-blue-800 font-medium text-lg">{term.hint}</p>
      </div>

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
        <div className="mt-8 space-y-4">
          {/* Mensagem de erro */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-6 py-3 rounded-lg">
              {errorMessage}
            </div>
          )}
          {/* Input para palavra completa */}
          <form onSubmit={handleWordGuess} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
            <label className="block text-sm font-semibold text-green-900 mb-3">
              💡 Sabe a palavra? Digite completa:
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={wordInput}
                onChange={(e) => setWordInput(e.target.value.toUpperCase())}
                placeholder="Digite a palavra completa..."
                className="flex-1 px-4 py-3 border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-lg font-medium uppercase"
                disabled={gameStatus !== 'playing'}
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={gameStatus !== 'playing' || !wordInput.trim()}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tentar
              </button>
            </div>
            <p className="text-xs text-green-700 mt-2">
              ⚠️ Cuidado! Se errar a palavra completa, conta como erro
            </p>
          </form>

          {/* Input para letra */}
          <form onSubmit={handleLetterGuess} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              🔤 Ou tente uma letra:
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={letterInput}
                onChange={(e) => {
                  const normalized = normalizeText(e.target.value);
                  setLetterInput(normalized.slice(0, 1));
                }}
                placeholder="Digite uma letra..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-medium uppercase text-center"
                maxLength={1}
                disabled={gameStatus !== 'playing'}
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={gameStatus !== 'playing' || !letterInput || isSubmitting}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '⏳...' : 'Tentar'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 Você também pode usar o teclado do seu computador/celular
            </p>
          </form>
        </div>
      )}
    </div>
  );
}

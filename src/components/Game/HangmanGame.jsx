import { useState, useEffect, useCallback } from 'react';
import HangmanDrawing from './HangmanDrawing';
import WordDisplay from './WordDisplay';
import GameStatus from './GameStatus';
import SessionReport from './SessionReport';
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
  const [history, setHistory] = useState([]);
  const [showReport, setShowReport] = useState(false);

  // ✅ CORRIGIDO: Sincroniza guessedLetters SEMPRE que playerData muda
  // ANTES: useEffect só rodava quando roomData mudava (insuficiente)
  // AGORA: Roda quando playerData específico é atualizado pelo servidor
  useEffect(() => {
    if (!isMultiplayer || !roomData?.players || !playerId) return;
    
    const playerData = roomData.players[playerId];
    if (!playerData) return;
    
    // ✅ Sincroniza estado do jogador em tempo real
    setGuessedLetters(playerData.guessedLetters || []);
    setErrors(playerData.wrongGuesses || 0);
    
    // Se o servidor avançou para novo termo, reseta UI
    if (playerData.currentTermIndex >= roomData.terms.length) {
      setGameStatus('finished');
    }
  }, [roomData?.players?.[playerId], isMultiplayer, playerId, roomData?.terms?.length]);

  // ✅ CORRIGIDO: Reset quando termo muda (jogador avançou)
  // Removido isMultiplayer da dependency array para evitar reset múltiplo
  useEffect(() => {
    if (!term) return;

    // Reset do estado local quando entra num novo termo (single e multiplayer)
    setGameStatus('playing');
    setWordInput('');
    setLetterInput('');
    setErrorMessage('');
    setGuessedLetters([]);
    setErrors(0);
    setTimeSpent(0);
  }, [term?.id]);

  // Timer - NÃO deve triggar verificação de vitória
  useEffect(() => {
    if (gameStatus !== 'playing') return;
    
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [gameStatus]);

  // ✅ CORRIGIDO: Verificação de win/loss APENAS em single-player
  // Em multiplayer, o servidor determina via submitGuess() atomicamente
  useEffect(() => {
    if (!term?.word || gameStatus !== 'playing') return;
    
    // ❌ EM MULTIPLAYER: DESABILITA esta lógica
    // O servidor em multiplayerService.submitGuess() já determina e avança o termo
    if (isMultiplayer) {
      return; // Não processa win/loss localmente
    }
    
    // ✅ SINGLE-PLAYER APENAS: Determina win/loss localmente
    const normalizedWord = normalizeText(term.word);
    // Inclui letras e números como obrigatórios
    const uniqueChars = [...new Set(normalizedWord.split(''))];

    // Verifica vitória
    const hasWon = uniqueChars.every(char => 
      guessedLetters.includes(char)
    );

    // Verifica derrota (6 erros)
    const wrongGuesses = guessedLetters.filter(
      char => !normalizedWord.includes(char)
    ).length;

    if (hasWon) {
      setGameStatus('won');
      onGameEnd?.('won', timeSpent);
    } else if (wrongGuesses >= 6) {
      setGameStatus('lost');
      onGameEnd?.('lost', timeSpent);
    } else {
      setErrors(wrongGuesses);
    }
  }, [guessedLetters, term, gameStatus, onGameEnd, isMultiplayer]);

  // ✅ NOVO: Handler para palpites com transações (multiplayer)
  const handleMultiplayerGuess = useCallback(async (guess) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage('');
    
    try {
      const result = await submitGuess(roomCode, playerId, guess);
      
      if (result) {
        // ✅ Estado será sincronizado pelo listener do Firebase
        // Removido console.log para melhorar performance
      } else {
        // Transação foi cancelada (pode ser duplicada)
        // Removido console.log para melhorar performance
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

    const normalizedInput = normalizeText(wordInput).trim();
    const normalizedWord = normalizeText(term.word).trim();

    if (normalizedInput.length < 2) {
      setErrorMessage('A palavra deve ter pelo menos 2 letras!');
      setWordInput('');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    if (isMultiplayer) {
      // Modo multiplayer: usa transação com palavra normalizada
      handleMultiplayerGuess(normalizedInput);
      // O estado será sincronizado pelo Firebase, não setar erro localmente
    } else {
      // Modo single-player: só uma tentativa
      if (normalizedInput === normalizedWord) {
        // Acertou a palavra completa
        const allLetters = [...new Set(normalizedWord.replace(/[^A-Z]/g, ''))];
        setGuessedLetters(allLetters);
        setGameStatus('won');
        onGameEnd?.('won', timeSpent);
      } else {
        setErrors(6);
        setTimeout(() => {
          setGameStatus('lost');
          onGameEnd?.('lost', timeSpent);
        }, 600);
      }
      setWordInput('');
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
      
      // ✅ CORRIGIDO: Ignorar eventos em inputs/textareas
      // Evita capturar teclas quando o usuário está digitando em outro campo
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        return;
      }
      
      // Ignora teclas de controle
      if (['Backspace', 'Delete', 'Enter', 'Tab', 'Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) {
        return;
      }
      
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
    if (gameStatus !== 'playing') {
      // Sempre adiciona o termo ao histórico, com explicação e dados completos
      setHistory(prev => [
        ...prev,
        {
          word: term.word,
          status: gameStatus,
          term: term,
          timeSpent: timeSpent,
          errors: errors
        }
      ]);
    }
    if (onGameEnd && gameStatus !== 'playing') {
      onGameEnd(gameStatus, timeSpent);
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
      <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-6 md:mb-8">Jogo da Forca</h2>

      {/* Tempo e Corações acima da Dica */}
      <div className="flex gap-2 md:gap-3 mb-3 md:mb-4">
        <div className="px-2 md:px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs md:text-sm">
          Tempo: {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}
        </div>
        <div className="px-2 md:px-3 py-1 rounded-full text-xs md:text-sm flex items-center gap-1">
          <div className="flex gap-0.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <span
                key={`heart-${i}`}
                className={
                  i < errors
                    ? "text-gray-300 opacity-40 transition-all duration-300"
                    : "text-red-500 transition-all duration-300"
                }
                style={{ filter: i < errors ? 'grayscale(1)' : 'none' }}
              >
                ❤️
              </span>
            ))}
          </div>
          <span className="text-xs text-gray-500 ml-2">{6 - errors} vidas restantes</span>
        </div>
      </div>

      {/* Dica e Controles de Tempo/Corações */}
      <div className="flex gap-3 md:gap-4 mb-4 md:mb-6 items-start">
        {/* Dica sempre visível */}
        <div className="flex-1 p-3 md:p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-lg md:text-xl">💡</span>
            <span className="font-semibold text-blue-900 text-sm md:text-base">Dica:</span>
          </div>
          <p className="text-blue-800 font-medium text-base md:text-lg">{term.hint}</p>
        </div>
      </div>

      {/* Jogo */}
      <div className="flex flex-col items-center md:flex-row md:items-start gap-2 md:gap-8 w-full">
        {/* Boneco só no desktop */}
        <div className="flex-1 hidden md:flex justify-center">
          <HangmanDrawing errors={errors} status={gameStatus} />
        </div>
        <div className="flex-1 w-full flex flex-col items-center">
          {/* Palavra sempre abaixo do boneco e acima do input */}
          <div className="w-full flex justify-center mb-2 md:mb-4">
            <WordDisplay 
              word={term.word}
              guessedLetters={guessedLetters}
              gameStatus={gameStatus}
              small
            />
          </div>
          {/* Só mostra GameStatus se não for multiplayer, ou se for multiplayer e não for erro de palavra completa */}
          {gameStatus !== 'playing' && (!isMultiplayer || (isMultiplayer && gameStatus !== 'lost')) && (
            <GameStatus 
              status={gameStatus}
              timeSpent={timeSpent}
              word={term.word}
              term={term}
              onNext={handleNext}
              onReview={() => {}}
              onShowReport={() => setShowReport(true)}
            />
          )}
        </div>
      </div>

      {/* Controles */}
      {gameStatus === 'playing' && (
        <div className="mt-3 md:mt-8 space-y-1.5 md:space-y-4">
          {/* Mensagem de erro - Visível e em vermelho no mobile */}
          {errorMessage && (
            <div className="bg-red-600 border-4 border-red-800 text-white px-3 md:px-6 py-3 md:py-4 rounded-lg md:rounded-xl font-bold text-sm md:text-base shadow-lg animate-pulse">
              <div className="flex items-center gap-2">
                <span className="text-xl md:text-2xl">❌</span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}
          {/* Input para palavra completa */}
          <form onSubmit={handleWordGuess} className="w-full bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg md:rounded-xl p-2 md:p-6 border-2 border-green-200">
            <label className="block text-xs md:text-sm font-semibold text-green-900 mb-1 md:mb-3">
              💡 Palavra:
            </label>
            <div className="flex gap-1 md:gap-3">
              <input
                type="text"
                value={wordInput}
                onChange={(e) => {
                  setWordInput(e.target.value);
                }}
                placeholder="Digite..."
                className="flex-1 px-2 md:px-4 py-1.5 md:py-3 border-2 border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 text-xs md:text-lg font-medium uppercase"
                disabled={gameStatus !== 'playing'}
                autoComplete="off"
                inputMode="text"
                spellCheck="false"
              />
              <button
                type="submit"
                disabled={gameStatus !== 'playing' || !wordInput.trim()}
                className="px-2 md:px-8 py-1.5 md:py-3 bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-medium text-xs md:text-base disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                OK
              </button>
            </div>
          </form>

          {/* Input para letra */}
          <form onSubmit={handleLetterGuess} className="w-full bg-gray-50 rounded-lg md:rounded-xl p-2 md:p-6 border border-gray-200">
            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1 md:mb-3">
              🔤 Digite uma letra:
            </label>
            <div className="flex gap-1 md:gap-3">
              <input
                type="text"
                value={letterInput}
                onChange={(e) => {
                  const normalized = normalizeText(e.target.value);
                  const letter = normalized.slice(0, 1);
                  setLetterInput(letter);
                  // Permite letras e números
                  if (letter && /^[A-Z0-9]$/.test(letter) && gameStatus === 'playing') {
                    setTimeout(() => {
                      handleGuess(letter);
                    }, 0);
                  }
                }}
                placeholder="A-Z ou 0-9"
                className="flex-1 px-2 md:px-4 py-1.5 md:py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs md:text-lg font-medium uppercase text-center"
                maxLength={1}
                disabled={gameStatus !== 'playing'}
                autoComplete="off"
              />
            </div>
          </form>
        </div>
      )}

      {/* Relatório da Sessão */}
      {showReport && (
        <SessionReport 
          history={history} 
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}

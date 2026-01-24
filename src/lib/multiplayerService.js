import { database } from './firebase';
import { ref, set, get, update, onValue, off, remove, runTransaction } from 'firebase/database';

export const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const createRoom = async (moduleId, moduleName, terms, hostName) => {
  if (!database) {
    throw new Error('Firebase não está inicializado. Esta função deve ser chamada apenas no cliente.');
  }
  const roomCode = generateRoomCode();
  const hostId = `player_${Date.now()}`;
  const roomRef = ref(database, `rooms/${roomCode}`);
  
  // Seleciona 10 termos aleatórios (MESMOS para todos)
  const shuffled = [...terms].sort(() => 0.5 - Math.random());
  const selectedTerms = shuffled.slice(0, Math.min(10, terms.length));
  
  // ✅ NOVO: Cada jogador tem seu próprio estado de jogo
  const playerGameState = {
    id: hostId,
    name: hostName,
    isHost: true,
    score: 0,
    // ✅ NOVO: Estado individual do jogo
    currentTermIndex: 0,
    guessedLetters: [],
    wrongGuesses: 0,
    completedTerms: [],
    isReady: false,
    joinedAt: Date.now()
  };
  
  const roomData = {
    roomCode,
    moduleId,
    moduleName,
    hostName,
    hostId,
    status: 'waiting',
    createdAt: Date.now(),
    // ✅ Termos compartilhados (mesmos para todos)
    terms: selectedTerms.map(t => ({
      id: t.id,
      word: t.word,
      hint: t.hint,
      category: t.category
    })),
    // ✅ Players com estado de jogo independente
    players: {
      [hostId]: playerGameState
    }
  };
  
  await set(roomRef, roomData);
  return { roomCode, playerId: hostId };
};

export const joinRoom = async (roomCode, playerName) => {
  if (!database) {
    throw new Error('Firebase não está inicializado. Esta função deve ser chamada apenas no cliente.');
  }
  const roomRef = ref(database, `rooms/${roomCode}`);
  const snapshot = await get(roomRef);
  
  if (!snapshot.exists()) {
    throw new Error('Sala não encontrada');
  }
  
  const roomData = snapshot.val();
  
  if (roomData.status !== 'waiting') {
    throw new Error('O jogo já começou');
  }
  
  const playerId = `player_${Date.now()}`;
  
  // ✅ NOVO: Cada novo jogador tem seu próprio estado
  const playerGameState = {
    id: playerId,
    name: playerName,
    isHost: false,
    score: 0,
    // ✅ NOVO: Estado individual
    currentTermIndex: 0,
    guessedLetters: [],
    wrongGuesses: 0,
    completedTerms: [],
    isReady: false,
    joinedAt: Date.now()
  };
  
  await update(ref(database, `rooms/${roomCode}/players/${playerId}`), playerGameState);
  
  return playerId;
};

export const setPlayerReady = async (roomCode, playerId) => {
  if (!database) {
    throw new Error('Firebase não está inicializado. Esta função deve ser chamada apenas no cliente.');
  }
  try {
    const playerRef = ref(database, `rooms/${roomCode}/players/${playerId}`);
    const snapshot = await get(playerRef);
    if (snapshot.exists()) {
      const playerData = snapshot.val();
      // Avoid unnecessary writes if already ready
      if (playerData.isReady) {
        console.log(`Player ${playerId} já estava marcado como pronto`);
        return;
      }

      await update(playerRef, { isReady: true });
      console.log(`Player ${playerId} marcado como pronto`);
    } else {
      throw new Error('Jogador não encontrado na sala');
    }
  } catch (error) {
    console.error('Erro ao marcar jogador como pronto:', error);
    throw error;
  }
};

export const startGame = async (roomCode) => {
  if (!database) {
    throw new Error('Firebase não está inicializado. Esta função deve ser chamada apenas no cliente.');
  }
  try {
    console.log(`Iniciando jogo na sala ${roomCode}`);
    
    // Reset de estados dos jogadores
    const roomRef = ref(database, `rooms/${roomCode}`);
    const snapshot = await get(roomRef);
    
    if (snapshot.exists()) {
      const roomData = snapshot.val();
      const players = roomData.players || {};
      
      // Reseta os termos completados de todos os jogadores
      const updates = {};
      Object.keys(players).forEach(playerId => {
        updates[`players/${playerId}/completedTerms`] = [];
        updates[`players/${playerId}/currentTermComplete`] = false;
      });
      
      updates['status'] = 'playing';
      updates['startedAt'] = Date.now();
      updates['currentTermIndex'] = 0;
      
      await update(roomRef, updates);
      console.log('Jogo iniciado com sucesso');
    }
  } catch (error) {
    console.error('Erro ao iniciar jogo:', error);
    throw error;
  }
};

export const updatePlayerScore = async (roomCode, playerId, termId, result, timeSpent) => {
  if (!database) {
    throw new Error('Firebase não está inicializado. Esta função deve ser chamada apenas no cliente.');
  }
  try {
    // ✅ CORRIGIDO: Usar transaction para evitar race condition
    // Garante que leitura + cálculo + escrita aconteçam atomicamente
    // Mesmo que dois jogadores atualizem simultaneamente, o score é correto
    const playerRef = ref(database, `rooms/${roomCode}/players/${playerId}`);
    
    await runTransaction(playerRef, (currentData) => {
      if (currentData === null) {
        console.warn(`Dados do jogador nulos durante transação: ${playerId}`);
        return;
      }
      
      // Calcula novo score dentro da transação (NUNCA leitura sem transação)
      const pointsEarned = result === 'won' ? 100 : 0;
      const newScore = (currentData.score || 0) + pointsEarned;
      
      return {
        ...currentData,
        score: newScore,
        completedTerms: [
          ...(currentData.completedTerms || []),
          {
            termId,
            result,
            timeSpent,
            timestamp: Date.now()
          }
        ],
        currentTermComplete: true,
        lastUpdate: Date.now()
      };
    });
    
    console.log(`Player ${playerId} score atualizado com transação`);
  } catch (error) {
    console.error('Erro ao atualizar score com transação:', error);
    throw error;
  }
};

export const listenToRoom = (roomCode, callback) => {
  if (!database) {
    console.warn('Firebase não está inicializado. listenToRoom não pode ser executada no servidor.');
    return () => {};
  }
  
  // ✅ OTIMIZAÇÃO: Usar onValue com { onlyOnce: false }
  // Reduz callbacks desnecessários comparando dados serializados
  const roomRef = ref(database, `rooms/${roomCode}`);
  let lastSerializedData = null;
  
  const unsubscribe = onValue(roomRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const serialized = JSON.stringify(data);
      
      // ✅ Verifica se dados realmente mudaram
      // Evita chamar callback se dados são idênticos
      if (lastSerializedData !== serialized) {
        lastSerializedData = serialized;
        console.log('🔄 Dados da sala atualizados');
        callback(data);
      } else {
        console.log('⏭️ Ignorando atualização duplicada');
      }
    } else {
      callback(null);
    }
  });
  
  return unsubscribe;
};

export const leaveRoom = async (roomCode, playerId) => {
  if (!database) {
    throw new Error('Firebase não está inicializado. Esta função deve ser chamada apenas no cliente.');
  }
  await remove(ref(database, `rooms/${roomCode}/players/${playerId}`));
};

export const deleteRoom = async (roomCode) => {
  if (!database) {
    throw new Error('Firebase não está inicializado. Esta função deve ser chamada apenas no cliente.');
  }
  await remove(ref(database, `rooms/${roomCode}`));
};

// ✅ CORRIGIDO: Finaliza o jogo quando todos completarem
// Cada jogador tem seu próprio progresso, então não há "avançar juntos"
export const finishGameIfAllComplete = async (roomCode) => {
  if (!database) {
    throw new Error('Firebase não está inicializado.');
  }
  try {
    const roomRef = ref(database, `rooms/${roomCode}`);
    const snapshot = await get(roomRef);
    
    if (snapshot.exists()) {
      const roomData = snapshot.val();
      const players = Object.values(roomData.players || {});
      
      // Verifica se todos completaram suas 10 palavras
      const allFinished = players.every(p => p.currentTermIndex >= roomData.terms.length);
      
      if (allFinished) {
        // ✅ Todos completaram! Finaliza o jogo
        console.log('🎉 Todos jogadores completaram! Finalizando jogo...');
        await update(roomRef, {
          status: 'finished',
          finishedAt: Date.now()
        });
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Erro ao finalizar jogo:', error);
    return false;
  }
};

export const advanceToNextTerm = async (roomCode) => {
  if (!database) {
    throw new Error('Firebase não está inicializado. Esta função deve ser chamada apenas no cliente.');
  }
  try {
    // ✅ REFATORADO: Não mais avança termo compartilhado
    // Apenas verifica se todos terminaram
    const finished = await finishGameIfAllComplete(roomCode);
    return finished;
  } catch (error) {
    console.error('Erro ao tentar finalizar:', error);
    throw error;
  }
};

// Nova função para verificar se todos completaram o termo atual
export const checkAllPlayersComplete = async (roomCode) => {
  if (!database) {
    console.warn('Firebase não está inicializado. checkAllPlayersComplete não pode ser executada no servidor.');
    return false;
  }
  try {
    const roomRef = ref(database, `rooms/${roomCode}`);
    const snapshot = await get(roomRef);
    
    if (snapshot.exists()) {
      const roomData = snapshot.val();
      const players = Object.values(roomData.players || {});
      
      // ✅ CORRIGIDO: Verifica se todos jogadores completaram suas 10 palavras
      // Cada jogador avança independentemente
      const allFinished = players.every(p => p.currentTermIndex >= roomData.terms.length);
      
      return allFinished;
    }
    return false;
  } catch (error) {
    console.error('Erro ao verificar conclusão:', error);
    return false;
  }
};

// ✅ REFATORADO: Lógica de jogo independente por jogador
export const submitGuess = async (roomCode, playerId, guess) => {
  if (!database) {
    throw new Error('Firebase não está inicializado. submitGuess deve ser chamada apenas no cliente.');
  }
  
  try {
    const playerRef = ref(database, `rooms/${roomCode}/players/${playerId}`);
    const roomRef = ref(database, `rooms/${roomCode}`);
    
    // Precisa dos dados da sala para acessar os termos
    const roomSnapshot = await get(roomRef);
    if (!roomSnapshot.exists()) {
      throw new Error('Sala não encontrada');
    }
    
    const roomData = roomSnapshot.val();
    const normalizedGuess = guess.toUpperCase().trim();
    const isWordGuess = normalizedGuess.length > 1;
    
    // ✅ TRANSAÇÃO: Processa o palpite de forma INDIVIDUAL e ATÔMICA
    const result = await runTransaction(playerRef, (playerData) => {
      if (playerData === null) {
        throw new Error('Jogador não encontrado');
      }

      // Inicializa estruturas de segurança
      if (!playerData.guessedLetters) playerData.guessedLetters = [];
      if (playerData.wrongGuesses === undefined) playerData.wrongGuesses = 0;
      if (!playerData.completedTerms) playerData.completedTerms = [];
      if (playerData.currentTermIndex === undefined) playerData.currentTermIndex = 0;

      // Proteção: se o jogo do jogador já acabou
      const currentTermIndex = playerData.currentTermIndex;
      if (currentTermIndex >= roomData.terms.length) {
        console.warn('Jogo já foi completado por este jogador');
        return; // Cancela transação
      }

      const currentTerm = roomData.terms[currentTermIndex];
      const targetWord = currentTerm.word.toUpperCase();

      if (isWordGuess) {
        // ✅ PALPITE DE PALAVRA COMPLETA (individual)
        if (playerData.wordGuesses && playerData.wordGuesses.includes(normalizedGuess)) {
          console.log(`Jogador ${playerId} já adivinhou a palavra "${normalizedGuess}"`);
          return; // Cancela - duplicata
        }

        if (!playerData.wordGuesses) playerData.wordGuesses = [];
        playerData.wordGuesses.push(normalizedGuess);

        if (normalizedGuess === targetWord) {
          // ✅ ACERTO NA PALAVRA!
          playerData.score = (playerData.score || 0) + 100;
          playerData.completedTerms.push({
            termId: currentTerm.id,
            result: 'won',
            method: 'word_guess',
            timestamp: Date.now()
          });
          // ✅ Avança para próxima palavra para este jogador
          playerData.currentTermIndex += 1;
          playerData.guessedLetters = [];
          playerData.wrongGuesses = 0;
          console.log(`✅ ${playerData.name} acertou a palavra! Próxima...`);
        } else {
          // ❌ ERRO NA PALAVRA
          playerData.wrongGuesses += 1;
          if (playerData.wrongGuesses >= 6) {
            // Jogador perdeu
            playerData.completedTerms.push({
              termId: currentTerm.id,
              result: 'lost',
              method: 'word_guess',
              timestamp: Date.now()
            });
            playerData.currentTermIndex += 1;
            playerData.guessedLetters = [];
            playerData.wrongGuesses = 0;
            console.log(`💀 ${playerData.name} perdeu esta rodada`);
          }
        }
      } else {
        // ✅ PALPITE DE LETRA (individual)
        if (playerData.guessedLetters.includes(normalizedGuess)) {
          console.log(`Jogador ${playerId} já adivinhou a letra "${normalizedGuess}"`);
          return; // Cancela - duplicata
        }

        playerData.guessedLetters.push(normalizedGuess);

        if (targetWord.includes(normalizedGuess)) {
          // ✅ ACERTO NA LETRA
          console.log(`✅ ${playerData.name} acertou a letra "${normalizedGuess}"!`);
        } else {
          // ❌ ERRO NA LETRA
          playerData.wrongGuesses += 1;
          console.log(`❌ ${normalizedGuess} errado! Erros: ${playerData.wrongGuesses}/6`);
        }

        // ✅ Verifica se jogador completou a palavra
        const uniqueLetters = new Set(targetWord.replace(/[^A-Z]/g, ''));
        const lettersGuessed = new Set(playerData.guessedLetters);
        const allLettersFound = [...uniqueLetters].every(letter => lettersGuessed.has(letter));

        if (allLettersFound) {
          // 🎉 VITÓRIA - descobriu todas as letras
          playerData.score = (playerData.score || 0) + 100;
          playerData.completedTerms.push({
            termId: currentTerm.id,
            result: 'won',
            method: 'letter_collection',
            timestamp: Date.now()
          });
          // ✅ Avança para próxima
          playerData.currentTermIndex += 1;
          playerData.guessedLetters = [];
          playerData.wrongGuesses = 0;
          console.log(`🎉 ${playerData.name} completou a palavra!`);
        } else if (playerData.wrongGuesses >= 6) {
          // 💀 DERROTA - muitos erros
          playerData.completedTerms.push({
            termId: currentTerm.id,
            result: 'lost',
            method: 'too_many_errors',
            timestamp: Date.now()
          });
          // ✅ Avança para próxima (pula esta)
          playerData.currentTermIndex += 1;
          playerData.guessedLetters = [];
          playerData.wrongGuesses = 0;
          console.log(`💀 ${playerData.name} perdeu esta rodada`);
        }
      }

      return playerData; // Salva estado atualizado do JOGADOR
    });

    if (result.committed) {
      console.log('✅ Palpite do jogador processado com sucesso!');
      return result.snapshot.val();
    } else {
      console.warn('⚠️ Transação cancelada (palpite duplicado ou jogo finalizado)');
      return null;
    }
  } catch (error) {
    console.error('❌ Erro ao processar palpite:', error);
    throw error;
  }
};

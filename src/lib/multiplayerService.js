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
  
  // Seleciona 10 termos aleatórios
  const shuffled = [...terms].sort(() => 0.5 - Math.random());
  const selectedTerms = shuffled.slice(0, Math.min(10, terms.length));
  
  const roomData = {
    roomCode,
    moduleId,
    moduleName,
    hostName,
    hostId,
    status: 'waiting',
    createdAt: Date.now(),
    currentTermIndex: 0,
    playersReady: {},
    terms: selectedTerms.map(t => ({
      id: t.id,
      word: t.word,
      hint: t.hint,
      category: t.category
    })),
    players: {
      [hostId]: {
        id: hostId,
        name: hostName,
        isHost: true,
        score: 0,
        completedTerms: [],
        isReady: false,
        joinedAt: Date.now()
      }
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
  const playerData = {
    id: playerId,
    name: playerName,
    isHost: false,
    score: 0,
    completedTerms: [],
    isReady: false,
    joinedAt: Date.now()
  };
  
  await update(ref(database, `rooms/${roomCode}/players/${playerId}`), playerData);
  
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
  const roomRef = ref(database, `rooms/${roomCode}`);
  onValue(roomRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null);
    }
  });
  
  return () => off(roomRef);
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

export const advanceToNextTerm = async (roomCode) => {
  if (!database) {
    throw new Error('Firebase não está inicializado. Esta função deve ser chamada apenas no cliente.');
  }
  try {
    const roomRef = ref(database, `rooms/${roomCode}`);
    const snapshot = await get(roomRef);
    
    if (snapshot.exists()) {
      const roomData = snapshot.val();
      const nextIndex = roomData.currentTermIndex + 1;
      
      console.log(`Avançando para termo ${nextIndex + 1}/${roomData.terms.length}`);
      
      if (nextIndex >= roomData.terms.length) {
        // Jogo terminou
        console.log('Jogo finalizado');
        await update(roomRef, {
          status: 'finished',
          finishedAt: Date.now()
        });
      } else {
        // Reseta o estado de completude dos jogadores
        const players = roomData.players || {};
        const updates = {};
        
        Object.keys(players).forEach(playerId => {
          updates[`players/${playerId}/currentTermComplete`] = false;
        });
        
        updates['currentTermIndex'] = nextIndex;
        
        await update(roomRef, updates);
        console.log(`Avançado para termo ${nextIndex}`);
      }
    }
  } catch (error) {
    console.error('Erro ao avançar termo:', error);
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
      
      // Verifica se todos completaram o termo atual
      const allComplete = players.every(p => p.currentTermComplete === true);
      
      return allComplete;
    }
    return false;
  } catch (error) {
    console.error('Erro ao verificar conclusão:', error);
    return false;
  }
};

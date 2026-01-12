import { database } from './firebase';
import { ref, set, get, update, onValue, off, remove } from 'firebase/database';

export const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const createRoom = async (moduleId, moduleName, terms, hostName) => {
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
  try {
    await update(ref(database, `rooms/${roomCode}/players/${playerId}`), {
      isReady: true
    });
    console.log(`Player ${playerId} marcado como pronto`);
  } catch (error) {
    console.error('Erro ao marcar jogador como pronto:', error);
    throw error;
  }
};

export const startGame = async (roomCode) => {
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
  try {
    const playerRef = ref(database, `rooms/${roomCode}/players/${playerId}`);
    const snapshot = await get(playerRef);
    
    if (snapshot.exists()) {
      const playerData = snapshot.val();
      const newScore = playerData.score + (result === 'won' ? 100 : 0);
      const completedTerms = [...(playerData.completedTerms || []), {
        termId,
        result,
        timeSpent,
        timestamp: Date.now()
      }];
      
      await update(playerRef, {
        score: newScore,
        completedTerms,
        currentTermComplete: true,
        lastUpdate: Date.now()
      });
      
      console.log(`Player ${playerId} score atualizado: ${newScore}`);
    }
  } catch (error) {
    console.error('Erro ao atualizar score:', error);
  }
};

export const listenToRoom = (roomCode, callback) => {
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
  await remove(ref(database, `rooms/${roomCode}/players/${playerId}`));
};

export const deleteRoom = async (roomCode) => {
  await remove(ref(database, `rooms/${roomCode}`));
};

export const advanceToNextTerm = async (roomCode) => {
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

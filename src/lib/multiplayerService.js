import { database } from './firebase';
import { ref, set, get, update, onValue, off, remove } from 'firebase/database';

export const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const createRoom = async (moduleId, moduleName, terms, hostName) => {
  const roomCode = generateRoomCode();
  const roomRef = ref(database, `rooms/${roomCode}`);
  
  // Seleciona 10 termos aleatórios
  const shuffled = [...terms].sort(() => 0.5 - Math.random());
  const selectedTerms = shuffled.slice(0, Math.min(10, terms.length));
  
  const roomData = {
    roomCode,
    moduleId,
    moduleName,
    hostName,
    status: 'waiting', // waiting, playing, finished
    createdAt: Date.now(),
    currentTermIndex: 0,
    terms: selectedTerms.map(t => ({
      id: t.id,
      word: t.word,
      hint: t.hint,
      category: t.category
    })),
    players: {
      [Date.now()]: {
        id: Date.now(),
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
  return roomCode;
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
  
  const playerId = Date.now();
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
  await update(ref(database, `rooms/${roomCode}/players/${playerId}`), {
    isReady: true
  });
};

export const startGame = async (roomCode) => {
  await update(ref(database, `rooms/${roomCode}`), {
    status: 'playing',
    startedAt: Date.now()
  });
};

export const updatePlayerScore = async (roomCode, playerId, termId, result, timeSpent) => {
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
      lastUpdate: Date.now()
    });
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
  const roomRef = ref(database, `rooms/${roomCode}`);
  const snapshot = await get(roomRef);
  
  if (snapshot.exists()) {
    const roomData = snapshot.val();
    const nextIndex = roomData.currentTermIndex + 1;
    
    if (nextIndex >= roomData.terms.length) {
      // Jogo terminou
      await update(roomRef, {
        status: 'finished',
        finishedAt: Date.now()
      });
    } else {
      await update(roomRef, {
        currentTermIndex: nextIndex
      });
    }
  }
};

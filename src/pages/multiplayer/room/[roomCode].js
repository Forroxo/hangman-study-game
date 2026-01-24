import { useRouter } from 'next/router';
import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import Layout from '../../../components/Layout/Layout';
import HangmanGame from '../../../components/Game/HangmanGame';
import { ref, onValue, off } from 'firebase/database';
import { database } from '../../../lib/firebase';
import { 
  listenToRoom, 
  setPlayerReady, 
  startGame, 
  updatePlayerScore,
  leaveRoom,
  advanceToNextTerm,
  checkAllPlayersComplete
} from '../../../lib/multiplayerService';

export default function MultiplayerRoomPage() {
  const router = useRouter();
  
  // ✅ CORRIGIDO: roomCode é um estado, NÃO uma desestruturação direta de router.query
  // PROBLEMA ANTES: const { roomCode } = router.query;
  // - Durante SSR: router.query = {} (vazio) → roomCode = undefined
  // - Durante hidratação no cliente: router.query = { roomCode: "ABC123" }
  // - Isso causa hydration mismatch → Application error
  const [roomCode, setRoomCode] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [message, setMessage] = useState('');
  
  // ✅ CORRIGIDO: useRef deve estar no nível superior do componente, não dentro de useEffect
  const lastSerializedRef = useRef(null);

  // ✅ CORRIGIDO: useEffect que sincroniza router.query com estado local
  // Este hook NUNCA executa durante SSR, apenas no navegador
  // Aguarda router.isReady antes de acessar router.query
  useEffect(() => {
    if (!router.isReady) return; // ← Aguarda router estar pronto
    if (router.query.roomCode) {
      setRoomCode(String(router.query.roomCode));
    }
  }, [router.isReady, router.query.roomCode]);

  // ✅ CORRIGIDO: playerId é sincronizado seguramente
  // Tenta primeiro do URL (router.query.playerId), depois localStorage
  // Sempre verifica typeof window !== 'undefined' antes de acessar localStorage
  useEffect(() => {
    if (router.query.playerId) {
      setPlayerId(String(router.query.playerId));
    } else if (roomCode && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`multiplayer_playerId_${roomCode}`);
        if (stored) setPlayerId(String(stored));
      } catch (e) {
        // ignore localStorage errors
      }
    }
  }, [router.query.playerId, roomCode]);

  // ✅ CORRIGIDO: Firebase listener só ativa quando roomCode existe
  // Garante que:
  // 1. Durante SSR (roomCode = null): listener NÃO é criado
  // 2. No cliente: listener é criado quando roomCode é definido
  // 3. Cleanup correto ao desmontar ou mudar roomCode
  useEffect(() => {
    if (!roomCode) return; // ← Guard clause crítica

    const unsubscribe = listenToRoom(roomCode, (data) => {
      if (data) {
        try {
          const serialized = JSON.stringify(data);
          if (lastSerializedRef.current !== serialized) {
            lastSerializedRef.current = serialized;
            setRoomData(data);
          }
        } catch (e) {
          // If serialization fails, fall back to updating state
          setRoomData(data);
        }

        setLoading(false);
      } else {
        router.push('/modules');
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [roomCode, router]);

  // ✅ NOVO: Listener ESPECÍFICO para playerData em tempo real
  // Garante sincronização de guessedLetters em < 100ms
  // ANTES: Esperava roomData.listeners atualizar (mais lento)
  // AGORA: Listener direto em players/{playerId} atualiza HangmanGame imediatamente
  useEffect(() => {
    if (!roomCode || !playerId) return;

    try {
      const playerRef = ref(database, `rooms/${roomCode}/players/${playerId}`);
      
      const unsubscribe = onValue(playerRef, (snapshot) => {
        if (snapshot.exists()) {
          const playerData = snapshot.val();
          console.log('📡 PlayerData atualizado em tempo real:', {
            playerId,
            guessedLetters: playerData.guessedLetters,
            wrongGuesses: playerData.wrongGuesses,
            currentTermIndex: playerData.currentTermIndex
          });
          
          // ✅ Força atualização de roomData para sincronizar HangmanGame
          // Faz deep copy para garantir que React detecte mudança
          setRoomData(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              players: {
                ...prev.players,
                [playerId]: playerData
              }
            };
          });
        }
      });

      return () => off(playerRef, unsubscribe);
    } catch (error) {
      console.error('Erro ao criar listener playerData:', error);
    }
  }, [roomCode, playerId]);

  // ✅ CORRIGIDO: Sincroniza currentPlayer quando roomData ou playerId mudam
  // MAS: Verifica se o objeto player realmente mudou para evitar re-renders
  useEffect(() => {
    if (roomData && playerId) {
      const player = roomData.players?.[playerId];
      // ✅ CORRIGIDO: Comparar dados do player antes de atualizar state
      // Evita renderização desnecessária se dados são iguais
      setCurrentPlayer(prev => {
        if (!prev && !player) return null;
        if (!prev || !player) return player;
        // Se todos os campos-chave são iguais, não atualiza
        if (
          prev.isReady === player.isReady &&
          prev.isHost === player.isHost &&
          prev.score === player.score &&
          prev.name === player.name &&
          prev.id === player.id
        ) {
          return prev; // Retorna referência antiga para evitar re-render
        }
        return player;
      });
    }
  }, [roomData, playerId]);

  // ✅ CORRIGIDO: handleReady com proteção de SSR
  const handleReady = async () => {
    if (!roomCode) return;

    // Tenta usar playerId do estado ou fallback do localStorage
    let id = playerId;
    if (!id && typeof window !== 'undefined') {
      try {
        id = localStorage.getItem(`multiplayer_playerId_${roomCode}`) || null;
        if (id) setPlayerId(String(id));
      } catch (e) {
        id = null;
      }
    }

    if (!id) {
      setMessage('Não foi possível identificar seu jogador. Reentre na sala pelo link de convite.');
      return;
    }

    console.log('Tentando marcar como pronto...', { roomCode, playerId: id });

    try {
      await setPlayerReady(roomCode, id);
      setIsReady(true);
      console.log('✅ Marcado como pronto com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao marcar como pronto:', error);
      setMessage('Erro ao marcar como pronto. Verifique o console.');
    }
  };

  // ✅ CORRIGIDO: handleStartGame não usa variável 'players' indefinida
  // PROBLEMA ANTES: players.length (ReferenceError - players não está no escopo)
  // SOLUÇÃO: Calcular playersInRoom localmente dentro da função
  const handleStartGame = async () => {
    if (!roomCode || !roomData) return;
    
    // Calcula players localmente para evitar ReferenceError
    const playersInRoom = Object.values(roomData.players || {});
    const allReady = playersInRoom.length > 0 && playersInRoom.every(p => p.isReady);
    
    console.log('🎮 Host tentando iniciar jogo...', { 
      roomCode, 
      playersCount: playersInRoom.length, 
      allReady 
    });
    
    try {
      await startGame(roomCode);
      console.log('✅ Jogo iniciado pelo host!');
    } catch (error) {
      console.error('❌ Erro ao iniciar jogo:', error);
      setMessage('Erro ao iniciar jogo. Verifique o console.');
    }
  };

  // ✅ CORRIGIDO: handleGameEnd com memoização para evitar loop de render
  // Agora a referência da função só muda quando dependências críticas mudam
  const handleGameEnd = useCallback(async (result, timeSpent) => {
    if (!roomCode || !playerId || !roomData || !currentPlayer) return; // ← Proteção contra undefined
    
    // ✅ CORRIGIDO: Usa o termo ATUAL do jogador
    const playerTermIndex = currentPlayer.currentTermIndex;
    const currentTerm = roomData.terms[playerTermIndex];
    
    if (!currentTerm) {
      console.warn('Termo não encontrado para o jogador');
      return;
    }
    
    console.log(`🎮 Jogador ${playerId} terminou a rodada. Atualizando pontuação...`);
    await updatePlayerScore(roomCode, playerId, currentTerm.id, result, timeSpent);
    
    // Aguarda 1 segundo para mostrar resultado
    setTimeout(async () => {
      console.log(`⏱️ Verificando se todos completaram a rodada...`);
      // Verifica se todos completaram
      const allComplete = await checkAllPlayersComplete(roomCode);
      
      if (allComplete) {
        // Se todos completaram, qualquer jogador pode finalizar
        console.log('🎉 Todos completaram! Finalizando jogo...');
        await advanceToNextTerm(roomCode);
      } else {
        console.log('⏳ Ainda há jogadores jogando. Aguardando...');
      }
    }, 1000);
  }, [roomCode, playerId, roomData, currentPlayer]);

  // ✅ NOVO: Auto-verificação periódica para finalizar jogo
  // Se alguém terminou, verifica a cada 3 segundos se TODOS terminaram
  // Previne espera infinita ou travamento
  useEffect(() => {
    if (!roomCode || !roomData || roomData.status !== 'playing') return;
    
    const players = Object.values(roomData.players || {});
    const playersWhoFinished = players.filter(p => p.currentTermIndex >= roomData.terms.length);
    const playersStillPlaying = players.filter(p => p.currentTermIndex < roomData.terms.length);
    
    // Se apenas 1 jogador, termina automaticamente quando ele termina
    if (players.length === 1 && playersWhoFinished.length === 1) {
      console.log('⚠️ Apenas 1 jogador. Finalizando automaticamente...');
      advanceToNextTerm(roomCode).catch(err => console.error('Erro ao finalizar:', err));
      return;
    }
    
    const checkIfAllFinished = async () => {
      try {
        const allFinished = await checkAllPlayersComplete(roomCode);
        if (allFinished) {
          console.log('✅ Auto-verificação: Todos completaram! Finalizando...');
          await advanceToNextTerm(roomCode);
        } else if (playersWhoFinished.length > 0 && playersStillPlaying.length > 0) {
          // Se alguns terminaram mas outros não, mostra quantos estão esperando
          console.log(`⏳ ${playersWhoFinished.length}/${players.length} jogadores terminaram. Aguardando ${playersStillPlaying.length} jogador(es)...`);
        }
      } catch (error) {
        console.error('Erro na auto-verificação:', error);
      }
    };
    
    // Verifica a cada 3 segundos se o jogo deve ser finalizado
    const interval = setInterval(checkIfAllFinished, 3000);
    
    // Executa verificação inicial imediatamente
    checkIfAllFinished();
    
    return () => clearInterval(interval);
  }, [roomCode, roomData]);

  const handleLeaveRoom = async () => {
    if (roomCode && playerId) {
      await leaveRoom(roomCode, playerId);
    }
    router.push('/modules');
  };

  // ✅ CORRIGIDO: copyRoomCode com proteção de SSR
  // Verifica typeof window !== 'undefined' antes de acessar navigator
  const copyRoomCode = () => {
    if (typeof window !== 'undefined' && navigator?.clipboard) {
      navigator.clipboard.writeText(roomCode);
      setMessage('Código copiado!');
    }
  };

  // ✅ CORRIGIDO: shareRoom com proteção de SSR
  // Se window não existir (SSR), retorna imediatamente
  // Se não tiver navigator.share (desktop), copia para clipboard
  const shareRoom = () => {
    if (typeof window === 'undefined') return; // ← Guard clause SSR
    
    const url = window.location.origin + `/multiplayer/join?code=${roomCode}`;
    if (navigator.share) {
      navigator.share({
        title: 'Jogue Forca Comigo!',
        text: `Entre na minha sala com o código: ${roomCode}`,
        url: url
      });
    } else if (navigator?.clipboard) {
      navigator.clipboard.writeText(`Entre na minha sala: ${url}`);
      setMessage('Link copiado!');
    }
  };

  // ✅ CORRIGIDO: Verifica AMBOS loading E router.isReady
  // PROBLEMA ANTES: if (loading) { ... } 
  // - Renderizava antes do router estar pronto
  // - router.query ainda estava vazio
  // - Causa renderização inconsistente
  // SOLUÇÃO: if (loading || !router.isReady)
  // - Aguarda router estar pronto
  // - Aguarda dados do Firebase chegarem
  if (loading || !router.isReady) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Carregando sala...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!roomData) {
    return (
      <Layout>
        <div className="text-center py-20">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Sala não encontrada</h2>
          <button
            onClick={() => router.push('/modules')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Voltar
          </button>
        </div>
      </Layout>
    );
  }

  // ✅ SEGURO: Só chegamos aqui se router.isReady e roomData existem
  // Agora é seguro calcular players, pois roomData não é null
  const players = Object.values(roomData?.players || {});
  const allReady = players.length > 0 && players.every(p => p.isReady);
  const isHost = currentPlayer?.isHost;

  console.log('📊 Estado da sala:', {
    status: roomData.status,
    playersCount: players.length,
    playersReady: players.filter(p => p.isReady).length,
    allReady,
    isHost,
    currentPlayerId: playerId
  });

  if (roomData.status === 'waiting') {
    return (
      <Layout>
        <Head>
          <title>Sala {roomCode} - StudyHangman</title>
        </Head>

        {message && (
          <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
            {message}
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Sala de Espera
              </h1>
              <p className="text-gray-600 mb-4">{roomData.moduleName}</p>
              
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full">
                <span className="text-sm font-medium">Código da Sala:</span>
                <span className="text-2xl font-bold tracking-wider">{roomCode}</span>
                <button
                  onClick={copyRoomCode}
                  className="ml-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
                >
                  📋 Copiar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-xl">👥</span>
                  Jogadores ({players.length}/6)
                </h3>
                <div className="space-y-3">
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        player.isReady ? 'bg-green-100' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {player.isHost && <span className="text-yellow-500">👑</span>}
                        <span className="font-medium text-gray-800">{player.name}</span>
                      </div>
                      <span className={`text-sm font-medium ${
                        player.isReady ? 'text-green-700' : 'text-gray-500'
                      }`}>
                        {player.isReady ? '✓ Pronto' : 'Aguardando...'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="font-semibold text-blue-900 mb-4">Informações</h3>
                <div className="space-y-3 text-sm text-blue-800">
                  <div className="flex items-center gap-2">
                    <span>📝</span>
                    <span>{roomData.terms?.length || 10} palavras</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>⭐</span>
                    <span>100 pontos por acerto</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>⏱️</span>
                    <span>Tempo ilimitado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🏆</span>
                    <span>Placar em tempo real</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {!isReady ? (
                <button
                  onClick={handleReady}
                  className="w-full px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-lg"
                >
                  ✓ Estou Pronto!
                </button>
              ) : (
                <div className="bg-green-100 border border-green-300 text-green-800 px-6 py-4 rounded-lg text-center font-medium">
                  ✓ Você está pronto! Aguardando outros jogadores... ({players.filter(p => p.isReady).length}/{players.length})
                </div>
              )}

              {isHost && !allReady && (
                <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-3 rounded-lg text-center text-sm">
                  ⏳ Aguardando {players.filter(p => !p.isReady).length} jogador(es) ficar(em) pronto(s)
                </div>
              )}

              {isHost && allReady && players.length >= 1 && (
                <button
                  onClick={handleStartGame}
                  disabled={roomData.status === 'playing' || roomData.status === 'finished'}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity font-medium text-lg animate-pulse disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🎮 Iniciar Jogo Agora!
                </button>
              )}

              <div className="flex gap-4">
                <button
                  onClick={shareRoom}
                  className="flex-1 px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                >
                  📤 Compartilhar
                </button>
                <button
                  onClick={handleLeaveRoom}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Sair
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (roomData.status === 'playing') {
    // ✅ REFATORADO: Cada jogador vê seu próprio termo
    const playerData = roomData.players[playerId];
    const playerTermIndex = playerData?.currentTermIndex || 0;
    const currentTerm = roomData.terms[playerTermIndex];
    const sortedPlayers = Object.values(roomData.players || {}).sort((a, b) => b.score - a.score);

    // ✅ NOVO: Se o jogador terminou todos seus termos, mostra "aguardando"
    const hasFinishedAllTerms = playerTermIndex >= roomData.terms.length;

    return (
      <Layout>
        <Head>
          <title>Jogando - Sala {roomCode}</title>
        </Head>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
            <div className="lg:col-span-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{roomData.moduleName}</h2>
                    <p className="opacity-90">Sala: {roomCode}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{currentPlayer?.score || 0}</div>
                    <div className="text-sm opacity-90">seus pontos</div>
                  </div>
                </div>
                {!hasFinishedAllTerms && (
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex-1 bg-white/20 rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-full bg-white transition-all duration-300"
                        style={{ width: `${((playerTermIndex + 1) / roomData.terms.length) * 100}%` }}
                      />
                    </div>
                    <span className="font-medium">{playerTermIndex + 1}/{roomData.terms.length}</span>
                  </div>
                )}
                {hasFinishedAllTerms && (
                  <div className="mt-4 p-4 bg-white/20 rounded-lg text-center">
                    <p className="font-semibold">✅ Você terminou todos os {roomData.terms.length} termos!</p>
                    <p className="text-sm opacity-90 mt-2">Aguardando outros jogadores finalizarem...</p>
                    {sortedPlayers.length > 1 && (
                      <div className="mt-3 text-xs opacity-75">
                        <p className="font-medium mb-1">Progresso dos outros:</p>
                        {sortedPlayers
                          .filter(p => p.id !== playerId)
                          .map(p => {
                            const progress = Math.min(p.currentTermIndex + 1, roomData.terms.length);
                            const isFinished = p.currentTermIndex >= roomData.terms.length;
                            return (
                              <div key={p.id} className="mb-1">
                                <span className={isFinished ? 'line-through' : ''}>{p.name}: {progress}/{roomData.terms.length}</span>
                                {isFinished && <span className="ml-1">✅</span>}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {!hasFinishedAllTerms && (
                <HangmanGame 
                  term={currentTerm}
                  onGameEnd={handleGameEnd}
                  isMultiplayer={true}
                  roomCode={roomCode}
                  playerId={playerId}
                  roomData={roomData}
                />
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-xl">🏆</span>
                  Placar
                </h3>
                <div className="space-y-2">
                  {sortedPlayers.map((player, index) => (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        player.id === playerId ? 'bg-blue-100 border border-blue-300' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-600">#{index + 1}</span>
                        <span className={`font-medium ${
                          player.id === playerId ? 'text-blue-800' : 'text-gray-800'
                        }`}>
                          {player.name}
                        </span>
                      </div>
                      <span className="font-bold text-gray-900">{player.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (roomData.status === 'finished') {
    // ✅ CORRIGIDO: Usar Object.values para pegar os players
    const allPlayers = Object.values(roomData.players || {});
    const sortedPlayers = allPlayers.sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0];
    const isWinner = winner?.id === playerId;

    return (
      <Layout>
        <Head>
          <title>Jogo Finalizado - StudyHangman</title>
        </Head>

        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="text-6xl mb-4">
              {isWinner ? '🏆' : '🎮'}
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isWinner ? 'Você Venceu!' : 'Jogo Finalizado!'}
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              {roomData.moduleName}
            </p>

            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 mb-8">
              <h3 className="font-bold text-gray-800 mb-4 text-xl">🏆 Classificação Final</h3>
              <div className="space-y-3">
                {sortedPlayers.map((player, index) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      index === 0 ? 'bg-yellow-100 border-2 border-yellow-400' :
                      index === 1 ? 'bg-gray-100 border-2 border-gray-400' :
                      index === 2 ? 'bg-orange-100 border-2 border-orange-400' :
                      'bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </span>
                      <span className="font-bold text-gray-800 text-lg">{player.name}</span>
                      {player.id === playerId && (
                        <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">Você</span>
                      )}
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{player.score}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => router.push('/modules')}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
              >
                🏠 Voltar para Módulos
              </button>
              <button
                onClick={handleLeaveRoom}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                ❌ Sair
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return null;
}

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: 'blocking'
  };
}

export async function getStaticProps() {
  return {
    props: {}
  };
}

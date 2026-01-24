import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Layout from '../../../components/Layout/Layout';
import HangmanGame from '../../../components/Game/HangmanGame';
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

    const lastSerializedRef = useRef(null);

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

  // ✅ CORRIGIDO: Sincroniza currentPlayer quando roomData ou playerId mudam
  useEffect(() => {
    if (roomData && playerId) {
      const player = roomData.players?.[playerId];
      setCurrentPlayer(player);
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

  // ✅ CORRIGIDO: handleGameEnd com guard clauses
  const handleGameEnd = async (result, timeSpent) => {
    if (!roomCode || !playerId || !roomData) return; // ← Proteção contra undefined
    
    const currentTerm = roomData.terms[roomData.currentTermIndex];
    await updatePlayerScore(roomCode, playerId, currentTerm.id, result, timeSpent);
    
    // Aguarda 2 segundos para mostrar resultado
    setTimeout(async () => {
      // Verifica se todos completaram
      const allComplete = await checkAllPlayersComplete(roomCode);
      
      if (allComplete && currentPlayer?.isHost) {
        // Se todos completaram e o usuário é host, avança
        console.log('Todos completaram! Avançando...');
        await advanceToNextTerm(roomCode);
      }
    }, 2000);
  };

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
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity font-medium text-lg animate-pulse"
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
    const currentTerm = roomData.terms[roomData.currentTermIndex];
    const sortedPlayers = players.sort((a, b) => b.score - a.score);

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
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex-1 bg-white/20 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full bg-white transition-all duration-300"
                      style={{ width: `${((roomData.currentTermIndex + 1) / roomData.terms.length) * 100}%` }}
                    />
                  </div>
                  <span className="font-medium">{roomData.currentTermIndex + 1}/{roomData.terms.length}</span>
                </div>
              </div>

              <HangmanGame 
                term={currentTerm}
                onGameEnd={handleGameEnd}
              />
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
    const sortedPlayers = players.sort((a, b) => b.score - a.score);
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
                Escolher Outro Módulo
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

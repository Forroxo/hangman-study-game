import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../components/Layout/Layout';
import { joinRoom } from '../../lib/multiplayerService';

export default function JoinRoomPage() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async (e) => {
    e.preventDefault();
    
    if (!roomCode.trim()) {
      setError('Digite o código da sala');
      return;
    }
    
    if (!playerName.trim()) {
      setError('Digite seu nome');
      return;
    }
    
    if (playerName.trim().length < 2) {
      setError('Nome deve ter pelo menos 2 caracteres');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const playerId = await joinRoom(roomCode.toUpperCase().trim(), playerName.trim());
      try {
        localStorage.setItem(`multiplayer_playerId_${roomCode.toUpperCase().trim()}`, String(playerId));
      } catch (e) {
        // localStorage may be unavailable in some environments; ignore
      }
      router.push(`/multiplayer/room/${roomCode.toUpperCase().trim()}?playerId=${playerId}`);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Erro ao entrar na sala');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>Entrar em Sala - StudyHangman</title>
      </Head>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🚪</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Entrar em Sala
            </h1>
            <p className="text-gray-600">
              Digite o código compartilhado pelo host
            </p>
          </div>

          <form onSubmit={handleJoin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código da Sala
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Ex: ABC123"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl font-bold tracking-wider"
                maxLength={6}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seu Nome
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Digite seu nome..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={20}
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : '✨ Entrar na Sala'}
            </button>

            <button
              type="button"
              onClick={() => router.push('/modules')}
              className="w-full text-gray-600 hover:text-gray-800 underline"
            >
              ← Voltar
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}

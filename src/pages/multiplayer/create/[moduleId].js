import { useRouter } from 'next/router';
import { useState } from 'react';
import Head from 'next/head';
import Layout from '../../../components/Layout/Layout';
import customModules from '../../../data/modules/custom-modules.json';
import { createRoom } from '../../../lib/multiplayerService';

const SAMPLE_MODULES = {
  biology: {
    id: 'biology',
    name: '🧬 Biologia Celular',
    terms: [
      { id: '1', word: 'MITOCONDRIA', hint: 'Organela responsável pela produção de energia', category: 'Organelas' },
      { id: '2', word: 'RIBOSSOMO', hint: 'Estrutura responsável pela síntese proteica', category: 'Organelas' },
      { id: '3', word: 'NUCLEO', hint: 'Estrutura que contém o material genético', category: 'Organelas' },
    ]
  },
  programming: {
    id: 'programming',
    name: '💻 JavaScript Básico',
    terms: [
      { id: '1', word: 'VARIAVEL', hint: 'Espaço na memória para armazenar dados', category: 'Fundamentos' },
      { id: '2', word: 'FUNCAO', hint: 'Bloco de código reutilizável', category: 'Fundamentos' },
    ]
  }
};

const getAllModules = () => {
  const modules = { ...SAMPLE_MODULES };
  if (customModules && Array.isArray(customModules)) {
    customModules.forEach(module => {
      if (module.id && module.terms && module.terms.length > 0) {
        modules[module.id] = module;
      }
    });
  }
  return modules;
};

export async function getStaticPaths() {
  // Pre-generate paths for known modules
  const paths = [
    { params: { moduleId: 'biology' } },
    { params: { moduleId: 'programming' } },
  ];

  return {
    paths,
    fallback: 'blocking', // SSR for unknown module IDs
  };
}

export async function getStaticProps({ params }) {
  // This function runs at build time and returns props
  // No Firebase initialization needed here
  return {
    props: {
      moduleId: params.moduleId,
    },
    revalidate: 3600, // Revalidate every hour
  };
}

export default function MultiplayerCreatePage({ moduleId: propModuleId }) {
  const router = useRouter();
  // Use prop during SSR, router.query on client
  const { moduleId: queryModuleId } = router.query;
  const moduleId = propModuleId || queryModuleId;
  
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    
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
      const allModules = getAllModules();
      const selectedModule = allModules[moduleId];
      
      if (!selectedModule || !selectedModule.terms || selectedModule.terms.length === 0) {
        setError('Módulo inválido ou sem termos');
        return;
      }
      
      const playerId = Date.now();
      const { roomCode, playerId: hostId } = await createRoom(
        moduleId,
        selectedModule.name,
        selectedModule.terms,
        playerName.trim()
      );
      try {
        localStorage.setItem(`multiplayer_playerId_${roomCode}`, String(hostId));
      } catch (e) {
        // ignore localStorage errors
      }
      
      router.push(`/multiplayer/room/${roomCode}?playerId=${hostId}`);
    } catch (err) {
      console.error(err);
      setError('Erro ao criar sala. Verifique sua conexão e configuração do Firebase.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = () => {
    router.push('/multiplayer/join');
  };

  return (
    <Layout>
      <Head>
        <title>Criar Sala Multiplayer - StudyHangman</title>
      </Head>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎮</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Criar Sala Multiplayer
            </h1>
            <p className="text-gray-600">
              Jogue com amigos em tempo real
            </p>
          </div>

          <form onSubmit={handleCreateRoom} className="space-y-6">
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

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Como funciona?</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✅ Crie uma sala e compartilhe o código</li>
                <li>✅ Até 6 jogadores podem entrar</li>
                <li>✅ Todos jogam as mesmas 10 palavras</li>
                <li>✅ Placar atualiza em tempo real</li>
                <li>✅ Quem fizer mais pontos vence!</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Criando sala...' : '🎯 Criar Sala'}
              </button>
              
              <button
                type="button"
                onClick={handleJoinRoom}
                disabled={loading}
                className="px-6 py-4 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium disabled:opacity-50"
              >
                Entrar em Sala
              </button>
            </div>

            <button
              type="button"
              onClick={() => router.push('/modules')}
              className="w-full text-gray-600 hover:text-gray-800 underline"
            >
              ← Voltar para módulos
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}

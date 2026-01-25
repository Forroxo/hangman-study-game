import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../../components/Layout/Layout';
import HangmanGame from '../../components/Game/HangmanGame';
import SessionReport from '../../components/Game/SessionReport';
import customModules from '../../data/modules/custom-modules.json';
import biologyModule from '../../data/modules/biology.json';
import biblicalModule from '../../data/modules/biblico.json';

const SAMPLE_MODULES = {
  biology: biologyModule,
  biblical: biblicalModule,
  programming: {
    id: 'programming',
    name: '💻 JavaScript Básico',
    color: 'yellow',
    terms: [
      {
        id: 'variavel_001',
        word: 'VARIAVEL',
        hint: 'Espaço na memória para armazenar dados',
        fullExplanation: 'Variáveis são containers para armazenar valores.',
        category: 'Programação',
      },
      {
        id: 'funcao_002',
        word: 'FUNCAO',
        hint: 'Bloco de código reutilizável',
        fullExplanation: 'Funções encapsulam código para reutilização.',
        category: 'Programação',
      },
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

export default function ChallengePage() {
  const router = useRouter();
  
  // ✅ CORRIGIDO: Evita hydration mismatch com SSR
  const [moduleId, setModuleId] = useState(null);
  const [module, setModule] = useState(null);
  const [challengeTerms, setChallengeTerms] = useState([]);
  const [selectedCount, setSelectedCount] = useState(10);
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [results, setResults] = useState([]);
  const [challengeComplete, setChallengeComplete] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ CORRIGIDO: Sincroniza router.query com estado local após hidratação
  useEffect(() => {
    if (!router.isReady) return;
    if (router.query.moduleId) {
      setModuleId(String(router.query.moduleId));
    }
  }, [router.isReady, router.query.moduleId]);

  // ✅ CORRIGIDO: Carrega o módulo quando moduleId muda
  // Isso garante que a página não fica em carregamento infinito
  useEffect(() => {
    if (!moduleId) return;
    
    setLoading(true);
    const allModules = getAllModules();
    const loadedModule = allModules[moduleId];
    
    if (loadedModule && loadedModule.terms) {
      setModule(loadedModule);
    }
    setLoading(false);
  }, [moduleId]);

  // ✅ Carrega os termos do desafio quando started = true
  useEffect(() => {
    if (!started || !module || !module.terms) return;
    
    const shuffled = [...module.terms].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(selectedCount, shuffled.length));
    setChallengeTerms(selected);
    setCurrentIndex(0);
  }, [started, selectedCount]);

  const handleGameEnd = (result, timeSpent) => {
    const score = result === 'won' ? 100 : 0;
    const newResult = {
      termId: challengeTerms[currentIndex].id,
      result,
      score,
      timeSpent
    };

    setResults([...results, newResult]);
    setTotalScore(totalScore + score);
    setTotalTime(totalTime + timeSpent);

    if (currentIndex < challengeTerms.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setChallengeComplete(true);
      saveResults(totalScore + score, totalTime + timeSpent, results.length + 1);
    }
  };

  const saveResults = (finalScore, finalTime, correctAnswers) => {
    if (typeof window === 'undefined') return;
    
    const challengeKey = `challenge_${moduleId}_results`;
    const newResult = {
      date: new Date().toISOString(),
      score: finalScore,
      time: finalTime,
      correct: correctAnswers,
      total: challengeTerms.length
    };
    
    const history = JSON.parse(localStorage.getItem(challengeKey) || '[]');
    history.push(newResult);
    localStorage.setItem(challengeKey, JSON.stringify(history));
  };

  const shareResults = () => {
    const text = `🎮 Completei o desafio de ${module.name}!\n✅ ${results.filter(r => r.result === 'won').length}/${challengeTerms.length} acertos\n⭐ ${totalScore} pontos\n⏱️ ${Math.floor(totalTime / 60)}:${(totalTime % 60).toString().padStart(2, '0')}\n\nTente você também!`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Meu resultado no StudyHangman',
        text: text,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(text + '\n' + window.location.href);
      alert('Resultado copiado para a área de transferência!');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Carregando desafio...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (challengeComplete) {
    // Monta histórico detalhado para o relatório
    const sessionHistory = challengeTerms.map((term, idx) => {
      const result = results[idx];
      return {
        word: term.word,
        status: result?.result || 'lost',
        term: term,
        timeSpent: result?.timeSpent || 0,
        errors: result?.errors || 0
      };
    });
    return (
      <Layout>
        <Head>
          <title>Desafio Completo! - StudyHangman</title>
        </Head>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Desafio Completo!</h1>
            <p className="text-xl text-gray-600 mb-4">{module.name}</p>
            <div className="flex gap-4 justify-center mb-4">
              <button
                onClick={shareResults}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
              >
                📤 Compartilhar Resultado
              </button>
              <button
                onClick={() => router.push(`/challenge/${moduleId}`)}
                className="px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
              >
                🔄 Tentar Novamente
              </button>
            </div>
            <button
              onClick={() => router.push('/modules')}
              className="mt-2 text-gray-600 hover:text-gray-800 underline"
            >
              ← Voltar para módulos
            </button>
          </div>
          {/* Relatório detalhado de todos os termos */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Relatório de Aprendizado</h2>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="space-y-6">
                <SessionReport history={sessionHistory} onClose={() => router.push('/modules')} />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const currentTerm = challengeTerms[currentIndex];

  return (
    <Layout>
      <Head>
        <title>Desafio: {module?.name} - StudyHangman</title>
      </Head>

      <div className="max-w-4xl mx-auto">
        {!started ? (
          <div className="bg-white rounded-2xl shadow p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{module?.name}</h1>
                <p className="text-sm text-gray-600 mt-1">Modo Desafio</p>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-700">Quantidade:</label>
                <select
                  value={selectedCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10) || 10;
                    setSelectedCount(val);
                  }}
                  className="text-gray-800 rounded px-2 py-1"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={20}>20</option>
                </select>
                <button
                  onClick={() => {
                    if (!moduleId || !module) return;
                    // ✅ SIMPLIFICADO: Apenas ativa started
                    // Os termos são carregados automaticamente pelo useEffect
                    setStarted(true);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  disabled={!module || loading}
                >
                  {loading ? 'Carregando...' : 'Iniciar'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 mb-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold">{module?.name}</h1>
                  <p className="opacity-90">Modo Desafio - {challengeTerms.length} Termos</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{totalScore}</div>
                  <div className="text-sm opacity-90">pontos</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-white/20 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / challengeTerms.length) * 100}%` }}
                  />
                </div>
                <span className="font-medium">{currentIndex + 1}/{challengeTerms.length}</span>
              </div>
            </div>

            <HangmanGame 
              term={currentTerm}
              onGameEnd={handleGameEnd}
            />
          </>
        )}
      </div>
    </Layout>
  );
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

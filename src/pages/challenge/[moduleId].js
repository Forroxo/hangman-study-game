import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../../components/Layout/Layout';
import HangmanGame from '../../components/Game/HangmanGame';
import customModules from '../../data/modules/custom-modules.json';
import biologyModule from '../../data/modules/biology.json';

const SAMPLE_MODULES = {
  biology: biologyModule,
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
  const { moduleId } = router.query;
  
  const [module, setModule] = useState(null);
  const [challengeTerms, setChallengeTerms] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [results, setResults] = useState([]);
  const [challengeComplete, setChallengeComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (moduleId) {
      loadChallenge(moduleId);
    }
  }, [moduleId]);

  const loadChallenge = (id) => {
    setLoading(true);
    const allModules = getAllModules();
    const loadedModule = allModules[id];
    
    if (loadedModule && loadedModule.terms) {
      const shuffled = [...loadedModule.terms].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, Math.min(10, shuffled.length));
      
      setModule(loadedModule);
      setChallengeTerms(selected);
      setLoading(false);
    } else {
      router.push('/modules');
    }
  };

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
    const correctCount = results.filter(r => r.result === 'won').length;
    const accuracy = Math.round((correctCount / challengeTerms.length) * 100);

    return (
      <Layout>
        <Head>
          <title>Desafio Completo! - StudyHangman</title>
        </Head>

        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="text-6xl mb-4">
              {accuracy >= 80 ? '🏆' : accuracy >= 50 ? '🎯' : '📚'}
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Desafio Completo!
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              {module.name}
            </p>

            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                <div className="text-3xl font-bold text-green-700">
                  {correctCount}/{challengeTerms.length}
                </div>
                <div className="text-sm text-gray-600">Acertos</div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                <div className="text-3xl font-bold text-blue-700">{totalScore}</div>
                <div className="text-sm text-gray-600">Pontos</div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                <div className="text-3xl font-bold text-purple-700">
                  {Math.floor(totalTime / 60)}:{(totalTime % 60).toString().padStart(2, '0')}
                </div>
                <div className="text-sm text-gray-600">Tempo</div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <h3 className="font-semibold text-gray-800 mb-4">Desempenho por Termo</h3>
              <div className="space-y-2">
                {results.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <span className="text-gray-700">Termo {index + 1}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">
                        {Math.floor(result.timeSpent / 60)}:{(result.timeSpent % 60).toString().padStart(2, '0')}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        result.result === 'won' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {result.result === 'won' ? '✓ Acertou' : '✗ Errou'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={shareResults}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
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
              className="mt-4 text-gray-600 hover:text-gray-800 underline"
            >
              ← Voltar para módulos
            </button>
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
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">{module?.name}</h1>
              <p className="opacity-90">Modo Desafio - 10 Termos</p>
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

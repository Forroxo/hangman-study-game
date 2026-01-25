import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../../components/Layout/Layout';
import HangmanGame from '../../components/Game/HangmanGame';
import Explanation from '../../components/Game/Explanation';
import ModuleSidebar from '../../components/Modules/ModuleSidebar';
import customModules from '../../data/modules/custom-modules.json';
import biologyModule from '../../data/modules/biology.json';
import biblicalModule from '../../data/modules/biblico.json';

// Módulos de exemplo (carregados de JSON)
const SAMPLE_MODULES = {
  biology: biologyModule,
  biblical: biblicalModule
};

// Combina módulos padrão com módulos customizados
const getAllModules = () => {
  const modules = { ...SAMPLE_MODULES };
  
  // Adiciona módulos customizados do JSON
  if (customModules && Array.isArray(customModules)) {
    customModules.forEach(module => {
      if (module.id && module.terms && module.terms.length > 0) {
        modules[module.id] = module;
      }
    });
  }
  
  return modules;
};

export default function ModuleGamePage() {
  const router = useRouter();
  
  // ✅ CORRIGIDO: Evita hydration mismatch com SSR
  // ANTES: const { moduleId } = router.query; (vazio no SSR, preenchido no cliente)
  // AGORA: Estado + useEffect com router.isReady
  const [moduleId, setModuleId] = useState(null);
  const [module, setModule] = useState(null);
  const [currentTermIndex, setCurrentTermIndex] = useState(0);
  const [gameHistory, setGameHistory] = useState([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [lastGameResult, setLastGameResult] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ CORRIGIDO: Sincroniza router.query com estado local após hidratação
  useEffect(() => {
    if (!router.isReady) return;
    if (router.query.moduleId) {
      setModuleId(String(router.query.moduleId));
    }
  }, [router.isReady, router.query.moduleId]);

  const getModuleColor = (color) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      purple: 'from-purple-500 to-purple-600',
      red: 'from-red-500 to-red-600',
      yellow: 'from-yellow-500 to-yellow-600',
      indigo: 'from-indigo-500 to-indigo-600',
      gray: 'from-gray-500 to-gray-600'
    };
    return colors[color] || colors.blue;
  };

  // Carrega módulo
  useEffect(() => {
    if (moduleId) {
      loadModule(moduleId);
      loadProgress(moduleId);
    }
  }, [moduleId]);

  const loadModule = (id) => {
    setLoading(true);
    // Simula carregamento de API
    setTimeout(() => {
      const allModules = getAllModules();
      const loadedModule = allModules[id] || allModules.biology;
      setModule(loadedModule);
      setLoading(false);
    }, 500);
  };

  const loadProgress = (id) => {
    if (typeof window === 'undefined') return;
    
    const progressKey = `module_${id}_progress`;
    const progress = JSON.parse(localStorage.getItem(progressKey)) || {
      gameHistory: [],
      currentIndex: 0,
      score: 0
    };
    
    setGameHistory(progress.gameHistory || []);
    setCurrentTermIndex(progress.currentIndex || 0);
  };

  const saveProgress = (result, timeSpent) => {
    if (!module || typeof window === 'undefined') return;
    
    // ✅ OTIMIZADO: Batch update ao localStorage
    // Evita múltiplas escritas que causam slowdown
    const progressKey = `module_${module.id}_progress`;
    const currentProgress = JSON.parse(localStorage.getItem(progressKey)) || {
      gameHistory: [],
      currentIndex: 0,
      score: 0,
      startDate: new Date().toISOString()
    };
    
    const gameRecord = {
      termId: module.terms[currentTermIndex].id,
      date: new Date().toISOString(),
      result,
      timeSpent,
      score: result === 'won' ? 100 : 50
    };
    
    // ✅ CORRIGIDO: Atualiza currentIndex ANTES de adicionar ao histórico
    // Garante que histórico está sincronizado
    currentProgress.gameHistory.push(gameRecord);
    currentProgress.currentIndex = currentTermIndex;  // Mantém índice atual
    currentProgress.score = (currentProgress.score || 0) + gameRecord.score;
    currentProgress.lastPlayed = new Date().toISOString();
    
    // ✅ Uma única escrita ao localStorage
    localStorage.setItem(progressKey, JSON.stringify(currentProgress));
    setGameHistory(currentProgress.gameHistory);
  };

  const handleGameEnd = (result, timeSpent) => {
    setLastGameResult({ result, timeSpent });
    saveProgress(result, timeSpent);
    setShowExplanation(true);
  };

  const handleNextTerm = () => {
    setShowExplanation(false);
    setLastGameResult(null);
    
    // Avança para próximo termo sem loop infinito
    setCurrentTermIndex(prev => {
      const nextIndex = prev + 1;
      return nextIndex < module.terms.length ? nextIndex : 0;
    });
  };

  const handleTermSelect = (index) => {
    setCurrentTermIndex(index);
    setShowExplanation(false);
    setLastGameResult(null);
  };

  if (loading || !module) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600">Carregando módulo...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const currentTerm = module.terms[currentTermIndex];

  return (
    <Layout>
      <Head>
        <title>{module.name} - StudyHangman</title>
        <meta name="description" content={`Aprenda ${module.name} jogando forca`} />
      </Head>

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-200px)]">
        {/* Sidebar */}
        <div className="lg:w-1/4">
          <ModuleSidebar 
            module={module}
            currentIndex={currentTermIndex}
            gameHistory={gameHistory}
          />
        </div>

        {/* Conteúdo principal */}
        <div className="lg:w-3/4 p-4 lg:p-8">
          <div className="max-w-5xl mx-auto">
            {/* Cabeçalho */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`text-3xl p-3 rounded-xl bg-gradient-to-br ${getModuleColor(module.color)} text-white`}>
                      {module.icon}
                    </div>
                    <div>
                      <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
                        {module.name}
                      </h1>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-gray-600">
                          Termo {currentTermIndex + 1} de {module.terms.length}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          currentTerm.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                          currentTerm.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {currentTerm.difficulty === 'easy' ? 'Fácil' :
                           currentTerm.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="hidden sm:block">
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-800">
                        {gameHistory.filter(g => g.result === 'won').length}/{module.terms.length}
                      </div>
                      <div className="text-sm text-gray-500">Termos acertados</div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => router.push('/modules')}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    ↰ Trocar Módulo
                  </button>
                </div>
              </div>

              {/* Progresso no módulo */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Progresso no módulo</span>
                  <span className="text-sm font-medium text-gray-800">
                    {Math.round((currentTermIndex + 1) / module.terms.length * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${(currentTermIndex + 1) / module.terms.length * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Jogo ou Explicação */}
            {!showExplanation ? (
              <HangmanGame 
                term={currentTerm}
                onGameEnd={handleGameEnd}
              />
            ) : (
              <Explanation 
                term={currentTerm}
                result={lastGameResult?.result || 'lost'}
                onNext={handleNextTerm}
              />
            )}

            {/* Navegação entre termos */}
            {!showExplanation && (
              <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
                <h3 className="font-semibold text-gray-700 mb-4">Navegação Rápida</h3>
                <div className="flex flex-wrap gap-2">
                  {module.terms.map((term, index) => {
                    const gameResult = gameHistory.find(g => g.termId === term.id)?.result;
                    const isCurrent = index === currentTermIndex;
                    
                    return (
                      <button
                        key={term.id}
                        onClick={() => handleTermSelect(index)}
                        className={`
                          px-4 py-2 rounded-lg transition-all duration-200
                          ${isCurrent 
                            ? 'bg-blue-600 text-white shadow-md' 
                            : gameResult === 'won' 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : gameResult === 'lost' 
                                ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2">
                          <span>#{index + 1}</span>
                          {gameResult === 'won' && <span>✓</span>}
                          {gameResult === 'lost' && <span>✗</span>}
                          {isCurrent && <span className="animate-pulse">●</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
                
                <div className="flex justify-between mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => handleTermSelect(Math.max(0, currentTermIndex - 1))}
                    disabled={currentTermIndex === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Termo Anterior
                  </button>
                  
                  <button
                    onClick={() => handleTermSelect((currentTermIndex + 1) % module.terms.length)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Próximo Termo →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Configuração para rotas dinâmicas
export async function getStaticPaths() {
  const allModules = { ...SAMPLE_MODULES };
  
  // Adiciona módulos customizados
  if (customModules && Array.isArray(customModules)) {
    customModules.forEach(module => {
      if (module.id && module.terms && module.terms.length > 0) {
        allModules[module.id] = module;
      }
    });
  }
  
  const paths = Object.keys(allModules).map(id => ({
    params: { moduleId: id }
  }));
  
  return {
    paths,
    fallback: 'blocking'
  };
}

export async function getStaticProps({ params }) {
  return {
    props: {}
  };
}
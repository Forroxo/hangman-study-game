import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../../../components/Layout/Layout';
import HangmanGame from '../../../components/Game/HangmanGame';
import Explanation from '../../../components/Game/Explanation';
import ModuleSidebar from '../../../components/Modules/ModuleSidebar';

// Módulos de exemplo (em produção viriam de uma API)
const SAMPLE_MODULES = {
  biology: {
    id: 'biology',
    name: '🧬 Biologia Celular',
    description: 'Explore organelas, processos celulares e genética básica',
    icon: '🔬',
    color: 'green',
    difficulty: 'intermediate',
    wordCount: 45,
    categories: ['ciencias', 'biologia', 'vestibular'],
    author: 'BioLearn',
    terms: [
      {
        id: 'mitocondria_001',
        word: 'MITOCONDRIA',
        hint: 'Organela responsável pela produção de energia na célula',
        fullExplanation: 'A mitocôndria é conhecida como a "casinha de força" da célula, onde ocorre a respiração celular e produção de ATP através do ciclo de Krebs e cadeia transportadora de elétrons.',
        funFact: 'As mitocôndrias têm seu próprio DNA e se acredita que eram organismos independentes que foram incorporados às células!',
        difficulty: 'medium',
        category: 'Biologia Celular',
        tags: ['organela', 'energia', 'respiração']
      },
      {
        id: 'ribossomo_002',
        word: 'RIBOSSOMO',
        hint: 'Estrutura celular responsável pela síntese proteica',
        fullExplanation: 'Os ribossomos são complexos de RNA ribossomal e proteínas que traduzem o RNA mensageiro em cadeias polipeptídicas. Podem ser livres no citoplasma ou associados ao retículo endoplasmático.',
        funFact: 'Os ribossomos são encontrados em todos os tipos de células, incluindo bactérias, o que os torna alvos para antibióticos como a tetraciclina.',
        difficulty: 'medium',
        category: 'Biologia Celular',
        tags: ['organela', 'proteína', 'síntese']
      },
      {
        id: 'nucleo_003',
        word: 'NÚCLEO',
        hint: 'Estrutura que contém o material genético da célula',
        fullExplanation: 'O núcleo é a organela mais proeminente da célula eucariótica, envolta por uma dupla membrana nuclear chamada envelope nuclear. Contém o DNA organizado em cromossomos e é responsável pelo controle das atividades celulares.',
        funFact: 'O núcleo foi a primeira organela a ser descoberta, observada por Antonie van Leeuwenhoek em 1676 em células de salmão.',
        difficulty: 'easy',
        category: 'Biologia Celular',
        tags: ['organela', 'DNA', 'genética']
      },
      {
        id: 'cloroplasto_004',
        word: 'CLOROPLASTO',
        hint: 'Organela onde ocorre a fotossíntese nas células vegetais',
        fullExplanation: 'Os cloroplastos são organelas presentes em células vegetais e algas que contêm clorofila e são responsáveis pela fotossíntese. Possuem seu próprio DNA, semelhante às mitocôndrias.',
        funFact: 'Assim como as mitocôndrias, os cloroplastos têm origem endossimbiótica - eram cianobactérias que foram incorporadas por células eucarióticas.',
        difficulty: 'medium',
        category: 'Biologia Celular',
        tags: ['organela', 'fotossíntese', 'planta']
      },
      {
        id: 'lisossomo_005',
        word: 'LISOSSOMO',
        hint: 'Organela responsável pela digestão intracelular',
        fullExplanation: 'Os lisossomos são vesículas membranosas que contêm enzimas digestivas (hidrolases ácidas) capazes de digerir diversos tipos de biomoléculas. Atuam na reciclagem de componentes celulares e defesa contra patógenos.',
        funFact: 'As enzimas dos lisossomos são tão poderosas que, se liberadas, poderiam digerir toda a célula. Por isso são mantidas isoladas em compartimentos membranosos.',
        difficulty: 'medium',
        category: 'Biologia Celular',
        tags: ['organela', 'digestão', 'enzima']
      }
    ]
  },
  programming: {
    id: 'programming',
    name: '💻 JavaScript Básico',
    description: 'Aprenda os fundamentos da programação com JavaScript',
    icon: '⚡',
    color: 'yellow',
    difficulty: 'beginner',
    wordCount: 38,
    categories: ['tecnologia', 'programacao', 'frontend'],
    author: 'CodeMaster',
    terms: [
      {
        id: 'variavel_001',
        word: 'VARIÁVEL',
        hint: 'Espaço na memória para armazenar dados',
        fullExplanation: 'Em JavaScript, variáveis são containers para armazenar valores de dados. Podem ser declaradas usando var, let ou const, cada uma com escopo e características diferentes.',
        funFact: 'JavaScript foi originalmente chamado de Mocha, depois LiveScript, antes de receber seu nome atual para capitalizar na popularidade do Java.',
        difficulty: 'easy',
        category: 'Programação',
        tags: ['fundamento', 'memória', 'dados']
      },
      {
        id: 'funcao_002',
        word: 'FUNÇÃO',
        hint: 'Bloco de código reutilizável que realiza uma tarefa específica',
        fullExplanation: 'Funções são blocos fundamentais em JavaScript que permitem encapsular código para reutilização. Podem receber parâmetros, executar operações e retornar valores.',
        funFact: 'Em JavaScript, funções são objetos de primeira classe, o que significa que podem ser atribuídas a variáveis, passadas como argumentos e retornadas de outras funções.',
        difficulty: 'easy',
        category: 'Programação',
        tags: ['estrutura', 'reuso', 'modularidade']
      }
    ]
  }
};

export default function ModuleGamePage() {
  const router = useRouter();
  const { moduleId } = router.query;
  
  const [module, setModule] = useState(null);
  const [currentTermIndex, setCurrentTermIndex] = useState(0);
  const [gameHistory, setGameHistory] = useState([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [lastGameResult, setLastGameResult] = useState(null);
  const [loading, setLoading] = useState(true);

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
      const loadedModule = SAMPLE_MODULES[id] || SAMPLE_MODULES.biology;
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
    
    currentProgress.gameHistory.push(gameRecord);
    currentProgress.currentIndex = (currentTermIndex + 1) % module.terms.length;
    currentProgress.score = (currentProgress.score || 0) + gameRecord.score;
    currentProgress.lastPlayed = new Date().toISOString();
    
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
    
    if (currentTermIndex < module.terms.length - 1) {
      setCurrentTermIndex(prev => prev + 1);
    } else {
      // Volta ao início se completou todos os termos
      setCurrentTermIndex(0);
    }
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
                    <div className={`text-3xl p-3 rounded-xl bg-gradient-to-br from-${module.color}-500 to-${module.color}-600 text-white`}>
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
  const paths = Object.keys(SAMPLE_MODULES).map(id => ({
    params: { moduleId: id }
  }));
  
  return {
    paths,
    fallback: false
  };
}

export async function getStaticProps({ params }) {
  return {
    props: {}
  };
}
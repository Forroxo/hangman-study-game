import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../../../components/Layout/Layout';
import ModuleCard from '../../../components/Modules/ModuleCard';
import ModuleFilter from '../../../components/Modules/ModuleFilter';

export default function ModulesPage() {
  const [modules, setModules] = useState([]);
  const [filteredModules, setFilteredModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    category: 'all',
    difficulty: 'all',
    search: ''
  });

  useEffect(() => {
    loadModules();
  }, []);

  useEffect(() => {
    filterModules();
  }, [modules, filter]);

  const loadModules = async () => {
    try {
      setLoading(true);
      // Simula API call
      const sampleModules = [
        {
          id: 'biology',
          name: '🧬 Biologia Celular',
          description: 'Explore organelas, processos celulares e genética básica',
          icon: '🔬',
          color: 'green',
          difficulty: 'intermediate',
          wordCount: 45,
          categories: ['ciencias', 'biologia', 'vestibular'],
          author: 'BioLearn',
          createdAt: '2024-01-15',
          rating: 4.8
        },
        {
          id: 'history-brazil',
          name: '🏛️ História do Brasil',
          description: 'Do descobrimento à república: fatos e personagens importantes',
          icon: '📜',
          color: 'red',
          difficulty: 'intermediate',
          wordCount: 52,
          categories: ['humanas', 'historia', 'enem'],
          author: 'História Viva',
          createdAt: '2024-01-10',
          rating: 4.6
        },
        {
          id: 'javascript',
          name: '💻 JavaScript Moderno',
          description: 'Conceitos fundamentais e recursos modernos do JavaScript',
          icon: '⚡',
          color: 'yellow',
          difficulty: 'beginner',
          wordCount: 38,
          categories: ['tecnologia', 'programacao', 'frontend'],
          author: 'CodeMaster',
          createdAt: '2024-01-20',
          rating: 4.9
        },
        {
          id: 'geography',
          name: '🗺️ Geografia Mundial',
          description: 'Países, capitais, relevo e aspectos socioeconômicos',
          icon: '🌍',
          color: 'blue',
          difficulty: 'intermediate',
          wordCount: 48,
          categories: ['humanas', 'geografia'],
          author: 'GeoExpert',
          createdAt: '2024-01-05',
          rating: 4.5
        },
        {
          id: 'chemistry',
          name: '⚗️ Química Orgânica',
          description: 'Funções orgânicas, reações e nomenclatura',
          icon: '🧪',
          color: 'purple',
          difficulty: 'advanced',
          wordCount: 56,
          categories: ['ciencias', 'quimica', 'vestibular'],
          author: 'ChemLab',
          createdAt: '2024-01-12',
          rating: 4.7
        },
        {
          id: 'english',
          name: '🔤 Inglês Intermediário',
          description: 'Vocabulário avançado e expressões idiomáticas',
          icon: '🇺🇸',
          color: 'indigo',
          difficulty: 'intermediate',
          wordCount: 42,
          categories: ['linguagens', 'ingles', 'idiomas'],
          author: 'EnglishPro',
          createdAt: '2024-01-18',
          rating: 4.8
        },
        {
          id: 'physics',
          name: '⚡ Física Clássica',
          description: 'Mecânica, termodinâmica e eletromagnetismo',
          icon: '🌀',
          color: 'blue',
          difficulty: 'advanced',
          wordCount: 58,
          categories: ['ciencias', 'fisica', 'enem'],
          author: 'Física Total',
          createdAt: '2024-01-08',
          rating: 4.4
        },
        {
          id: 'philosophy',
          name: '🤔 Filosofia Ocidental',
          description: 'Pensadores clássicos e escolas filosóficas',
          icon: '💭',
          color: 'gray',
          difficulty: 'intermediate',
          wordCount: 40,
          categories: ['humanas', 'filosofia'],
          author: 'Penso Logo Existo',
          createdAt: '2024-01-22',
          rating: 4.6
        }
      ];

      // Simula delay de rede
      await new Promise(resolve => setTimeout(resolve, 800));
      setModules(sampleModules);
      setFilteredModules(sampleModules);
    } catch (error) {
      console.error('Erro ao carregar módulos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterModules = () => {
    let result = [...modules];

    // Filtro por categoria
    if (filter.category !== 'all') {
      if (filter.category === 'recent') {
        result = result.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        ).slice(0, 4);
      } else if (filter.category === 'popular') {
        result = result.sort((a, b) => b.rating - a.rating).slice(0, 4);
      } else {
        result = result.filter(module => 
          module.categories.includes(filter.category)
        );
      }
    }

    // Filtro por dificuldade
    if (filter.difficulty !== 'all') {
      result = result.filter(module => 
        module.difficulty === filter.difficulty
      );
    }

    // Filtro por pesquisa
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      result = result.filter(module => 
        module.name.toLowerCase().includes(searchLower) ||
        module.description.toLowerCase().includes(searchLower) ||
        module.categories.some(cat => cat.toLowerCase().includes(searchLower))
      );
    }

    setFilteredModules(result);
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  return (
    <Layout>
      <Head>
        <title>Módulos - StudyHangman</title>
        <meta name="description" content="Escolha entre diversos módulos educacionais para aprender jogando" />
      </Head>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Biblioteca de Módulos
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Escolha um tema, aprenda jogando e acompanhe seu progresso. 
            <span className="text-blue-600 font-medium"> {modules.length} módulos</span> disponíveis.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar com filtros */}
          <div className="lg:w-1/4">
            <div className="sticky top-24">
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">
                  Filtrar Módulos
                </h2>
                <ModuleFilter 
                  currentFilter={filter}
                  onFilterChange={handleFilterChange}
                />
              </div>
              
              {/* Quick Stats */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
                <h3 className="font-bold text-lg mb-4">Estatísticas</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-300">Módulos completados</span>
                      <span className="font-bold">3/12</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 w-1/4"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-2xl font-bold">156</div>
                      <div className="text-xs text-gray-400">Termos vistos</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-2xl font-bold">78%</div>
                      <div className="text-xs text-gray-400">Taxa de acerto</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grid de módulos */}
          <div className="lg:w-3/4">
            {/* Resultados */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {loading ? 'Carregando...' : `${filteredModules.length} módulos encontrados`}
                </h2>
                {filter.search && (
                  <p className="text-gray-600">
                    Resultados para: <span className="font-medium">"{filter.search}"</span>
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-gray-600">Ordenar por:</span>
                <select className="border rounded-lg px-3 py-2 bg-white">
                  <option>Relevância</option>
                  <option>Mais novos</option>
                  <option>Melhor avaliados</option>
                  <option>Mais populares</option>
                </select>
              </div>
            </div>

            {/* Loading state */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gray-300 rounded-xl"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6 mb-6"></div>
                    <div className="h-2 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : filteredModules.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Nenhum módulo encontrado
                </h3>
                <p className="text-gray-600 mb-6">
                  Tente ajustar seus filtros ou buscar por outros termos
                </p>
                <button
                  onClick={() => setFilter({ category: 'all', difficulty: 'all', search: '' })}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Limpar filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredModules.map((module) => (
                  <ModuleCard key={module.id} module={module} />
                ))}
              </div>
            )}

            {/* CTA para criar módulo */}
            {!loading && (
              <div className="mt-12 text-center">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border-2 border-dashed border-blue-200">
                  <div className="text-5xl mb-4">➕</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    Quer criar seu próprio módulo?
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Em breve você poderá criar módulos personalizados e compartilhar com outros estudantes!
                  </p>
                  <button className="px-6 py-3 bg-white border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 font-medium">
                    Avise-me quando estiver pronto
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
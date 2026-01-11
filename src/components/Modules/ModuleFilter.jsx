import { useState } from 'react';

const categories = [
  { id: 'all', name: 'Todos', icon: '📚' },
  { id: 'ciencias', name: 'Ciências', icon: '🔬' },
  { id: 'humanas', name: 'Humanas', icon: '📖' },
  { id: 'exatas', name: 'Exatas', icon: '🧮' },
  { id: 'tecnologia', name: 'Tecnologia', icon: '💻' },
  { id: 'linguagens', name: 'Linguagens', icon: '🔤' },
  { id: 'recent', name: 'Recentes', icon: '🆕' },
  { id: 'popular', name: 'Populares', icon: '🔥' },
];

const difficulties = [
  { id: 'all', name: 'Todas' },
  { id: 'beginner', name: 'Iniciante' },
  { id: 'intermediate', name: 'Intermediário' },
  { id: 'advanced', name: 'Avançado' },
];

export default function ModuleFilter({ currentFilter, onFilterChange }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeDifficulty, setActiveDifficulty] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleCategoryClick = (categoryId) => {
    setActiveCategory(categoryId);
    onFilterChange({
      category: categoryId,
      difficulty: activeDifficulty,
      search: searchQuery
    });
  };

  const handleDifficultyClick = (difficultyId) => {
    setActiveDifficulty(difficultyId);
    onFilterChange({
      category: activeCategory,
      difficulty: difficultyId,
      search: searchQuery
    });
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    onFilterChange({
      category: activeCategory,
      difficulty: activeDifficulty,
      search: value
    });
  };

  return (
    <div className="space-y-6">
      {/* Barra de pesquisa */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Pesquisar módulos..."
          value={searchQuery}
          onChange={handleSearch}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Filtros de categoria */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Categorias</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200
                ${activeCategory === category.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              <span className="text-lg">{category.icon}</span>
              <span className="font-medium">{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filtros de dificuldade */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Dificuldade</h3>
        <div className="flex flex-wrap gap-2">
          {difficulties.map((difficulty) => (
            <button
              key={difficulty.id}
              onClick={() => handleDifficultyClick(difficulty.id)}
              className={`
                px-4 py-2 rounded-lg transition-all duration-200 font-medium
                ${activeDifficulty === difficulty.id
                  ? difficulty.id === 'beginner' ? 'bg-green-600 text-white' :
                    difficulty.id === 'intermediate' ? 'bg-yellow-600 text-white' :
                    difficulty.id === 'advanced' ? 'bg-red-600 text-white' :
                    'bg-gray-800 text-white'
                  : difficulty.id === 'beginner' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                    difficulty.id === 'intermediate' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' :
                    difficulty.id === 'advanced' ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                    'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {difficulty.name}
            </button>
          ))}
        </div>
      </div>

      {/* Estatísticas rápidas */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-700">12+</div>
            <div className="text-sm text-gray-600">Módulos</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-700">500+</div>
            <div className="text-sm text-gray-600">Termos</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-700">24h</div>
            <div className="text-sm text-gray-600">Atualizado</div>
          </div>
        </div>
      </div>
    </div>
  );
}
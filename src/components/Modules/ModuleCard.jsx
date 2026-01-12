import Link from 'next/link';
import ProgressRing from './ProgressRing';

export default function ModuleCard({ module }) {
  // Simula progresso do localStorage
  const getProgress = () => {
    if (typeof window === 'undefined') return { completed: 0, total: 50 };
    
    const progress = localStorage.getItem(`module_${module.id}_progress`);
    if (progress) {
      return JSON.parse(progress);
    }
    
    return {
      completed: Math.floor(Math.random() * module.wordCount),
      total: module.wordCount,
      score: Math.floor(Math.random() * 1000),
      lastPlayed: null
    };
  };

  const progress = getProgress();
  const completionPercentage = progress.total > 0 
    ? Math.round((progress.completed / progress.total) * 100) 
    : 0;

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyText = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'Iniciante';
      case 'intermediate': return 'Intermediário';
      case 'advanced': return 'Avançado';
      default: return 'Todos';
    }
  };

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

  return (
    <Link href={`/game/${module.id}`}>
      <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border border-gray-200 cursor-pointer">
        {/* Header com gradiente */}
        <div className={`h-2 bg-gradient-to-r ${getModuleColor(module.color)}`} />
        
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className={`text-2xl p-3 rounded-xl bg-gradient-to-br ${getModuleColor(module.color)} text-white`}>
                  {module.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                    {module.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {module.author || 'StudyHangman'} • {module.wordCount} termos
                  </p>
                </div>
              </div>
              
              <p className="text-gray-600 mb-4 line-clamp-2">
                {module.description}
              </p>
            </div>
            
            <ProgressRing 
              percentage={completionPercentage}
              size={70}
              strokeWidth={8}
              color={module.color}
            />
          </div>

          {/* Tags e dificuldade */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(module.difficulty)}`}>
              {getDifficultyText(module.difficulty)}
            </span>
            
            {module.categories?.slice(0, 2).map((category, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
              >
                {category}
              </span>
            ))}
            
            {module.categories?.length > 2 && (
              <span className="px-2 py-1 text-gray-500 text-xs">
                +{module.categories.length - 2}
              </span>
            )}
          </div>

          {/* Progress bar e stats */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progresso</span>
              <span className="font-semibold text-gray-800">
                {progress.completed}/{progress.total} termos
              </span>
            </div>
            
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full bg-gradient-to-r ${getModuleColor(module.color)} transition-all duration-500`}
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Pontuação: {progress.score || 0}</span>
              {progress.lastPlayed && (
                <span>Última vez: {new Date(progress.lastPlayed).toLocaleDateString('pt-BR')}</span>
              )}
            </div>
          </div>

          {/* Botão de ação */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <button 
              onClick={(e) => {
                e.preventDefault();
                window.location.href = `/game/${module.id}`;
              }}
              className="bg-gradient-to-r from-gray-900 to-gray-800 text-white font-medium py-3 rounded-lg hover:opacity-90 transition-opacity group-hover:shadow-lg"
            >
              {completionPercentage === 0 ? 'Começar' : 
               completionPercentage === 100 ? 'Revisar' : 
               'Continuar'}
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                window.location.href = `/share/${module.id}`;
              }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-3 rounded-lg hover:opacity-90 transition-opacity"
            >
              🎯 Desafio
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
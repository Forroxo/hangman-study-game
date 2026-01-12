import { useState } from 'react';
import Link from 'next/link';

export default function ModuleSidebar({ module, currentIndex, gameHistory }) {
  const [expanded, setExpanded] = useState(true);

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

  // Calcula estatísticas do módulo
  const getModuleStats = () => {
    const totalTerms = module.terms.length;
    const completedTerms = gameHistory?.filter(g => g.result === 'won').length || 0;
    const totalScore = gameHistory?.reduce((sum, game) => sum + (game.score || 0), 0) || 0;
    const averageTime = gameHistory?.length 
      ? Math.round(gameHistory.reduce((sum, game) => sum + (game.timeSpent || 0), 0) / gameHistory.length)
      : 0;

    return { totalTerms, completedTerms, totalScore, averageTime };
  };

  const stats = getModuleStats();
  const completionPercentage = stats.totalTerms > 0 
    ? Math.round((stats.completedTerms / stats.totalTerms) * 100) 
    : 0;

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className={`hidden md:flex flex-col w-80 bg-white border-r border-gray-200 transition-all duration-300 ${expanded ? '' : 'w-20'}`}>
      {/* Botão expandir/recolher */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="absolute -right-3 top-6 bg-white border border-gray-300 rounded-full p-1 shadow-md z-10"
      >
        {expanded ? '‹' : '›'}
      </button>

      {/* Header do módulo */}
      <div className="p-6 border-b border-gray-200">
        {expanded ? (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className={`text-2xl p-3 rounded-xl bg-gradient-to-br ${getModuleColor(module.color)} text-white`}>
                {module.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{module.name}</h2>
                <p className="text-sm text-gray-500">Módulo de estudo</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm">{module.description}</p>
          </>
        ) : (
          <div className="flex justify-center">
            <div className={`text-2xl p-3 rounded-xl bg-gradient-to-br ${getModuleColor(module.color)} text-white`}>
              {module.icon}
            </div>
          </div>
        )}
      </div>

      {/* Estatísticas */}
      {expanded && (
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-700 mb-4">Estatísticas</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Progresso</span>
                <span className="font-semibold">{completionPercentage}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-lg font-bold text-gray-800">{stats.completedTerms}/{stats.totalTerms}</div>
                <div className="text-xs text-gray-500">Termos</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-lg font-bold text-gray-800">{stats.totalScore}</div>
                <div className="text-xs text-gray-500">Pontos</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-lg font-bold text-gray-800">{formatTime(stats.averageTime)}</div>
                <div className="text-xs text-gray-500">Tempo médio</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-lg font-bold text-gray-800">
                  {gameHistory?.length || 0}
                </div>
                <div className="text-xs text-gray-500">Jogos</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navegação de termos */}
      {expanded && (
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Termos do Módulo</h3>
          <div className="space-y-2">
            {module.terms.map((term, index) => {
              const isCurrent = index === currentIndex;
              const gameResult = gameHistory?.find(g => g.termId === term.id)?.result;
              
              return (
                <Link 
                  key={term.id} 
                  href={`/game/${module.id}?term=${index}`}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg transition-colors
                    ${isCurrent 
                      ? 'bg-blue-50 border border-blue-200' 
                      : 'hover:bg-gray-50'
                    }
                  `}
                >
                  <div className={`
                    w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium
                    ${isCurrent 
                      ? 'bg-blue-600 text-white' 
                      : gameResult === 'won' 
                        ? 'bg-green-100 text-green-800' 
                        : gameResult === 'lost' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-gray-100 text-gray-600'
                    }
                  `}>
                    {index + 1}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800">
                      Termo #{index + 1}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {term.category || 'Termo do módulo'}
                    </div>
                  </div>
                  
                  {gameResult === 'won' && (
                    <div className="text-green-600">✓</div>
                  )}
                  {gameResult === 'lost' && (
                    <div className="text-red-600">✗</div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Ações rápidas */}
      {expanded && (
        <div className="p-6 border-t border-gray-200 space-y-3">
          <Link 
            href="/modules"
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            ← Voltar para módulos
          </Link>
          <button className="w-full btn-primary">
            Compartilhar Módulo
          </button>
        </div>
      )}
    </div>
  );
}
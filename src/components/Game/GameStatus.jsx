export default function GameStatus({ status, timeSpent, word, term, onNext, onReview, onShowReport }) {
  if (!status || status === 'playing') return null;

  const getStatusConfig = () => {
    switch (status) {
      case 'won':
        return {
          title: '🎉 Parabéns!',
          message: 'Você adivinhou a palavra!',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          buttonBg: 'bg-green-600',
          buttonHover: 'hover:bg-green-700',
          icon: '🏆',
        };
      case 'lost':
        return {
          title: '💀 Fim de Jogo',
          message: 'Mas você aprendeu algo novo!',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          buttonBg: 'bg-red-600',
          buttonHover: 'hover:bg-red-700',
          icon: '📚',
        };
      case 'solved':
        return {
          title: '🔍 Palavra Revelada',
          message: 'Agora você sabe a resposta!',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          buttonBg: 'bg-amber-600',
          buttonHover: 'hover:bg-amber-700',
          icon: '🎯',
        };
      default:
        return {
          title: 'Jogo Concluído',
          message: 'Continue aprendendo!',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          buttonBg: 'bg-blue-600',
          buttonHover: 'hover:bg-blue-700',
          icon: '✅',
        };
    }
  };

  const config = getStatusConfig();

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`${config.bgColor} border ${config.borderColor} rounded-xl p-6 fade-in`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{config.icon}</div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">{config.title}</h3>
            <p className="text-gray-600">{config.message}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-800">{formatTime(timeSpent)}</div>
          <div className="text-sm text-gray-500">Tempo total</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-800">
            {status === 'won' ? '100' : status === 'lost' ? '50' : '25'}
          </div>
          <div className="text-sm text-gray-500">Pontos ganhos</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-800">{word}</div>
          <div className="text-sm text-gray-500">Palavra</div>
        </div>
      </div>

      {/* Explicação Completa */}
      {term && (
        <div className="bg-white rounded-lg p-4 mb-6 border-l-4 border-blue-500">
          <div className="mb-4">
            <h4 className="text-lg font-bold text-gray-800 mb-2">📚 O que você aprendeu:</h4>
            <p className="text-gray-700 leading-relaxed">{term.fullExplanation}</p>
          </div>
          
          {term.funFact && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
              <h5 className="font-semibold text-amber-900 mb-2">💡 Curiosidade interessante:</h5>
              <p className="text-amber-900">{term.funFact}</p>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={onShowReport}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          📚 Ver Relatório
        </button>
        
        <button
          onClick={onNext}
          className={`px-6 py-3 ${config.buttonBg} text-white rounded-lg ${config.buttonHover} transition-colors`}
        >
          Próxima Palavra
        </button>
        
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Jogar Novamente
        </button>
      </div>
    </div>
  );
}
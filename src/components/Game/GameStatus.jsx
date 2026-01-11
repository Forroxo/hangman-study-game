export default function GameStatus({ status, timeSpent, word, onNext, onReview }) {
  if (!status || status === 'playing') return null;

  const getStatusConfig = () => {
    switch (status) {
      case 'won':
        return {
          title: '🎉 Parabéns!',
          message: 'Você adivinhou a palavra!',
          color: 'green',
          icon: '🏆',
        };
      case 'lost':
        return {
          title: '💀 Fim de Jogo',
          message: 'Mas você aprendeu algo novo!',
          color: 'red',
          icon: '📚',
        };
      case 'solved':
        return {
          title: '🔍 Palavra Revelada',
          message: 'Agora você sabe a resposta!',
          color: 'amber',
          icon: '🎯',
        };
      default:
        return {
          title: 'Jogo Concluído',
          message: 'Continue aprendendo!',
          color: 'blue',
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
    <div className={`bg-${config.color}-50 border border-${config.color}-200 rounded-xl p-6 fade-in`}>
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

      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={onReview}
          className={`px-6 py-3 bg-${config.color}-600 text-white rounded-lg hover:bg-${config.color}-700 transition-colors`}
        >
          Ver Explicação Completa
        </button>
        
        <button
          onClick={onNext}
          className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
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
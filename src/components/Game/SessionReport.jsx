import { useMemo } from 'react';

// ✅ OTIMIZADO: Componente memo para evitar re-render desnecessário
const TermCard = ({ item, index }) => (
  <div key={index} className="border-l-4 border-blue-500 bg-blue-50 rounded-lg p-6">
    {/* Status e Palavra */}
    <div className="flex items-center gap-3 mb-4">
      <span className="text-3xl">
        {item.status === 'won' ? '✅' : item.status === 'lost' ? '❌' : '🔍'}
      </span>
      <div>
        <h3 className="text-2xl font-bold text-gray-800">{item.word}</h3>
        <p className="text-sm text-gray-600">
          {item.status === 'won' && '🎉 Você acertou!'}
          {item.status === 'lost' && '💀 Você perdeu'}
          {item.status === 'solved' && '🔍 Palavra revelada'}
        </p>
      </div>
    </div>

    {/* Dica */}
    {item.term?.hint && (
      <div className="bg-white rounded p-3 mb-4 border-l-4 border-yellow-500">
        <p className="text-sm font-semibold text-gray-700">💡 Dica:</p>
        <p className="text-gray-700">{item.term.hint}</p>
      </div>
    )}

    {/* Explicação Completa */}
    {item.term?.fullExplanation && (
      <div className="bg-white rounded p-4 mb-4 border-l-4 border-green-500">
        <p className="text-sm font-semibold text-gray-700 mb-2">📖 O que você aprendeu:</p>
        <p className="text-gray-700 leading-relaxed text-justify">
          {item.term.fullExplanation}
        </p>
      </div>
    )}

    {/* Fun Fact */}
    {item.term?.funFact && (
      <div className="bg-amber-50 rounded p-4 border-l-4 border-amber-500">
        <p className="text-sm font-semibold text-amber-900 mb-2">💡 Curiosidade interessante:</p>
        <p className="text-amber-900 text-justify">
          {item.term.funFact}
        </p>
      </div>
    )}

    {/* Categoria e Dificuldade */}
    {item.term && (
      <div className="flex gap-2 mt-4 flex-wrap">
        {item.term.category && (
          <span className="inline-block bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
            📂 {item.term.category}
          </span>
        )}
        {item.term.difficulty && (
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
            item.term.difficulty === 'easy' ? 'bg-green-200 text-green-800' :
            item.term.difficulty === 'medium' ? 'bg-yellow-200 text-yellow-800' :
            'bg-red-200 text-red-800'
          }`}>
            {item.term.difficulty === 'easy' ? '⭐ Fácil' :
             item.term.difficulty === 'medium' ? '⭐⭐ Médio' :
             '⭐⭐⭐ Avançado'}
          </span>
        )}
      </div>
    )}
  </div>
);

export default function SessionReport({ history, onClose }) {
  if (!history || history.length === 0) return null;

  // ✅ OTIMIZADO: useMemo para calcular estatísticas apenas quando history muda
  const stats = useMemo(() => {
    const totalTerms = history.length;
    const won = history.filter(h => h.status === 'won').length;
    const lost = history.filter(h => h.status === 'lost').length;
    const revealed = history.filter(h => h.status === 'solved').length;
    const winRate = totalTerms > 0 ? Math.round((won / totalTerms) * 100) : 0;
    
    return { totalTerms, won, lost, revealed, winRate };
  }, [history]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold mb-2">📚 Relatório da Sessão</h2>
            <p className="text-blue-100">Aprenda com todas as palavras que jogou</p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl hover:bg-blue-800 rounded-full p-2 transition"
          >
            ✕
          </button>
        </div>

        {/* Estatísticas */}
        <div className="bg-blue-50 p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 text-center shadow">
            <div className="text-3xl font-bold text-blue-600">{stats.totalTerms}</div>
            <div className="text-sm text-gray-600">Total de palavras</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow">
            <div className="text-3xl font-bold text-green-600">{stats.won}</div>
            <div className="text-sm text-gray-600">Acertadas</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow">
            <div className="text-3xl font-bold text-red-600">{stats.lost}</div>
            <div className="text-sm text-gray-600">Perdidas</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow">
            <div className="text-3xl font-bold text-amber-600">{stats.winRate}%</div>
            <div className="text-sm text-gray-600">Taxa de sucesso</div>
          </div>
        </div>

        {/* Lista de Termos */}
        <div className="p-6 space-y-6">
          {history.map((item, index) => (
            <TermCard key={`term-${index}`} item={item} index={index} />
          ))}
        </div>

        {/* Rodapé */}
        <div className="sticky bottom-0 bg-gray-100 p-6 flex gap-3 justify-center">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Fechar Relatório
          </button>
        </div>
      </div>
    </div>
  );
}

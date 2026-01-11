import { useState } from 'react';

export default function Explanation({ term, result, onNext }) {
  const [showMore, setShowMore] = useState(false);

  if (!term) return null;

  const getResultColor = () => {
    return result === 'won' ? 'green' : result === 'lost' ? 'red' : 'amber';
  };

  const getMotivationMessage = () => {
    if (result === 'won') {
      return [
        "Excelente trabalho! Você dominou este conceito.",
        "Continue assim! Cada acerto fortalece sua memória.",
        "Parabéns! Seu aprendizado está progredindo bem."
      ][Math.floor(Math.random() * 3)];
    } else {
      return [
        "Não se preocupe! Errar faz parte do aprendizado.",
        "Agora você nunca mais vai esquecer este termo!",
        "Este erro vai ajudar sua memória a longo prazo."
      ][Math.floor(Math.random() * 3)];
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden fade-in">
      {/* Header */}
      <div className={`bg-${getResultColor()}-500 p-6 text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Explicação do Termo</h2>
            <p className="opacity-90">Aprenda com mais detalhes</p>
          </div>
          <div className={`px-4 py-2 bg-white/20 rounded-full text-sm font-medium`}>
            {result === 'won' ? '🎯 Acertou' : '📚 Aprendizado'}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Termo e definição */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className={`text-3xl bg-${getResultColor()}-100 text-${getResultColor()}-700 p-3 rounded-xl`}>
              {result === 'won' ? '✅' : '📖'}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">{term.word}</h3>
              <p className="text-gray-600">{term.hint}</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-blue-600">📚</span>
              <span className="font-semibold text-gray-700">Explicação Completa</span>
            </div>
            <p className="text-gray-700 leading-relaxed">
              {showMore ? term.fullExplanation : `${term.fullExplanation.substring(0, 200)}...`}
            </p>
            {term.fullExplanation.length > 200 && (
              <button
                onClick={() => setShowMore(!showMore)}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                {showMore ? 'Mostrar menos' : 'Ler mais'}
              </button>
            )}
          </div>
        </div>

        {/* Curiosidade */}
        {term.funFact && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-yellow-600">💡</span>
              <span className="font-semibold text-yellow-800">Curiosidade</span>
            </div>
            <p className="text-yellow-700">{term.funFact}</p>
          </div>
        )}

        {/* Motivação */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-5 mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-2xl">🌟</div>
            <h4 className="text-lg font-bold text-gray-800">Motivação</h4>
          </div>
          <p className="text-gray-700">{getMotivationMessage()}</p>
        </div>

        {/* Tags e metadados */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            {term.tags?.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
            <div>
              <div className="font-semibold">Dificuldade</div>
              <div className={`px-2 py-1 rounded-full inline-block ${
                term.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                term.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {term.difficulty === 'easy' ? 'Fácil' :
                 term.difficulty === 'medium' ? 'Médio' : 'Difícil'}
              </div>
            </div>
            
            <div>
              <div className="font-semibold">Próxima Revisão</div>
              <div className="text-gray-800">Em 3 dias</div>
            </div>
            
            <div>
              <div className="font-semibold">Status</div>
              <div className={`px-2 py-1 rounded-full inline-block ${
                result === 'won' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {result === 'won' ? 'Dominado' : 'Em aprendizado'}
              </div>
            </div>
            
            <div>
              <div className="font-semibold">Categoria</div>
              <div className="text-gray-800">{term.category || 'Geral'}</div>
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex flex-wrap gap-4 justify-center pt-6 border-t border-gray-200">
          <button
            onClick={onNext}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Continuar para Próximo Termo
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Revisar Este Termo
          </button>
          
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(term.word + ' ' + term.hint)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium"
          >
            Pesquisar Mais
          </a>
        </div>
      </div>
    </div>
  );
}
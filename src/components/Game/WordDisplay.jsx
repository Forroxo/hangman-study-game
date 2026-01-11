export default function WordDisplay({ word, guessedLetters, gameStatus }) {
  const displayWord = word?.toUpperCase() || '';
  
  const getLetterDisplay = (letter) => {
    if (letter === ' ') return <span className="mx-4"></span>;
    
    const isGuessed = guessedLetters.includes(letter);
    const shouldReveal = gameStatus === 'lost' || gameStatus === 'won';
    
    return (
      <div className="flex flex-col items-center mx-1">
        <div
          className={`
            w-12 h-14 flex items-center justify-center
            text-3xl font-bold
            border-b-4
            transition-all duration-300
            ${isGuessed || shouldReveal
              ? 'text-gray-800 border-blue-500'
              : 'text-transparent border-gray-300'
            }
          `}
        >
          {(isGuessed || shouldReveal) ? letter : '?'}
        </div>
        <div className="w-12 h-1 bg-gray-200 mt-1"></div>
      </div>
    );
  };

  const getRevealClass = (letter) => {
    if (letter === ' ') return '';
    
    const isGuessed = guessedLetters.includes(letter);
    if (!isGuessed && gameStatus === 'lost') {
      return 'animate-pulse text-red-600';
    }
    if (isGuessed) {
      return 'text-green-600';
    }
    return '';
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-inner">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Palavra para adivinhar:
        </h3>
        <div className="text-sm text-gray-500">
          {displayWord.length} letras
        </div>
      </div>
      
      <div className="flex flex-wrap justify-center gap-1 mb-8">
        {displayWord.split('').map((letter, index) => (
          <div key={index} className={getRevealClass(letter)}>
            {getLetterDisplay(letter)}
          </div>
        ))}
      </div>
      
      {/* Letras já tentadas */}
      <div className="mt-6">
        <div className="text-sm font-medium text-gray-600 mb-2">
          Letras tentadas:
        </div>
        <div className="flex flex-wrap gap-2">
          {guessedLetters.length === 0 ? (
            <div className="text-gray-400 italic">
              Nenhuma letra tentada ainda...
            </div>
          ) : (
            guessedLetters.map((letter, index) => {
              const isInWord = displayWord.includes(letter);
              return (
                <span
                  key={index}
                  className={`
                    px-3 py-1 rounded-lg font-medium
                    ${isInWord
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-red-100 text-red-800 border border-red-300'
                    }
                  `}
                >
                  {letter}
                </span>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
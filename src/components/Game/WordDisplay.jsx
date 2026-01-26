import { normalizeText, normalizeTextWithSpaces } from '../../lib/textUtils';

export default function WordDisplay({ word, guessedLetters, gameStatus, small = false }) {
  const displayWord = normalizeTextWithSpaces(word) || '';
  const originalWord = word?.toUpperCase() || '';
  const normalizedWord = normalizeText(word) || '';
  
  const getLetterDisplay = (letter, index) => {
    if (letter === ' ') return <span key={index} className="mx-1 md:mx-4"></span>;
    
    const normalizedLetter = normalizeText(letter)[0];
    const isGuessed = guessedLetters.includes(normalizedLetter);
    const shouldReveal = gameStatus === 'lost' || gameStatus === 'won';
    
    return (
      <div key={index} className={`flex flex-col items-center mx-0.5 ${small ? 'gap-0' : ''}`}>
        <div
          className={`
            w-5 h-6 text-xs border-b
            sm:w-6 sm:h-7 sm:text-sm sm:border-b-2
            md:w-12 md:h-14 md:text-3xl md:border-b-4
            flex items-center justify-center
            font-bold
            transition-all duration-300
            ${isGuessed || shouldReveal
              ? 'text-gray-800 border-blue-500'
              : 'text-transparent border-gray-300'
            }
          `}
        >
          {(isGuessed || shouldReveal) ? originalWord[index] : '?'}
        </div>
        <div className="w-5 h-0.5 sm:w-6 sm:h-0.5 md:w-12 md:h-1 bg-gray-200 mt-0.5 md:mt-1"></div>
      </div>
    );
  };

  const getRevealClass = (letter, index) => {
    if (letter === ' ') return '';
    
    const normalizedLetter = normalizeText(letter)[0];
    const isGuessed = guessedLetters.includes(normalizedLetter);
    if (!isGuessed && gameStatus === 'lost') {
      return 'animate-pulse text-red-600';
    }
    if (isGuessed) {
      return 'text-green-600';
    }
    return '';
  };

  return (
    <div className="bg-white rounded-lg md:rounded-xl p-2 md:p-6 shadow-inner word-section-responsive">
      <div className="mb-2 md:mb-6">
        <h3 className="text-sm md:text-lg font-semibold text-gray-700 mb-1">
          Palavra:
        </h3>
        <div className="text-xs md:text-sm text-gray-500">
          {originalWord.length} letras
        </div>
      </div>
      
      <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 md:gap-x-12 md:gap-y-3 mb-3 md:mb-8 word-break-on-space mx-auto w-full max-w-2xl word-auto-shrink">
        {originalWord.split(' ').map((wordBlock, wordIdx) => (
          <div key={wordIdx} className="flex flex-nowrap mb-1">
            {wordBlock.split('').map((letter, index) => (
              <div key={index} className={getRevealClass(letter, index + (wordIdx === 0 ? 0 : originalWord.split(' ').slice(0, wordIdx).join(' ').length + wordIdx))}>
                {getLetterDisplay(letter, index + (wordIdx === 0 ? 0 : originalWord.split(' ').slice(0, wordIdx).join(' ').length + wordIdx))}
              </div>
            ))}
          </div>
        ))}
      </div>
      
      {/* Letras já tentadas - Visível em mobile e desktop */}
      <div className="mt-2 md:mt-6">
        <div className="text-xs md:text-sm font-medium text-gray-600 mb-1 md:mb-2">
          Tentadas:
        </div>
        <div className="flex flex-wrap gap-0.5 md:gap-2">
          {guessedLetters.length === 0 ? (
            <div className="text-gray-400 italic text-xs md:text-sm">
              -
            </div>
          ) : (
            guessedLetters.map((letter, index) => {
              const isInWord = normalizedWord.includes(letter);
              return (
                <span
                  key={index}
                  className={`
                    px-1.5 md:px-3 py-0.5 md:py-1 rounded text-xs md:text-sm font-medium
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
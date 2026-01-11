export default function HangmanDrawing({ errors, status }) {
  const parts = [
    // Base
    <line key="base" x1="20" y1="280" x2="120" y2="280" className="hangman-part" />,
    // Post
    <line key="post" x1="70" y1="280" x2="70" y2="40" className="hangman-part" />,
    // Beam
    <line key="beam" x1="70" y1="40" x2="160" y2="40" className="hangman-part" />,
    // Rope
    <line key="rope" x1="160" y1="40" x2="160" y2="80" className="hangman-part" />,
    // Head
    <circle key="head" cx="160" cy="110" r="30" className={`hangman-part ${errors > 0 ? 'opacity-100' : 'opacity-0'}`} />,
    // Body
    <line key="body" x1="160" y1="140" x2="160" y2="220" className={`hangman-part ${errors > 1 ? 'opacity-100' : 'opacity-0'}`} />,
    // Left arm
    <line key="left-arm" x1="160" y1="160" x2="130" y2="190" className={`hangman-part ${errors > 2 ? 'opacity-100' : 'opacity-0'}`} />,
    // Right arm
    <line key="right-arm" x1="160" y1="160" x2="190" y2="190" className={`hangman-part ${errors > 3 ? 'opacity-100' : 'opacity-0'}`} />,
    // Left leg
    <line key="left-leg" x1="160" y1="220" x2="140" y2="260" className={`hangman-part ${errors > 4 ? 'opacity-100' : 'opacity-0'}`} />,
    // Right leg
    <line key="right-leg" x1="160" y1="220" x2="180" y2="260" className={`hangman-part ${errors > 5 ? 'opacity-100' : 'opacity-0'}`} />,
  ];

  const face = errors >= 6 ? (
    <>
      {/* Sad face */}
      <circle key="left-eye" cx="150" cy="100" r="4" fill="#4b5563" />
      <circle key="right-eye" cx="170" cy="100" r="4" fill="#4b5563" />
      <path key="mouth" d="M150 120 Q160 130 170 120" stroke="#4b5563" strokeWidth="3" fill="none" />
    </>
  ) : errors > 0 ? (
    <>
      {/* Normal face */}
      <circle key="left-eye" cx="150" cy="100" r="4" fill="#4b5563" />
      <circle key="right-eye" cx="170" cy="100" r="4" fill="#4b5563" />
      <circle key="mouth" cx="160" cy="120" r="8" stroke="#4b5563" strokeWidth="2" fill="none" />
    </>
  ) : null;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg
          width="240"
          height="300"
          viewBox="0 0 240 300"
          className="fade-in"
        >
          {/* Forca */}
          {parts.slice(0, 4)}
          
          {/* Boneco */}
          {parts.slice(4)}
          
          {/* Rosto */}
          {face}
        </svg>
        
        {/* Status indicator */}
        <div className={`absolute -top-2 -right-2 px-3 py-1 rounded-full text-sm font-medium ${
          status === 'won' ? 'bg-green-100 text-green-800' :
          status === 'lost' ? 'bg-red-100 text-red-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {status === 'won' ? 'Venceu!' : 
           status === 'lost' ? 'Perdeu!' : 
           `${6 - errors}/6 vidas`}
        </div>
      </div>
      
      {/* Life indicators */}
      <div className="flex gap-2 mt-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className={`w-8 h-2 rounded-full transition-all duration-300 ${
              index < errors 
                ? 'bg-red-500' 
                : index < 6 - errors 
                  ? 'bg-green-500' 
                  : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
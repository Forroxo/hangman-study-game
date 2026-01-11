export default function ProgressRing({ percentage = 0, size = 80, strokeWidth = 10, color = 'blue' }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  const getColor = () => {
    const colors = {
      blue: '#3b82f6',
      green: '#10b981',
      purple: '#8b5cf6',
      red: '#ef4444',
      yellow: '#f59e0b',
      indigo: '#6366f1'
    };
    return colors[color] || colors.blue;
  };

  const getTextColor = () => {
    const colors = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      purple: 'text-purple-600',
      red: 'text-red-600',
      yellow: 'text-yellow-600',
      indigo: 'text-indigo-600'
    };
    return colors[color] || colors.blue;
  };

  const getStatusText = () => {
    if (percentage === 0) return 'Novo';
    if (percentage < 30) return 'Iniciando';
    if (percentage < 70) return 'Em progresso';
    if (percentage < 100) return 'Quase lá';
    return 'Completo';
  };

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="fill-none stroke-gray-200"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="fill-none transition-all duration-700 ease-out"
          stroke={getColor()}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      
      {/* Texto no centro */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className={`text-lg font-bold ${getTextColor()}`}>
          {percentage}%
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          {getStatusText()}
        </div>
      </div>
    </div>
  );
}
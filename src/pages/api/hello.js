// API route básica para teste
export default function handler(req, res) {
  res.status(200).json({
    name: 'StudyHangman API',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      modules: '/api/modules',
      progress: '/api/progress',
      game: '/api/game'
    },
    timestamp: new Date().toISOString()
  });
}
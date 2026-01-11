/**
 * API para gerenciar progresso dos usuários
 */

export default async function handler(req, res) {
  const { method, query, body } = req;

  try {
    switch (method) {
      case 'GET':
        await handleGet(req, res);
        break;
      
      case 'POST':
        await handlePost(req, res);
        break;
      
      case 'PUT':
        await handlePut(req, res);
        break;
      
      case 'DELETE':
        await handleDelete(req, res);
        break;
      
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        res.status(405).json({ error: `Método ${method} não permitido` });
    }
  } catch (error) {
    console.error('Erro na API de progresso:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// GET: Obter progresso
async function handleGet(req, res) {
  const { moduleId, userId } = req.query;

  // Em produção, buscaria do banco de dados
  // Aqui simula dados do localStorage
  const progressKey = `module_${moduleId}_progress`;
  
  // Dados simulados para exemplo
  const simulatedProgress = {
    moduleId,
    userId: userId || 'anonymous',
    totalScore: 1250,
    masteredTerms: 3,
    totalTerms: 8,
    gameHistory: [
      {
        termId: 'mitocondria_001',
        date: '2024-01-20T10:30:00.000Z',
        result: 'won',
        timeSpent: 45,
        score: 95
      },
      {
        termId: 'ribossomo_002',
        date: '2024-01-20T11:15:00.000Z',
        result: 'lost',
        timeSpent: 60,
        score: 50
      }
    ],
    lastPlayed: '2024-01-20T11:15:00.000Z',
    startDate: '2024-01-15T08:00:00.000Z'
  };

  res.status(200).json({
    success: true,
    progress: simulatedProgress,
    stats: {
      completionRate: Math.round((simulatedProgress.masteredTerms / simulatedProgress.totalTerms) * 100),
      averageScore: Math.round(simulatedProgress.totalScore / simulatedProgress.gameHistory.length),
      totalPlayTime: simulatedProgress.gameHistory.reduce((sum, game) => sum + game.timeSpent, 0)
    }
  });
}

// POST: Salvar resultado de jogo
async function handlePost(req, res) {
  const { moduleId, termId, result, timeSpent, score, userId } = req.body;

  if (!moduleId || !termId || !result) {
    return res.status(400).json({
      error: 'Dados incompletos. moduleId, termId e result são obrigatórios.'
    });
  }

  // Em produção, salvaria no banco de dados
  // Aqui apenas simula o salvamento
  const success = true;

  if (success) {
    res.status(201).json({
      success: true,
      message: 'Progresso salvo com sucesso!',
      data: {
        moduleId,
        termId,
        result,
        timeSpent: timeSpent || 0,
        score: score || (result === 'won' ? 100 : 50),
        savedAt: new Date().toISOString(),
        nextReview: calculateNextReview(result)
      }
    });
  } else {
    res.status(500).json({
      error: 'Erro ao salvar progresso'
    });
  }
}

// PUT: Atualizar progresso
async function handlePut(req, res) {
  // Implementação para atualizar progresso existente
  res.status(200).json({
    success: true,
    message: 'Progresso atualizado',
    updatedAt: new Date().toISOString()
  });
}

// DELETE: Resetar progresso
async function handleDelete(req, res) {
  const { moduleId, userId } = req.query;

  if (!moduleId) {
    return res.status(400).json({
      error: 'moduleId é obrigatório'
    });
  }

  // Em produção, removeria do banco de dados
  const success = true;

  if (success) {
    res.status(200).json({
      success: true,
      message: 'Progresso resetado com sucesso',
      moduleId
    });
  } else {
    res.status(500).json({
      error: 'Erro ao resetar progresso'
    });
  }
}

// Função auxiliar para calcular próxima revisão
function calculateNextReview(result) {
  const nextDate = new Date();
  
  if (result === 'won') {
    // Se acertou, revisar em 3 dias
    nextDate.setDate(nextDate.getDate() + 3);
  } else {
    // Se errou, revisar amanhã
    nextDate.setDate(nextDate.getDate() + 1);
  }
  
  return nextDate.toISOString();
}
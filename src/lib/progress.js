/**
 * Sistema de progresso e repetição espaçada
 */

// Calcula o próximo intervalo de revisão usando algoritmo SM-2
export function calculateNextReview(currentInterval, easinessFactor, performance) {
  if (performance >= 3) {
    // Resposta correta
    if (currentInterval === 0) {
      return 1; // Primeira revisão: amanhã
    } else if (currentInterval === 1) {
      return 6; // Segunda revisão: 6 dias
    } else {
      const newInterval = Math.round(currentInterval * easinessFactor);
      return Math.min(newInterval, 365); // Limite máximo de 1 ano
    }
  } else {
    // Resposta incorreta - rever amanhã
    return 1;
  }
}

// Atualiza fator de facilidade
export function updateEasinessFactor(currentEasiness, performance) {
  let newEasiness = currentEasiness + (0.1 - (5 - performance) * (0.08 + (5 - performance) * 0.02));
  return Math.max(1.3, Math.min(newEasiness, 2.5));
}

// Salva progresso de um termo
export function saveTermProgress(moduleId, termId, performance, timeSpent) {
  const progressKey = `module_${moduleId}_progress`;
  const moduleProgress = JSON.parse(localStorage.getItem(progressKey)) || {
    terms: {},
    totalScore: 0,
    startDate: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  };
  
  const termProgress = moduleProgress.terms[termId] || {
    easinessFactor: 2.5,
    interval: 0,
    nextReview: null,
    reviews: [],
    mastered: false,
    firstSeen: new Date().toISOString()
  };
  
  // Atualiza métricas
  termProgress.reviews.push({
    date: new Date().toISOString(),
    performance,
    timeSpent
  });
  
  // Atualiza intervalo e fator de facilidade
  termProgress.interval = calculateNextReview(
    termProgress.interval,
    termProgress.easinessFactor,
    performance
  );
  
  termProgress.easinessFactor = updateEasinessFactor(
    termProgress.easinessFactor,
    performance
  );
  
  // Define próxima revisão
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + termProgress.interval);
  termProgress.nextReview = nextDate.toISOString();
  
  // Marca como dominado se performance foi boa por 3 revisões consecutivas
  const lastThreeReviews = termProgress.reviews.slice(-3);
  if (lastThreeReviews.length >= 3 && lastThreeReviews.every(r => r.performance >= 4)) {
    termProgress.mastered = true;
  }
  
  // Atualiza progresso do módulo
  moduleProgress.terms[termId] = termProgress;
  moduleProgress.totalScore = calculateModuleScore(moduleProgress.terms);
  moduleProgress.lastUpdated = new Date().toISOString();
  
  localStorage.setItem(progressKey, JSON.stringify(moduleProgress));
  
  return termProgress;
}

// Calcula pontuação total do módulo
function calculateModuleScore(terms) {
  return Object.values(terms).reduce((total, term) => {
    const termScore = term.reviews.reduce((sum, review) => {
      const baseScore = review.performance * 20;
      const timeBonus = Math.max(0, 100 - review.timeSpent) / 10;
      return sum + baseScore + timeBonus;
    }, 0);
    return total + termScore;
  }, 0);
}

// Obtém termos que precisam de revisão
export function getTermsForReview(moduleId) {
  const progressKey = `module_${moduleId}_progress`;
  const moduleProgress = JSON.parse(localStorage.getItem(progressKey));
  
  if (!moduleProgress) return [];
  
  const now = new Date();
  const termsForReview = [];
  
  Object.entries(moduleProgress.terms).forEach(([termId, term]) => {
    if (!term.nextReview || new Date(term.nextReview) <= now) {
      // Calcula prioridade baseada em:
      // 1. Quanto tempo desde a última revisão
      // 2. Facilidade do termo (mais difícil = maior prioridade)
      // 3. Performance nas últimas revisões
      
      const lastReview = term.reviews[term.reviews.length - 1];
      const daysSinceReview = lastReview 
        ? Math.floor((now - new Date(lastReview.date)) / (1000 * 60 * 60 * 24))
        : 999;
      
      const difficultyScore = 3 - term.easinessFactor; // Termos mais difíceis têm maior prioridade
      const performanceScore = lastReview ? 5 - lastReview.performance : 5;
      
      const priority = daysSinceReview * 0.5 + difficultyScore * 2 + performanceScore;
      
      termsForReview.push({
        termId,
        priority,
        ...term
      });
    }
  });
  
  // Ordena por prioridade (maior primeiro)
  return termsForReview.sort((a, b) => b.priority - a.priority);
}

// Obtém estatísticas do módulo
export function getModuleStats(moduleId) {
  const progressKey = `module_${moduleId}_progress`;
  const moduleProgress = JSON.parse(localStorage.getItem(progressKey));
  
  if (!moduleProgress) {
    return {
      totalTerms: 0,
      masteredTerms: 0,
      reviewDue: 0,
      totalScore: 0,
      daysActive: 0,
      averagePerformance: 0
    };
  }
  
  const terms = moduleProgress.terms;
  const termIds = Object.keys(terms);
  
  const masteredTerms = termIds.filter(id => terms[id].mastered).length;
  const reviewDue = getTermsForReview(moduleId).length;
  
  // Calcula performance média
  const allReviews = termIds.flatMap(id => terms[id].reviews);
  const averagePerformance = allReviews.length > 0
    ? allReviews.reduce((sum, r) => sum + r.performance, 0) / allReviews.length
    : 0;
  
  // Calcula dias ativos
  const startDate = new Date(moduleProgress.startDate);
  const daysActive = Math.floor((new Date() - startDate) / (1000 * 60 * 60 * 24));
  
  return {
    totalTerms: termIds.length,
    masteredTerms,
    reviewDue,
    totalScore: moduleProgress.totalScore || 0,
    daysActive,
    averagePerformance: Math.round(averagePerformance * 10) / 10
  };
}

// Reseta progresso de um módulo
export function resetModuleProgress(moduleId) {
  const progressKey = `module_${moduleId}_progress`;
  localStorage.removeItem(progressKey);
  return true;
}

// Exporta progresso para backup
export function exportProgress() {
  const allKeys = Object.keys(localStorage).filter(key => key.startsWith('module_'));
  const progressData = {};
  
  allKeys.forEach(key => {
    progressData[key] = JSON.parse(localStorage.getItem(key));
  });
  
  return {
    exportDate: new Date().toISOString(),
    version: '1.0',
    data: progressData
  };
}

// Importa progresso de backup
export function importProgress(backupData) {
  if (!backupData || !backupData.data) {
    throw new Error('Dados de backup inválidos');
  }
  
  Object.entries(backupData.data).forEach(([key, value]) => {
    localStorage.setItem(key, JSON.stringify(value));
  });
  
  return true;
}
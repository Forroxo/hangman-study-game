/**
 * API para gerenciar módulos
 */

import fs from 'fs';
import path from 'path';

// Caminho para os dados
const modulesDir = path.join(process.cwd(), 'src/data/modules');

export default async function handler(req, res) {
  const { method, query } = req;

  try {
    switch (method) {
      case 'GET':
        await handleGet(req, res);
        break;
      
      case 'POST':
        await handlePost(req, res);
        break;
      
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).json({ error: `Método ${method} não permitido` });
    }
  } catch (error) {
    console.error('Erro na API de módulos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// GET: Listar módulos ou obter módulo específico
async function handleGet(req, res) {
  const { id, category, difficulty, search } = req.query;

  // Se um ID específico foi fornecido
  if (id) {
    try {
      const filePath = path.join(modulesDir, `${id}.json`);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Módulo não encontrado' });
      }

      const fileData = fs.readFileSync(filePath, 'utf8');
      const module = JSON.parse(fileData);
      res.status(200).json(module);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao carregar módulo' });
    }
    return;
  }

  // Listar todos os módulos com filtros
  try {
    const files = fs.readdirSync(modulesDir);
    let modules = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(modulesDir, file);
        const fileData = fs.readFileSync(filePath, 'utf8');
        const module = JSON.parse(fileData);
        modules.push(module);
      }
    }

    // Aplicar filtros
    if (category && category !== 'all') {
      modules = modules.filter(module => 
        module.categories.includes(category)
      );
    }

    if (difficulty && difficulty !== 'all') {
      modules = modules.filter(module => 
        module.difficulty === difficulty
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      modules = modules.filter(module => 
        module.name.toLowerCase().includes(searchLower) ||
        module.description.toLowerCase().includes(searchLower) ||
        module.categories.some(cat => cat.toLowerCase().includes(searchLower)) ||
        module.author.toLowerCase().includes(searchLower)
      );
    }

    // Ordenar por nome (padrão)
    modules.sort((a, b) => a.name.localeCompare(b.name));

    // Estatísticas
    const stats = {
      total: modules.length,
      categories: {},
      difficulties: {},
      wordCount: modules.reduce((sum, module) => sum + module.wordCount, 0)
    };

    modules.forEach(module => {
      // Contagem por categoria
      module.categories.forEach(cat => {
        stats.categories[cat] = (stats.categories[cat] || 0) + 1;
      });

      // Contagem por dificuldade
      stats.difficulties[module.difficulty] = (stats.difficulties[module.difficulty] || 0) + 1;
    });

    res.status(200).json({
      modules,
      stats,
      success: true
    });
  } catch (error) {
    console.error('Erro ao listar módulos:', error);
    res.status(500).json({ error: 'Erro ao carregar módulos' });
  }
}

// POST: Criar novo módulo (simulação)
async function handlePost(req, res) {
  const moduleData = req.body;

  // Validação básica
  if (!moduleData.name || !moduleData.description || !moduleData.terms) {
    return res.status(400).json({ 
      error: 'Dados incompletos. Nome, descrição e termos são obrigatórios.' 
    });
  }

  if (!Array.isArray(moduleData.terms) || moduleData.terms.length === 0) {
    return res.status(400).json({ 
      error: 'O módulo deve conter pelo menos um termo.' 
    });
  }

  // Gera ID baseado no nome
  const id = moduleData.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Verifica se já existe
  const filePath = path.join(modulesDir, `${id}.json`);
  if (fs.existsSync(filePath)) {
    return res.status(409).json({ 
      error: 'Já existe um módulo com nome similar. Tente um nome diferente.' 
    });
  }

  // Estrutura completa do módulo
  const completeModule = {
    id,
    name: moduleData.name,
    description: moduleData.description,
    icon: moduleData.icon || '📚',
    color: moduleData.color || 'blue',
    difficulty: moduleData.difficulty || 'intermediate',
    wordCount: moduleData.terms.length,
    categories: moduleData.categories || ['geral'],
    author: moduleData.author || 'Usuário',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rating: 0,
    reviewCount: 0,
    terms: moduleData.terms.map((term, index) => ({
      id: `${id}_term_${index + 1}`,
      word: term.word.toUpperCase(),
      hint: term.hint,
      fullExplanation: term.fullExplanation || term.hint,
      funFact: term.funFact || '',
      difficulty: term.difficulty || 'medium',
      category: term.category || moduleData.name,
      tags: term.tags || [],
      imageUrl: term.imageUrl || '',
      relatedTerms: term.relatedTerms || []
    }))
  };

  // Em produção, salvaria no banco de dados
  // Aqui apenas simula o salvamento
  const success = true; // Simulação

  if (success) {
    res.status(201).json({
      success: true,
      module: completeModule,
      message: 'Módulo criado com sucesso!'
    });
  } else {
    res.status(500).json({ 
      error: 'Erro ao salvar módulo' 
    });
  }
}
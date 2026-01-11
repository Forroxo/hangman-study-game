import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout/Layout';
import ModuleCard from '../components/Modules/ModuleCard';

export default function Home() {
  const [featuredModules, setFeaturedModules] = useState([]);
  const [stats, setStats] = useState({
    totalModules: 0,
    totalTerms: 0,
    activeUsers: 0,
  });

  useEffect(() => {
    // Simula carregamento de dados
    const loadData = async () => {
      // Na prática, buscaria de uma API
      const modules = [
        {
          id: 'biology',
          name: '🧬 Biologia Celular',
          description: 'Explore o mundo microscópico das células e seus processos vitais',
          icon: '🧫',
          color: 'green',
          difficulty: 'intermediate',
          wordCount: 45,
          categories: ['ciencias', 'biologia'],
          author: 'Dr. Silva',
        },
        {
          id: 'programming',
          name: '💻 JavaScript Básico',
          description: 'Aprenda os fundamentos da programação com JavaScript',
          icon: '⚡',
          color: 'yellow',
          difficulty: 'beginner',
          wordCount: 38,
          categories: ['tecnologia', 'programacao'],
          author: 'Tech Academy',
        },
        {
          id: 'history',
          name: '🏛️ História do Brasil',
          description: 'Descubra os principais eventos da história brasileira',
          icon: '📜',
          color: 'red',
          difficulty: 'intermediate',
          wordCount: 52,
          categories: ['humanas', 'historia'],
          author: 'Prof. Santos',
        },
      ];

      setFeaturedModules(modules);
      setStats({
        totalModules: 12,
        totalTerms: 543,
        activeUsers: 1247,
      });
    };

    loadData();
  }, []);

  return (
    <Layout>
      {/* Hero Section */}
      <div className="text-center py-12 md:py-20">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          Aprenda enquanto se{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            diverte
          </span>
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
          StudyHangman combina o clássico jogo da forca com aprendizado ativo.
          Escolha entre diversos módulos educacionais e fortaleça sua memória.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/modules" 
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            🚀 Começar Agora
          </Link>
          <Link 
            href="#how-it-works" 
            className="px-8 py-4 bg-white border-2 border-gray-300 text-gray-800 font-bold rounded-xl hover:border-blue-500 transition-colors"
          >
            📖 Como Funciona
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 text-center">
          <div className="text-4xl font-bold text-blue-700 mb-2">{stats.totalModules}</div>
          <div className="text-gray-700 font-medium">Módulos Disponíveis</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 text-center">
          <div className="text-4xl font-bold text-green-700 mb-2">{stats.totalTerms}</div>
          <div className="text-gray-700 font-medium">Termos para Aprender</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 text-center">
          <div className="text-4xl font-bold text-purple-700 mb-2">{stats.activeUsers.toLocaleString()}</div>
          <div className="text-gray-700 font-medium">Estudantes Ativos</div>
        </div>
      </div>

      {/* Featured Modules */}
      <div className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Módulos em Destaque</h2>
          <Link 
            href="/modules" 
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Ver todos →
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredModules.map((module) => (
            <ModuleCard key={module.id} module={module} />
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div id="how-it-works" className="bg-gray-50 rounded-3xl p-8 md:p-12 mb-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Como Funciona?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl mb-6 mx-auto">
              1️⃣
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Escolha um Módulo</h3>
            <p className="text-gray-600">
              Selecione entre diversas categorias como Ciências, História, Programação e mais.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center text-3xl mb-6 mx-auto">
              2️⃣
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Jogue e Aprenda</h3>
            <p className="text-gray-600">
              Tente adivinhar o termo pela dica. Cada jogo é uma oportunidade de aprendizado.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-20 h-20 bg-purple-100 rounded-2xl flex items-center justify-center text-3xl mb-6 mx-auto">
              3️⃣
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Revisão Inteligente</h3>
            <p className="text-gray-600">
              O sistema lembra quando você precisa revisar cada conteúdo para memorização ideal.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 md:p-12 text-center text-white">
        <h2 className="text-3xl font-bold mb-4">
          Pronto para transformar seu aprendizado?
        </h2>
        <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
          Junte-se a milhares de estudantes que já estão aprendendo de forma divertida e eficiente.
        </p>
        <Link 
          href="/modules" 
          className="inline-block px-8 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-gray-100 transition-colors"
        >
          🎮 Começar Agora Gratuitamente
        </Link>
        
        <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>Sem cadastro necessário</span>
          </div>
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>Totalmente gratuito</span>
          </div>
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>Compatível com celular</span>
          </div>
        </div>
      </div>
    </Layout>
  );
}
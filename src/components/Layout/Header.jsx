import Link from 'next/link';
import { useState } from 'react';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">🧠</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">StudyHangman</h1>
              <p className="text-xs text-gray-500">Aprenda jogando</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium">
              Início
            </Link>
            <Link href="/modules" className="text-gray-700 hover:text-blue-600 font-medium">
              Módulos
            </Link>
            <Link href="/#how-it-works" className="text-gray-700 hover:text-blue-600 font-medium">
              Como Funciona
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/modules" className="btn-primary">
                Começar a Jogar
              </Link>
            </div>
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <div className="w-6 h-6 flex flex-col justify-center space-y-1">
              <span className={`block h-0.5 bg-gray-600 transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
              <span className={`block h-0.5 bg-gray-600 transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`block h-0.5 bg-gray-600 transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
            </div>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 fade-in">
            <div className="flex flex-col space-y-4">
              <Link 
                href="/" 
                className="text-gray-700 hover:text-blue-600 font-medium py-2"
                onClick={() => setMenuOpen(false)}
              >
                Início
              </Link>
              <Link 
                href="/modules" 
                className="text-gray-700 hover:text-blue-600 font-medium py-2"
                onClick={() => setMenuOpen(false)}
              >
                Módulos
              </Link>
              <Link 
                href="/#how-it-works" 
                className="text-gray-700 hover:text-blue-600 font-medium py-2"
                onClick={() => setMenuOpen(false)}
              >
                Como Funciona
              </Link>
              <Link 
                href="/modules" 
                className="btn-primary text-center"
                onClick={() => setMenuOpen(false)}
              >
                Começar a Jogar
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
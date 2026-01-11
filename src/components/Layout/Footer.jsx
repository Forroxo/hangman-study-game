export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8 mt-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">🧠</span>
              </div>
              <h2 className="text-xl font-bold">StudyHangman</h2>
            </div>
            <p className="text-gray-400 max-w-md">
              Aprenda enquanto se diverte com nosso jogo educativo de forca.
              Conhecimento através do entretenimento.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">Navegação</h3>
              <ul className="space-y-2">
                <li><a href="/" className="text-gray-400 hover:text-white">Início</a></li>
                <li><a href="/modules" className="text-gray-400 hover:text-white">Módulos</a></li>
                <li><a href="/#about" className="text-gray-400 hover:text-white">Sobre</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">Recursos</h3>
              <ul className="space-y-2">
                <li><a href="/#faq" className="text-gray-400 hover:text-white">FAQ</a></li>
                <li><a href="/#contact" className="text-gray-400 hover:text-white">Contato</a></li>
                <li><a href="/#privacy" className="text-gray-400 hover:text-white">Privacidade</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>© {new Date().getFullYear()} StudyHangman. Todos os direitos reservados.</p>
          <p className="mt-2 text-sm">Aprenda, jogue, cresça!</p>
        </div>
      </div>
    </footer>
  );
}
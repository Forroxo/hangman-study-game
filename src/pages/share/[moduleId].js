import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../../components/Layout/Layout';

export default function SharePage() {
  const router = useRouter();
  const { moduleId } = router.query;
  const [challengeUrl, setChallengeUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && moduleId) {
      const baseUrl = window.location.origin;
      const url = `${baseUrl}/challenge/${moduleId}`;
      setChallengeUrl(url);
    }
  }, [moduleId]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(challengeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnWhatsApp = () => {
    const text = `🎮 Desafio de Forca! Consegue acertar 10 termos? ${challengeUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareOnTwitter = () => {
    const text = `🎮 Desafio de Forca! Consegue acertar 10 termos?`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(challengeUrl)}`, '_blank');
  };

  return (
    <Layout>
      <Head>
        <title>Compartilhar Desafio - StudyHangman</title>
      </Head>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎯</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Compartilhar Desafio
            </h1>
            <p className="text-gray-600">
              Desafie seus amigos a completar 10 termos deste módulo!
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link do Desafio
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={challengeUrl}
                  readOnly
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {copied ? '✓ Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>

            <div className="border-t pt-6">
              <p className="text-sm font-medium text-gray-700 mb-4">
                Compartilhar em:
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={shareOnWhatsApp}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <span className="text-xl">📱</span>
                  WhatsApp
                </button>
                <button
                  onClick={shareOnTwitter}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors"
                >
                  <span className="text-xl">🐦</span>
                  Twitter
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Como funciona?</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• O desafio contém 10 termos aleatórios do módulo</li>
                <li>• Cada acerto vale 100 pontos</li>
                <li>• O tempo é contabilizado para ranking</li>
                <li>• Resultados salvos localmente no dispositivo</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => router.push(`/challenge/${moduleId}`)}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
              >
                Fazer o Desafio
              </button>
              <button
                onClick={() => router.push('/modules')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

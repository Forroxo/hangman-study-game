import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

let app;
let database;

// Guard against SSR: only initialize on client side
if (typeof window !== 'undefined') {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  };

  // Validar se as variáveis de ambiente estão configuradas
  if (!firebaseConfig.projectId || !firebaseConfig.databaseURL) {
    console.error(
      'Erro: Variáveis de ambiente Firebase não estão configuradas.\n' +
      'Por favor, adicione as seguintes variáveis no Vercel Dashboard > Settings > Environment Variables:\n' +
      '- NEXT_PUBLIC_FIREBASE_API_KEY\n' +
      '- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN\n' +
      '- NEXT_PUBLIC_FIREBASE_DATABASE_URL\n' +
      '- NEXT_PUBLIC_FIREBASE_PROJECT_ID\n' +
      '- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET\n' +
      '- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID\n' +
      '- NEXT_PUBLIC_FIREBASE_APP_ID'
    );
  } else {
    try {
      app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
      database = getDatabase(app);
    } catch (error) {
      console.error('Erro ao inicializar Firebase:', error);
    }
  }
}

export { app, database };

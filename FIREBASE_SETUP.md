# Configuração do Firebase

## 1. Criar Projeto no Firebase

1. Acesse https://console.firebase.google.com/
2. Clique em "Adicionar projeto"
3. Nome: `hangman-study-game` (ou outro de sua escolha)
4. Desabilite Google Analytics (não é necessário)
5. Clique em "Criar projeto"

## 2. Configurar Realtime Database

1. No menu lateral, clique em "Realtime Database"
2. Clique em "Criar banco de dados"
3. Selecione localização: `us-central1` (ou mais próxima do Brasil: `southamerica-east1`)
4. Modo de segurança: **"Modo de teste"** (por enquanto)
5. Clique em "Ativar"

## 3. Obter Credenciais

1. Clique no ícone de engrenagem ⚙️ > "Configurações do projeto"
2. Role até "Seus aplicativos" 
3. Clique no ícone Web `</>`
4. Apelido do app: `StudyHangman Web`
5. **NÃO** marque "Firebase Hosting"
6. Clique em "Registrar app"
7. **Copie as credenciais** que aparecem (firebaseConfig)

Exemplo do que você vai copiar:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "seu-projeto.firebaseapp.com",
  databaseURL: "https://seu-projeto.firebaseio.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## 4. Criar arquivo .env.local

Na raiz do projeto, crie o arquivo `.env.local` com:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=sua_api_key_aqui
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://seu_projeto.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu_projeto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

## 5. Configurar Regras de Segurança

No Realtime Database, vá em "Regras" e cole:

```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": true,
        ".write": true,
        ".indexOn": ["status", "createdAt"]
      }
    }
  }
}
```

⚠️ **IMPORTANTE**: Essas regras são para desenvolvimento. Em produção, você deve adicionar autenticação.

## 6. Instalar Dependências

```bash
npm install
```

## 7. Testar

```bash
npm run dev
```

Acesse http://localhost:3000 e teste criando uma sala multiplayer!

## Próximos Passos

Após configurar, você pode:
1. Criar salas de jogo
2. Compartilhar código da sala
3. Jogar em tempo real com amigos
4. Ver placar ao vivo

## Segurança em Produção

Quando for para produção, configure:
1. Firebase Authentication (anônima ou Google)
2. Regras de segurança mais restritas
3. Rate limiting
4. Validação de dados no servidor

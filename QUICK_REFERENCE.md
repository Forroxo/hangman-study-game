# 📝 QUICK REFERENCE - StudyHangman

**Uso:** Cole este arquivo em um prompt de IA para contexto rápido

---

## 🎯 Informações Críticas

**Projeto:** StudyHangman (Jogo Educativo da Forca)  
**Tech Stack:** Next.js 13 + React 18 + Tailwind + Firebase  
**Status:** ✅ Funcional (correções de SSR implementadas)  
**Deploy:** Pronto para Vercel  

---

## 🔴 PROBLEMAS RESOLVIDOS

### 1. SSR/Hidratação Mismatch
- **Arquivo:** `src/pages/multiplayer/room/[roomCode].js`
- **Erro:** "Application error: a client-side exception has occurred"
- **Causa:** `const { roomCode } = router.query;` (vazio no SSR)
- **Fix:** Use `useEffect` com `router.isReady`

### 2. ReferenceError: players is not defined
- **Arquivo:** `src/pages/multiplayer/room/[roomCode].js:109`
- **Causa:** Função tenta usar variável definida depois
- **Fix:** Calcular localmente `const playersInRoom = Object.values(roomData.players || {})`

### 3. window/navigator/localStorage sem proteção
- **Causa:** Acesso direto sem verificar SSR
- **Fix:** `if (typeof window !== 'undefined') { ... }`

### 4. Event listener sem proteção SSR
- **Arquivo:** `src/components/Game/HangmanGame.jsx:106`
- **Fix:** Colocar `if (typeof window === 'undefined') return;` no useEffect

---

## ⚙️ SETUP NECESSÁRIO

### Firebase (.env.local)
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBpaXYdxKvxi6AlxK1HVE0pYOanNRvjlHs
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=hangman-study-game.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://hangman-study-game-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=hangman-study-game
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=hangman-study-game.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=936166296326
NEXT_PUBLIC_FIREBASE_APP_ID=1:936166296326:web:73f859e086f23b6fb16c87
```

### Dependências
```json
{
  "next": "13.4.19",
  "react": "18.2.0",
  "firebase": "^10.7.1",
  "tailwindcss": "^3.3.3"
}
```

---

## 🚀 ROTAS PRINCIPAIS

| Rota | Arquivo | Função |
|------|---------|--------|
| `/` | `pages/index.js` | Home |
| `/modules` | `pages/modules/index.js` | Lista módulos |
| `/game/[moduleId]` | `pages/game/[moduleId].js` | Single player |
| `/challenge/[moduleId]` | `pages/challenge/[moduleId].js` | Desafio 10 termos |
| `/multiplayer/join` | `pages/multiplayer/join.js` | Entrar sala |
| `/multiplayer/create/[moduleId]` | `pages/multiplayer/create/[moduleId].js` | Criar sala |
| `/multiplayer/room/[roomCode]` | `pages/multiplayer/room/[roomCode].js` | **CRÍTICO** |

---

## 📁 ARQUIVOS CRÍTICOS

```
src/
├── lib/
│   ├── firebase.js                   ← Inicialização
│   ├── multiplayerService.js         ← Serviço multiplayer
│   ├── gameLogic.js                  ← Lógica jogo
│   └── textUtils.js                  ← Normalização
├── pages/
│   ├── multiplayer/room/[roomCode].js ← 🔴 CRÍTICO
│   ├── game/[moduleId].js            ← Single player
│   └── multiplayer/create/[moduleId].js ← Criar sala
└── components/
    └── Game/HangmanGame.jsx          ← Lógica principal
```

---

## 🐛 PADRÃO DE FIX PARA PROBLEMAS SSR

### Template 1: Usar router.query
```javascript
// ❌ WRONG
const { param } = router.query;

// ✅ RIGHT
const [param, setParam] = useState(null);

useEffect(() => {
  if (!router.isReady) return;
  if (router.query.param) {
    setParam(String(router.query.param));
  }
}, [router.isReady, router.query.param]);
```

### Template 2: window/localStorage
```javascript
// ❌ WRONG
const value = localStorage.getItem('key');

// ✅ RIGHT
useEffect(() => {
  if (typeof window === 'undefined') return;
  const value = localStorage.getItem('key');
}, []);
```

### Template 3: Event Listeners
```javascript
// ❌ WRONG
window.addEventListener('click', handler);

// ✅ RIGHT
useEffect(() => {
  if (typeof window === 'undefined') return;
  window.addEventListener('click', handler);
  return () => window.removeEventListener('click', handler);
}, [dependencies]);
```

---

## 🧪 TESTES RÁPIDOS

### Multiplayer
```
1. npm run dev
2. Aba 1: http://localhost:3000/multiplayer/create/biology
3. Aba 2: Copiar link da sala
4. Cole em aba nova (incógnito)
5. Ambas carregam? ✅
```

### Acesso Direto
```
1. Crie sala, copie código (ABC123)
2. Nova aba: /multiplayer/room/ABC123?playerId=player_123
3. Carrega? ✅
```

---

## 📊 FLUXO MULTIPLAYER

```
Host cria sala
  ↓
Firebase gera: rooms/ABC123
  ↓
Host redireciona para: /multiplayer/room/ABC123?playerId=player_1
  ↓
Outro jogador entra via /multiplayer/join
  ↓
Firebase: joinRoom() cria player em rooms/ABC123/players
  ↓
Redireciona para: /multiplayer/room/ABC123?playerId=player_2
  ↓
Ambos acessam mesma página
  ↓
listenToRoom() sincroniza em tempo real
  ↓
Placar atualiza para todos
```

---

## 🔍 CHECKLIST - Antes de Commit

- [ ] Nenhum acesso a `window` fora de `useEffect`
- [ ] Nenhum acesso a `router.query` fora de `useEffect`
- [ ] Toda página dinâmica tem `router.isReady` check
- [ ] Todos os `useEffect` com cleanup (return)
- [ ] Mensagens de erro em state, não alert()
- [ ] localStorage protegido com typeof window
- [ ] Build local: `npm run build` ✅
- [ ] Sem lint errors: `npm run lint` ✅

---

## 🚨 SINAIS DE ALERTA

| Sinal | Causa Provável | Fix |
|-------|----------------|----|
| "Application error" | SSR mismatch | Use useEffect + router.isReady |
| ReferenceError | Variável undefined | Debugar scope |
| Hydration mismatch | Dados diferentes SSR/client | Usar estado |
| Page flickers | Re-render durante hidratação | Verificar dependencies |
| Multiplayer não sincroniza | Firebase listener não ativo | Verificar listenToRoom |

---

## 📞 COMANDOS ÚTEIS

```bash
# Desenvolvimento
npm run dev              # localhost:3000

# Build
npm run build            # Gera .next/
npm start                # Roda build em produção

# Qualidade
npm run lint             # ESLint check

# Debug
node --inspect next dev  # Node debugger
```

---

## 🔐 FIREBASE

**Projeto:** hangman-study-game  
**Banco:** Realtime Database  
**URL:** https://hangman-study-game-default-rtdb.firebaseio.com  
**Regras:** Desenvolvimento (TODO: autenticação)

---

## 📚 DOCUMENTAÇÃO

- `RELATORIO_COMPLETO.md` - Relatório detalhado
- `RESUMO_EXECUTIVO.md` - Resumo executivo (5 min)
- `GUIA_TECNICO.md` - Detalhes técnicos
- `FIREBASE_SETUP.md` - Setup Firebase
- `MULTIPLAYER_FIXES.md` - Histórico correções
- `CRIAR_MODULO.md` - Criar novo módulo

---

**Last:** 23 jan 2026 | **Versão:** 1.0.0 | **Status:** ✅ Production Ready

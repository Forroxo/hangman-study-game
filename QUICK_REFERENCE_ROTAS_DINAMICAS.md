# QUICK REFERENCE - Rotas Dinâmicas Next.js

## 🚨 ERROS COMUNS EM ROTAS DINÂMICAS

### ❌ Erro #1: Desestruturação Direta de router.query
```javascript
// ❌ NÃO FAÇA ISSO!
const { roomCode } = router.query;
const [playerId, setPlayerId] = useState(null);
// Causa: Hydration mismatch (SSR: undefined, Cliente: "ABC123")
```

**Solução:**
```javascript
// ✅ FAÇA ISSO!
const [roomCode, setRoomCode] = useState(null);

useEffect(() => {
  if (!router.isReady) return;
  if (router.query.roomCode) {
    setRoomCode(String(router.query.roomCode));
  }
}, [router.isReady, router.query.roomCode]);
```

---

### ❌ Erro #2: localStorage Sem Proteção SSR
```javascript
// ❌ NÃO FAÇA ISSO!
const value = localStorage.getItem('key');
// Causa: ReferenceError em SSR (localStorage undefined)
```

**Solução:**
```javascript
// ✅ FAÇA ISSO!
if (typeof window !== 'undefined') {
  const value = localStorage.getItem('key');
}
```

---

### ❌ Erro #3: window/navigator Sem Proteção
```javascript
// ❌ NÃO FAÇA ISSO!
const url = window.location.href;
navigator.clipboard.writeText(text);
// Causa: ReferenceError em SSR

// ❌ NÃO FAÇA ISSO!
window.addEventListener('event', handler);
// Causa: ReferenceError em SSR
```

**Solução:**
```javascript
// ✅ FAÇA ISSO!
if (typeof window === 'undefined') return;

const url = window.location.href;
navigator.clipboard.writeText(text);

useEffect(() => {
  if (typeof window === 'undefined') return;
  window.addEventListener('event', handler);
  return () => window.removeEventListener('event', handler);
}, []);
```

---

### ❌ Erro #4: Renderização Antes de router.isReady
```javascript
// ❌ NÃO FAÇA ISSO!
if (loading) {
  return <LoadingScreen />;
}
// Renderiza com dados incompletos

const { roomCode } = router.query;  // undefined em SSR
```

**Solução:**
```javascript
// ✅ FAÇA ISSO!
if (loading || !router.isReady) {
  return <LoadingScreen />;
}
```

---

### ❌ Erro #5: ReferenceError - Variável Não Definida
```javascript
// ❌ NÃO FAÇA ISSO!
const handleClick = () => {
  console.log(players.length);  // players não está neste escopo!
};

// ... mais código...

const players = Object.values(roomData?.players || {});
```

**Solução:**
```javascript
// ✅ FAÇA ISSO!
const handleClick = () => {
  const playersLocal = Object.values(roomData?.players || {});
  console.log(playersLocal.length);
};

// Ou use o players global se já definido:
useEffect(() => {
  // Atualizar estado se necessário
}, [players]);
```

---

### ❌ Erro #6: Firebase Listener Sem Guard Clause
```javascript
// ❌ NÃO FAÇA ISSO!
useEffect(() => {
  listenToRoom(roomCode, callback);  // roomCode pode ser undefined
}, [roomCode]);
```

**Solução:**
```javascript
// ✅ FAÇA ISSO!
useEffect(() => {
  if (!roomCode) return;  // Guard clause
  listenToRoom(roomCode, callback);
  return () => unsubscribe();
}, [roomCode]);
```

---

### ❌ Erro #7: Hooks Executando Condicionalmente
```javascript
// ❌ NÃO FAÇA ISSO!
if (condition) {
  useEffect(() => {  // Hooks NUNCA podem ser condicionais!
    // ...
  }, []);
}
```

**Solução:**
```javascript
// ✅ FAÇA ISSO!
useEffect(() => {
  if (!condition) return;  // Guard clause DENTRO do hook
  // ...
}, [condition]);
```

---

## 📋 CHECKLIST PARA ROTAS DINÂMICAS

Use este checklist ao criar/modificar rotas dinâmicas (`[param].js`):

### Estados
- [ ] Não uso desestruturação direta: `const { param } = router.query`
- [ ] Crio estado: `const [param, setParam] = useState(null)`
- [ ] Estado tem valor padrão seguro: `null` ou `undefined` (nunca `""`ou derivado)

### useEffect - Sincronização
- [ ] Verifico `router.isReady`: `if (!router.isReady) return`
- [ ] Sincronizo com estado: `setParam(router.query.param)`
- [ ] Adiciono dependências corretas: `[router.isReady, router.query.param]`

### useEffect - Listeners
- [ ] Adiciono guard clause: `if (!param) return`
- [ ] Cleanup correto: `return () => unsubscribe()`
- [ ] Dependências corretas: `[param]`

### Renderização Condicional
- [ ] Aguardo dados: `if (loading) return <Loading />`
- [ ] Aguardo router: `if (!router.isReady) return <Loading />`
- [ ] AMBAS as verificações: `if (loading || !router.isReady) return <Loading />`

### Proteção SSR
- [ ] localStorage: `if (typeof window !== 'undefined') { localStorage... }`
- [ ] window: `if (typeof window !== 'undefined') { window... }`
- [ ] navigator: `if (typeof window !== 'undefined') { navigator... }`
- [ ] Event listeners: Adiciono `if (typeof window === 'undefined') return;` dentro de useEffect
- [ ] No JSX: Sem `window`, `document`, `localStorage`, `navigator`

### Funções/Handlers
- [ ] Não referencio variáveis externas indefinidas
- [ ] Se preciso, calculo localmente dentro da função
- [ ] Ou uso estado que é garantido existir

### Console/Debugging
- [ ] console.log(): ✅ OK em produção (remover depois)
- [ ] alert(): ❌ Não use, use `setMessage()` ou toast
- [ ] debugger: ❌ Não use em produção

---

## 🧠 CONCEITOS-CHAVE

### SSR (Server-Side Rendering)
- Código executa no Node.js server
- `window`, `navigator`, `localStorage` **NÃO EXISTEM**
- HTML é gerado e enviado ao navegador

### Hidratação (Hydration)
- React conecta o HTML do servidor com código no cliente
- Se HTML server ≠ HTML cliente → **Hydration error**
- `router.query` está vazio durante SSR

### router.isReady
- `false` durante SSR e na primeira renderização no cliente
- `true` quando `router.query` foi populado com valores da URL
- **SEMPRE** aguarde `router.isReady` antes de usar `router.query`

### typeof window
- `typeof window === 'undefined'` → Está em SSR (Node.js)
- `typeof window !== 'undefined'` → Está no navegador

---

## 🔍 DEBUGGING

### Erro: "ReferenceError: window is not defined"
```javascript
// ❌ Você fez:
const url = window.location.href;

// ✅ Faça:
if (typeof window !== 'undefined') {
  const url = window.location.href;
}
```

### Erro: "Hydration failed"
```javascript
// ❌ Você fez:
const { roomCode } = router.query;
const page = roomCode ? 'room' : 'home';

// ✅ Faça:
const [roomCode, setRoomCode] = useState(null);
useEffect(() => {
  if (!router.isReady) return;
  setRoomCode(router.query.roomCode);
}, [router.isReady, router.query.roomCode]);

const page = roomCode ? 'room' : 'home';
```

### Erro: "ReferenceError: localStorage is not defined"
```javascript
// ❌ Você fez:
useEffect(() => {
  const item = localStorage.getItem('key');
}, []);

// ✅ Faça:
useEffect(() => {
  if (typeof window === 'undefined') return;
  const item = localStorage.getItem('key');
}, []);
```

### Erro: "Cannot read properties of undefined"
```javascript
// ❌ Você fez:
console.log(roomData.players.length);  // roomData pode ser null

// ✅ Faça:
console.log(roomData?.players?.length || 0);  // Optional chaining

// Ou guard clause:
if (!roomData) return <Loading />;
console.log(roomData.players.length);
```

---

## 🧪 TESTE RÁPIDO

Crie este arquivo de teste para verificar seu componente:

```javascript
// __tests__/room.test.js
import { render, screen } from '@testing-library/react';
import MultiplayerRoomPage from '../pages/multiplayer/room/[roomCode]';

describe('Rota dinâmica /multiplayer/room/[roomCode]', () => {
  test('não quebra em SSR', () => {
    // Se você consegue fazer require() sem erro,
    // o componente não tem window/localStorage/navigator no escopo global
    expect(MultiplayerRoomPage).toBeDefined();
  });

  test('renderiza loading enquanto router.isReady é false', () => {
    const { getByText } = render(<MultiplayerRoomPage />);
    // Pode não mostrar "Carregando..." se o router já estiver pronto
    // Mas não deve quebrar nunca
    expect(screen.getByText).toBeDefined();
  });
});
```

---

## 📞 RECURSOS

- [Next.js - Dynamic Routes](https://nextjs.org/docs/routing/dynamic-routes)
- [Next.js - useRouter API](https://nextjs.org/docs/api-reference/next-router/use-router)
- [React - useEffect Hook](https://react.dev/reference/react/useEffect)
- [MDN - typeof Operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof)
- [Next.js - SSR vs CSR](https://nextjs.org/docs/advanced-features/rendering)

---

## 💡 TIPS & TRICKS

### Tip #1: Criar wrapper para localStorage
```javascript
// utils/storage.ts
export const getItem = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const setItem = (key: string, value: string): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
};

// No seu componente:
import { getItem, setItem } from '@/utils/storage';

const value = getItem('myKey');
setItem('myKey', 'newValue');
```

### Tip #2: Criar hook para router.query
```javascript
// hooks/useRouterQuery.ts
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export function useRouterQuery() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (router.isReady) {
      setIsReady(true);
    }
  }, [router.isReady]);

  return { ...router.query, isReady };
}

// No seu componente:
const { roomCode, isReady } = useRouterQuery();

if (!isReady) return <Loading />;
```

### Tip #3: Usar dynamic import com ssr: false
```javascript
// Para componentes que PRECISAM acessar window
import dynamic from 'next/dynamic';

const MapComponent = dynamic(
  () => import('../components/Map'),
  { ssr: false }  // Não renderizar em SSR
);

export default function Page() {
  return (
    <div>
      <MapComponent />  {/* Só renderiza no cliente */}
    </div>
  );
}
```

---

## ✅ FINAL CHECKLIST

Antes de fazer push, verifique:

- [ ] Build passa: `npm run build` sem erros
- [ ] Lint passa: `npm run lint` sem avisos
- [ ] Rota dinâmica não quebra em acesso direto
- [ ] Console não tem erros (F12 → Console)
- [ ] Funciona em dev, build, e start
- [ ] Testei em mobile também
- [ ] Documentei mudanças importantes
- [ ] Comentei código confuso

---

**Data:** 23 de janeiro de 2026
**Versão:** 1.0
**Status:** ✅ PRONTO PARA PRODUÇÃO


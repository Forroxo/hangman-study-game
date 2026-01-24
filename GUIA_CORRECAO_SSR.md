# ✅ GUIA DE CORREÇÃO - Application Error SSR/Hydration

## 🔴 ERROS CORRIGIDOS

### 1. **Hydration Mismatch - router.query Desestruturação Direta**

#### ❌ PROBLEMA (Antes):
```javascript
const { roomCode } = router.query;  // ERRADO!
const [playerId, setPlayerId] = useState(null);
```

**Por que errava:**
- SSR: `router.query = {}` → `roomCode = undefined`
- Cliente: `router.query = { roomCode: "ABC123" }` → `roomCode = "ABC123"`
- Hydration fail: HTML não bate com DOM
- Resultado: `Application error: a client-side exception has occurred`

#### ✅ SOLUÇÃO (Depois):
```javascript
const [roomCode, setRoomCode] = useState(null);

useEffect(() => {
  if (!router.isReady) return;  // ← Aguarda router estar pronto
  if (router.query.roomCode) {
    setRoomCode(String(router.query.roomCode));
  }
}, [router.isReady, router.query.roomCode]);
```

**Por que funciona:**
- useState inicial: `roomCode = null` (consistente em SSR e cliente)
- useEffect: NUNCA executa em SSR, apenas no navegador
- Quando cliente está pronto, useEffect sincroniza o valor real
- Não há mismatch entre SSR e hidratação

---

### 2. **ReferenceError - Variável Não Definida**

#### ❌ PROBLEMA (Antes):
```javascript
const handleStartGame = async () => {
  if (!roomCode) return;
  console.log('Players:', players.length);  // ❌ ReferenceError!
  // ...
};

// players definido mais abaixo:
const players = Object.values(roomData?.players || {});
```

**Por que errava:**
- `players` é uma variável local do componente
- Dentro de `handleStartGame`, não existe `players` no escopo
- Resultado: `ReferenceError: players is not defined`

#### ✅ SOLUÇÃO (Depois):
```javascript
const handleStartGame = async () => {
  if (!roomCode || !roomData) return;
  
  const playersInRoom = Object.values(roomData.players || {});
  console.log('Players:', playersInRoom.length);  // ✅ OK!
};
```

**Por que funciona:**
- Calcula `playersInRoom` localmente dentro da função
- Não depende de variáveis externas indefinidas

---

### 3. **Renderização Antes do Router Estar Pronto**

#### ❌ PROBLEMA (Antes):
```javascript
if (loading) {
  return <LoadingScreen />;
}
// Tenta renderizar com roomCode = undefined
```

**Por que errava:**
- Renderiza a página antes do router estar pronto
- `roomCode = undefined` em toda a árvore de componentes
- Sem dados iniciais corretos

#### ✅ SOLUÇÃO (Depois):
```javascript
if (loading || !router.isReady) {  // ← Adicionado router.isReady
  return <LoadingScreen />;
}
```

**Por que funciona:**
- Aguarda AMBAS as condições:
  - `loading`: Dados do Firebase chegaram
  - `router.isReady`: Router populou router.query
- Só renderiza quando tudo está pronto

---

### 4. **Acesso a window/localStorage Sem Proteção**

#### ❌ PROBLEMA (Antes):
```javascript
const stored = localStorage.getItem(`...`);  // ❌ ReferenceError em SSR
```

**Por que errava:**
- Durante SSR, `localStorage` não existe
- Resultado: `ReferenceError: localStorage is not defined`

#### ✅ SOLUÇÃO (Depois):
```javascript
if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem(`...`);
  } catch (e) {
    // ignore localStorage errors
  }
}
```

**Por que funciona:**
- `typeof window !== 'undefined'`: Verifica se é navegador
- Em SSR: `typeof window === 'undefined'` → skipa localStorage
- No cliente: `typeof window !== 'undefined'` → acessa localStorage

---

### 5. **Event Listeners Sem Proteção SSR**

#### ❌ PROBLEMA (Antes):
```javascript
useEffect(() => {
  window.addEventListener('keydown', handler);  // ❌ window undefined em SSR
  return () => window.removeEventListener('keydown', handler);
}, []);
```

**Por que errava:**
- Durante SSR, `window` não existe
- Resultado: `ReferenceError: window is not defined`

#### ✅ SOLUÇÃO (Depois):
```javascript
useEffect(() => {
  if (typeof window === 'undefined') return;  // ← Guard clause
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, []);
```

**Por que funciona:**
- Retorna cedo se não for navegador
- Event listener só é adicionado no cliente

---

### 6. **Firebase Listener Sem Guard Clause**

#### ❌ PROBLEMA (Antes):
```javascript
useEffect(() => {
  listenToRoom(roomCode, callback);  // ❌ roomCode é undefined em SSR
}, [roomCode]);
```

**Por que errava:**
- Se `roomCode = undefined`, Firebase tenta criar listener com chave vazia
- Comportamento indefinido no Firebase

#### ✅ SOLUÇÃO (Depois):
```javascript
useEffect(() => {
  if (!roomCode) return;  // ← Guard clause crítica
  listenToRoom(roomCode, callback);
}, [roomCode]);
```

**Por que funciona:**
- Não cria listener até `roomCode` ter valor
- Durante SSR: `roomCode = null` → pula listener
- No cliente: `roomCode = "ABC123"` → cria listener

---

## 📋 CHECKLIST PARA ROTAS DINÂMICAS

Use este checklist para qualquer rota dinâmica (`[param].js`):

- [ ] **Nunca** use desestruturação direta de `router.query`
  ```javascript
  ❌ const { param } = router.query;
  ✅ const [param, setParam] = useState(null);
  ```

- [ ] **Sempre** use `router.isReady` em useEffect
  ```javascript
  useEffect(() => {
    if (!router.isReady) return;
    setParam(router.query.param);
  }, [router.isReady, router.query.param]);
  ```

- [ ] **Sempre** aguarde `router.isReady` antes de renderizar
  ```javascript
  if (loading || !router.isReady) return <LoadingScreen />;
  ```

- [ ] **Sempre** proteja acessos a `window`, `navigator`, `localStorage`
  ```javascript
  if (typeof window !== 'undefined') {
    // acessa browser APIs
  }
  ```

- [ ] **Sempre** verifique guard clauses em useEffect
  ```javascript
  useEffect(() => {
    if (!param) return;  // ← Guard clause
    // usar param
  }, [param]);
  ```

- [ ] **Nunca** reference variáveis externas em event handlers
  ```javascript
  ❌ const handleClick = () => { console.log(players.length); };
  ✅ const handleClick = () => { 
        const players = Object.values(roomData?.players || {});
        console.log(players.length); 
      };
  ```

---

## 🧪 COMO TESTAR

### 1. **Build Local**
```bash
npm run build
npm run start
```
Acesse: `http://localhost:3000/multiplayer/room/ABC123?playerId=player_123`

### 2. **Verificar Console**
- Abra DevTools (F12)
- Vá para "Console"
- Não deve haver erros vermelhos
- Deve ver logs: `📊 Estado da sala:`

### 3. **Testar Hydration**
- Abra DevTools
- Network → Throttle para "Slow 3G"
- Recarregue a página
- Aguarde carregamento completo
- Não deve haver jumps/flashs visuais

### 4. **Em Produção (Vercel)**
```bash
git add .
git commit -m "fix: Corrige hydration mismatch em rota dinâmica"
git push
```
- Acesse o link no Vercel
- Teste acesso direto (não refresh via navegação)
- Teste em mobile

---

## 📚 REFERÊNCIAS

- [Next.js - Dynamic Routes](https://nextjs.org/docs/routing/dynamic-routes)
- [Next.js - useRouter](https://nextjs.org/docs/api-reference/next-router/use-router)
- [React Hydration Errors](https://react.dev/reference/react-dom/hydrateRoot)
- [Next.js - SSR & CSR](https://nextjs.org/docs/advanced-features/rendering)

---

## 🎯 RESUMO EXECUTIVO

**O Erro:** Application error acontecia quando SSR gerava HTML diferente do cliente durante hidratação.

**A Causa Raiz:** Desestruturação direta de `router.query` que está vazio durante SSR.

**A Solução:** 
1. Move `roomCode` para state (não para desestruturação)
2. Sincroniza com `useEffect` aguardando `router.isReady`
3. Aguarda `!router.isReady` antes de renderizar
4. Protege todos acessos a APIs do navegador
5. Adiciona guard clauses em listeners

**Resultado:** Hydration consistente, sem erros client-side.


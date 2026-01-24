# 🔧 GUIA TÉCNICO - StudyHangman

**Nível:** Avançado  
**Para:** Developers que precisam entender internals do projeto  

---

## 📋 Índice

1. [Padrões e Convenções](#padrões)
2. [Ciclo de Vida das Páginas](#ciclo-vida)
3. [Sincronização Firebase](#firebase-sync)
4. [Tratamento de Erros](#erros)
5. [Performance](#performance)
6. [Segurança](#segurança)

---

## <a name="padrões"></a>1️⃣ Padrões e Convenções

### 1.1 Estrutura de Componentes React

```javascript
import { useState, useEffect } from 'react';

export default function ComponentName({ prop1, prop2 }) {
  // 1. Estados
  const [state, setState] = useState(initialValue);
  
  // 2. Effects (ordem: data fetching, side effects, cleanup)
  useEffect(() => {
    // Aqui roda after render
    return () => {
      // Cleanup (opcional)
    };
  }, [dependencies]);
  
  // 3. Handlers
  const handleClick = () => {
    setState(newValue);
  };
  
  // 4. Condicional rendering
  if (loading) return <Loading />;
  if (error) return <Error />;
  
  // 5. Render
  return (
    <div>
      {/* JSX aqui */}
    </div>
  );
}
```

### 1.2 Páginas Next.js (Route: /game/[moduleId])

```javascript
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

export default function GamePage() {
  const router = useRouter();
  const [moduleId, setModuleId] = useState(null);
  
  // CRÍTICO: Sempre aguardar router.isReady
  useEffect(() => {
    if (!router.isReady) return;
    
    // Agora router.query está populado
    if (router.query.moduleId) {
      setModuleId(String(router.query.moduleId));
    }
  }, [router.isReady, router.query.moduleId]);
  
  // Nunca acesse router.query diretamente fora de useEffect!
  
  if (!moduleId) {
    return <Loading />;
  }
  
  return <GameComponent moduleId={moduleId} />;
}

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: 'blocking'
  };
}

export async function getStaticProps() {
  return {
    props: {},
    revalidate: 60 // ISR: revalidar a cada 60 segundos
  };
}
```

### 1.3 Formatação de Strings

```javascript
// Sempre usar template literals
const url = `${baseUrl}/game/${moduleId}`;

// Não concatenar strings
const url = baseUrl + '/game/' + moduleId; // ❌

// Acesso seguro a objetos
const value = obj?.property?.nested;

// Valores padrão
const value = data ?? 'default';
```

---

## <a name="ciclo-vida"></a>2️⃣ Ciclo de Vida das Páginas

### Fluxo: User clica em "Jogar" → Carrega /game/[moduleId]

```
┌──────────────────────────────────────────────────────┐
│ 1. NEXT.JS ROUTING                                    │
│    router.push('/game/biology')                       │
└──────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────┐
│ 2. GETSTATICPROPS (Build Time ou ISR)                │
│    - Busca dados estáticos                           │
│    - Cached para próximas requisições                │
│    - Revalidado a cada 60s                           │
└──────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────┐
│ 3. HTML RENDERIZADO NO SERVIDOR (SSR)                │
│    - Componente executa no servidor                  │
│    - router.query está VAZIO {}                      │
│    - Não acesse: window, localStorage, document      │
│    - useState / useEffect NOT executados yet         │
└──────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────┐
│ 4. HTML ENVIADO PARA NAVEGADOR                       │
│    - Browser recebe HTML estático                    │
│    - JavaScript bundle carregado                     │
│    - React começa hidratação                         │
└──────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────┐
│ 5. HYDRATION (cliente)                               │
│    - React "hidratea" o DOM                          │
│    - useState inicializados                          │
│    - useEffect effects NÃO executados ainda          │
│    - router.query AINDA está vazio                   │
└──────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────┐
│ 6. ROUTER READY                                      │
│    - router.isReady = true                           │
│    - router.query AGORA tem valores                  │
│    - Triggers useEffect dependencies                 │
└──────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────┐
│ 7. USEEFFECTS EXECUTAM                               │
│    - Busca de dados                                  │
│    - Setup de listeners                              │
│    - Cleanup em unmount                              │
└──────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────┐
│ 8. PÁGINA PRONTA PARA INTERAÇÃO                      │
│    - User pode clicar, digitar, etc.                 │
└──────────────────────────────────────────────────────┘
```

### O Problema: SSR/Hydration Mismatch

```javascript
// ❌ ERRADO - Causa Mismatch
export default function Page() {
  const { moduleId } = router.query;  // Vazio no SSR, preenchido no cliente
  
  // Servidor renderiza: <div>undefined</div>
  // Cliente renderiza: <div>biology</div>
  // React detecta: MISMATCH! ❌
  
  return <div>{moduleId}</div>;
}

// ✅ CORRETO - Sem Mismatch
export default function Page() {
  const router = useRouter();
  const [moduleId, setModuleId] = useState(null);  // null para ambos
  
  // Servidor renderiza: <div></div>
  // Cliente renderiza: <div></div>
  // React detecta: MATCH! ✅
  
  useEffect(() => {
    if (!router.isReady) return;
    setModuleId(router.query.moduleId);
  }, [router.isReady]);
  
  if (!moduleId) return <Loading />;
  return <div>{moduleId}</div>;
}
```

---

## <a name="firebase-sync"></a>3️⃣ Sincronização Firebase

### 3.1 Realtime Listener (Multiplayer)

```javascript
import { ref, onValue, off } from 'firebase/database';

export const listenToRoom = (roomCode, callback) => {
  const roomRef = ref(database, `rooms/${roomCode}`);
  
  // Registra listener
  onValue(roomRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null);
    }
  });
  
  // Retorna função para unsubscribe
  return () => off(roomRef);
};
```

**Uso em componente:**

```javascript
useEffect(() => {
  if (!roomCode) return;
  
  const unsubscribe = listenToRoom(roomCode, (data) => {
    setRoomData(data);
    setLoading(false);
  });
  
  // Cleanup: unsubscribe ao desmontar
  return () => {
    if (unsubscribe) unsubscribe();
  };
}, [roomCode]);
```

### 3.2 Otimizando Atualizações (Evitar Renders Desnecessários)

```javascript
// Problema: Renderiza toda vez que roomData muda
useEffect(() => {
  if (!roomCode) return;
  
  const unsubscribe = listenToRoom(roomCode, (data) => {
    setRoomData(data);  // Renderiza sempre
  });
  
  return () => unsubscribe?.();
}, [roomCode]);

// Solução: Comparar com JSON.stringify
useEffect(() => {
  if (!roomCode) return;
  
  const lastSerializedRef = useRef(null);
  
  const unsubscribe = listenToRoom(roomCode, (data) => {
    if (data) {
      const serialized = JSON.stringify(data);
      if (lastSerializedRef.current !== serialized) {
        lastSerializedRef.current = serialized;
        setRoomData(data);  // Renderiza só se mudou
      }
    }
  });
  
  return () => unsubscribe?.();
}, [roomCode]);
```

### 3.3 Estrutura de Dados Multiplayer

```
{
  rooms/
    {roomCode}/
      roomCode: "ABC123"
      moduleId: "biology"
      moduleName: "🧬 Biologia Celular"
      hostId: "player_1234567890"
      status: "playing"        // waiting, playing, finished
      currentTermIndex: 0      // Termo atual (0-9)
      terms: [                 // 10 termos selecionados
        {
          id: "1",
          word: "MITOCONDRIA",
          hint: "...",
          category: "..."
        }
      ]
      players/
        {playerId}/
          id: "player_1234567890"
          name: "João"
          isHost: true
          score: 100
          isReady: true
          completedTerms: [
            {
              termId: "1",
              result: "won",     // won, lost
              timeSpent: 45      // segundos
            }
          ]
          currentTermComplete: true
          joinedAt: 1674421200000
}
```

### 3.4 Transições de Status

```
waiting
  ↓
  (Host clica "Iniciar Jogo")
  ↓
playing
  ↓
  (Todos completam todos os 10 termos)
  ↓
finished
```

---

## <a name="erros"></a>4️⃣ Tratamento de Erros

### 4.1 Try-Catch para Firebase

```javascript
const joinRoom = async (roomCode, playerName) => {
  try {
    // Validação input
    if (!roomCode?.trim()) {
      throw new Error('Código da sala é obrigatório');
    }
    
    // Firebase operation
    const playerId = await joinRoom(roomCode, playerName);
    
    // Sucesso
    return playerId;
  } catch (error) {
    // Erros específicos do Firebase
    if (error.message.includes('Sala não encontrada')) {
      setError('Sala expirou ou não existe');
    } else if (error.message.includes('O jogo já começou')) {
      setError('Jogo já em andamento');
    } else {
      setError('Erro ao conectar. Verifique sua internet.');
      console.error(error);
    }
    
    // Não relançar, apenas logar
    return null;
  }
};
```

### 4.2 Fallbacks Seguro

```javascript
// ❌ Perigoso - pode ser null/undefined
const players = roomData.players;
const count = players.length;

// ✅ Seguro - usa optional chaining
const players = Object.values(roomData?.players || {});
const count = players.length;  // Sempre 0+ se não houver

// ✅ Seguro - null coalescing
const message = data?.message ?? 'Erro desconhecido';

// ✅ Seguro - optional chaining em arrays
const firstPlayer = roomData.players?.[0];
```

---

## <a name="performance"></a>5️⃣ Performance

### 5.1 Code Splitting

```javascript
// ❌ Carrega tudo no bundle principal
import HeavyComponent from './HeavyComponent';

// ✅ Carrega sob demanda
import dynamic from 'next/dynamic';
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Loading />,
  ssr: false
});
```

### 5.2 Memoização

```javascript
// Evitar re-renders desnecessários
import { useMemo } from 'react';

export default function Component({ data }) {
  // Recalcula só quando 'data' muda
  const processedData = useMemo(() => {
    return expensiveCalculation(data);
  }, [data]);
  
  return <div>{processedData}</div>;
}
```

### 5.3 Lazy Loading de Imagens

```javascript
// ✅ Com Tailwind + next/image
import Image from 'next/image';

<Image
  src="/image.jpg"
  alt="Description"
  width={400}
  height={300}
  loading="lazy"
  priority={false}
/>
```

---

## <a name="segurança"></a>6️⃣ Segurança

### 6.1 Proteção SSR

```javascript
// ❌ Quebra no SSR
const isDark = localStorage.getItem('theme') === 'dark';

// ✅ Protegido
if (typeof window !== 'undefined') {
  const isDark = localStorage.getItem('theme') === 'dark';
}
```

### 6.2 Validação de Input

```javascript
const handleSubmit = (input) => {
  // 1. Validar vazio
  if (!input?.trim()) {
    setError('Campo obrigatório');
    return;
  }
  
  // 2. Validar tamanho
  if (input.length > 50) {
    setError('Máximo 50 caracteres');
    return;
  }
  
  // 3. Validar format (regex)
  if (!/^[a-zA-Z0-9\s]+$/.test(input)) {
    setError('Apenas letras e números');
    return;
  }
  
  // 4. Sanitizar
  const clean = input.trim().toUpperCase();
  
  // 5. Usar
  submitToServer(clean);
};
```

### 6.3 Firebase Security Rules (Atual)

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

⚠️ **PROBLEMA:** Qualquer um pode ler/escrever qualquer sala  
⚠️ **SOLUÇÃO (TODO):** Implementar autenticação

```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": "root.child('players').child(auth.uid).exists()",
        ".write": "root.child('players').child(auth.uid).exists()",
        ".validate": "newData.hasChildren(['roomCode', 'players'])"
      }
    }
  }
}
```

---

## 🔍 Debugging

### Chrome DevTools

1. **F12** → Sources
2. Breakpoints nos files relevantes
3. Inspecionar estado no Console
4. Network tab para ver requisições Firebase

### Console Logs Úteis

```javascript
// Multiplayer
console.log('📊 Estado da sala:', { status, playersCount, allReady });
console.log('✅ Marcado como pronto:', playerId);
console.log('❌ Erro ao iniciar:', error);

// Firebase
console.log('🔥 Dados do Firebase:', snapshot.val());
console.log('🔄 Sincronizando...', roomCode);
```

### React DevTools

1. Instalar extensão Chrome "React Developer Tools"
2. Inspecionar componentes
3. Verificar props e state
4. Trace renders

---

**Status:** Documentação Técnica Completa ✅

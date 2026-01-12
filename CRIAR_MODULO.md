# Como Criar Novos Módulos

## Localização
Adicione seus módulos no arquivo: `src/data/modules/custom-modules.json`

## Formato do JSON

```json
[
  {
    "id": "seu-modulo-unico",
    "name": "🎯 Nome do Módulo",
    "description": "Descrição breve do que será estudado",
    "icon": "🎓",
    "color": "blue",
    "difficulty": "intermediate",
    "wordCount": 5,
    "categories": ["categoria1", "categoria2"],
    "author": "Seu Nome",
    "terms": [
      {
        "id": "termo_001",
        "word": "PALAVRA",
        "hint": "Dica para adivinhar a palavra",
        "fullExplanation": "Explicação completa e detalhada sobre o conceito.",
        "funFact": "Uma curiosidade interessante sobre o termo!",
        "difficulty": "medium",
        "category": "Categoria do Termo",
        "tags": ["tag1", "tag2", "tag3"]
      }
    ]
  }
]
```

## Campos Obrigatórios

### Módulo
- **id**: identificador único (sem espaços, use hífens)
- **name**: nome exibido (pode incluir emoji)
- **description**: descrição do módulo
- **icon**: emoji representativo
- **color**: cores disponíveis: `blue`, `green`, `purple`, `red`, `yellow`, `indigo`, `gray`
- **difficulty**: `beginner`, `intermediate` ou `advanced`
- **wordCount**: número de termos (deve coincidir com array terms)
- **categories**: array com categorias
- **author**: nome do autor
- **terms**: array com os termos

### Termo
- **id**: identificador único do termo
- **word**: palavra em MAIÚSCULAS (sem acentos funciona melhor)
- **hint**: dica que aparece durante o jogo
- **fullExplanation**: explicação detalhada
- **funFact**: curiosidade (opcional)
- **difficulty**: `easy`, `medium` ou `hard`
- **category**: categoria do termo
- **tags**: array com tags relacionadas

## Exemplo Completo

```json
[
  {
    "id": "matematica-basica",
    "name": "🔢 Matemática Básica",
    "description": "Conceitos fundamentais de matemática",
    "icon": "📐",
    "color": "purple",
    "difficulty": "beginner",
    "wordCount": 3,
    "categories": ["exatas", "matematica"],
    "author": "Prof. Math",
    "terms": [
      {
        "id": "adicao_001",
        "word": "ADICAO",
        "hint": "Operação matemática que junta valores",
        "fullExplanation": "A adição é uma das quatro operações básicas da aritmética. Consiste em combinar dois ou mais números para obter um total ou soma.",
        "funFact": "O símbolo '+' foi usado pela primeira vez em 1489!",
        "difficulty": "easy",
        "category": "Operações Básicas",
        "tags": ["operacao", "soma", "aritmetica"]
      },
      {
        "id": "subtracao_002",
        "word": "SUBTRACAO",
        "hint": "Operação que remove ou diminui valores",
        "fullExplanation": "A subtração é a operação inversa da adição. Remove uma quantidade de outra para encontrar a diferença.",
        "funFact": "Na antiguidade, a subtração era considerada mais difícil que a adição!",
        "difficulty": "easy",
        "category": "Operações Básicas",
        "tags": ["operacao", "diferenca", "aritmetica"]
      },
      {
        "id": "fracao_003",
        "word": "FRACAO",
        "hint": "Representa parte de um todo",
        "fullExplanation": "Uma fração representa uma divisão de algo em partes iguais. É composta por numerador (parte superior) e denominador (parte inferior).",
        "funFact": "Os egípcios usavam frações há mais de 4000 anos!",
        "difficulty": "medium",
        "category": "Números",
        "tags": ["divisao", "numero", "parte"]
      }
    ]
  }
]
```

## Dicas
1. Use palavras sem acentuação para melhor compatibilidade
2. Mantenha hints claros mas não muito óbvios
3. wordCount deve ser igual ao número de termos no array
4. IDs devem ser únicos em todo o sistema
5. Teste seu módulo antes de compartilhar

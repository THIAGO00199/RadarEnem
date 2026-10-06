import type { Area } from "./atena";
export type Lesson = {
  id: string;
  title: string;
  desc: string;
  concept: string;
  q: string;
  o: string[];
  c: number;
  e: string;
  boss?: boolean;
};
export type Track = { icon: string; title: string; units: Lesson[] };
export const academy: Record<Area, Track> = {
  mat: {
    icon: "∑",
    title: "Matemática",
    units: [
      {
        id: "mat1",
        title: "Porcentagem sem medo",
        desc: "Transforme porcentagens em multiplicadores e resolva aumentos e descontos.",
        concept: "20% = 0,20. Para calcular x% de N, multiplique N por x/100.",
        q: "Um tênis de R$ 300 recebe 15% de desconto. Qual o preço final?",
        o: ["R$ 245", "R$ 255", "R$ 265", "R$ 285"],
        c: 1,
        e: "15% de 300 = 45; 300 − 45 = 255.",
      },
      {
        id: "mat2",
        title: "Razão e proporção",
        desc: "Leia relações entre grandezas e use proporcionalidade com unidade correta.",
        concept:
          "Uma razão compara duas grandezas. Em proporções, produtos cruzados ajudam a encontrar o valor desconhecido.",
        q: "Se 4 cadernos custam R$ 28, quanto custam 7, mantendo o preço unitário?",
        o: ["R$ 42", "R$ 45", "R$ 49", "R$ 52"],
        c: 2,
        e: "Cada caderno custa R$ 7; 7×7 = R$ 49.",
      },
      {
        id: "mat3",
        title: "Função afim",
        desc: "Entenda taxa de variação, valor inicial e leitura de gráficos.",
        concept:
          "Em f(x)=ax+b, a indica quanto y varia quando x aumenta uma unidade; b é o valor quando x=0.",
        q: "Em f(x)=3x−2, quanto vale f(4)?",
        o: ["8", "10", "12", "14"],
        c: 1,
        e: "3×4−2 = 10.",
      },
      {
        id: "mat4",
        title: "Estatística essencial",
        desc: "Média, mediana e leitura crítica de conjuntos de dados.",
        concept:
          "A média usa todos os valores; a mediana é o valor central após ordenar os dados.",
        q: "Qual a mediana de 2, 4, 7, 9 e 20?",
        o: ["4", "7", "8,4", "9"],
        c: 1,
        e: "Com cinco valores ordenados, o terceiro é a mediana: 7.",
      },
      {
        id: "mat5",
        boss: true,
        title: "Chefe: Matemática base",
        desc: "Checkpoint da unidade. Resolva sem fórmula decorada.",
        concept:
          "Misture porcentagem, proporção, função e estatística escolhendo a ideia adequada.",
        q: "Uma conta sobe de R$ 160 para R$ 184. O aumento percentual foi:",
        o: ["10%", "12%", "15%", "24%"],
        c: 2,
        e: "O aumento foi 24. 24/160=0,15=15%.",
      },
      {
        id: "mat6",
        title: "Geometria que ocupa espaço",
        desc: "Relacione capacidade e volume.",
        concept:
          "Um cubo de aresta a tem volume a³. 1 m³ equivale a 1.000 litros.",
        q: "Um tanque cúbico de aresta 1,5 m comporta quantos litros?",
        o: ["1.500", "2.250", "3.375", "4.500"],
        c: 2,
        e: "1,5³ = 3,375 m³. Multiplicando por 1.000: 3.375 litros.",
        boss: false,
      },
      {
        id: "mat7",
        title: "Probabilidade com reposição",
        desc: "Entenda quando as chances permanecem iguais.",
        concept:
          "Com reposição, a composição da urna é restaurada. Para eventos independentes, multiplique as probabilidades.",
        q: "Uma urna tem 2 bolas azuis e 3 vermelhas. Com reposição, a chance de duas azuis é:",
        o: ["2/5", "4/25", "1/5", "4/10"],
        c: 1,
        e: "Cada retirada tem chance 2/5. Assim, (2/5)² = 4/25.",
        boss: false,
      },
      {
        id: "mat8",
        title: "Unidades antes das contas",
        desc: "Evite comparar grandezas em unidades diferentes.",
        concept:
          "Converta as unidades antes de aplicar uma fórmula. A unidade final deve responder ao pedido.",
        q: "Uma pessoa corre 600 metros em 2 minutos. Sua velocidade média em m/s é:",
        o: ["3", "5", "10", "300"],
        c: 1,
        e: "Dois minutos são 120 segundos. 600/120 = 5 m/s.",
        boss: true,
      },
    ],
  },
  nat: {
    icon: "⚗",
    title: "Natureza",
    units: [
      {
        id: "nat1",
        title: "Energia e transformações",
        desc: "Reconheça conversões de energia em situações do cotidiano.",
        concept:
          "A energia pode mudar de forma, mas a análise deve acompanhar o sistema e as transferências.",
        q: "Num painel solar fotovoltaico, a transformação principal é:",
        o: [
          "luminosa em elétrica",
          "elétrica em química",
          "química em sonora",
          "térmica em nuclear",
        ],
        c: 0,
        e: "Células fotovoltaicas convertem energia luminosa em elétrica.",
      },
      {
        id: "nat2",
        title: "Ecologia",
        desc: "Fluxo de energia, cadeias alimentares e relações ecológicas.",
        concept:
          "Energia entra majoritariamente pelos produtores e diminui a cada transferência trófica.",
        q: "A maior quantidade de energia disponível em uma cadeia tende a estar:",
        o: [
          "nos decompositores apenas",
          "nos produtores",
          "no último predador",
          "igual em todos os níveis",
        ],
        c: 1,
        e: "Os produtores formam a base energética da cadeia.",
      },
      {
        id: "nat3",
        title: "Eletricidade básica",
        desc: "Tensão, resistência, corrente e potência.",
        concept:
          "A Lei de Ohm relaciona V=R·I. Potência elétrica pode ser calculada por P=V·I.",
        q: "Com 12 V em um resistor de 6 Ω, a corrente é:",
        o: ["0,5 A", "2 A", "6 A", "72 A"],
        c: 1,
        e: "I=V/R=12/6=2 A.",
      },
      {
        id: "nat4",
        title: "Química e pH",
        desc: "Interprete acidez e ordens de grandeza.",
        concept:
          "A escala de pH é logarítmica: uma unidade representa fator 10 na concentração de H⁺.",
        q: "Comparando pH 3 e pH 5, a solução de pH 3 tem concentração de H⁺:",
        o: [
          "2 vezes maior",
          "10 vezes maior",
          "100 vezes maior",
          "1000 vezes menor",
        ],
        c: 2,
        e: "São duas unidades: 10²=100 vezes.",
      },
      {
        id: "nat5",
        boss: true,
        title: "Chefe: Natureza base",
        desc: "Checkpoint interdisciplinar.",
        concept: "Leia o fenômeno antes de escolher a fórmula ou conceito.",
        q: "Se a resistência dobra e a tensão permanece constante, a corrente elétrica:",
        o: ["dobra", "cai pela metade", "fica igual", "quadruplica"],
        c: 1,
        e: "I=V/R; dobrar R reduz I à metade.",
      },
      {
        id: "nat6",
        title: "Conservação da massa",
        desc: "Acompanhe reagentes e produtos.",
        concept:
          "Em um sistema fechado, a massa total se conserva durante uma reação química.",
        q: "Em um recipiente fechado, 12 g de um reagente combinam-se com 32 g de outro. A massa total dos produtos é:",
        o: ["20 g", "32 g", "44 g", "384 g"],
        c: 2,
        e: "Sem troca de matéria com o ambiente, a massa total dos produtos é 12 + 32 = 44 g.",
        boss: false,
      },
      {
        id: "nat7",
        title: "Água e separação de misturas",
        desc: "Associe cada etapa à sua função.",
        concept:
          "A filtração retém partículas. A desinfecção atua sobre microrganismos. Uma etapa não substitui a outra.",
        q: "Depois de filtrar uma água, a desinfecção é importante para:",
        o: [
          "reter pedras maiores",
          "reduzir microrganismos potencialmente patogênicos",
          "aumentar a quantidade de areia",
          "transformar água salgada em doce",
        ],
        c: 1,
        e: "A filtração de partículas, por si só, não garante eliminação de agentes patogênicos.",
        boss: false,
      },
      {
        id: "nat8",
        title: "Seleção natural",
        desc: "Populações mudam ao longo de gerações.",
        concept:
          "Características herdáveis que favorecem sobrevivência e reprodução podem tornar-se mais frequentes sob determinadas condições.",
        q: "A resistência a um antibiótico pode aumentar numa população bacteriana porque:",
        o: [
          "o antibiótico ensina as bactérias a resistir",
          "bactérias resistentes podem sobreviver e deixar descendentes",
          "todas as bactérias mudam voluntariamente",
          "cada bactéria escolhe uma mutação útil",
        ],
        c: 1,
        e: "A seleção favorece variantes resistentes presentes ou surgidas na população; não há intenção ou aprendizado da resistência.",
        boss: true,
      },
    ],
  },
  hum: {
    icon: "⌘",
    title: "Humanas",
    units: [
      {
        id: "hum1",
        title: "Cidadania",
        desc: "Direitos, deveres e participação na vida coletiva.",
        concept:
          "Cidadania envolve dimensões civis, políticas e sociais e formas de participação.",
        q: "Qual situação representa exercício de cidadania para além do voto?",
        o: [
          "participar de conselho comunitário",
          "ignorar decisões públicas",
          "evitar qualquer debate",
          "recusar direitos sociais",
        ],
        c: 0,
        e: "Participação em conselhos e espaços públicos é exercício de cidadania.",
      },
      {
        id: "hum2",
        title: "Urbanização brasileira",
        desc: "Industrialização, êxodo rural e metropolização.",
        concept:
          "A urbanização acelerou com industrialização, transformações no campo e migrações internas.",
        q: "Um fator importante da urbanização brasileira no século XX foi:",
        o: [
          "êxodo rural",
          "fim da indústria",
          "queda absoluta dos serviços",
          "proibição de migrações",
        ],
        c: 0,
        e: "O êxodo rural contribuiu para o crescimento urbano.",
      },
      {
        id: "hum3",
        title: "Globalização",
        desc: "Fluxos globais e desigualdades.",
        concept:
          "Globalização intensifica fluxos econômicos, informacionais e produtivos, sem eliminar fronteiras e desigualdades.",
        q: "Uma característica da globalização contemporânea é:",
        o: [
          "redução de todos os fluxos",
          "intensificação de redes produtivas e informacionais",
          "fim dos Estados",
          "igualdade automática entre países",
        ],
        c: 1,
        e: "Redes e fluxos se intensificam, mas desigualdades permanecem.",
      },
      {
        id: "hum4",
        title: "Trabalho e produção",
        desc: "Divisão do trabalho e mudanças econômicas.",
        concept:
          "A divisão internacional do trabalho distribui atividades e especializações entre economias.",
        q: "A expressão “divisão internacional do trabalho” refere-se à:",
        o: [
          "separação de bairros",
          "distribuição produtiva entre países",
          "divisão dos poderes",
          "grade escolar",
        ],
        c: 1,
        e: "Ela descreve especializações e posições produtivas na economia mundial.",
      },
      {
        id: "hum5",
        boss: true,
        title: "Chefe: Humanas base",
        desc: "Checkpoint de interpretação social.",
        concept:
          "Conecte processos históricos, sociais, políticos e econômicos sem reduzir fenômenos a uma causa única.",
        q: "Eleições periódicas em democracias representativas têm como função:",
        o: [
          "eliminar conflitos",
          "renovar representação política",
          "substituir leis automaticamente",
          "impedir participação social",
        ],
        c: 1,
        e: "Eleições renovam mandatos e representantes.",
      },
      {
        id: "hum6",
        title: "Cidade e ilhas de calor",
        desc: "Relacione uso do solo e temperatura.",
        concept:
          "Superfícies impermeáveis, pouca vegetação e materiais que acumulam calor podem intensificar o aquecimento urbano.",
        q: "Uma medida coerente para reduzir ilhas de calor é:",
        o: [
          "ampliar o asfalto e retirar árvores",
          "aumentar áreas verdes e superfícies permeáveis",
          "eliminar todos os espaços públicos",
          "substituir parques por estacionamentos",
        ],
        c: 1,
        e: "Vegetação e permeabilidade podem contribuir para sombreamento, evapotranspiração e melhor manejo da água.",
        boss: false,
      },
      {
        id: "hum7",
        title: "Cidadania e participação",
        desc: "Pense em direitos e responsabilidade coletiva.",
        concept:
          "A participação cidadã inclui acompanhar decisões, debater propostas e cobrar instituições, além de votar.",
        q: "Uma ação que amplia a participação cidadã é:",
        o: [
          "impedir acesso a informações públicas",
          "acompanhar reuniões e discutir decisões da comunidade",
          "aceitar toda informação sem conferir",
          "excluir pessoas com opiniões diferentes",
        ],
        c: 1,
        e: "Debate informado e acompanhamento das decisões criam oportunidades de participação e controle social.",
        boss: false,
      },
      {
        id: "hum8",
        title: "Leitura de mapas",
        desc: "Escala muda o nível de detalhe.",
        concept:
          "Uma escala de 1:10.000 representa uma área menor com mais detalhe que 1:1.000.000, para mapas de dimensões equivalentes.",
        q: "Qual escala permite mais detalhe de um bairro?",
        o: ["1:5.000", "1:50.000", "1:500.000", "1:5.000.000"],
        c: 0,
        e: "A escala 1:5.000 tem o menor denominador e permite maior detalhamento do espaço representado.",
        boss: true,
      },
    ],
  },
  ling: {
    icon: "¶",
    title: "Linguagens",
    units: [
      {
        id: "ling1",
        title: "Tese e argumento",
        desc: "Encontre o ponto central defendido por um texto.",
        concept:
          "A tese é a posição central; argumentos são razões, dados ou relações usadas para sustentá-la.",
        q: "Em um artigo de opinião, a tese corresponde principalmente:",
        o: [
          "ao ponto de vista defendido",
          "à fonte bibliográfica",
          "ao título",
          "a qualquer exemplo",
        ],
        c: 0,
        e: "A tese organiza o posicionamento do texto.",
      },
      {
        id: "ling2",
        title: "Coesão",
        desc: "Entenda o papel dos conectores.",
        concept:
          "Conectores explicitam relações como causa, contraste, consequência e conclusão.",
        q: "“Contudo” costuma introduzir:",
        o: ["adição", "contraste", "causa", "exemplo"],
        c: 1,
        e: "“Contudo” marca oposição ou contraste.",
      },
      {
        id: "ling3",
        title: "Inferência",
        desc: "Leia o que o texto sugere sem inventar informação.",
        concept:
          "Inferir é construir uma conclusão sustentada por pistas do texto e pelo contexto.",
        q: "Uma inferência válida deve:",
        o: [
          "contradizer o texto",
          "ser sustentada por pistas textuais",
          "depender só de opinião pessoal",
          "ignorar contexto",
        ],
        c: 1,
        e: "A inferência precisa ser justificável por evidências do texto.",
      },
      {
        id: "ling4",
        title: "Figuras de linguagem",
        desc: "Reconheça efeitos de sentido.",
        concept:
          "Figuras organizam efeitos expressivos; personificação atribui traços humanos a seres não humanos.",
        q: "“A cidade acordou nervosa” contém:",
        o: ["personificação", "onomatopeia", "eufemismo", "pleonasmo"],
        c: 0,
        e: "A cidade recebe uma característica humana.",
      },
      {
        id: "ling5",
        boss: true,
        title: "Chefe: Linguagens base",
        desc: "Checkpoint de leitura e argumentação.",
        concept:
          "Leia objetivo, gênero e contexto antes de nomear recursos linguísticos.",
        q: "Informação explícita é aquela que:",
        o: [
          "está declarada diretamente",
          "depende de adivinhação",
          "existe fora do texto",
          "só aparece por ironia",
        ],
        c: 0,
        e: "Explícita significa apresentada diretamente no texto.",
      },
      {
        id: "ling6",
        title: "Funções da linguagem",
        desc: "Observe a intenção dominante.",
        concept:
          "Um texto pode combinar funções, mas o objetivo e os recursos usados ajudam a identificar a predominante.",
        q: "A frase publicitária “Experimente agora e transforme sua rotina” privilegia:",
        o: [
          "a descrição neutra de um fenômeno",
          "a tentativa de influenciar o interlocutor",
          "a explicação do código linguístico",
          "a expressão de dúvida científica",
        ],
        c: 1,
        e: "O imperativo busca orientar a ação do interlocutor, característica da função conativa.",
        boss: false,
      },
      {
        id: "ling7",
        title: "Coesão e contraste",
        desc: "Conectivos indicam relações entre ideias.",
        concept:
          "Conectivos como contudo e entretanto sinalizam oposição; portanto costuma indicar conclusão.",
        q: "Em “O acesso aumentou; contudo, a desigualdade permanece”, contudo indica:",
        o: ["conclusão", "adição", "oposição", "causa"],
        c: 2,
        e: "O segundo segmento contrasta com a expectativa criada pelo aumento do acesso.",
        boss: false,
      },
      {
        id: "ling8",
        title: "Argumento e evidência",
        desc: "Diferencie opinião de sustentação.",
        concept:
          "Um dado só sustenta um argumento quando sua origem, contexto e relação com a afirmação são explicados.",
        q: "Qual procedimento fortalece uma afirmação baseada em dados?",
        o: [
          "omitir a fonte",
          "citar a origem e explicar o que o dado permite concluir",
          "usar um número sem contexto",
          "concluir além do que a pesquisa mediu",
        ],
        c: 1,
        e: "Origem, contexto e alcance da evidência tornam o raciocínio verificável e evitam extrapolações.",
        boss: true,
      },
    ],
  },
  red: {
    icon: "✎",
    title: "Redação",
    units: [
      {
        id: "red1",
        title: "Tese forte",
        desc: "Transforme tema em posição argumentável.",
        concept:
          "Uma tese funcional responde ao problema e antecipa o caminho dos argumentos.",
        q: "Qual tese é mais adequada a um texto sobre desinformação científica?",
        o: [
          "A ciência existe.",
          "A desinformação científica se mantém por baixa alfabetização midiática e circulação irresponsável de conteúdo, exigindo educação e responsabilização.",
          "Redes sociais são legais.",
          "O tema é importante.",
        ],
        c: 1,
        e: "Ela apresenta posição e dois eixos que podem ser desenvolvidos.",
      },
      {
        id: "red2",
        title: "Desenvolvimento",
        desc: "Monte parágrafo com função clara.",
        concept:
          "Um desenvolvimento pode usar tópico frasal, explicação, repertório pertinente e ligação com a tese.",
        q: "Qual elemento evita que repertório vire “nome jogado”?",
        o: [
          "explicar sua relação com o argumento",
          "usar autor famoso sempre",
          "colocar aspas",
          "aumentar o tamanho da frase",
        ],
        c: 0,
        e: "O repertório precisa ser produtivo, isto é, contribuir para o raciocínio.",
      },
      {
        id: "red3",
        title: "Coesão na redação",
        desc: "Faça as ideias conversarem.",
        concept:
          "Coesão não é decorar conectivos; é explicitar relações lógicas entre frases e parágrafos.",
        q: "Para introduzir consequência, um conector adequado é:",
        o: ["por conseguinte", "embora", "por exemplo", "por outro lado"],
        c: 0,
        e: "“Por conseguinte” indica consequência/conclusão.",
      },
      {
        id: "red4",
        title: "Intervenção",
        desc: "Construa proposta concreta e relacionada ao problema.",
        concept:
          "Uma revisão útil procura agente, ação, meio/modo, finalidade e detalhamento, respeitando os direitos humanos.",
        q: "Qual opção apresenta agente e ação?",
        o: [
          "É necessário melhorar.",
          "O Ministério da Educação deve ampliar programas de educação midiática nas escolas.",
          "Logo, existe um problema.",
          "Tal questão é difícil.",
        ],
        c: 1,
        e: "Há agente definido e ação concreta.",
      },
      {
        id: "red5",
        boss: true,
        title: "Chefe: Arquitetura da redação",
        desc: "Checkpoint da estrutura argumentativa.",
        concept:
          "O texto precisa manter tema, tese, argumentos conectados e intervenção coerente.",
        q: "Se a conclusão propõe uma ação sem relação com os argumentos anteriores, o principal problema é:",
        o: [
          "falta de coerência",
          "excesso de parágrafos",
          "uso de título",
          "presença de repertório",
        ],
        c: 0,
        e: "A intervenção deve responder aos problemas discutidos no desenvolvimento.",
      },
      {
        id: "red6",
        title: "Repertório com propósito",
        desc: "Uma referência precisa trabalhar pelo argumento.",
        concept:
          "Apresente a referência, explique seu sentido e conecte-a ao problema discutido. Citação solta não substitui análise.",
        q: "Um repertório é produtivo quando:",
        o: [
          "aparece sem explicação",
          "é conectado ao argumento e ao recorte temático",
          "ocupa o maior espaço possível",
          "é usado com palavras difíceis apenas",
        ],
        c: 1,
        e: "A produtividade está na relação construída entre a referência e a argumentação.",
        boss: false,
      },
      {
        id: "red7",
        title: "Intervenção e direitos humanos",
        desc: "Escolha uma resposta específica e respeitosa.",
        concept:
          "Uma proposta pode indicar agente, ação, meio e finalidade, com detalhamento e respeito aos direitos humanos.",
        q: "Uma intervenção consistente deve:",
        o: [
          "propor violência contra um grupo",
          "responder ao problema e explicar como agir",
          "repetir o tema sem propor ação",
          "apresentar uma solução impossível sem detalhar",
        ],
        c: 1,
        e: "A ação deve dialogar com o problema, indicar sua execução e respeitar direitos humanos.",
        boss: false,
      },
      {
        id: "red8",
        title: "Recorte temático",
        desc: "Responda ao problema que foi apresentado.",
        concept:
          "Ao planejar, identifique o assunto, o problema e o contexto. Falar só do assunto amplo pode deixar o recorte sem resposta.",
        q: "Num tema sobre acesso à leitura no Brasil, qual tese se aproxima mais do recorte?",
        o: [
          "Livros existem há séculos",
          "O acesso é limitado por desigualdades de infraestrutura e formação leitora",
          "A tecnologia sempre melhora tudo",
          "Todos deveriam gostar das mesmas histórias",
        ],
        c: 1,
        e: "A tese relaciona obstáculos ao acesso à leitura, mantendo o problema e o contexto propostos.",
        boss: true,
      },
    ],
  },
};

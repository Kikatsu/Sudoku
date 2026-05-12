export const FAMOUS_BESTS_KEY = "sana-sudoku-famous-bests-v1";

export const FAMOUS_PUZZLES = [
  {
    id: "ai-escargot",
    name: { ru: "AI Escargot", en: "AI Escargot", kk: "AI Escargot" },
    setter: "Arto Inkala",
    year: 2006,
    difficulty: "impossible",
    tagline: {
      ru: "Снаряженная улитка финского математика — первая «самая сложная в мире».",
      en: "The Finnish mathematician's snail-shaped puzzle — the first \"world's hardest\".",
      kk: "Финн математигінің ұлулы тақырыбы — әлемдегі алғашқы «ең қиыны».",
    },
    story: {
      ru: "В ноябре 2006 года Арто Инкала опубликовал AI Escargot и заявил, что он сложнее всего, что встречалось в газетах. Решающему предлагается удерживать в голове до восьми логических связей одновременно — против одной-двух у самых хитрых публичных партий того времени.",
      en: "In November 2006 Arto Inkala released AI Escargot and claimed it was harder than anything in the newspapers. The solver must hold up to eight simultaneous logical relationships in mind — versus one or two for the trickiest public puzzles of the era.",
      kk: "2006 жылдың қарашасында Арто Инкала AI Escargot-ты жариялап, оны газеттердегі кез келген тақырыптан қиынырақ деп мәлімдеді. Шешуші бір уақытта сегізге дейін логикалық байланысты ұстап тұруы керек — сол кездегі ең қиын ашық тақырыптарда бір-екі ғана.",
    },
    highlights: [
      {
        who: "Arto Inkala",
        year: 2006,
        note: { ru: "Создал и опубликовал", en: "Designed and published", kk: "Жасап шығарды" },
      },
      {
        who: { ru: "Газеты по всему миру", en: "Newspapers worldwide", kk: "Әлемдік газеттер" },
        year: 2006,
        note: { ru: "Перепечатали как «самая сложная в мире»", en: "Reprinted as \"world's hardest\"", kk: "«Әлемдегі ең қиыны» деп қайта басып шығарды" },
      },
    ],
    puzzle: [1, 0, 0, 0, 0, 7, 0, 9, 0, 0, 3, 0, 0, 2, 0, 0, 0, 8, 0, 0, 9, 6, 0, 0, 5, 0, 0, 0, 0, 5, 3, 0, 0, 9, 0, 0, 0, 1, 0, 0, 8, 0, 0, 0, 2, 6, 0, 0, 0, 0, 4, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 1, 0, 0, 4, 0, 0, 0, 0, 0, 0, 7, 0, 0, 7, 0, 0, 0, 3, 0, 0],
    solution: [1, 6, 2, 8, 5, 7, 4, 9, 3, 5, 3, 4, 1, 2, 9, 6, 7, 8, 7, 8, 9, 6, 4, 3, 5, 2, 1, 4, 7, 5, 3, 1, 2, 9, 8, 6, 9, 1, 3, 5, 8, 6, 7, 4, 2, 6, 2, 8, 7, 9, 4, 1, 3, 5, 3, 5, 6, 4, 7, 8, 2, 1, 9, 2, 4, 1, 9, 3, 5, 8, 6, 7, 8, 9, 7, 2, 6, 1, 3, 5, 4],
  },
  {
    id: "inkala-2012",
    name: {
      ru: "«Эверест» Арто Инкала",
      en: "Arto Inkala's \"Everest\"",
      kk: "Арто Инкаланың «Эвересті»",
    },
    setter: "Arto Inkala",
    year: 2012,
    difficulty: "impossible",
    tagline: {
      ru: "Версия 2012 года, опубликованная в The Telegraph и оценённая Инкалой на 11 из 5.",
      en: "The 2012 version published by The Telegraph, rated 11 out of 5 by Inkala himself.",
      kk: "The Telegraph 2012 жылғы нұсқасы — Инкала 5-тен 11-ге бағалаған.",
    },
    story: {
      ru: "Шесть лет спустя Инкала опубликовал ещё более тяжёлую сетку. Газеты The Telegraph, Metro и Indian Express подхватили её как «решаемую только самыми острыми умами». В рейтинге SudokuWiki она занимает третье место среди самых сложных известных партий.",
      en: "Six years later Inkala released an even tougher grid. The Telegraph, Metro and Indian Express ran it as \"solvable only by the sharpest minds\". On SudokuWiki's leaderboard it sits third among the hardest puzzles ever published.",
      kk: "Алты жылдан кейін Инкала одан да күрделі торды жариялады. The Telegraph, Metro мен Indian Express оны «тек ең өткір ақылдар шеше алатын» деп таратты. SudokuWiki рейтингінде ол ең қиын тақырыптардың үшіншісінде тұр.",
    },
    highlights: [
      {
        who: "Arto Inkala",
        year: 2012,
        note: { ru: "Сложность: 11 из 5", en: "Self-rated 11 out of 5", kk: "5-тен 11 деп бағалады" },
      },
      {
        who: "The Telegraph",
        year: 2012,
        note: { ru: "Опубликовала впервые", en: "First publication", kk: "Алғаш жариялады" },
      },
    ],
    puzzle: [8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 6, 0, 0, 0, 0, 0, 0, 7, 0, 0, 9, 0, 2, 0, 0, 0, 5, 0, 0, 0, 7, 0, 0, 0, 0, 0, 0, 0, 4, 5, 7, 0, 0, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 0, 6, 8, 0, 0, 8, 5, 0, 0, 0, 1, 0, 0, 9, 0, 0, 0, 0, 4, 0, 0],
    solution: [8, 1, 2, 7, 5, 3, 6, 4, 9, 9, 4, 3, 6, 8, 2, 1, 7, 5, 6, 7, 5, 4, 9, 1, 2, 8, 3, 1, 5, 4, 2, 3, 7, 8, 9, 6, 3, 6, 9, 8, 4, 5, 7, 2, 1, 2, 8, 7, 1, 6, 9, 5, 3, 4, 5, 2, 1, 9, 7, 4, 3, 6, 8, 4, 3, 8, 5, 2, 6, 9, 1, 7, 7, 9, 6, 3, 1, 8, 4, 5, 2],
  },
  {
    id: "golden-nugget",
    name: { ru: "Golden Nugget", en: "Golden Nugget", kk: "Golden Nugget" },
    setter: "Tarek (enjoysudoku.com)",
    year: 2007,
    difficulty: "impossible",
    tagline: {
      ru: "21-подсказочный «золотой самородок» Тарика — на пять кругов сильнейших цепочек.",
      en: "Tarek's 21-clue \"golden nugget\" — five passes of the deepest forcing chains.",
      kk: "Тарик жасаған 21 кеңесті «алтын кесек» — ең тереңдеген тізбектердің бес айналымы.",
    },
    story: {
      ru: "Опубликован пользователем Tarek на форуме Sudoku Forums в январе 2007 года. Многие источники называют его самым сложным судоку в истории: Sudoku Snake требует пяти прогонов техники Dynamic Unit Nested Forcing Chains II, чтобы добраться до решения.",
      en: "Posted by user Tarek on the Sudoku Forums in January 2007. Many sources still rank it as the world's hardest sudoku — Sudoku Snake needs five passes of Dynamic Unit Nested Forcing Chains II to crack it.",
      kk: "2007 жылдың қаңтарында Tarek деген қолданушы Sudoku Forums форумында жариялады. Көптеген дереккөздер оны әлемдегі ең қиын деп санайды: Sudoku Snake шешу үшін Dynamic Unit Nested Forcing Chains II әдісінің бес айналымы керек.",
    },
    highlights: [
      {
        who: "Tarek",
        year: 2007,
        note: { ru: "Опубликовал на enjoysudoku.com", en: "Posted on enjoysudoku.com", kk: "enjoysudoku.com-да жариялады" },
      },
      {
        who: "Sudoku Snake",
        note: { ru: "Описал технику разбора", en: "Documented the solve route", kk: "Шешу әдісін сипаттады" },
      },
    ],
    puzzle: [0, 0, 0, 0, 0, 0, 0, 3, 9, 0, 0, 0, 0, 1, 0, 0, 0, 5, 0, 0, 3, 0, 0, 5, 8, 0, 0, 0, 0, 8, 0, 0, 9, 0, 0, 6, 0, 7, 0, 0, 2, 0, 0, 0, 0, 1, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 9, 0, 0, 8, 0, 5, 0, 0, 2, 0, 0, 0, 0, 6, 0, 0, 4, 0, 0, 7, 0, 0, 0, 0, 0],
    solution: [7, 5, 1, 8, 6, 4, 2, 3, 9, 8, 9, 2, 3, 1, 7, 4, 6, 5, 6, 4, 3, 2, 9, 5, 8, 7, 1, 2, 3, 8, 1, 7, 9, 5, 4, 6, 9, 7, 4, 5, 2, 6, 3, 1, 8, 1, 6, 5, 4, 8, 3, 9, 2, 7, 3, 1, 9, 6, 4, 8, 7, 5, 2, 5, 2, 7, 9, 3, 1, 6, 8, 4, 4, 8, 6, 7, 5, 2, 1, 9, 3],
  },
  {
    id: "easter-monster",
    name: { ru: "Easter Monster", en: "Easter Monster", kk: "Easter Monster" },
    setter: "JPF (enjoysudoku.com)",
    year: 2007,
    difficulty: "impossible",
    tagline: {
      ru: "Пасхальный монстр JPF, вдохновивший новые техники Naked/Hidden Double Loops.",
      en: "JPF's Easter Monster — the puzzle that inspired Naked & Hidden Double Loops.",
      kk: "JPF-тің Easter Monster-і — Naked/Hidden Double Loops техникаларын тудырған тақырып.",
    },
    story: {
      ru: "Опубликован пользователем JPF в апреле 2007 года и моментально получил статус одного из сложнейших судоку. Изучая его, исследователи Sudoku Snake придумали техники Naked Double Loops и Hidden Double Loops — без них даже современные движки буксуют.",
      en: "Posted by JPF in April 2007, it was hailed as one of the hardest sudoku ever. While studying it, the Sudoku Snake team invented Naked Double Loops and Hidden Double Loops — without those, even modern engines stall.",
      kk: "2007 жылдың сәуірінде JPF жариялады, бірден ең қиындардың бірі деп танылды. Оны зерттеу барысында Sudoku Snake командасы Naked Double Loops және Hidden Double Loops техникаларын тапты — оларсыз заманауи қозғалтқыштардың өзі тоқтайды.",
    },
    highlights: [
      {
        who: "JPF",
        year: 2007,
        note: { ru: "Создал на пасхальной неделе", en: "Posted during Easter week", kk: "Пасха аптасында жариялады" },
      },
      {
        who: "Sudoku Snake",
        year: 2007,
        note: { ru: "Открыл новые техники из-за этой партии", en: "New techniques discovered while solving it", kk: "Осы тақырыпты шешу үшін жаңа техникалар ашты" },
      },
    ],
    puzzle: [1, 0, 0, 0, 0, 0, 0, 0, 2, 0, 9, 0, 4, 0, 0, 0, 5, 0, 0, 0, 6, 0, 0, 0, 7, 0, 0, 0, 5, 0, 9, 0, 3, 0, 0, 0, 0, 0, 0, 0, 7, 0, 0, 0, 0, 0, 0, 0, 8, 5, 0, 0, 4, 0, 7, 0, 0, 0, 0, 0, 6, 0, 0, 0, 3, 0, 0, 0, 9, 0, 8, 0, 0, 0, 2, 0, 0, 0, 0, 0, 1],
    solution: [1, 7, 4, 3, 8, 5, 9, 6, 2, 2, 9, 3, 4, 6, 7, 1, 5, 8, 5, 8, 6, 1, 9, 2, 7, 3, 4, 4, 5, 1, 9, 2, 3, 8, 7, 6, 9, 2, 8, 6, 7, 4, 3, 1, 5, 3, 6, 7, 8, 5, 1, 2, 4, 9, 7, 1, 9, 5, 4, 8, 6, 2, 3, 6, 3, 5, 2, 1, 9, 4, 8, 7, 8, 4, 2, 7, 3, 6, 5, 9, 1],
  },
  {
    id: "platinum-blonde",
    name: { ru: "Platinum Blonde", en: "Platinum Blonde", kk: "Platinum Blonde" },
    setter: "gsf (enjoysudoku.com)",
    year: 2007,
    difficulty: "impossible",
    tagline: {
      ru: "Эталонная задача в исследованиях сложности — на «шкале Рихтера» судоку 3.5789.",
      en: "A research benchmark — sits at 3.5789 on the sudoku \"Richter scale\" of difficulty.",
      kk: "Зерттеу эталоны — судокудың «Рихтер шкаласында» 3.5789 баға алады.",
    },
    story: {
      ru: "Также известна как gsf's sudoku q1 в наборе бенчмарков enjoysudoku. В 2012 году Эрчей-Раваж и Тороцкаи использовали её, чтобы построить математическую «шкалу Рихтера» сложности судоку: Platinum Blonde решается примерно в десять раз дольше «лёгких» партий из-за хаотичного движения по пространству состояний.",
      en: "Also known as gsf's sudoku q1 in the enjoysudoku benchmark set. In 2012 Ercsey-Ravasz and Toroczkai used it to build a mathematical \"Richter scale\" of sudoku difficulty: Platinum Blonde takes about ten times longer than easy puzzles because of chaotic motion through state space.",
      kk: "enjoysudoku эталондық жинағында gsf's sudoku q1 ретінде белгілі. 2012 жылы Ercsey-Ravasz пен Toroczkai оны судоку қиындығының математикалық «Рихтер шкаласын» жасау үшін пайдаланды: Platinum Blonde күй кеңістігіндегі хаосты жүрістерінің кесірінен жеңіл тақырыптарға қарағанда шамамен он есе көп уақыт алады.",
    },
    highlights: [
      {
        who: "gsf",
        year: 2007,
        note: { ru: "Опубликовал в наборе q1", en: "Released in the q1 benchmark set", kk: "q1 эталондық жинағында жариялады" },
      },
      {
        who: { ru: "Эрчей-Раваж и Тороцкаи", en: "Ercsey-Ravasz & Toroczkai", kk: "Ercsey-Ravasz пен Toroczkai" },
        year: 2012,
        note: { ru: "Использовали для шкалы сложности", en: "Used to build the difficulty scale", kk: "Қиындық шкаласын жасау үшін қолданды" },
      },
    ],
    puzzle: [0, 0, 0, 0, 0, 0, 0, 1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 2, 3, 0, 0, 4, 0, 0, 0, 0, 1, 8, 0, 0, 0, 0, 5, 0, 6, 0, 0, 7, 0, 8, 0, 0, 0, 0, 0, 0, 0, 9, 0, 0, 0, 0, 0, 8, 5, 0, 0, 0, 0, 0, 9, 0, 0, 0, 4, 0, 5, 0, 0, 4, 7, 0, 0, 0, 6, 0, 0, 0],
    solution: [8, 3, 9, 4, 6, 5, 7, 1, 2, 1, 4, 6, 7, 8, 2, 9, 5, 3, 7, 5, 2, 3, 9, 1, 4, 8, 6, 3, 9, 1, 8, 2, 4, 6, 7, 5, 5, 6, 4, 1, 7, 3, 8, 2, 9, 2, 8, 7, 6, 5, 9, 3, 4, 1, 6, 2, 8, 5, 3, 7, 1, 9, 4, 9, 1, 3, 2, 4, 8, 5, 6, 7, 4, 7, 5, 9, 1, 6, 2, 3, 8],
  },
  {
    id: "royle-17-first",
    name: {
      ru: "Первая 17-подсказочная",
      en: "The first 17-clue puzzle",
      kk: "Алғашқы 17 кеңесті тақырып",
    },
    setter: "Gordon Royle (collection)",
    year: 2005,
    difficulty: "expert",
    tagline: {
      ru: "Минимум информации, доказанный математиками: 17 подсказок — нижняя граница уникального судоку.",
      en: "Mathematically proven minimum: 17 clues is the floor for a uniquely solvable sudoku.",
      kk: "Математикалық дәлелденген минимум: 17 кеңес — бір ғана шешімі бар судокуның төменгі шегі.",
    },
    story: {
      ru: "Гордон Ройл из Университета Западной Австралии много лет собирал коллекцию судоку с 17 подсказками. В 2012 году Гари Магуайр, Бастиан Тугеманн и Жиль Чиварио доказали, что меньшего количества подсказок для уникального решения не бывает. Эта партия — первая запись в каталоге Ройла.",
      en: "Gordon Royle of the University of Western Australia spent years cataloguing 17-clue sudokus. In 2012 Gary McGuire, Bastian Tugemann and Gilles Civario proved that no 16-clue puzzle with a unique solution exists. This board is the first entry in Royle's catalogue.",
      kk: "Батыс Австралия университетінің Гордон Ройл 17 кеңесті судокулар жинағын жылдар бойы құрастырды. 2012 жылы Гари МакГайр, Бастиан Тугеманн және Жиль Чиварио бір ғана шешімі бар 16 кеңесті судоку жоқ екенін дәлелдеді. Бұл тақырып — Ройл каталогындағы алғашқы жазба.",
    },
    highlights: [
      {
        who: "Gordon Royle",
        note: { ru: "Каталогизировал 49 151 семейство", en: "Catalogued 49,151 distinct families", kk: "49 151 ерекше отбасын каталогтады" },
      },
      {
        who: { ru: "МакГайр, Тугеманн, Чиварио", en: "McGuire, Tugemann, Civario", kk: "МакГайр, Тугеманн, Чиварио" },
        year: 2012,
        note: { ru: "Доказали, что 17 — минимум", en: "Proved 17 is the minimum", kk: "17 — минимум екенін дәлелдеді" },
      },
    ],
    puzzle: [0, 0, 0, 0, 0, 0, 0, 1, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 4, 0, 7, 0, 0, 8, 0, 0, 0, 3, 0, 0, 0, 0, 1, 0, 9, 0, 0, 0, 0, 3, 0, 0, 4, 0, 0, 2, 0, 0, 0, 5, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 6, 0, 0, 0],
    solution: [6, 9, 3, 7, 8, 4, 5, 1, 2, 4, 8, 7, 5, 1, 2, 9, 3, 6, 1, 2, 5, 9, 6, 3, 8, 7, 4, 9, 3, 2, 6, 5, 1, 4, 8, 7, 5, 6, 8, 2, 4, 7, 3, 9, 1, 7, 4, 1, 3, 9, 8, 6, 2, 5, 3, 1, 9, 4, 7, 5, 2, 6, 8, 8, 5, 6, 1, 2, 9, 7, 4, 3, 2, 7, 4, 8, 3, 6, 1, 5, 9],
  },
  {
    id: "silver-plate",
    name: { ru: "Silver Plate", en: "Silver Plate", kk: "Silver Plate" },
    setter: "Community (.sdk / enjoysudoku)",
    year: 2008,
    difficulty: "impossible",
    tagline: {
      ru: "Симметричный эталон для «очень глубоких» цепочек ограничений.",
      en: "A symmetrical benchmark famous for very deep constraint-pair chains.",
      kk: "Шектеу жұптарының терең тізбектері үшін белгілі симметриялы эталон.",
    },
    story: {
      ru: "Партия Silver Plate годами фигурирует в тестах солверов и в разборе пар кандидатов: её симметричные «уши» и центральный блок 62 заставляют движки раскручивать длинные логические цепи. На sw-amt.ws и в обсуждениях Enjoy Sudoku она отмечена как уровень very deep — хорошая проверка техники после Golden Nugget и Easter Monster.",
      en: "Silver Plate has long been a stress test for engines and constraint-pair analysis: mirrored “ears” and the central 62 pattern force long logical chains before the grid unlocks. Analysts tag it as very deep in public benchmark sets — a natural next boss after Golden Nugget or Easter Monster.",
      kk: "Silver Plate жылдар бойы шешуші бағдарламалар мен шектеу жұптарын талдау үшін сынақ ретінде қолданылады: симметриялы «құлақтар» мен орталық 62 үлгісі тор ашылмас бұрын ұзын логикалық тізбектерді талап етеді. Ашық эталондарда very deep деп белгіленеді — Golden Nugget немесе Easter Monster кейінгі қадам.",
    },
    highlights: [
      {
        who: { ru: "Сообщество Enjoy Sudoku", en: "Enjoy Sudoku community", kk: "Enjoy Sudoku қауымдастығы" },
        year: 2008,
        note: { ru: "Распространяла .sdk-эталон", en: "Circulated the .sdk benchmark", kk: ".sdk эталонын таратты" },
      },
      {
        who: "sw-amt.ws",
        note: { ru: "Классифицировала как very deep", en: "Classified as very deep analysis", kk: "Very deep талдауы деп сипаттады" },
      },
    ],
    puzzle: [1, 0, 0, 0, 0, 0, 0, 0, 7, 0, 2, 0, 4, 0, 0, 0, 6, 0, 0, 0, 3, 0, 0, 0, 5, 0, 0, 0, 9, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 6, 2, 0, 4, 0, 0, 0, 0, 9, 0, 0, 8, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 3, 0, 6, 0, 2, 0, 0, 0, 8, 0, 7, 0, 0, 0, 0, 1, 0, 0, 0],
    solution: [1, 5, 9, 8, 2, 6, 4, 3, 7, 8, 2, 7, 4, 5, 3, 9, 6, 1, 6, 4, 3, 7, 1, 9, 5, 2, 8, 2, 9, 1, 3, 4, 8, 7, 5, 6, 5, 7, 8, 1, 6, 2, 3, 4, 9, 4, 3, 6, 9, 7, 5, 8, 1, 2, 9, 1, 5, 6, 8, 4, 2, 7, 3, 3, 6, 4, 2, 9, 7, 1, 8, 5, 7, 8, 2, 5, 3, 1, 6, 9, 4],
  },
  {
    id: "coly013",
    name: { ru: "Coly013", en: "Coly013", kk: "Coly013" },
    setter: "Coly series (enjoysudoku.com)",
    year: 2010,
    difficulty: "impossible",
    tagline: {
      ru: "Форумный эталон Coly — плотные кластеры и «очень глубокий» уровень.",
      en: "A Coly-series forum benchmark: tight clue clusters and very deep rating.",
      kk: "Coly форумдық сериясының эталоны: тығыз кеңестер мен very deep деңгей.",
    },
    story: {
      ru: "Серия Coly получила имя от пользовательских паттернов на Enjoy Sudoku: эти сетки специально подбирали, чтобы ломать простые эвристики и требовать многоступенчатых цепочек. Coly013 входит в подборки «very deep» на открытых таблицах сложности и остаётся любимой проверкой для тех, кто уже освоил классику уровня Golden Nugget.",
      en: "The Coly puzzles are named after pattern challenges on Enjoy Sudoku: they were engineered to break naive heuristics and demand multi-stage chains. Coly013 shows up in public very-deep tables and is a favourite follow-up once Golden Nugget no longer feels impossible.",
      kk: "Coly тақырыптары Enjoy Sudokuдағы үлгі челлендждерінен ата алған: қарапайым эвристикаларды сындырып, көп сатылы тізбектерді талап етеді. Coly013 ашық very deep кестелерінде кездеседі және Golden Nugget қиындықсыз болғанда келесі сынақ болып табылады.",
    },
    highlights: [
      {
        who: { ru: "Enjoy Sudoku", en: "Enjoy Sudoku", kk: "Enjoy Sudoku" },
        year: 2010,
        note: { ru: "Серия Coly", en: "Coly pattern lineage", kk: "Coly үлгі сериясы" },
      },
      {
        who: "sw-amt.ws",
        note: { ru: "Отмечена как very deep", en: "Logged as very deep", kk: "Very deep деп тіркелген" },
      },
    ],
    puzzle: [0, 0, 0, 0, 9, 0, 0, 5, 0, 0, 1, 0, 0, 0, 0, 0, 3, 0, 0, 0, 2, 3, 0, 0, 7, 0, 0, 0, 0, 4, 5, 0, 0, 0, 7, 0, 8, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 6, 4, 0, 0, 0, 9, 0, 0, 1, 0, 0, 0, 0, 0, 8, 0, 0, 6, 0, 0, 0, 0, 0, 0, 5, 4, 0, 0, 0, 0, 7],
    solution: [7, 4, 3, 8, 9, 2, 1, 5, 6, 5, 1, 8, 6, 4, 7, 9, 3, 2, 9, 6, 2, 3, 5, 1, 7, 4, 8, 6, 2, 4, 5, 8, 9, 3, 7, 1, 8, 7, 9, 1, 3, 4, 2, 6, 5, 3, 5, 1, 2, 7, 6, 4, 8, 9, 4, 9, 6, 7, 1, 5, 8, 2, 3, 2, 8, 7, 9, 6, 3, 5, 1, 4, 1, 3, 5, 4, 2, 8, 6, 9, 7],
  },
  {
    id: "coly007",
    name: { ru: "Coly007", en: "Coly007", kk: "Coly007" },
    setter: "Coly series (enjoysudoku.com)",
    year: 2010,
    difficulty: "impossible",
    tagline: {
      ru: "Ещё один «Coly» — жёсткие блоки и длинные цепи без подсказок.",
      en: "Another Coly benchmark: rigid blocks and long chains with few giveaways.",
      kk: "Тағы бір Coly эталоны: қатты блоктар, аз кеңес, ұзын тізбектер.",
    },
    story: {
      ru: "Coly007 делит с Coly013 одну идею — сжать подсказки так, чтобы даже сильные игроки ловили тупики на простых ходах. В открытых таблицах её помечают тем же very deep классом; для тренировки удобно сравнивать две партии подряд и смотреть, как меняется ваш темп.",
      en: "Coly007 shares the Coly design goal: compress clues until even strong solvers stall on “obvious” moves. Public benchmark tables file it alongside other very deep Coly boards — try it back-to-back with Coly013 to feel how your pacing changes.",
      kk: "Coly007 Coly идеясын бөліседі: кеңестерді сығып, тәжірбиелі шешушілердің өзі «айқын» жүрістерде тоқтай қалуы мүмкін. Ашық кестелерде оны басқа very deep Coly тақырыптарымен бірге көрсетеді — Coly013-пен қатар шешіп, қарқыныңыз қалай өзгеретінін байқаңыз.",
    },
    highlights: [
      {
        who: { ru: "Coly lineage", en: "Coly lineage", kk: "Coly сериясы" },
        year: 2010,
        note: { ru: "Паттерн-челлендж", en: "Pattern-game lineage", kk: "Паттерн ойыны" },
      },
      {
        who: "sw-amt.ws",
        note: { ru: "Very deep класс", en: "Very deep tier", kk: "Very deep деңгей" },
      },
    ],
    puzzle: [0, 0, 0, 2, 0, 0, 0, 0, 8, 7, 0, 0, 0, 0, 0, 0, 0, 9, 0, 0, 3, 0, 9, 0, 5, 0, 0, 0, 0, 8, 0, 3, 0, 0, 0, 5, 1, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 4, 0, 0, 6, 0, 0, 0, 0, 6, 0, 8, 0, 0, 5, 0, 0, 7, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 0, 4, 0, 0, 0],
    solution: [9, 6, 5, 2, 4, 3, 7, 1, 8, 7, 8, 2, 5, 1, 6, 4, 3, 9, 4, 1, 3, 7, 9, 8, 5, 2, 6, 6, 2, 8, 1, 3, 7, 9, 4, 5, 1, 9, 4, 8, 6, 5, 3, 7, 2, 5, 3, 7, 4, 2, 9, 6, 8, 1, 3, 4, 6, 9, 8, 2, 1, 5, 7, 8, 7, 9, 3, 5, 1, 2, 6, 4, 2, 5, 1, 6, 7, 4, 8, 9, 3],
  },
  {
    id: "sudoku-explainer-eleven",
    name: {
      ru: "Эталон Sudoku Explainer 11.x",
      en: "Sudoku Explainer 11.x benchmark",
      kk: "Sudoku Explainer 11.x эталоны",
    },
    setter: "SE / forum benchmark",
    year: 2009,
    difficulty: "impossible",
    tagline: {
      ru: "Сетка, которую классический SE оценивает выше «десяти» по шкале сложности.",
      en: "A grid the classic Sudoku Explainer rates beyond “10” on its difficulty scale.",
      kk: "Классикалық Sudoku Explainer қиындығын 10-нан жоғары бағалайтын тор.",
    },
    story: {
      ru: "Sudoku Explainer ввёл привычную шкалу «до 11» для экстремальных задач: такие партии требуют редких стратегий и аккуратного учёта кандидатов. Этот эталон часто всплывает в обсуждениях софта и в подборках eleven-te2 — отличный мост между «газетным мастером» и монстрами вроде Golden Nugget.",
      en: "Sudoku Explainer popularised the “turn it up to 11” meme for puzzles that need rare tactics and careful pencil marks. This benchmark often appears in eleven-te2 collections — a bridge between newspaper masters and monsters like Golden Nugget.",
      kk: "Sudoku Explainer сирек тактикалар мен кандидаттарды мұқият есептеуді талап ететін тақырыптар үшін «11-ге дейін» шкаласын танымал етті. Бұл эталон eleven-te2 жинақтарында жиі кездеседі — газеттік деңгей мен Golden Nugget сияқты «монстрлар» арасындағы көпір.",
    },
    highlights: [
      {
        who: "Sudoku Explainer",
        year: 2009,
        note: { ru: "Шкала сложности SE", en: "SE difficulty metric", kk: "SE қиындық метрикасы" },
      },
      {
        who: { ru: "Форумные подборки eleven", en: "Forum eleven-te2 sets", kk: "Форумдық eleven-te2 жинақтары" },
        note: { ru: "Сохраняют эталон", en: "Archive the puzzle", kk: "Тақырыпты сақтайды" },
      },
    ],
    puzzle: [0, 0, 0, 0, 0, 6, 7, 0, 0, 0, 5, 0, 1, 0, 0, 0, 3, 0, 0, 0, 0, 0, 3, 0, 0, 0, 4, 0, 0, 8, 0, 0, 4, 0, 0, 0, 3, 0, 0, 5, 2, 0, 0, 0, 0, 0, 9, 0, 0, 1, 0, 0, 2, 0, 7, 0, 0, 0, 0, 0, 6, 0, 0, 0, 3, 0, 9, 0, 0, 0, 1, 0, 0, 0, 5, 0, 0, 0, 0, 0, 8],
    solution: [1, 2, 3, 4, 5, 6, 7, 8, 9, 4, 5, 7, 1, 8, 9, 2, 3, 6, 6, 8, 9, 7, 3, 2, 1, 5, 4, 2, 7, 8, 3, 9, 4, 5, 6, 1, 3, 6, 1, 5, 2, 8, 9, 4, 7, 5, 9, 4, 6, 1, 7, 8, 2, 3, 7, 1, 2, 8, 4, 3, 6, 9, 5, 8, 3, 6, 9, 7, 5, 4, 1, 2, 9, 4, 5, 2, 6, 1, 3, 7, 8],
  },
  {
    id: "tarek-ultra-0339",
    name: {
      ru: "Tarek Ultra #0339",
      en: "Tarek Ultra #0339",
      kk: "Tarek Ultra #0339",
    },
    setter: "Tarek (patterns / enjoysudoku)",
    year: 2008,
    difficulty: "impossible",
    tagline: {
      ru: "Ещё один ультра-сет от Тарика — рядом с Golden Nugget по духу.",
      en: "Another Tarek ultra pattern puzzle in the spirit of Golden Nugget.",
      kk: "Golden Nugget рухындағы Тариктың тағы бір ультра үлгісі.",
    },
    story: {
      ru: "Тот же Tarek, что подарил Golden Nugget, выкладывал целую линейку «ultra» сеток для любителей экстремальной логики. Эта партия из открытых ph-/ultra подборок сохраняет фирменный минимализм подсказок и заставляет работать цепочками, а не угадыванием.",
      en: "The same Tarek behind Golden Nugget published a whole family of ultra pattern boards for extremal logic fans. Pulled from open ph-/ultra archives, this one keeps the trademark sparse clues and insists on chains instead of guessing.",
      kk: "Golden Nugget артындағы Tarek экстремалды логика сүйерлер үшін ultra үлгілер сериясын жариялаған. Ашық ph-/ultra мұрағатынан алынған бұл тақырып сирек кеңестерді сақтайды және болжам емес, тізбектерді талап етеді.",
    },
    highlights: [
      {
        who: "Tarek",
        year: 2008,
        note: { ru: "Ultra-паттерны", en: "Ultra pattern set", kk: "Ultra үлгілер жинағы" },
      },
      {
        who: { ru: "Открытые ph-архивы", en: "Open ph archives", kk: "Ашық ph мұрағаттары" },
        note: { ru: "Сохраняют номер #0339", en: "Catalogued as #0339", kk: "#0339 ретінде каталогталған" },
      },
    ],
    puzzle: [0, 0, 0, 0, 0, 3, 0, 0, 2, 7, 0, 0, 0, 9, 0, 0, 6, 0, 0, 0, 0, 5, 0, 0, 4, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 5, 0, 0, 1, 0, 6, 0, 0, 9, 0, 0, 0, 0, 0, 0, 4, 3, 0, 0, 8, 0, 5, 0, 1, 0, 0, 0, 0, 1, 6, 0, 0, 0, 0, 0, 0, 0, 0, 9, 7, 0, 0, 0, 0, 8, 0],
    solution: [4, 1, 8, 6, 7, 3, 9, 5, 2, 7, 5, 2, 4, 9, 8, 1, 6, 3, 9, 3, 6, 5, 2, 1, 4, 7, 8, 6, 8, 4, 2, 3, 9, 7, 1, 5, 3, 2, 1, 7, 6, 5, 8, 9, 4, 5, 7, 9, 1, 8, 4, 3, 2, 6, 8, 4, 5, 9, 1, 2, 6, 3, 7, 1, 6, 3, 8, 5, 7, 2, 4, 9, 2, 9, 7, 3, 4, 6, 5, 8, 1],
  },
];

export function getFamousPuzzleById(id) {
  return FAMOUS_PUZZLES.find((entry) => entry.id === id) || null;
}

let memoryStore = null;

function readRawBests() {
  if (typeof localStorage !== "undefined" && localStorage) {
    try {
      const raw = localStorage.getItem(FAMOUS_BESTS_KEY);
      if (raw) return raw;
    } catch {
      // fall through to memory store
    }
  }
  return memoryStore;
}

function writeRawBests(serialized) {
  memoryStore = serialized;
  if (typeof localStorage !== "undefined" && localStorage) {
    try {
      localStorage.setItem(FAMOUS_BESTS_KEY, serialized);
    } catch {
      // ignore quota / privacy errors; memory copy still holds
    }
  }
}

export function loadFamousBests() {
  const raw = readRawBests();
  if (!raw) return {};
  try {
    const data = JSON.parse(raw);
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

export function saveFamousBests(bests) {
  writeRawBests(JSON.stringify(bests || {}));
}

export function recordFamousBest(id, entry) {
  if (!id || !entry || !Number.isFinite(entry.seconds)) return loadFamousBests();
  const current = loadFamousBests();
  const existing = current[id];
  if (!existing || entry.seconds < existing.seconds) {
    const next = {
      ...current,
      [id]: {
        seconds: entry.seconds,
        completedAt: entry.completedAt ?? Date.now(),
        mistakes: entry.mistakes ?? 0,
        hintsUsed: entry.hintsUsed ?? 0,
      },
    };
    saveFamousBests(next);
    return next;
  }
  return current;
}

export function mergeFamousBests(local, remote) {
  const out = { ...(local || {}) };
  for (const [id, entry] of Object.entries(remote || {})) {
    if (!entry || !Number.isFinite(entry.seconds)) continue;
    const existing = out[id];
    if (!existing || entry.seconds < existing.seconds) {
      out[id] = {
        seconds: entry.seconds,
        completedAt: entry.completedAt ?? null,
        mistakes: entry.mistakes ?? 0,
        hintsUsed: entry.hintsUsed ?? 0,
      };
    }
  }
  return out;
}

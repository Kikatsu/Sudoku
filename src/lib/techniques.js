export const TECHNIQUE_TIERS = ["beginner", "tactician", "master", "expert"];

export const SUDOKU_TECHNIQUES = [
  {
    id: "naked-single",
    name: "Naked Single",
    tier: "beginner",
    summary: {
      ru: "В клетке остался ровно один допустимый кандидат.",
      en: "A cell has exactly one legal candidate left.",
      kk: "Ұяшықта бір ғана мүмкін кандидат қалады.",
    },
    detail: {
      ru: "Проверьте строку, столбец и квадрат выбранной клетки. Если восемь цифр уже запрещены, оставшаяся цифра доказана.",
      en: "Check the selected cell's row, column, and box. If eight digits are already blocked, the remaining digit is proven.",
      kk: "Таңдалған ұяшықтың қатары, бағаны және шаршысын тексеріңіз. Сегіз сан жабылса, қалған сан дәлелденеді.",
    },
    trainer: {
      cells: [1, 2, 3, 4, 5, 6, 7, 8, 0],
      question: {
        ru: "Какая цифра обязана стоять в пустой клетке?",
        en: "Which digit must go in the empty cell?",
        kk: "Бос ұяшыққа қай сан міндетті түрде келеді?",
      },
      answer: 9,
      options: [7, 8, 9],
    },
  },
  {
    id: "hidden-single",
    name: "Hidden Single",
    tier: "beginner",
    summary: {
      ru: "Число может стоять только в одной клетке внутри строки, столбца или квадрата.",
      en: "A digit has only one possible cell inside a row, column, or box.",
      kk: "Сан қатар, баған немесе шаршы ішінде тек бір ұяшыққа ғана келе алады.",
    },
    detail: {
      ru: "Клетка может иметь несколько кандидатов, но для конкретной цифры в зоне остается единственное место.",
      en: "The cell may have several candidates, but one digit has a single home in that unit.",
      kk: "Ұяшықта бірнеше кандидат болуы мүмкін, бірақ бір санға аймақта жалғыз орын қалады.",
    },
    trainer: {
      cells: [0, 0, 6, 0, 8, 0, 0, 0, 0],
      marks: ["1 5", "1 5 9", "", "2 5", "", "2 5", "1 5", "2 5", "2 5"],
      focus: 1,
      question: {
        ru: "Где единственное место для 9 в этой строке?",
        en: "Where is the only place for 9 in this row?",
        kk: "Бұл қатарда 9 санының жалғыз орны қайда?",
      },
      answer: 2,
      options: [1, 2, 8],
      optionLabel: (value) => `C${value}`,
    },
  },
  {
    id: "locked-candidate",
    name: "Locked Candidate",
    tier: "tactician",
    summary: {
      ru: "Кандидаты числа заперты в одной линии внутри квадрата.",
      en: "A digit's candidates are locked into one line inside a box.",
      kk: "Сан кандидаттары шаршы ішінде бір сызыққа бекітіледі.",
    },
    detail: {
      ru: "Если все варианты цифры в квадрате лежат в одной строке, эту цифру можно убрать из остальных клеток той строки вне квадрата.",
      en: "If all candidates for a digit in a box sit on one row, remove that digit from the rest of that row outside the box.",
      kk: "Егер шаршыдағы сан нұсқалары бір қатарда болса, сол қатардың шаршыдан тыс бөлігінен санды алып тастауға болады.",
    },
    trainer: {
      cells: [0, 0, 0, 4, 6, 0, 0, 0, 0],
      marks: ["7", "7", "7", "", "", "2 7", "1 3", "1 3", "1 3"],
      focus: 5,
      question: {
        ru: "Какой кандидат можно убрать из C6?",
        en: "Which candidate can be removed from C6?",
        kk: "C6 ұяшығынан қай кандидатты алып тастауға болады?",
      },
      answer: 7,
      options: [2, 6, 7],
    },
  },
  {
    id: "naked-pair",
    name: "Naked Pair",
    tier: "master",
    summary: {
      ru: "Две клетки в одной зоне содержат одну и ту же пару кандидатов.",
      en: "Two cells in one unit contain the same two candidates.",
      kk: "Бір аймақтағы екі ұяшықта бірдей екі кандидат болады.",
    },
    detail: {
      ru: "Если две клетки могут быть только {2,7}, эти две цифры заняты парой и удаляются из остальных клеток зоны.",
      en: "If two cells can only be {2,7}, those digits belong to the pair and can be removed from other cells in the unit.",
      kk: "Екі ұяшық тек {2,7} болса, бұл сандар жұпқа тиесілі және аймақтағы басқа ұяшықтардан алынады.",
    },
    trainer: {
      cells: [0, 0, 0, 4, 5, 6, 8, 9, 0],
      marks: ["2 7", "2 7", "1 2 7", "", "", "", "", "", "1 3"],
      focus: 2,
      question: {
        ru: "Какие кандидаты нужно убрать из C3?",
        en: "Which candidates should be removed from C3?",
        kk: "C3 ұяшығынан қай кандидаттарды алып тастау керек?",
      },
      answer: "2,7",
      options: ["1", "2,7", "3"],
    },
  },
  {
    id: "candidate-scan",
    name: "Candidate Scan",
    tier: "expert",
    summary: {
      ru: "Выбор следующей сильной клетки без угадывания.",
      en: "Choosing the next strong cell without guessing.",
      kk: "Болжамсыз келесі маңызды ұяшықты таңдау.",
    },
    detail: {
      ru: "Сканируйте клетки с меньшим числом кандидатов, затем ищите одиночки, скрытые одиночки или пары вокруг них.",
      en: "Scan low-candidate cells first, then look for singles, hidden singles, or pairs around them.",
      kk: "Алдымен кандидаты аз ұяшықтарды қарап, содан кейін жалғыздар, жасырын жалғыздар немесе жұптарды іздеңіз.",
    },
    trainer: {
      cells: [0, 0, 0, 2, 0, 4, 0, 8, 0],
      marks: ["1 3 5", "1 3", "1 3 5 7", "", "6 9", "", "1 3 5 7", "", "5 7 9"],
      focus: 1,
      question: {
        ru: "С какой клетки лучше начать скан?",
        en: "Which cell is the best scan target?",
        kk: "Сканды қай ұяшықтан бастаған дұрыс?",
      },
      answer: 2,
      options: [1, 2, 3],
      optionLabel: (value) => `C${value}`,
    },
  },
];

export function getTechniqueById(id) {
  return SUDOKU_TECHNIQUES.find((technique) => technique.id === id) || null;
}

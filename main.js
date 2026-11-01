const obsidian = require("obsidian");
const {
  PluginSettingTab,
  Modal,
  Component,
  MarkdownRenderer,
  Notice,
  TFile,
  AbstractInputSuggest,
  addIcon,
  setIcon,
  normalizePath,
  getLanguage,
} = obsidian;

// ───────────── 아이콘 (모바일 툴바 옵션에 보임) ─────────────
const S = 'fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"';
const CAL = `<rect x="14" y="22" width="72" height="64" rx="9" ${S}/><path d="M14 44h72M34 12v18M66 12v18" ${S}/>`;
const ICONS = {
  "growth-stamp-clock": `<circle cx="50" cy="50" r="40" ${S}/><path d="M50 26v26l17 10" ${S}/>`,
  "growth-stamp-calendar": CAL,
  "growth-stamp-calendar-dot": CAL + `<circle cx="50" cy="66" r="6" fill="currentColor"/>`,
  "growth-stamp-calendar-lines": CAL + `<path d="M30 60h40M30 73h24" ${S}/>`,
  "growth-stamp-play": `<circle cx="50" cy="50" r="40" ${S}/><path d="M42 33l26 17-26 17z" ${S}/>`,
  "growth-stamp-stop": `<circle cx="50" cy="50" r="40" ${S}/><rect x="36" y="36" width="28" height="28" rx="4" ${S}/>`,
  "growth-stamp-dice": `<rect x="14" y="14" width="72" height="72" rx="14" ${S}/><g fill="currentColor"><circle cx="34" cy="34" r="5"/><circle cx="66" cy="34" r="5"/><circle cx="50" cy="50" r="5"/><circle cx="34" cy="66" r="5"/><circle cx="66" cy="66" r="5"/></g>`,
  "growth-stamp-sparkle": `<path d="M50 12C54 36 64 46 88 50C64 54 54 64 50 88C46 64 36 54 12 50C36 46 46 36 50 12Z" ${S}/>`,
  "growth-stamp-pencil": `<path d="M20 80l4-16 38-38 12 12-38 38zM56 32l12 12" ${S}/>`,
  "growth-stamp-check": `<rect x="16" y="16" width="68" height="68" rx="12" ${S}/><path d="M32 52l13 13 25-29" ${S}/>`,
  "growth-stamp-hash": `<path d="M38 18L30 82M70 18L62 82M18 38h66M14 62h66" ${S}/>`,
  "growth-stamp-star": `<path d="M50 12l11 26 28 2-22 18 7 28-24-16-24 16 7-28-22-18 28-2z" ${S}/>`,
  "growth-stamp-copy": `<g transform="rotate(35 50 50)"><path d="M38 12h24M50 12v34" ${S}/><path d="M33 46h34v20c0 14-8 24-17 24s-17-10-17-24z" ${S}/></g>`,
  "growth-stamp-sun": `<circle cx="50" cy="50" r="17" ${S}/><path d="M50 10v10M50 80v10M10 50h10M80 50h10M22 22l7 7M71 71l7 7M78 22l-7 7M29 71l-7 7" ${S}/>`,
};
const DATE_ICONS = ["growth-stamp-calendar", "growth-stamp-calendar-dot", "growth-stamp-calendar-lines"];
const PHRASE_ICONS = ["growth-stamp-pencil", "growth-stamp-check", "growth-stamp-hash", "growth-stamp-star"];
// 시작과 끝 입력 형태: 구분 기호, 소요시간 표시 방식
const RANGE_PRESETS = [
  { sep: "~", dur: "text" },
  { sep: "~", dur: "clock" },
  { sep: " → ", dur: "text" },
  { sep: "~", dur: "none" },
];

// ───────────── 문구 (언어 설정에 따라 설명과 예시까지 바뀜) ─────────────
// 설명은 한 줄로 끝나거나, 두 줄이면 둘째 줄이 절반 이상 차도록 길이를 맞춤
const STR = {
  ko: {
    langLabel: "언어 (Language)",
    langDesc: "설명과 예시가 한국어 기준으로 표시돼요.",
    cmdTime: "현재 시간 입력",
    cmdDate: "오늘 날짜 입력",
    cmdAff: "확언 메모 열기",

    timeTitle: "현재 시간",
    timeSub: "누르면 현재 시각이 입력돼요.",
    roundLabel: "반올림 단위",
    roundDesc: "가까운 N분 단위로 시각을 맞춰요. 직접 입력할 때 1을 넣으면 반올림하지 않아요.",
    minutes: "분",
    customShort: "직접 입력",
    formatLabel: "입력 형태",
    formatDesc: "하나 고르거나 아래에서 직접 만드세요.",
    customLabel: "직접 만들기",
    tokenSummary: "사용할 수 있는 기호 보기",
    timeSample: "오늘은 어떤 재미있는 일이 있을까?",
    previewLabel: "미리보기",
    previewRaw: "입력되는 글자 (띄어쓰기 포함)",
    previewRendered: "문서에서 보이는 모습",
    nowRound: (a, n, b) => `지금 ${a} → ${n}분 단위로 ${b}`,
    nowNoRound: (a) => `지금 ${a} (반올림 없음)`,

    dateTitle: "오늘 날짜",
    dateSub: "누르면 오늘 날짜가 입력돼요. 일상용, 자기계발용처럼 형태가 다른 버튼을 여러 개 만들 수 있어요.",
    dateCard: (n) => `날짜 버튼 ${n}`,
    nameLabel: "버튼 이름",
    nameDesc: "툴바에 올릴 때 구분할 이름이에요.",
    namePh: "예) 요일 포함, 기울임",
    dateFormatLabel: "날짜 형태",
    dateSample: "화장실 청소",
    iconLabel: "아이콘",
    iconDesc: "툴바에 보일 모양이에요.",
    remove: "삭제",
    cancel: "취소",
    removeTitle: (name) => `'${name}' 버튼을 삭제할까요?`,
    removeDesc: "이 버튼의 설정이 사라져요.",
    addDate: "＋ 날짜 버튼 추가",
    addDateDesc: "형태가 다른 날짜 버튼을 하나 더 만들어요. 툴바 옵션의 명령 목록에 바로 나타나요.",

    affTitle: "내 확언",
    affSub: "메모를 열거나 한 줄을 무작위로 뽑아요.",
    affPathLabel: "열 메모",
    affPathDesc: "이름을 입력하면 후보가 나와요.",
    affPh: "예) 확언/매일 확언",
    affFound: (n) => `✓ 열 수 있는 메모예요. 뽑을 수 있는 줄은 ${n}개예요.`,
    affMissing: "✗ 이 경로에서 메모를 찾을 수 없어요",
    affEmpty: "아직 메모를 지정하지 않았어요",
    affNotice: "확언 메모를 찾을 수 없어요: ",
    affNotSet: "플러그인 설정에서 확언 메모를 먼저 지정해 주세요.",

    cmdStart: "시작 시각 입력",
    cmdEnd: "끝 시각과 소요시간 입력",
    cmdPhrase: "문구 입력",
    cmdRandomShow: "랜덤 확언 보기",
    cmdRandomInsert: "랜덤 확언 입력",

    rangeTitle: "시작과 끝",
    rangeSub: "시작과 끝을 누르면 소요시간을 계산해요.",
    rangeLabel: "입력 형태",
    rangeDesc: "시각 모양은 위의 현재 시간 형식을 따라요.",
    rangeSample: "독서",
    rangeNote: "시작을 누르면 앞부분이, 끝을 누르면 뒷부분이 입력돼요.",
    started: "시작 기록:",
    needStart: "먼저 시작 버튼을 눌러 주세요.",
    badRange: "끝 시각이 시작보다 빨라요.",

    phraseTitle: "내 문구 버튼",
    phraseSub: "누르면 정해 둔 문구가 입력돼요.",
    phraseCard: (n) => `문구 버튼 ${n}`,
    phraseNamePh: "예) 할 일 체크박스",
    textLabel: "입력할 문구",
    textDesc: "끝의 띄어쓰기도 그대로 입력돼요.",
    textPh: "예) - [ ] ",
    addPhrase: "＋ 문구 버튼 추가",
    addPhraseDesc: "문구 버튼을 하나 더 만들어요. 아래 예시를 눌러 바로 시작할 수도 있어요.",
    exampleLabel: "예시로 시작",
    examples: [["체크박스", "- [ ] "], ["회고 태그", "#회고 "], ["배운 점", "배운 점: "]],
    randomEmpty: "뽑을 확언 줄이 없어요.",

    cmdCopy: "헤딩 복사",
    copyTitle: "헤딩 복사",
    copySub: "커서 아래 헤딩과 하위 내용을 복사해요.",
    copyHowLabel: "사용법",
    copyHow1: "헤딩 아래에 커서를 두고 버튼을 누르면 그 헤딩과 하위 내용이 클립보드에 복사돼요.",
    copyHow2: "붙여넣기는 평소처럼 하면 돼요.",
    copied: (title, n) => `복사했어요: ${title} (${n}줄)`,
    copyFail: "복사하지 못했어요.",
    copyNoHeading: "헤딩 아래에 커서를 두고 눌러 주세요.",

    affRuleLabel: "뽑는 기준",
    affRule1: "메모 안의 글줄을 하나씩 뽑아요. 목록(- , 1.)과 인용(>) 기호는 떼고 내용만 써요.",
    affRule2: "빼는 줄: 제목(# 다음에 띄어쓰기), 구분선, 빈 줄, 맨 위 속성 영역, %% 주석",
    affRule3: "같은 줄이 연속으로 나오지 않아요.",
    affLinesSummary: (n) => `뽑을 수 있는 줄 보기 (${n})`,

    affButtonsLabel: "만들어지는 버튼",
    affOpenDesc: "메모를 바로 열어요.",
    affShowDesc: "한 줄을 알림으로 보여 줘요.",
    affInsertDesc: "한 줄을 커서 위치에 써 줘요.",
    affTestBtn: "한 줄 뽑아 보기",
    affTestLabel: "뽑기 테스트",

    hotkeyTitle: "단축키와 모바일 툴바",
    hotkeyDesc: "단축키: 옵시디언 설정 → 단축키에서 Growth Stamp를 검색해 지정하세요.",
    toolbarHint: "모바일 툴바: 옵시디언 설정 → 모바일 → 툴바 옵션에서 이 플러그인의 명령을 추가하세요.",

    tokens: [
      ["HH", "시 (24시간, 두 자리)", "08"],
      ["H", "시 (24시간)", "8"],
      ["hh / h", "시 (12시간)", "08 / 8"],
      ["mm", "분", "30"],
      ["A", "오전/오후", "오전"],
      ["YYYY / YY", "연도", "2026 / 26"],
      ["MM / M", "월", "10 / 10"],
      ["DD / D", "일", "24 / 24"],
      ["ddd", "요일", "토"],
      ["[글자]", "대괄호 안은 그대로 출력", "[시]"],
    ],
    timePresets: ["HHmm ", "HHmm : ", "HH:mm ", "HH:mm - "],
    datePresets: ["MM/DD(ddd) ", "*MM/DD(ddd)* ", "YYYY-MM-DD ", "M월 D일 (ddd) "],
  },
  en: {
    langLabel: "Language (언어)",
    langDesc: "Descriptions and examples are shown in English.",
    cmdTime: "Insert current time",
    cmdDate: "Insert today's date",
    cmdAff: "Open affirmation note",

    timeTitle: "Current time",
    timeSub: "Tap to type the current time.",
    roundLabel: "Round to",
    roundDesc: "Rounds to the nearest N minutes. Type 1 in the custom box for no rounding.",
    minutes: "min",
    customShort: "Custom",
    formatLabel: "Output style",
    formatDesc: "Pick one, or build your own below.",
    customLabel: "Custom format",
    tokenSummary: "Show available tokens",
    timeSample: "What fun thing will happen today?",
    previewLabel: "Preview",
    previewRaw: "Typed text (spaces included)",
    previewRendered: "How it looks in a note",
    nowRound: (a, n, b) => `Now ${a} → rounded to ${n} min: ${b}`,
    nowNoRound: (a) => `Now ${a} (no rounding)`,

    dateTitle: "Today's date",
    dateSub: "Tap to type today's date. Add more buttons for other styles, e.g. daily log or journal.",
    dateCard: (n) => `Date button ${n}`,
    nameLabel: "Button name",
    nameDesc: "A name to tell buttons apart in the toolbar.",
    namePh: "e.g. With weekday, italic",
    dateFormatLabel: "Date style",
    dateSample: "Clean the bathroom",
    iconLabel: "Icon",
    iconDesc: "How it looks on the toolbar.",
    remove: "Remove",
    cancel: "Cancel",
    removeTitle: (name) => `Remove '${name}'?`,
    removeDesc: "This button's settings will be gone.",
    addDate: "＋ Add date button",
    addDateDesc: "Adds one more date button. It shows up right away in the command list of toolbar options.",

    affTitle: "My affirmations",
    affSub: "Open the note, or draw one random line from it.",
    affPathLabel: "Note to open",
    affPathDesc: "Type a note name to see suggestions.",
    affPh: "e.g. Affirmations/Daily",
    affFound: (n) => `✓ Note found. ${n} lines to draw from.`,
    affMissing: "✗ No note found at this path",
    affEmpty: "No note selected yet",
    affNotice: "Affirmation note not found: ",
    affNotSet: "Choose the affirmation note in the plugin settings first.",

    cmdStart: "Insert start time",
    cmdEnd: "Insert end time with duration",
    cmdPhrase: "Insert phrase",
    cmdRandomShow: "Show random affirmation",
    cmdRandomInsert: "Insert random affirmation",

    rangeTitle: "Start and end",
    rangeSub: "Press start, then end, and the duration is worked out.",
    rangeLabel: "Output style",
    rangeDesc: "The time look follows your current time format above.",
    rangeSample: "Reading",
    rangeNote: "Start types the first part, end types the rest.",
    started: "Started at",
    needStart: "Press the start button first.",
    badRange: "The end time is before the start time.",

    phraseTitle: "My phrase buttons",
    phraseSub: "Tap to type a phrase you set.",
    phraseCard: (n) => `Phrase button ${n}`,
    phraseNamePh: "e.g. Checkbox",
    textLabel: "Phrase",
    textDesc: "Trailing spaces are typed too.",
    textPh: "e.g. - [ ] ",
    addPhrase: "＋ Add phrase button",
    addPhraseDesc: "Creates one more phrase button. Tap an example below to start fast.",
    exampleLabel: "Quick start",
    examples: [["Checkbox", "- [ ] "], ["Review tag", "#review "], ["Learned", "Learned: "]],
    randomEmpty: "No lines to pick from.",

    cmdCopy: "Copy heading section",
    copyTitle: "Heading copy",
    copySub: "Copies the heading under the cursor and what is below it.",
    copyHowLabel: "How to use",
    copyHow1: "Put the cursor under a heading and tap the button. That heading and its sub-content go to your clipboard.",
    copyHow2: "Paste as usual.",
    copied: (title, n) => `Copied: ${title} (${n} lines)`,
    copyFail: "Could not copy.",
    copyNoHeading: "Put the cursor under a heading first.",

    affRuleLabel: "How a line is chosen",
    affRule1: "Each text line in the note can be drawn. List (- , 1.) and quote (>) marks are removed.",
    affRule2: "Skipped: headings (# followed by a space), dividers, blank lines, the properties block at the top, %% comments.",
    affRule3: "The same line never comes up twice in a row.",
    affLinesSummary: (n) => `Show lines that can be drawn (${n})`,

    affButtonsLabel: "Buttons you get",
    affOpenDesc: "Opens the note right away.",
    affShowDesc: "Shows one line as a notice.",
    affInsertDesc: "Types one line at the cursor.",
    affTestBtn: "Draw one line",
    affTestLabel: "Try it",

    hotkeyTitle: "Hotkeys and mobile toolbar",
    hotkeyDesc: "Hotkeys: Obsidian Settings → Hotkeys, then search for Growth Stamp.",
    toolbarHint: "Mobile toolbar: Obsidian Settings → Mobile → Toolbar options, then add this plugin's commands.",

    tokens: [
      ["HH", "hour (24h, 2 digits)", "08"],
      ["H", "hour (24h)", "8"],
      ["hh / h", "hour (12h)", "08 / 8"],
      ["mm", "minute", "30"],
      ["A", "AM / PM", "AM"],
      ["YYYY / YY", "year", "2026 / 26"],
      ["MMM", "month name", "Oct"],
      ["MM / M", "month", "10 / 10"],
      ["DD / D", "day", "24 / 24"],
      ["ddd", "weekday", "Sat"],
      ["[text]", "text in brackets is kept as is", "[at]"],
    ],
    timePresets: ["HHmm ", "HH:mm ", "h:mm A ", "HH:mm - "],
    datePresets: ["MM/DD (ddd) ", "MMM D (ddd) ", "YYYY-MM-DD ", "*MMM D* "],
  },
};
const WEEKDAYS = {
  ko: ["일", "월", "화", "수", "목", "금", "토"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
};
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const DEFAULTS = {
  language: "ko",
  roundMinutes: 10,
  timeFormat: "HHmm ",
  dates: [{ id: "d1", name: "", format: "MM/DD(ddd) ", icon: "growth-stamp-calendar" }],
  affirmationPath: "",
  rangePreset: 0,
  startedAt: null,
  phrases: [],
};

// ───────────── 순수 함수 ─────────────
const pad = (n) => String(n).padStart(2, "0");

const roundDate = (date, minutes) => {
  const n = Math.max(1, Math.floor(Number(minutes)) || 1);
  const step = n * 60000;
  return new Date(Math.round(date.getTime() / step) * step);
};

// 기호: YYYY YY MMM MM M ddd DD D HH H hh h mm A, [글자] = 그대로 출력. 요일은 실제 날짜에서 계산
const formatDate = (date, fmt, lang) => {
  const l = lang === "en" ? "en" : "ko";
  const h12 = date.getHours() % 12 || 12;
  const map = {
    YYYY: String(date.getFullYear()),
    YY: pad(date.getFullYear() % 100),
    MMM: l === "en" ? MONTHS_EN[date.getMonth()] : `${date.getMonth() + 1}월`,
    MM: pad(date.getMonth() + 1),
    M: String(date.getMonth() + 1),
    ddd: WEEKDAYS[l][date.getDay()],
    DD: pad(date.getDate()),
    D: String(date.getDate()),
    HH: pad(date.getHours()),
    H: String(date.getHours()),
    hh: pad(h12),
    h: String(h12),
    mm: pad(date.getMinutes()),
    A: date.getHours() < 12 ? (l === "en" ? "AM" : "오전") : l === "en" ? "PM" : "오후",
  };
  return fmt.replace(/\[([^\]]*)\]|YYYY|YY|MMM|MM|M|ddd|DD|D|HH|H|hh|h|mm|A/g, (m, lit) => (lit !== undefined ? lit : map[m]));
};

// 소요시간 글자: text = 1시간 20분, clock = 1:20
const durationText = (mins, style, lang) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (style === "clock") return `${h}:${pad(m)}`;
  if (lang === "en") return h > 0 ? (m > 0 ? `${h} h ${m} min` : `${h} h`) : `${m} min`;
  return h > 0 ? (m > 0 ? `${h}시간 ${m}분` : `${h}시간`) : `${m}분`;
};

const uiLang = () => {
  return String(getLanguage() || "en").toLowerCase().startsWith("ko") ? "ko" : "en";
};

// ───────────── 플러그인 ─────────────
module.exports = class GrowthStampPlugin extends obsidian.Plugin {
  async onload() {
    for (const [id, svg] of Object.entries(ICONS)) addIcon(id, svg);
    await this.loadSettings();
    this.cmdIds = [];
    this.registerCommands();
    this.addSettingTab(new GrowthStampSettingTab(this.app, this));
  }

  get t() {
    return STR[this.settings.language] || STR.ko;
  }

  async loadSettings() {
    const saved = (await this.loadData()) || {};
    this.settings = { ...DEFAULTS, ...saved };
    if (!saved.language) this.settings.language = uiLang();
    if (!Array.isArray(this.settings.dates)) this.settings.dates = DEFAULTS.dates.map((d) => ({ ...d }));
    if (!Array.isArray(this.settings.phrases)) this.settings.phrases = [];
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  currentTimeText() {
    const d = roundDate(new Date(), this.settings.roundMinutes);
    return formatDate(d, this.settings.timeFormat, this.settings.language);
  }

  dateText(inst) {
    return formatDate(new Date(), inst.format, this.settings.language);
  }

  // 시작과 끝: 현재 시간 형식에서 뒤쪽 구분 글자(띄어쓰기, 콜론, 줄표)만 뺀 모양을 사용
  rangeTimeText(date) {
    const fmt = (this.settings.timeFormat || "").replace(/[\s:\-–~→]+$/, "") || "HH:mm";
    return formatDate(date, fmt, this.settings.language);
  }

  rangeStartText(start, idx = this.settings.rangePreset) {
    const r = RANGE_PRESETS[idx] || RANGE_PRESETS[0];
    return this.rangeTimeText(start) + r.sep;
  }

  rangeEndText(end, start, idx = this.settings.rangePreset) {
    const r = RANGE_PRESETS[idx] || RANGE_PRESETS[0];
    const mins = Math.round((end.getTime() - start.getTime()) / 60000);
    let out = this.rangeTimeText(end);
    if (r.dur !== "none") out += ` (${durationText(mins, r.dur, this.settings.language)})`;
    return out + " ";
  }

  rangeSampleText(idx) {
    const a = new Date(2026, 9, 24, 11, 40);
    const b = new Date(2026, 9, 24, 12, 20);
    return this.rangeStartText(a, idx) + this.rangeEndText(b, a, idx);
  }

  async startRange(editor) {
    const d = roundDate(new Date(), this.settings.roundMinutes);
    this.settings.startedAt = d.getTime();
    await this.saveSettings();
    editor.replaceSelection(this.rangeStartText(d));
    new Notice(`${this.t.started} ${this.rangeTimeText(d)}`, 2500);
  }

  async endRange(editor) {
    if (!this.settings.startedAt) return new Notice(this.t.needStart);
    const start = new Date(this.settings.startedAt);
    const end = roundDate(new Date(), this.settings.roundMinutes);
    if (end.getTime() < start.getTime()) return new Notice(this.t.badRange);
    editor.replaceSelection(this.rangeEndText(end, start));
    this.settings.startedAt = null;
    await this.saveSettings();
  }

  // 커서가 있는 헤딩과 그 아래 내용(더 깊은 헤딩 포함)을 다음 같은 단계 이상 헤딩 전까지 가져옴
  sectionAtCursor(editor) {
    const lines = editor.getValue().split("\n");
    const cur = editor.getCursor().line;
    let fence = null;
    const heads = [];
    lines.forEach((l, i) => {
      const f = l.match(/^\s*(`{3,}|~{3,})/);
      if (f) {
        if (!fence) fence = f[1][0];
        else if (f[1][0] === fence) fence = null;
        return;
      }
      if (fence) return;
      const m = l.match(/^(#{1,6})\s+(.*)$/);
      if (m) heads.push({ i, level: m[1].length, title: m[2].trim() });
    });
    let start = null;
    for (const h of heads) {
      if (h.i <= cur) start = h;
      else break;
    }
    if (!start) return null;
    let end = lines.length;
    for (const h of heads) {
      if (h.i > start.i && h.level <= start.level) {
        end = h.i;
        break;
      }
    }
    const body = lines.slice(start.i, end);
    while (body.length && body[body.length - 1].trim() === "") body.pop();
    return { title: start.title, text: body.join("\n"), lines: body.length };
  }

  async copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  async copyHeading(editor) {
    const sec = this.sectionAtCursor(editor);
    if (!sec) return new Notice(this.t.copyNoHeading);
    const ok = await this.copyText(sec.text);
    new Notice(ok ? this.t.copied(sec.title, sec.lines) : this.t.copyFail, 3000);
  }

  phraseCommandName(inst, i) {
    const base = this.t.cmdPhrase;
    if (inst.name) return `${base}: ${inst.name}`;
    return this.settings.phrases.length > 1 ? `${base} (${i + 1})` : base;
  }

  // 확언 메모에서 뽑을 수 있는 줄 (제목, 구분선, 속성 영역은 빼고 목록 기호는 떼어냄)
  async affirmationLines() {
    const file = this.findAffirmation();
    if (!file) return null;
    let lines = (await this.app.vault.cachedRead(file)).split(/\r?\n/);
    if (lines[0] && lines[0].trim() === "---") {
      const end = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
      if (end > 0) lines = lines.slice(end + 1);
    }
    return lines
      .filter((l) => !/^\s*#{1,6}\s/.test(l) && !/^\s*[-*_]{3,}\s*$/.test(l) && !l.trim().startsWith("%%"))
      .map((l) => l.replace(/^\s*(?:[-*+]\s+(?:\[.\]\s+)?|\d+[.)]\s+|>\s*)/, "").trim())
      .filter((l) => l.length > 0);
  }

  async randomAffirmation() {
    if (!(this.settings.affirmationPath || "").trim()) {
      new Notice(this.t.affNotSet);
      return null;
    }
    const lines = await this.affirmationLines();
    if (lines === null) {
      new Notice(this.t.affNotice + this.settings.affirmationPath);
      return null;
    }
    if (lines.length === 0) {
      new Notice(this.t.randomEmpty);
      return null;
    }
    let i = Math.floor(Math.random() * lines.length);
    if (lines.length > 1 && lines[i] === this.lastAffirmation) i = (i + 1) % lines.length;
    this.lastAffirmation = lines[i];
    return lines[i];
  }

  dateCommandName(inst, i) {
    const base = this.t.cmdDate;
    if (inst.name) return `${base}: ${inst.name}`;
    return this.settings.dates.length > 1 ? `${base} (${i + 1})` : base;
  }

  // 이름, 개수, 언어가 바뀌면 명령을 다시 등록 (id가 같으므로 단축키는 유지됨)
  registerCommands() {
    for (const id of this.cmdIds) this.removeCommand(id);
    this.cmdIds = [];
    const add = (cmd) => {
      this.cmdIds.push(cmd.id);
      this.addCommand(cmd);
    };

    add({
      id: "insert-time",
      name: this.t.cmdTime,
      icon: "growth-stamp-clock",
      editorCallback: (editor) => editor.replaceSelection(this.currentTimeText()),
    });
    this.settings.dates.forEach((inst, i) => {
      add({
        id: `insert-date-${inst.id}`,
        name: this.dateCommandName(inst, i),
        icon: inst.icon || "growth-stamp-calendar",
        editorCallback: (editor) => editor.replaceSelection(this.dateText(inst)),
      });
    });
    add({
      id: "start-time",
      name: this.t.cmdStart,
      icon: "growth-stamp-play",
      editorCallback: (editor) => this.startRange(editor),
    });
    add({
      id: "end-time",
      name: this.t.cmdEnd,
      icon: "growth-stamp-stop",
      editorCallback: (editor) => this.endRange(editor),
    });
    this.settings.phrases.forEach((inst, i) => {
      add({
        id: `insert-phrase-${inst.id}`,
        name: this.phraseCommandName(inst, i),
        icon: inst.icon || PHRASE_ICONS[0],
        editorCallback: (editor) => editor.replaceSelection(inst.text || ""),
      });
    });
    add({
      id: "copy-heading",
      name: this.t.cmdCopy,
      icon: "growth-stamp-copy",
      editorCallback: (editor) => this.copyHeading(editor),
    });
    add({
      id: "random-affirmation",
      name: this.t.cmdRandomShow,
      icon: "growth-stamp-dice",
      // 모바일 툴바 목록에는 편집기 명령만 나타나므로 editorCallback 사용
      editorCallback: async () => {
        const line = await this.randomAffirmation();
        if (line) new Notice(line, 10000);
      },
    });
    add({
      id: "insert-random-affirmation",
      name: this.t.cmdRandomInsert,
      icon: "growth-stamp-sparkle",
      editorCallback: async (editor) => {
        const line = await this.randomAffirmation();
        if (line) editor.replaceSelection(line);
      },
    });
    add({
      id: "open-affirmation",
      name: this.t.cmdAff,
      icon: "growth-stamp-sun",
      editorCallback: () => this.openAffirmation(),
    });
  }

  findAffirmation() {
    let path = (this.settings.affirmationPath || "").trim();
    if (!path) return null;
    if (!path.toLowerCase().endsWith(".md")) path += ".md";
    const f = this.app.vault.getAbstractFileByPath(normalizePath(path));
    return f instanceof TFile ? f : null;
  }

  async openAffirmation() {
    const raw = (this.settings.affirmationPath || "").trim();
    if (!raw) return new Notice(this.t.affNotSet);
    const file = this.findAffirmation();
    if (!file) return new Notice(this.t.affNotice + raw);
    await this.app.workspace.getLeaf(false).openFile(file);
  }
};

// ───────────── 설정창 ─────────────
class NoteSuggest extends AbstractInputSuggest {
  constructor(app, inputEl, onPick) {
    super(app, inputEl);
    this.inputEl = inputEl;
    this.onPick = onPick;
  }
  getSuggestions(q) {
    const s = q.toLowerCase();
    return this.app.vault.getMarkdownFiles().filter((f) => f.path.toLowerCase().includes(s)).slice(0, 30);
  }
  renderSuggestion(file, el) {
    el.setText(file.path);
  }
  selectSuggestion(file) {
    this.inputEl.value = file.path;
    this.onPick(file.path);
    this.close();
  }
}

// 삭제 전에 한 번 더 묻는 창
class ConfirmModal extends Modal {
  constructor(app, o) {
    super(app);
    this.o = o;
  }
  onOpen() {
    const { contentEl } = this;
    this.titleEl.setText(this.o.title);
    contentEl.createDiv({ cls: "kst-desc", text: this.o.desc });
    const row = contentEl.createDiv({ cls: "kst-modal-buttons" });
    const cancel = row.createEl("button", { text: this.o.cancelText });
    cancel.addEventListener("click", () => this.close());
    const ok = row.createEl("button", { cls: "mod-warning", text: this.o.confirmText });
    ok.addEventListener("click", () => {
      this.close();
      this.o.onConfirm();
    });
  }
  onClose() {
    this.contentEl.empty();
  }
}

class GrowthStampSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  hide() {
    this.unloadRenders();
  }

  // 미리보기를 그릴 때 만든 컴포넌트 정리 (메모리 누수 방지)
  unloadRenders() {
    for (const c of this.renderComps || []) c.unload();
    this.renderComps = new Set();
  }

  // 마크다운으로 그려서 기울임과 굵게가 실제 문서처럼 보이게 함
  async renderMd(el, md) {
    el._kst = (el._kst || 0) + 1;
    const tok = el._kst;
    if (!this.renderComps) this.renderComps = new Set();
    if (el._kstComp) {
      el._kstComp.unload();
      this.renderComps.delete(el._kstComp);
    }
    const comp = new Component();
    comp.load();
    el._kstComp = comp;
    this.renderComps.add(comp);
    const tmp = createDiv();
    try {
      await MarkdownRenderer.render(this.app, md, tmp, "", comp);
    } catch {
      tmp.setText(md);
    }
    if (el._kst !== tok) return;
    const only = tmp.children.length === 1 && tmp.firstElementChild.tagName === "P" ? tmp.firstElementChild : tmp;
    el.empty();
    el.append(...Array.from(only.childNodes));
  }

  // ── 작은 UI 부품들 ──
  section(parent, title, sub, num) {
    const sec = parent.createDiv({ cls: "kst-sec" });
    const head = sec.createDiv({ cls: "kst-sec-title" });
    if (num) head.createSpan({ cls: "kst-num", text: String(num) });
    head.createSpan({ text: title });
    if (sub) sec.createDiv({ cls: "kst-sec-sub", text: sub });
    return sec.createDiv({ cls: "kst-sec-body" });
  }

  field(parent, label, desc) {
    const f = parent.createDiv({ cls: "kst-field" });
    f.createDiv({ cls: "kst-label", text: label });
    if (desc) f.createDiv({ cls: "kst-desc", text: desc });
    return f;
  }

  textInput(parent, value, placeholder, onInput) {
    const input = parent.createEl("input", { cls: "kst-input", type: "text" });
    input.value = value;
    if (placeholder) input.placeholder = placeholder;
    input.addEventListener("input", () => onInput(input.value));
    return input;
  }

  previewPanel(parent) {
    const t = this.plugin.t;
    const box = parent.createDiv({ cls: "kst-preview" });
    box.createDiv({ cls: "kst-tag", text: t.previewLabel });
    box.createDiv({ cls: "kst-preview-cap", text: t.previewRaw });
    const raw = box.createDiv({ cls: "kst-preview-line" });
    box.createDiv({ cls: "kst-preview-cap", text: t.previewRendered });
    const rendered = box.createDiv({ cls: "kst-preview-line" });
    const note = box.createDiv({ cls: "kst-preview-note" });
    return {
      set: (inserted, sample, noteText) => {
        raw.empty();
        raw.createSpan({ cls: "kst-ins", text: inserted });
        raw.createSpan({ text: sample });
        this.renderMd(rendered, inserted + sample);
        note.setText(noteText || "");
        note.toggleClass("is-hidden", !noteText);
      },
    };
  }

  // 자주 쓰는 형태를 눌러서 고르는 목록 (각 줄이 문서에서 보일 모습 그대로 나옴)
  presetList(parent, presets, getFormat, toMd, onPick) {
    const list = parent.createDiv({ cls: "kst-presets" });
    const rows = presets.map((fmt) => {
      const row = list.createDiv({ cls: "kst-preset" });
      row.createDiv({ cls: "kst-radio" });
      const body = row.createDiv({ cls: "kst-preset-line" });
      row.addEventListener("click", () => onPick(fmt));
      return { fmt, row, body };
    });
    return () => {
      for (const r of rows) {
        r.row.toggleClass("is-selected", r.fmt === getFormat());
        this.renderMd(r.body, toMd(r.fmt));
      }
    };
  }

  display() {
    const { containerEl } = this;
    const p = this.plugin;
    const t = p.t;
    const lang = p.settings.language;
    this.unloadRenders();
    containerEl.empty();
    containerEl.addClass("kst");
    this.onTimeChange = null;

    // ── 언어 ──
    const langBody = this.section(containerEl, t.langLabel, t.langDesc);
    const seg = langBody.createDiv({ cls: "kst-group" });
    [["ko", "한국어"], ["en", "English"]].forEach(([code, label]) => {
      const b = seg.createEl("button", { text: label });
      b.toggleClass("is-active", lang === code);
      b.addEventListener("click", async () => {
        if (p.settings.language === code) return;
        p.settings.language = code;
        await p.saveSettings();
        p.registerCommands();
        this.display();
      });
    });

    // ── ① 현재 시간 ──
    const tb = this.section(containerEl, t.timeTitle, t.timeSub, 1);

    const roundF = this.field(tb, t.roundLabel, t.roundDesc);
    const PRESET_MIN = [5, 10, 15, 30];
    const group = roundF.createDiv({ cls: "kst-group" });
    const chips = PRESET_MIN.map((n) => {
      const c = group.createEl("button", { text: `${n}${t.minutes}` });
      c.addEventListener("click", async () => {
        p.settings.roundMinutes = n;
        await p.saveSettings();
        roundInput.value = "";
        refreshTime();
      });
      return { n, c };
    });
    const customSeg = group.createDiv({ cls: "kst-group-input" });
    const roundInput = customSeg.createEl("input", { type: "number" });
    roundInput.placeholder = t.customShort;
    roundInput.min = "1";
    roundInput.max = "720";
    if (!PRESET_MIN.includes(p.settings.roundMinutes)) roundInput.value = String(p.settings.roundMinutes);
    roundInput.addEventListener("input", async () => {
      const n = parseInt(roundInput.value, 10);
      if (n >= 1 && n <= 720) {
        p.settings.roundMinutes = n;
        await p.saveSettings();
        refreshTime();
      }
    });

    const fmtF = this.field(tb, t.formatLabel, t.formatDesc);
    const now = () => new Date();
    const timeStr = (fmt) => formatDate(roundDate(now(), p.settings.roundMinutes), fmt, lang);
    const refreshPresets = this.presetList(
      fmtF,
      t.timePresets,
      () => p.settings.timeFormat,
      (fmt) => timeStr(fmt) + t.timeSample,
      async (fmt) => {
        p.settings.timeFormat = fmt;
        await p.saveSettings();
        timeInput.value = fmt;
        refreshTime();
      }
    );

    const customF = this.field(tb, t.customLabel, null);
    const timeInput = this.textInput(customF, p.settings.timeFormat, "HHmm ", async (v) => {
      p.settings.timeFormat = v;
      await p.saveSettings();
      refreshTime();
    });
    this.tokenHelp(customF, t);

    const timePrev = this.previewPanel(tb);
    const refreshTime = () => {
      chips.forEach(({ n, c }) => c.toggleClass("is-active", n === p.settings.roundMinutes));
      customSeg.toggleClass("is-active", !PRESET_MIN.includes(p.settings.roundMinutes));
      refreshPresets();
      if (this.onTimeChange) this.onTimeChange();
      const raw = formatDate(now(), "HH:mm", lang);
      const rounded = formatDate(roundDate(now(), p.settings.roundMinutes), "HH:mm", lang);
      timePrev.set(
        p.currentTimeText(),
        t.timeSample,
        p.settings.roundMinutes > 1 ? t.nowRound(raw, p.settings.roundMinutes, rounded) : t.nowNoRound(raw)
      );
    };
    refreshTime();

    // ── ② 시작과 끝 ──
    const rb = this.section(containerEl, t.rangeTitle, t.rangeSub, 2);
    const rangeF = this.field(rb, t.rangeLabel, t.rangeDesc);
    const refreshRangePresets = this.presetList(
      rangeF,
      RANGE_PRESETS.map((_, i) => i),
      () => p.settings.rangePreset,
      (i) => p.rangeSampleText(i) + t.rangeSample,
      async (i) => {
        p.settings.rangePreset = i;
        await p.saveSettings();
        refreshRange();
      }
    );
    const rangePrev = this.previewPanel(rb);
    const refreshRange = () => {
      refreshRangePresets();
      rangePrev.set(p.rangeSampleText(p.settings.rangePreset), t.rangeSample, t.rangeNote);
    };
    refreshRange();
    // 현재 시간 형식을 바꾸면 이 미리보기도 따라 바뀌게 함
    this.onTimeChange = refreshRange;

    // ── ③ 오늘 날짜 ──
    const db = this.section(containerEl, t.dateTitle, t.dateSub, 3);
    p.settings.dates.forEach((inst, i) => this.dateCard(db, inst, i));

    const addRow = db.createDiv({ cls: "kst-add" });
    const addBtn = addRow.createEl("button", { cls: "kst-btn mod-cta", text: t.addDate });
    addRow.createDiv({ cls: "kst-desc", text: t.addDateDesc });
    addBtn.addEventListener("click", async () => {
      p.settings.dates.push({
        id: "d" + Date.now().toString(36),
        name: "",
        format: t.datePresets[1],
        icon: DATE_ICONS[Math.min(p.settings.dates.length, DATE_ICONS.length - 1)],
      });
      await p.saveSettings();
      p.registerCommands();
      this.display();
    });

    // ── ④ 내 문구 버튼 ──
    const pb = this.section(containerEl, t.phraseTitle, t.phraseSub, 4);
    p.settings.phrases.forEach((inst, i) => this.phraseCard(pb, inst, i));
    const addPhraseRow = pb.createDiv({ cls: "kst-add" });
    const addPhraseBtn = addPhraseRow.createEl("button", { cls: "kst-btn mod-cta", text: t.addPhrase });
    addPhraseRow.createDiv({ cls: "kst-desc", text: t.addPhraseDesc });
    const addPhrase = async (name, text) => {
      p.settings.phrases.push({
        id: "p" + Date.now().toString(36),
        name,
        text,
        icon: PHRASE_ICONS[p.settings.phrases.length % PHRASE_ICONS.length],
      });
      await p.saveSettings();
      p.registerCommands();
      this.display();
    };
    addPhraseBtn.addEventListener("click", () => addPhrase("", ""));
    const exRow = addPhraseRow.createDiv({ cls: "kst-row" });
    exRow.createSpan({ cls: "kst-desc", text: t.exampleLabel });
    for (const [name, text] of t.examples) {
      const chip = exRow.createEl("button", { cls: "kst-chip", text: name });
      chip.addEventListener("click", () => addPhrase(name, text));
    }

    // ── ⑤ 헤딩 복사 ──
    const cb = this.section(containerEl, t.copyTitle, t.copySub, 5);
    const howF = this.field(cb, t.copyHowLabel, t.copyHow1);
    howF.createDiv({ cls: "kst-desc", text: t.copyHow2 });

    // ── ⑥ 내 확언 ──
    const ab = this.section(containerEl, t.affTitle, t.affSub, 6);
    const affF = this.field(ab, t.affPathLabel, t.affPathDesc);
    const status = ab.createDiv({ cls: "kst-status" });
    const ruleF = this.field(ab, t.affRuleLabel, t.affRule1);
    ruleF.addClass("kst-gap-top");
    ruleF.createDiv({ cls: "kst-desc", text: t.affRule2 });
    ruleF.createDiv({ cls: "kst-desc", text: t.affRule3 });
    const candidates = ruleF.createDiv();
    const refreshAff = async () => {
      const has = (p.settings.affirmationPath || "").trim().length > 0;
      const ok = has && !!p.findAffirmation();
      status.setText(!has ? t.affEmpty : ok ? t.affFound(0) : t.affMissing);
      status.toggleClass("is-ok", ok);
      status.toggleClass("is-bad", has && !ok);
      candidates.empty();
      if (ok) {
        const lines = await p.affirmationLines();
        if (lines) {
          status.setText(t.affFound(lines.length));
          if (lines.length > 0) {
            const d = candidates.createEl("details", { cls: "kst-tokens" });
            d.createEl("summary", { text: t.affLinesSummary(lines.length) });
            const ul = d.createDiv({ cls: "kst-line-list" });
            lines.slice(0, 50).forEach((l) => ul.createDiv({ text: l }));
            if (lines.length > 50) ul.createDiv({ cls: "kst-desc", text: "..." });
          }
        }
      }
    };
    const affInput = this.textInput(affF, p.settings.affirmationPath, t.affPh, async (v) => {
      p.settings.affirmationPath = v;
      await p.saveSettings();
      refreshAff();
    });
    new NoteSuggest(this.app, affInput, async (path) => {
      p.settings.affirmationPath = path;
      await p.saveSettings();
      refreshAff();
    });
    refreshAff();

    // 이 메모로 만들어지는 버튼 3개
    const btnF = this.field(ab, t.affButtonsLabel, null);
    btnF.addClass("kst-gap-top");
    const list = btnF.createDiv({ cls: "kst-cmd-list" });
    [
      ["growth-stamp-sun", t.cmdAff, t.affOpenDesc],
      ["growth-stamp-dice", t.cmdRandomShow, t.affShowDesc],
      ["growth-stamp-sparkle", t.cmdRandomInsert, t.affInsertDesc],
    ].forEach(([icon, name, desc]) => {
      const row = list.createDiv({ cls: "kst-cmd-row" });
      setIcon(row.createDiv({ cls: "kst-cmd-icon" }), icon);
      const text = row.createDiv({ cls: "kst-cmd-text" });
      text.createDiv({ cls: "kst-cmd-name", text: name });
      text.createDiv({ cls: "kst-desc", text: desc });
    });

    const testF = this.field(ab, t.affTestLabel, null);
    const testBtn = testF.createEl("button", { cls: "kst-btn", text: t.affTestBtn });
    const testBox = testF.createDiv({ cls: "kst-box is-hidden" });
    testBtn.addEventListener("click", async () => {
      const line = await p.randomAffirmation();
      if (!line) return;
      testBox.removeClass("is-hidden");
      testBox.setText(line);
    });

    // ── 단축키 ──
    const hb = this.section(containerEl, t.hotkeyTitle, null);
    hb.createDiv({ cls: "kst-desc", text: t.hotkeyDesc });
    hb.createDiv({ cls: "kst-desc kst-gap", text: t.toolbarHint });
  }

  textArea(parent, value, placeholder, onInput) {
    const input = parent.createEl("textarea", { cls: "kst-input" });
    input.value = value;
    input.rows = 2;
    if (placeholder) input.placeholder = placeholder;
    input.addEventListener("input", () => onInput(input.value));
    return input;
  }

  phraseCard(parent, inst, index) {
    const p = this.plugin;
    const t = p.t;
    const card = parent.createDiv({ cls: "kst-card" });

    const head = card.createDiv({ cls: "kst-card-head" });
    const titleEl = head.createDiv({ cls: "kst-card-title" });
    const setTitle = () => {
      titleEl.setText((inst.name || "").trim() || t.phraseCard(index + 1));
      titleEl.toggleClass("is-placeholder", !(inst.name || "").trim());
    };
    setTitle();
    const del = head.createEl("button", { cls: "kst-btn kst-danger", text: t.remove });
    del.addEventListener("click", () => {
      new ConfirmModal(this.app, {
        title: t.removeTitle((inst.name || "").trim() || t.phraseCard(index + 1)),
        desc: t.removeDesc,
        confirmText: t.remove,
        cancelText: t.cancel,
        onConfirm: async () => {
          p.settings.phrases.splice(index, 1);
          await p.saveSettings();
          p.registerCommands();
          this.display();
        },
      }).open();
    });

    const nameF = this.field(card, t.nameLabel, t.nameDesc);
    this.textInput(nameF, inst.name || "", t.phraseNamePh, async (v) => {
      inst.name = v;
      setTitle();
      await p.saveSettings();
      p.registerCommands();
    });

    const textF = this.field(card, t.textLabel, t.textDesc);
    this.textArea(textF, inst.text || "", t.textPh, async (v) => {
      inst.text = v;
      await p.saveSettings();
      refresh();
    });

    const prev = this.previewPanel(card);
    const refresh = () => prev.set(inst.text || "", t.dateSample);
    refresh();

    const iconF = this.field(card, t.iconLabel, t.iconDesc);
    const iconRow = iconF.createDiv({ cls: "kst-row" });
    const iconBtns = PHRASE_ICONS.map((id) => {
      const b = iconRow.createEl("button", { cls: "kst-icon-btn" });
      setIcon(b, id);
      b.addEventListener("click", async () => {
        inst.icon = id;
        await p.saveSettings();
        p.registerCommands();
        mark();
      });
      return { id, b };
    });
    const mark = () => iconBtns.forEach(({ id, b }) => b.toggleClass("is-active", (inst.icon || PHRASE_ICONS[0]) === id));
    mark();
  }

  tokenHelp(parent, t) {
    const d = parent.createEl("details", { cls: "kst-tokens" });
    d.createEl("summary", { text: t.tokenSummary });
    const table = d.createDiv({ cls: "kst-token-table" });
    for (const [tok, desc, ex] of t.tokens) {
      table.createSpan({ cls: "kst-tok", text: tok });
      table.createSpan({ text: desc });
      table.createSpan({ cls: "kst-tok-ex", text: ex });
    }
  }

  dateCard(parent, inst, index) {
    const p = this.plugin;
    const t = p.t;
    const lang = p.settings.language;
    const card = parent.createDiv({ cls: "kst-card" });

    // 제목: 이름을 쓰면 그 이름 그대로, 비어 있으면 "날짜 버튼 N"
    const head = card.createDiv({ cls: "kst-card-head" });
    const titleEl = head.createDiv({ cls: "kst-card-title" });
    const setTitle = () => {
      titleEl.setText(inst.name.trim() || t.dateCard(index + 1));
      titleEl.toggleClass("is-placeholder", !inst.name.trim());
    };
    setTitle();
    const del = head.createEl("button", { cls: "kst-btn kst-danger", text: t.remove });
    del.addEventListener("click", () => {
      new ConfirmModal(this.app, {
        title: t.removeTitle(inst.name.trim() || t.dateCard(index + 1)),
        desc: t.removeDesc,
        confirmText: t.remove,
        cancelText: t.cancel,
        onConfirm: async () => {
          p.settings.dates.splice(index, 1);
          await p.saveSettings();
          p.registerCommands();
          this.display();
        },
      }).open();
    });

    const nameF = this.field(card, t.nameLabel, t.nameDesc);
    this.textInput(nameF, inst.name, t.namePh, async (v) => {
      inst.name = v;
      setTitle();
      await p.saveSettings();
      p.registerCommands();
    });

    const fmtF = this.field(card, t.dateFormatLabel, null);
    const refreshPresets = this.presetList(
      fmtF,
      t.datePresets,
      () => inst.format,
      (fmt) => formatDate(new Date(), fmt, lang) + t.dateSample,
      async (fmt) => {
        inst.format = fmt;
        await p.saveSettings();
        input.value = fmt;
        refresh();
      }
    );
    const customF = this.field(card, t.customLabel, null);
    const input = this.textInput(customF, inst.format, "MM/DD(ddd) ", async (v) => {
      inst.format = v;
      await p.saveSettings();
      refresh();
    });
    this.tokenHelp(customF, t);

    const prev = this.previewPanel(card);
    const refresh = () => {
      refreshPresets();
      prev.set(p.dateText(inst), t.dateSample);
    };
    refresh();

    const iconF = this.field(card, t.iconLabel, t.iconDesc);
    const iconRow = iconF.createDiv({ cls: "kst-row" });
    const iconBtns = DATE_ICONS.map((id) => {
      const b = iconRow.createEl("button", { cls: "kst-icon-btn" });
      setIcon(b, id);
      b.addEventListener("click", async () => {
        inst.icon = id;
        await p.saveSettings();
        p.registerCommands();
        mark();
      });
      return { id, b };
    });
    const mark = () => iconBtns.forEach(({ id, b }) => b.toggleClass("is-active", (inst.icon || DATE_ICONS[0]) === id));
    mark();
  }
}

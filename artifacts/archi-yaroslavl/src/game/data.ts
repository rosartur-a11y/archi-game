// ============================================================
// ПУТЬ ARCHI — игровой контент: стадии, действия, улучшения,
// достижения, задания, события, локации, главы
// ============================================================

import type {
  ActionId,
  IconName,
  StageId,
  UpgradeId,
} from './types';

// ------------------------------------------------------------
// Стадии персонажа
// ------------------------------------------------------------

export type Stage = {
  id: StageId;
  name: string;
  minLevel: number;
  file: string;
  /** Надпись «открывается на N уровне» для будущих стадий. */
  unlockAt: string;
  accent: string;
};

export const STAGES: Stage[] = [
  {
    id: 'novice',
    name: 'НОВИЧОК',
    minLevel: 1,
    file: 'level-01.sprite.png',
    unlockAt: 'НАЧАЛО ПУТИ',
    accent: 'lime',
  },
  {
    id: 'growth',
    name: 'РАЗВИТИЕ',
    minLevel: 10,
    file: 'level-10.sprite.png',
    unlockAt: 'ОТКРЫВАЕТСЯ НА 10 УРОВНЕ',
    accent: 'sky',
  },
  {
    id: 'success',
    name: 'УСПЕШНЫЙ',
    minLevel: 20,
    file: 'level-20.sprite.png',
    unlockAt: 'ОТКРЫВАЕТСЯ НА 20 УРОВНЕ',
    accent: 'violet',
  },
  {
    id: 'legend',
    name: 'ЛЕГЕНДА',
    minLevel: 30,
    file: 'level-30.sprite.png',
    unlockAt: 'ОТКРЫВАЕТСЯ НА 30 УРОВНЕ',
    accent: 'gold',
  },
];

export const getStage = (level: number): Stage => {
  let current = STAGES[0];
  for (const stage of STAGES) {
    if (level >= stage.minLevel) current = stage;
  }
  return current;
};

export const stageFile = (stage: StageId): string => {
  const found = STAGES.find((s) => s.id === stage);
  return found ? found.file : STAGES[0].file;
};

// ------------------------------------------------------------
// Действия («Что делаем сегодня?»)
// ------------------------------------------------------------

export type ActionDef = {
  id: ActionId;
  title: string;
  subtitle: string;
  icon: IconName;
  energyCost: number;
  accent: string;
  /** Минимум подписчиков для открытия. */
  minSubs?: number;
};

export const ACTIONS: ActionDef[] = [
  {
    id: 'video',
    title: 'СНЯТЬ ВИДЕО',
    subtitle: '+подписчики · +XP',
    icon: 'clapper',
    energyCost: 15,
    accent: 'violet',
  },
  {
    id: 'work',
    title: 'ПОЙТИ РАБОТАТЬ',
    subtitle: '+деньги · +XP',
    icon: 'briefcase',
    energyCost: 30,
    accent: 'amber',
  },
  {
    id: 'stream',
    title: 'ПРОВЕСТИ СТРИМ',
    subtitle: '+подписчики · +репутация · +XP',
    icon: 'broadcast',
    energyCost: 25,
    accent: 'coral',
  },
  {
    id: 'city',
    title: 'СНЯТЬ КОНТЕНТ В ГОРОДЕ',
    subtitle: '+деньги · +подписчики · +XP',
    icon: 'camera',
    energyCost: 20,
    accent: 'sky',
    minSubs: 50,
  },
  {
    id: 'rest',
    title: 'ОТДОХНУТЬ',
    subtitle: '+45 энергии',
    icon: 'moon',
    energyCost: 0,
    accent: 'blue',
  },
];

export const actionById = (id: ActionId): ActionDef =>
  ACTIONS.find((a) => a.id === id) ?? ACTIONS[0];

// ------------------------------------------------------------
// Улучшения (магазин)
// ------------------------------------------------------------

export type UpgradeDef = {
  id: UpgradeId;
  name: string;
  price: number;
  desc: string;
  icon: IconName;
};

export const UPGRADES: UpgradeDef[] = [
  {
    id: 'phone',
    name: 'НОВЫЙ ТЕЛЕФОН',
    price: 5000,
    desc: '+10% к подписчикам за видео',
    icon: 'phone',
  },
  {
    id: 'mic',
    name: 'МИКРОФОН',
    price: 8000,
    desc: '+1 репутация и +4 подписчика за стрим',
    icon: 'mic',
  },
  {
    id: 'camera',
    name: 'КАМЕРА',
    price: 15000,
    desc: '+3 подписчика за каждое видео',
    icon: 'camera',
  },
  {
    id: 'light',
    name: 'СВЕТ И ФОН',
    price: 12000,
    desc: '+10 ₽ за контент в городе',
    icon: 'bulb',
  },
  {
    id: 'drone',
    name: 'ДРОН ДЛЯ СЪЁМОК',
    price: 30000,
    desc: '+5 подписчиков за городской контент',
    icon: 'drone',
  },
  {
    id: 'studio',
    name: 'СВОЯ СТУДИЯ',
    price: 50000,
    desc: '+15 ₽ за работу · +1 репутации за стрим',
    icon: 'studio',
  },
];

export const upgradeById = (id: UpgradeId): UpgradeDef =>
  UPGRADES.find((u) => u.id === id) ?? UPGRADES[0];

// ------------------------------------------------------------
// Достижения (Трофеи)
// ------------------------------------------------------------

import type { GameState, RewardLine } from './types';

export type AchievementDef = {
  id: string;
  name: string;
  desc: string;
  icon: IconName;
  check: (state: GameState) => boolean;
  reward: RewardLine[];
};

const totalActionsDone = (state: GameState) =>
  Object.values(state.actionCounts).reduce((sum, n) => sum + n, 0);

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first-video',
    name: 'ПЕРВЫЙ РОЛИК',
    desc: 'Снять первое видео',
    icon: 'clapper',
    check: (s) => s.actionCounts.video >= 1,
    reward: [
      { icon: 'coins', label: '+100 ₽' },
      { icon: 'star', label: '+30 XP' },
    ],
  },
  {
    id: 'first-step',
    name: 'ПЕРВЫЙ ШАГ',
    desc: 'Достичь 2 уровня',
    icon: 'star',
    check: (s) => s.level >= 2,
    reward: [
      { icon: 'coins', label: '+150 ₽' },
      { icon: 'star', label: '+40 XP' },
    ],
  },
  {
    id: 'first-money',
    name: 'ПЕРВЫЕ ДЕНЬГИ',
    desc: 'Заработать 1 000 ₽',
    icon: 'coins',
    check: (s) => s.totalEarned >= 1000,
    reward: [
      { icon: 'coins', label: '+300 ₽' },
      { icon: 'star', label: '+50 XP' },
    ],
  },
  {
    id: 'first-hundred',
    name: 'ПЕРВЫЕ 100',
    desc: 'Собрать 100 подписчиков',
    icon: 'subs',
    check: (s) => s.subscribers >= 100,
    reward: [
      { icon: 'coins', label: '+250 ₽' },
      { icon: 'star', label: '+60 XP' },
    ],
  },
  {
    id: 'first-stream',
    name: 'В ЭФИРЕ',
    desc: 'Провести первый стрим',
    icon: 'broadcast',
    check: (s) => s.actionCounts.stream >= 1,
    reward: [
      { icon: 'coins', label: '+150 ₽' },
      { icon: 'star', label: '+30 XP' },
    ],
  },
  {
    id: 'known-face',
    name: 'ЗНАКОМОЕ ЛИЦО',
    desc: 'Достичь 10 репутации',
    icon: 'megaphone',
    check: (s) => s.reputation >= 10,
    reward: [
      { icon: 'coins', label: '+200 ₽' },
      { icon: 'star', label: '+40 XP' },
    ],
  },
  {
    id: 'hard-worker',
    name: 'ТРУДОГОЛИК',
    desc: 'Выполнить 30 действий',
    icon: 'briefcase',
    check: (s) => totalActionsDone(s) >= 30,
    reward: [
      { icon: 'coins', label: '+400 ₽' },
      { icon: 'star', label: '+70 XP' },
    ],
  },
  {
    id: 'city-expert',
    name: 'ЗНАТОК ГОРОДА',
    desc: 'Снять 10 роликов в городе',
    icon: 'camera',
    check: (s) => s.actionCounts.city >= 10,
    reward: [
      { icon: 'coins', label: '+350 ₽' },
      { icon: 'star', label: '+60 XP' },
    ],
  },
  {
    id: 'popularity',
    name: 'ПОПУЛЯРНОСТЬ',
    desc: 'Собрать 1 000 подписчиков',
    icon: 'burst',
    check: (s) => s.subscribers >= 1000,
    reward: [
      { icon: 'coins', label: '+1 000 ₽' },
      { icon: 'star', label: '+150 XP' },
    ],
  },
  {
    id: 'wealth',
    name: 'БОГАТСТВО',
    desc: 'Накопить 10 000 ₽',
    icon: 'coins',
    check: (s) => s.money >= 10000,
    reward: [
      { icon: 'coins', label: '+2 000 ₽' },
      { icon: 'star', label: '+200 XP' },
    ],
  },
  {
    id: 'local-star',
    name: 'МЕСТНАЯ ЗВЕЗДА',
    desc: 'Достичь 50 репутации',
    icon: 'megaphone',
    check: (s) => s.reputation >= 50,
    reward: [
      { icon: 'coins', label: '+1 500 ₽' },
      { icon: 'star', label: '+150 XP' },
    ],
  },
  {
    id: 'legend',
    name: 'ЛЕГЕНДА',
    desc: 'Достичь 30 уровня',
    icon: 'crown',
    check: (s) => s.level >= 30,
    reward: [
      { icon: 'coins', label: '+5 000 ₽' },
      { icon: 'star', label: '+1 000 XP' },
      { icon: 'crown', label: 'ТИТУЛ ЛЕГЕНДА' },
    ],
  },
];

// ------------------------------------------------------------
// Ежедневные задания
// ------------------------------------------------------------

export type QuestDef = {
  id: string;
  name: string;
  target: number;
  /** Ключ в DailyCounters. */
  counter: keyof GameState['daily'];
  reward: RewardLine[];
};

export const DAILY_QUESTS: QuestDef[] = [
  {
    id: 'q-videos',
    name: 'СНЯТЬ 2 ВИДЕО',
    target: 2,
    counter: 'videos',
    reward: [
      { icon: 'coins', label: '+150 ₽' },
      { icon: 'star', label: '+40 XP' },
    ],
  },
  {
    id: 'q-money',
    name: 'ЗАРАБОТАТЬ 1 000 ₽',
    target: 1000,
    counter: 'earned',
    reward: [
      { icon: 'coins', label: '+250 ₽' },
      { icon: 'star', label: '+50 XP' },
    ],
  },
  {
    id: 'q-subs',
    name: 'НАБРАТЬ 50 ПОДПИСЧИКОВ',
    target: 50,
    counter: 'subs',
    reward: [
      { icon: 'coins', label: '+200 ₽' },
      { icon: 'star', label: '+40 XP' },
    ],
  },
  {
    id: 'q-actions',
    name: 'ВЫПОЛНИТЬ 4 ДЕЙСТВИЯ',
    target: 4,
    counter: 'actions',
    reward: [
      { icon: 'coins', label: '+150 ₽' },
      { icon: 'star', label: '+30 XP' },
    ],
  },
];

// ------------------------------------------------------------
// События между действиями
// ------------------------------------------------------------

export type EventChoiceDef = {
  label: string;
  hint: string;
  apply: Partial<{
    energy: number;
    money: number;
    subs: number;
    rep: number;
    xp: number;
  }>;
};

export type EventDef = {
  id: string;
  text: string;
  minLevel?: number;
  minSubs?: number;
  minRep?: number;
  choices: EventChoiceDef[];
};

export const EVENTS: EventDef[] = [
  {
    id: 'e-recognized',
    text: 'Тебя узнали на улице! Прохожий снимает тебя на телефон.',
    minRep: 5,
    choices: [
      {
        label: 'СНЯТЬ СОВМЕСТНОЕ ВИДЕО',
        hint: '−10 энергии · +60 подписчиков',
        apply: { energy: -10, subs: 60 },
      },
      {
        label: 'ПРОДОЛЖИТЬ ПУТЬ',
        hint: '+30 XP',
        apply: { xp: 30 },
      },
    ],
  },
  {
    id: 'e-fan',
    text: 'К тебе подошёл подписчик. Говорит, что следит с самого начала.',
    minSubs: 20,
    choices: [
      {
        label: 'ПОБОЛТАТЬ',
        hint: '+5 репутации',
        apply: { rep: 5 },
      },
      {
        label: 'ПРОРЕКЛАМИРОВАТЬ КАНАЛ',
        hint: '−50 ₽ · +40 подписчиков',
        apply: { money: -50, subs: 40 },
      },
    ],
  },
  {
    id: 'e-rain',
    text: 'Начался дождь прямо перед съёмкой. Съёмочный план под угрозой.',
    choices: [
      {
        label: 'СНЯТЬ «ДОЖДЕВОЙ» КОНТЕНТ',
        hint: '−10 энергии · +40 подписчиков',
        apply: { energy: -10, subs: 40 },
      },
      {
        label: 'ПЕРЕЖДАТЬ ДОЖДЬ',
        hint: '+15 XP',
        apply: { xp: 15 },
      },
    ],
  },
  {
    id: 'e-coffee',
    text: 'Хозяин кафе предлагает бесплатный кофе в обмен на упоминание.',
    choices: [
      {
        label: 'СОГЛАСИТЬСЯ',
        hint: '+20 энергии',
        apply: { energy: 20 },
      },
      {
        label: 'СНЯТЬ СПОНСОРСКИЙ РОЛИК',
        hint: '+60 ₽ · +20 подписчиков',
        apply: { money: 60, subs: 20 },
      },
    ],
  },
  {
    id: 'e-friend',
    text: 'Старый друг зовёт прогуляться по набережной. У тебя планы.',
    choices: [
      {
        label: 'ПРОГУЛКА',
        hint: '+35 энергии',
        apply: { energy: 35 },
      },
      {
        label: 'СНЯТЬ ПРОГУЛКУ',
        hint: '−10 энергии · +30 подписчиков',
        apply: { energy: -10, subs: 30 },
      },
    ],
  },
  {
    id: 'e-order',
    text: 'Неожиданный заказ: местный магазин просит рекламный ролик!',
    minRep: 15,
    choices: [
      {
        label: 'ВЗЯТЬСЯ ЗА ЗАКАЗ',
        hint: '−15 энергии · +300 ₽',
        apply: { energy: -15, money: 300 },
      },
      {
        label: 'ОТКАЗАТЬСЯ',
        hint: '+20 XP',
        apply: { xp: 20 },
      },
    ],
  },
  {
    id: 'e-trend',
    text: 'В городе набирает обороты вирусный тренд. Ловить момент?',
    minLevel: 4,
    choices: [
      {
        label: 'СНЯТЬ ПАРОДИЮ',
        hint: '−20 энергии · +90 подписчиков',
        apply: { energy: -20, subs: 90 },
      },
      {
        label: 'ПРОПУСТИТЬ ТРЕНД',
        hint: '+25 XP',
        apply: { xp: 25 },
      },
    ],
  },
  {
    id: 'e-mentor',
    text: 'Старший блогер согласен дать совет.',
    minLevel: 5,
    choices: [
      {
        label: 'СПРОСИТЬ ПРО КАМЕРУ',
        hint: '+80 XP',
        apply: { xp: 80 },
      },
      {
        label: 'СПРОСИТЬ ПРО АУДИТОРИЮ',
        hint: '+40 подписчиков',
        apply: { subs: 40 },
      },
    ],
  },
  {
    id: 'e-cafe-ad',
    text: 'Кафе предлагает разместить твою рекламу у себя. Платит сразу.',
    minSubs: 100,
    choices: [
      {
        label: 'СОГЛАСИТЬСЯ',
        hint: '+150 ₽ · +10 репутации',
        apply: { money: 150, rep: 10 },
      },
      {
        label: 'ПОДУМАТЬ',
        hint: '+15 XP',
        apply: { xp: 15 },
      },
    ],
  },
  {
    id: 'e-comment',
    text: 'Первый негативный комментарий под роликом. Как ответишь?',
    minSubs: 100,
    choices: [
      {
        label: 'ОТВЕТИТЬ СПОКОЙНО',
        hint: '+5 репутации · +20 XP',
        apply: { rep: 5, xp: 20 },
      },
      {
        label: 'ИГНОРИРОВАТЬ',
        hint: '+10 XP',
        apply: { xp: 10 },
      },
    ],
  },
];

export const eventById = (id: string): EventDef | undefined =>
  EVENTS.find((e) => e.id === id);

// ------------------------------------------------------------
// Карта / локации
// ------------------------------------------------------------

export type LocationDef = {
  id: string;
  name: string;
  place: string;
  image: string;
  icon: IconName;
  desc: string;
  unlock: Partial<{ level: number; subs: number; rep: number }>;
  /** Специальная зона «СЕЗОН 02». */
  season2?: boolean;
};

export const LOCATIONS: LocationDef[] = [
  {
    id: 'start',
    name: 'ТОЧКА СТАРТА',
    place: 'ЯРОСЛАВЛЬ',
    image: 'archi-location-start.jpg',
    icon: 'pin',
    desc: 'Отсюда начинается путь ARCHI: город, характер и большая мечта.',
    unlock: { level: 1 },
  },
  {
    id: 'embankment',
    name: 'НАБЕРЕЖНАЯ',
    place: 'ЯРОСЛАВЛЬ',
    image: 'archi-location-yaroslavl.jpg',
    icon: 'camera',
    desc: 'Первые съёмки у воды. Волга запоминает каждого, кто к ней приходит.',
    unlock: { subs: 50 },
  },
  {
    id: 'filming',
    name: 'ЛОКАЦИЯ ДЛЯ СЪЁМОК',
    place: 'ЯРОСЛАВЛЬ',
    image: 'archi-location-filming.jpg',
    icon: 'clapper',
    desc: 'Место, где ролики находят свою аудиторию: свет, фон и характер.',
    unlock: { level: 5 },
  },
  {
    id: 'center',
    name: 'ЦЕНТР ГОРОДА',
    place: 'ЯРОСЛАВЛЬ',
    image: 'archi-location-yaroslavl.jpg',
    icon: 'home',
    desc: 'Центр города открывается тем, кого здесь уже знают в лицо.',
    unlock: { rep: 20 },
  },
  {
    id: 'stage',
    name: 'ОСОБЫЕ ЛОКАЦИИ',
    place: 'БОЛЬШАЯ СЦЕНА',
    image: 'archi-location-work.jpg',
    icon: 'burst',
    desc: 'Тысячи подписчиков — и перед ARCHI открываются особые места.',
    unlock: { subs: 1000 },
  },
  {
    id: 'season2',
    name: 'СЕЗОН 02',
    place: 'СКОРО',
    image: 'archi-location-work.jpg',
    icon: 'lock',
    desc: 'Легенда Ярославля завершает сезон 01. Впереди — новая история.',
    unlock: { level: 30 },
    season2: true,
  },
];

export const locationUnlocked = (
  location: LocationDef,
  state: { level: number; subscribers: number; reputation: number },
): boolean => {
  if (location.unlock.level !== undefined && state.level < location.unlock.level) {
    return false;
  }
  if (location.unlock.subs !== undefined && state.subscribers < location.unlock.subs) {
    return false;
  }
  if (location.unlock.rep !== undefined && state.reputation < location.unlock.rep) {
    return false;
  }
  return true;
};

export const locationConditionLabel = (location: LocationDef): string => {
  if (location.unlock.level !== undefined) return `УРОВЕНЬ ${location.unlock.level}`;
  if (location.unlock.subs !== undefined) return `${location.unlock.subs} ПОДПИСЧИКОВ`;
  if (location.unlock.rep !== undefined) return `${location.unlock.rep} РЕПУТАЦИИ`;
  return 'СКОРО';
};

// ------------------------------------------------------------
// Главы истории
// ------------------------------------------------------------

export type ChapterDef = {
  level: number;
  title: string;
  text: string;
};

export const CHAPTERS: ChapterDef[] = [
  {
    level: 1,
    title: 'НАЧАЛО ПУТИ',
    text: 'ARCHI начинает с нуля в Ярославле. Город, характер и большая мечта — стать легендой.',
  },
  {
    level: 2,
    title: 'ПЕРВЫЕ ДЕНЬГИ',
    text: 'Первые заработанные деньги. Маленький шаг, но уже свой.',
  },
  {
    level: 3,
    title: 'ПЕРВЫЕ ПОДПИСЧИКИ',
    text: 'Кто-то начинает следить за историей ARCHI. Теперь путь виден не только ему.',
  },
  {
    level: 5,
    title: 'ПЕРВЫЕ СЪЁМКИ',
    text: 'Камера, свет, город. Контент находит свою аудиторию.',
  },
  {
    level: 8,
    title: 'ПЕРВАЯ ПОПУЛЯРНОСТЬ',
    text: 'ARCHI узнают на улицах Ярославля. Город начинает отвечать.',
  },
  {
    level: 12,
    title: 'ПЕРВЫЙ ЗАКАЗ',
    text: 'Серьёзное предложение о сотрудничестве. Местные бренды заметили ARCHI.',
  },
  {
    level: 18,
    title: 'РОСТ',
    text: 'Каждый день — новый шаг. Команда, идеи, новый масштаб.',
  },
  {
    level: 25,
    title: 'ИЗВЕСТНОСТЬ',
    text: 'Имя ARCHI звучит по всему городу. До легенды — рукой подать.',
  },
  {
    level: 30,
    title: 'ЛЕГЕНДА',
    text: '30 уровень. ARCHI стал легендой Ярославля. Впереди — СЕЗОН 02.',
  },
];

export const chapterAt = (level: number): ChapterDef | undefined =>
  CHAPTERS.find((c) => c.level === level);
// ============================================================
// ПУТЬ ARCHI — чистая игровая логика
// ============================================================

import {
  ACHIEVEMENTS,
  ACTIONS,
  CHAPTERS,
  DAILY_QUESTS,
  actionById,
  chapterAt,
  getStage,
  upgradeById,
  type AchievementDef,
} from './data';
import type {
  ActionId,
  GameState,
  Reward,
  RewardLine,
  StageId,
} from './types';

export const MAX_ENERGY = 100;
export const REST_ENERGY = 45;
export const STORAGE_KEY = 'put-archi-game-v3';

export const todayStr = (): string => {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
};

export const xpNeeded = (level: number): number => 100 + (level - 1) * 35;

export const formatMoney = (value: number): string =>
  new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(Math.max(0, Math.round(value)))
    .replace(/\u00a0/g, ' ');

export const formatCompact = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1).replace('.', ',')} млн`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace('.', ',')} тыс.`;
  }
  return formatMoney(value);
};

export const moneyBuffActive = (state: GameState): boolean =>
  Date.now() < state.moneyBuffUntil;

/** Сколько XP нужно, чтобы дойти от текущего уровня до следующего. */
export const xpProgress = (state: GameState): number => {
  const needed = xpNeeded(state.level);
  return Math.min(100, (state.xp / needed) * 100);
};

export const totalActionsDone = (state: GameState): number =>
  Object.values(state.actionCounts).reduce((sum, n) => sum + n, 0);

// ------------------------------------------------------------
// Добавление опыта с повышением уровня
// ------------------------------------------------------------

export type LevelResult = {
  state: GameState;
  levelsGained: number;
  oldLevel: number;
};

export function addXp(state: GameState, amount: number): LevelResult {
  let level = state.level;
  let xp = state.xp + Math.max(0, amount);
  let needed = xpNeeded(level);
  let gained = 0;

  while (xp >= needed) {
    xp -= needed;
    level += 1;
    gained += 1;
    needed = xpNeeded(level);
  }

  return {
    state: { ...state, level, xp },
    levelsGained: gained,
    oldLevel: state.level,
  };
}

// ------------------------------------------------------------
// Результаты действий
// ------------------------------------------------------------

export type Gains = {
  money: number;
  subs: number;
  rep: number;
  xp: number;
};

export function computeGains(state: GameState, actionId: ActionId): Gains {
  const { level } = state;
  const u = state.upgrades;
  const mult = moneyBuffActive(state) ? 2 : 1;

  switch (actionId) {
    case 'video': {
      const subs = Math.round(
        8 + level * 1.2 + u.camera * 3 + u.phone * 2 + u.phone * 0.8,
      );
      const money = Math.round((10 + level * 2 + u.phone * 4) * mult);
      return { money, subs, rep: 1, xp: 18 };
    }
    case 'work': {
      const money = Math.round((55 + level * 6 + u.studio * 15) * mult);
      return { money, subs: 0, rep: 1, xp: 14 };
    }
    case 'stream': {
      const subs = Math.round(10 + level * 1.5 + u.mic * 4);
      const rep = Math.round(3 + level * 0.2 + u.mic + u.studio);
      const money = Math.round((15 + level * 2) * mult);
      return { money, subs, rep, xp: 22 };
    }
    case 'city': {
      const money = Math.round((30 + level * 4 + u.light * 10) * mult);
      const subs = Math.round(6 + level * 1 + u.drone * 5);
      return { money, subs, rep: 1, xp: 16 };
    }
    case 'rest':
      return { money: 0, subs: 0, rep: 0, xp: 4 };
  }
}

export type ActionOutcome = {
  next: GameState;
  gains: Gains;
  leveledUp: boolean;
  stageChanged: boolean;
  newStage: StageId;
  /** Модалки, которые нужно поставить в очередь (уровень, новый образ). */
  rewards: Reward[];
};

export function applyAction(state: GameState, actionId: ActionId): ActionOutcome {
  const action = actionId;
  const gains = computeGains(state, action);
  const rewards: Reward[] = [];

  const energyCost = actionId === 'rest' ? 0 : actionById(action).energyCost;

  let next: GameState = {
    ...state,
    energy: Math.max(
      0,
      Math.min(MAX_ENERGY, state.energy - energyCost),
    ),
    money: state.money + gains.money,
    subscribers: state.subscribers + gains.subs,
    reputation: Math.min(100, state.reputation + gains.rep),
    totalEarned: state.totalEarned + Math.max(0, gains.money),
    actionCounts: {
      ...state.actionCounts,
      [action]: state.actionCounts[action] + 1,
    },
    lastTick: Date.now(),
    totalActionsDone: state.totalActionsDone + 1,
    sinceAd: state.sinceAd + 1,
    daily: {
      videos: state.daily.videos + (actionId === 'video' ? 1 : 0),
      earned: state.daily.earned + Math.max(0, gains.money),
      subs: state.daily.subs + Math.max(0, gains.subs),
      actions: state.daily.actions + 1,
    },
  };

  // Отдых: не тратит энергию, а восстанавливает.
  if (actionId === 'rest') {
    next = {
      ...next,
      energy: Math.min(MAX_ENERGY, state.energy + REST_ENERGY),
      daily: {
        ...next.daily,
        actions: next.daily.actions + 1,
      },
    };
  }

  // XP и уровни.
  const beforeLevel = next.level;
  const leveled = addXp(next, gains.xp);
  next = leveled.state;
  const leveledUp = leveled.levelsGained > 0;

  if (leveledUp) {
    // Награда за новый уровень.
    const moneyReward = 30 * next.level;
    next = {
      ...next,
      money: next.money + moneyReward,
      totalEarned: next.totalEarned + moneyReward,
    };
    rewards.push({
      id: `level-${next.level}`,
      kind: 'level',
      title: `УРОВЕНЬ ${next.level}!`,
      text: leveled.levelsGained > 1 ? `Сразу +${leveled.levelsGained} уровня!` : 'Путь продолжается. Так держать!',
      items: [
        { icon: 'coins', label: `+${formatMoney(moneyReward)} ₽` },
      ],
    });
  }

  // Смена образа персонажа.
  const oldStage = getStage(beforeLevel);
  const newStage = getStage(next.level);
  const stageChanged = oldStage.id !== newStage.id;

  if (stageChanged) {
    next = {
      ...next,
      pendingRewards: [
        ...next.pendingRewards,
        {
          id: `stage-${newStage.id}`,
          kind: 'stage',
          title: `ARCHI — ${newStage.name}`,
          text: 'Новый образ открыт. Легенда становится ближе.',
          art: newStage.id,
          items: [{ icon: 'sparkle', label: 'НОВЫЙ ОБРАЗ ОТКРЫТ' }],
        },
      ],
    };
  }

  return { next, gains, leveledUp, stageChanged, newStage: newStage.id, rewards };
}

// ------------------------------------------------------------
// События: выбор варианта
// ------------------------------------------------------------

export function applyEventChoice(
  state: GameState,
  apply: { energy?: number; money?: number; subs?: number; rep?: number; xp?: number },
): { next: GameState; rewards: Reward[] } {
  const rewards: Reward[] = [];
  let next: GameState = {
    ...state,
    energy: Math.max(
      0,
      Math.min(MAX_ENERGY, state.energy + (apply.energy ?? 0)),
    ),
    money: Math.max(0, state.money + (apply.money ?? 0)),
    subscribers: Math.max(0, state.subscribers + (apply.subs ?? 0)),
    reputation: Math.max(0, Math.min(100, state.reputation + (apply.rep ?? 0))),
    daily: {
      videos: state.daily.videos,
      earned: state.daily.earned + Math.max(0, apply.money ?? 0),
      subs: state.daily.subs + Math.max(0, apply.subs ?? 0),
      actions: state.daily.actions,
    },
    activeEvent: null,
    eventCooldownUntil: Date.now() + 75_000,
    lastTick: Date.now(),
  };
  if ((apply.money ?? 0) > 0) {
    next = { ...next, totalEarned: next.totalEarned + apply.money! };
  }
  if ((apply.xp ?? 0) > 0) {
    const leveled = addXp(next, apply.xp!);
    next = leveled.state;
    if (leveled.levelsGained > 0) {
      const moneyReward = 30 * next.level;
      next = {
        ...next,
        money: next.money + moneyReward,
        totalEarned: next.totalEarned + moneyReward,
      };
      rewards.push({
        id: `level-${next.level}-ev`,
        kind: 'level',
        title: `УРОВЕНЬ ${next.level}!`,
        text: 'Событие принесло новый уровень!',
        items: [{ icon: 'coins', label: `+${formatMoney(moneyReward)} ₽` }],
      });
    }
    const seen = next.seenChapters;
    const chapter = chapterAt(next.level);
    if (chapter && !seen.includes(chapter.title)) {
      rewards.push({
        id: `chapter-${chapter.title}`,
        kind: 'chapter',
        title: `ГЛАВА · ${chapter.title}`,
        text: chapter.text,
        items: [{ icon: 'flag', label: 'ИСТОРИЯ ПРОДОЛЖАЕТСЯ' }],
      });
      next = { ...next, seenChapters: [...seen, chapter.title] };
    }
  }
  return { next, rewards };
}

// ------------------------------------------------------------
// Достижения и главы: поиск новых
// ------------------------------------------------------------

export function newlyUnlockedAchievements(state: GameState): AchievementDef[] {
  return ACHIEVEMENTS.filter(
    (a) => !state.achieved.includes(a.id) && a.check(state),
  );
}

export function newlySeenChapters(state: GameState): typeof CHAPTERS {
  return CHAPTERS.filter(
    (c) => c.level <= state.level && !state.seenChapters.includes(c.title),
  );
}

// ------------------------------------------------------------
// Ежедневные задания
// ------------------------------------------------------------

export function questProgress(state: GameState): Record<string, number> {
  const result: Record<string, number> = {};
  for (const quest of DAILY_QUESTS) {
    result[quest.id] = state.daily[quest.counter] as number;
  }
  return result;
}

export function questClaimed(state: GameState, questId: string): boolean {
  return state.claimedQuests.includes(questId);
}

// ------------------------------------------------------------
// Инициализация и загрузка
// ------------------------------------------------------------

export const emptyCounters = {
  videos: 0,
  earned: 0,
  subs: 0,
  actions: 0,
};

const emptyUpgrades = {
  phone: 0,
  mic: 0,
  camera: 0,
  light: 0,
  drone: 0,
  studio: 0,
};

const emptyActionCounts = {
  video: 0,
  work: 0,
  stream: 0,
  city: 0,
  rest: 0,
};

export function initialState(): GameState {
  return {
    version: 3,
    season: 1,
    money: 300,
    level: 1,
    xp: 0,
    energy: MAX_ENERGY,
    subscribers: 0,
    reputation: 0,
    totalEarned: 0,
    totalSpent: 0,
    lastTick: Date.now(),
    lastDay: todayStr(),
    actionCounts: { ...emptyActionCounts },
    upgrades: { ...emptyUpgrades },
    achieved: [],
    seenChapters: [],
    unlockedLocations: ['start'],
    pendingRewards: [],
    activeEvent: null,
    eventCooldownUntil: 0,
    daily: { ...emptyCounters },
    claimedQuests: [],
    introSeen: false,
    moneyBuffUntil: 0,
    sinceAd: 0,
    pendingAds: 0,
    totalActionsDone: 0,
  };
}

export function loadGame(): GameState {
  const fallback = initialState();
  if (typeof window === 'undefined') return fallback;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return fallback;

    const parsed = JSON.parse(stored) as Partial<GameState>;
    const base = initialState();

    return {
      ...base,
      ...parsed,
      upgrades: { ...base.upgrades, ...(parsed.upgrades ?? {}) },
      actionCounts: { ...base.actionCounts, ...(parsed.actionCounts ?? {}) },
      daily: { ...base.daily, ...(parsed.daily ?? {}) },
      achieved: Array.isArray(parsed.achieved) ? parsed.achieved : [],
      seenChapters: Array.isArray(parsed.seenChapters) ? parsed.seenChapters : [],
      unlockedLocations: Array.isArray(parsed.unlockedLocations)
        ? parsed.unlockedLocations
        : ['start'],
      pendingRewards: Array.isArray(parsed.pendingRewards)
        ? parsed.pendingRewards
        : [],
      claimedQuests: Array.isArray(parsed.claimedQuests)
        ? parsed.claimedQuests
        : [],
      money: Math.max(0, Number(parsed.money ?? base.money)),
      level: Math.max(1, Number(parsed.level ?? 1)),
      xp: Math.max(0, Number(parsed.xp ?? 0)),
      energy: Math.min(MAX_ENERGY, Math.max(0, Number(parsed.energy ?? MAX_ENERGY))),
      subscribers: Math.max(0, Number(parsed.subscribers ?? 0)),
      reputation: Math.min(100, Math.max(0, Number(parsed.reputation ?? 0))),
      totalEarned: Math.max(0, Number(parsed.totalEarned ?? 0)),
      totalSpent: Math.max(0, Number(parsed.totalSpent ?? 0)),
      lastTick: Number(parsed.lastTick ?? Date.now()),
      lastDay: typeof parsed.lastDay === 'string' ? parsed.lastDay : todayStr(),
      moneyBuffUntil: Number(parsed.moneyBuffUntil ?? 0),
      sinceAd: Math.max(0, Number(parsed.sinceAd ?? 0)),
      pendingAds: Math.max(0, Number(parsed.pendingAds ?? 0)),
      totalActionsDone: Math.max(0, Number(parsed.totalActionsDone ?? 0)),
      eventCooldownUntil: Number(parsed.eventCooldownUntil ?? 0),
    };
  } catch {
    return fallback;
  }
}

// ------------------------------------------------------------
// Вспомогательные наборы наград
// ------------------------------------------------------------

export const moneyLine = (amount: number): RewardLine => ({
  icon: 'coins',
  label: `+${formatMoney(amount)} ₽`,
});

export const xpLine = (amount: number): RewardLine => ({
  icon: 'star',
  label: `+${amount} XP`,
});

export const subsLine = (amount: number): RewardLine => ({
  icon: 'subs',
  label: `+${amount} подписчиков`,
});

export const repLine = (amount: number): RewardLine => ({
  icon: 'megaphone',
  label: `+${amount} репутации`,
});

// ------------------------------------------------------------
// Улучшения
// ------------------------------------------------------------

export const upgradeCost = (upgradeId: string, level: number): number => {
  const def = upgradeById(upgradeId as Parameters<typeof upgradeById>[0]);
  return Math.round(def.price * Math.pow(1.6, level));
};

export function buyUpgrade(
  state: GameState,
  upgradeId: keyof GameState['upgrades'],
): { next: GameState; ok: boolean; cost: number; rewards: Reward[] } {
  const def = upgradeById(upgradeId);
  const level = state.upgrades[upgradeId];
  const cost = upgradeCost(upgradeId, level);
  if (state.money < cost) {
    return { next: state, ok: false, cost, rewards: [] };
  }
  const next: GameState = {
    ...state,
    money: state.money - cost,
    totalSpent: state.totalSpent + cost,
    upgrades: { ...state.upgrades, [upgradeId]: level + 1 },
    lastTick: Date.now(),
  };
  const rewards: Reward[] = [
    {
      id: `upgrade-${upgradeId}-${level + 1}`,
      kind: 'reward',
      title: `${def.name} УЛУЧШЕН`,
      text: 'Новая экипировка уже работает на пути к легенде.',
      items: [{ icon: def.icon, label: `УРОВЕНЬ ${level + 1}` }],
    },
  ];
  return { next, ok: true, cost, rewards };
}


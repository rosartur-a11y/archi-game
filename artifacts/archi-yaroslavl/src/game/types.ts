// ============================================================
// ПУТЬ ARCHI — типы игрового состояния и контента
// ============================================================

export type StageId = 'novice' | 'growth' | 'success' | 'legend';

export type ActionId = 'video' | 'work' | 'stream' | 'city' | 'rest';

export type UpgradeId = 'phone' | 'mic' | 'camera' | 'light' | 'drone' | 'studio';

export type IconName =
  | 'coins'
  | 'star'
  | 'bolt'
  | 'subs'
  | 'megaphone'
  | 'clapper'
  | 'briefcase'
  | 'broadcast'
  | 'moon'
  | 'camera'
  | 'map'
  | 'growth'
  | 'trophy'
  | 'lock'
  | 'check'
  | 'x'
  | 'plus'
  | 'gift'
  | 'quest'
  | 'burst'
  | 'pin'
  | 'down'
  | 'right'
  | 'flag'
  | 'sparkle'
  | 'phone'
  | 'mic'
  | 'bulb'
  | 'drone'
  | 'studio'
  | 'crown'
  | 'home'
  | 'clock';

/** Одна строка награды в модалке: иконка + текст. */
export type RewardLine = {
  icon: IconName;
  label: string;
};

/** Модалка с наградой/главой/новым образом. */
export type Reward = {
  id: string;
  kind: 'reward' | 'chapter' | 'stage' | 'level' | 'intro';
  title: string;
  text?: string;
  /** Спрайт стадии, который показать в модалке. */
  art?: StageId;
  items: RewardLine[];
  /** Денежный подарок, выдаётся при закрытии модалки. */
  gift?: number;
};

export type DailyCounters = {
  videos: number;
  earned: number;
  subs: number;
  actions: number;
};

export type GameState = {
  version: number;
  /** Архитектура для СЕЗОН 02: сейчас всегда 1. */
  season: 1;

  money: number;
  level: number;
  xp: number;
  energy: number;
  subscribers: number;
  reputation: number;

  totalEarned: number;
  totalSpent: number;

  lastTick: number;
  lastDay: string;

  actionCounts: Record<ActionId, number>;
  upgrades: Record<UpgradeId, number>;

  /** id открытых достижений. */
  achieved: string[];
  /** id просмотренных глав истории. */
  seenChapters: string[];
  /** id открытых локаций на карте. */
  unlockedLocations: string[];

  /** Очередь модалок с наградами. */
  pendingRewards: Reward[];
  /** Активное сюжетное событие (id), если есть. */
  activeEvent: string | null;
  eventCooldownUntil: number;

  /** Счётчики ежедневных заданий. */
  daily: DailyCounters;
  claimedQuests: string[];

  /** Было ли показано интро. */
  introSeen: boolean;

  /** x2 к деньгам до этого момента (timestamp). */
  moneyBuffUntil: number;

  /** Сколько действий сделано после последней межстраничной рекламы. */
  sinceAd: number;
  /** Очередь межстраничной рекламы (заглушка). */
  pendingAds: number;

  totalActionsDone: number;
};
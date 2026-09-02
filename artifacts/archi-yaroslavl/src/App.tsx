import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ArrowUpRight,
  BatteryCharging,
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Flame,
  Hammer,
  House,
  LockKeyhole,
  Moon,
  Phone,
  Play,
  Rocket,
  Sparkles,
  Star,
  Trophy,
  UserRound,
  Video,
  WalletCards,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

type ActionId = 'work' | 'video' | 'rest' | 'develop';
type UpgradeId = 'phone' | 'office' | 'team' | 'brand';
type View = 'home' | 'shop' | 'achievements';

type GameState = {
  money: number;
  level: number;
  xp: number;
  energy: number;
  subscribers: number;
  reputation: number;
  totalEarned: number;
  lastTick: number;
  upgrades: Record<UpgradeId, number>;
  actionCounts: Record<ActionId, number>;
};

type Upgrade = {
  id: UpgradeId;
  name: string;
  description: string;
  icon: LucideIcon;
  baseCost: number;
  factor: number;
};

const STORAGE_KEY = 'archi-yaroslavl-game-v2';
const MAX_ENERGY = 100;

const UPGRADES: Upgrade[] = [
  {
    id: 'phone',
    name: 'Телефон Pro',
    description: '+6 подписчиков за видео',
    icon: Phone,
    baseCost: 180,
    factor: 1.5,
  },
  {
    id: 'office',
    name: 'Уютный офис',
    description: '+8 ₽ за работу · +1,2 ₽/сек',
    icon: Building2,
    baseCost: 320,
    factor: 1.58,
  },
  {
    id: 'team',
    name: 'Контент-команда',
    description: '+14 подписчиков за видео · +2,8 ₽/сек',
    icon: Video,
    baseCost: 650,
    factor: 1.64,
  },
  {
    id: 'brand',
    name: 'Личный бренд',
    description: '+3 репутации за развитие',
    icon: Sparkles,
    baseCost: 1100,
    factor: 1.72,
  },
];

const ACTIONS: Array<{
  id: ActionId;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  accent: string;
  energyCost?: number;
}> = [
  {
    id: 'work',
    title: 'Работать',
    subtitle: 'Деньги и репутация',
    icon: BriefcaseBusiness,
    accent: 'lime',
    energyCost: 14,
  },
  {
    id: 'video',
    title: 'Снять видео',
    subtitle: 'Подписчики и охваты',
    icon: Play,
    accent: 'violet',
    energyCost: 18,
  },
  {
    id: 'rest',
    title: 'Отдохнуть',
    subtitle: 'Восстановить энергию',
    icon: Moon,
    accent: 'blue',
  },
  {
    id: 'develop',
    title: 'Развить бизнес',
    subtitle: 'Рост бренда и аудитории',
    icon: Rocket,
    accent: 'gold',
    energyCost: 24,
  },
];

const emptyUpgrades = (): Record<UpgradeId, number> => ({
  phone: 0,
  office: 0,
  team: 0,
  brand: 0,
});

const emptyActionCounts = (): Record<ActionId, number> => ({
  work: 0,
  video: 0,
  rest: 0,
  develop: 0,
});

const getInitialGame = (): GameState => ({
  money: 500,
  level: 1,
  xp: 0,
  energy: MAX_ENERGY,
  subscribers: 0,
  reputation: 0,
  totalEarned: 0,
  lastTick: Date.now(),
  upgrades: emptyUpgrades(),
  actionCounts: emptyActionCounts(),
});

const getXpNeeded = (level: number) => 90 + (level - 1) * 55;

const addExperience = (game: GameState, amount: number): GameState => {
  let level = game.level;
  let xp = game.xp + amount;
  let needed = getXpNeeded(level);

  while (xp >= needed) {
    xp -= needed;
    level += 1;
    needed = getXpNeeded(level);
  }

  return { ...game, level, xp };
};

const getPassiveIncome = (upgrades: Record<UpgradeId, number>) =>
  upgrades.office * 1.2 + upgrades.team * 2.8;

const getUpgradeCost = (upgrade: Upgrade, level: number) =>
  Math.round(upgrade.baseCost * Math.pow(upgrade.factor, level));

const getSavedGame = (): GameState => {
  const fallback = getInitialGame();
  if (typeof window === 'undefined') return fallback;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return fallback;
    const parsed = JSON.parse(stored) as Partial<GameState>;
    const upgrades = { ...emptyUpgrades(), ...(parsed.upgrades ?? {}) };
    const actionCounts = { ...emptyActionCounts(), ...(parsed.actionCounts ?? {}) };
    const passive = getPassiveIncome(upgrades);
    const lastTick = Number(parsed.lastTick ?? Date.now());
    const awaySeconds = Math.min(
      Math.max((Date.now() - lastTick) / 1000, 0),
      60 * 60 * 4,
    );
    const awayIncome = passive * awaySeconds;

    return {
      ...fallback,
      ...parsed,
      money: Math.max(0, Number(parsed.money ?? fallback.money) + awayIncome),
      level: Math.max(1, Number(parsed.level ?? fallback.level)),
      xp: Math.max(0, Number(parsed.xp ?? fallback.xp)),
      energy: Math.min(
        MAX_ENERGY,
        Math.max(0, Number(parsed.energy ?? fallback.energy) + awaySeconds * 0.8),
      ),
      subscribers: Math.max(0, Number(parsed.subscribers ?? 0)),
      reputation: Math.max(0, Number(parsed.reputation ?? 0)),
      totalEarned: Math.max(
        0,
        Number(parsed.totalEarned ?? 0) + awayIncome,
      ),
      upgrades,
      actionCounts,
      lastTick: Date.now(),
    };
  } catch {
    return fallback;
  }
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
    .format(Math.max(0, value))
    .replace(/\u00a0/g, ' ');

const formatCompact = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1).replace('.', ',')} млн`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace('.', ',')} тыс.`;
  }
  return formatMoney(value);
};

function Home() {
  const [game, setGame] = useState<GameState>(getSavedGame);
  const [view, setView] = useState<View>('home');
  const [pulse, setPulse] = useState(false);
  const [floatingValues, setFloatingValues] = useState<
    Array<{ id: number; text: string; kind: string }>
  >([]);
  const [toast, setToast] = useState('');
  const [loadedFromSave] = useState(
    () =>
      typeof window !== 'undefined' &&
      Boolean(window.localStorage.getItem(STORAGE_KEY)),
  );

  const passiveIncome = useMemo(
    () => getPassiveIncome(game.upgrades),
    [game.upgrades],
  );
  const xpNeeded = getXpNeeded(game.level);
  const xpProgress = Math.min(100, (game.xp / xpNeeded) * 100);
  const actionProgress = game.actionCounts.work + game.actionCounts.video + game.actionCounts.develop;

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
  }, [game]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setGame((current) => {
        const now = Date.now();
        const elapsed = Math.max(0, (now - current.lastTick) / 1000);
        if (elapsed < 0.05) return current;
        const income = passiveIncome * elapsed;
        return {
          ...current,
          money: current.money + income,
          totalEarned: current.totalEarned + income,
          energy: Math.min(MAX_ENERGY, current.energy + elapsed * 0.8),
          lastTick: now,
        };
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [passiveIncome]);

  useEffect(() => {
    if (!loadedFromSave) return;
    setToast('Сохранение загружено');
    const timer = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timer);
  }, [loadedFromSave]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  };

  const addFloat = (text: string, kind: string) => {
    const id = Date.now() + Math.random();
    setFloatingValues((current) => [
      ...current.slice(-3),
      { id, text, kind },
    ]);
    window.setTimeout(() => {
      setFloatingValues((current) => current.filter((item) => item.id !== id));
    }, 900);
  };

  const runAction = (actionId: ActionId) => {
    if (actionId === 'rest') {
      if (game.energy >= MAX_ENERGY) {
        showToast('Энергия уже полностью восстановлена');
        return;
      }

      setGame((current) => {
        const next = addExperience(
          {
            ...current,
            energy: Math.min(MAX_ENERGY, current.energy + 38),
            reputation: Math.min(100, current.reputation + 1),
            actionCounts: {
              ...current.actionCounts,
              rest: current.actionCounts.rest + 1,
            },
            lastTick: Date.now(),
          },
          8,
        );
        return next;
      });
      addFloat('+38 энергии', 'blue');
      showToast('Пауза пошла на пользу');
      return;
    }

    const action = ACTIONS.find((item) => item.id === actionId);
    if (!action || game.energy < (action.energyCost ?? 0)) {
      showToast('Нужно восстановить энергию');
      return;
    }

    const needsDevelopmentMoney = actionId === 'develop' ? 125 : 0;
    if (game.money < needsDevelopmentMoney) {
      showToast(`Нужно ещё ${formatMoney(needsDevelopmentMoney - game.money)} ₽`);
      return;
    }

    let resultText = '';
    let resultKind = 'lime';
    setGame((current) => {
      let next: GameState = {
        ...current,
        money: current.money - needsDevelopmentMoney,
        energy: Math.max(0, current.energy - (action.energyCost ?? 0)),
        actionCounts: {
          ...current.actionCounts,
          [actionId]: current.actionCounts[actionId] + 1,
        },
        lastTick: Date.now(),
      };

      if (actionId === 'work') {
        const earned = 38 + current.upgrades.office * 8 + current.level * 4;
        next = {
          ...next,
          money: next.money + earned,
          totalEarned: next.totalEarned + earned,
          reputation: Math.min(100, next.reputation + 2),
        };
        resultText = `+${formatMoney(earned)} ₽`;
        resultKind = 'lime';
      }

      if (actionId === 'video') {
        const newSubscribers = 8 + current.upgrades.phone * 6 + current.upgrades.team * 14;
        const earned = 18 + current.upgrades.team * 3;
        next = {
          ...next,
          money: next.money + earned,
          totalEarned: next.totalEarned + earned,
          subscribers: next.subscribers + newSubscribers,
          reputation: Math.min(100, next.reputation + 3),
        };
        resultText = `+${newSubscribers} подписчиков`;
        resultKind = 'violet';
      }

      if (actionId === 'develop') {
        const newSubscribers = 18 + current.upgrades.brand * 8;
        const newReputation = 7 + current.upgrades.brand * 3;
        next = {
          ...next,
          subscribers: next.subscribers + newSubscribers,
          reputation: Math.min(100, next.reputation + newReputation),
        };
        resultText = `+${newReputation} репутации`;
        resultKind = 'gold';
      }

      return addExperience(next, actionId === 'work' ? 18 : actionId === 'video' ? 24 : 42);
    });

    addFloat(resultText, resultKind);
    setPulse(true);
    window.setTimeout(() => setPulse(false), 260);
    showToast(
      actionId === 'develop'
        ? 'Бизнес двигается вверх'
        : actionId === 'video'
          ? 'Видео опубликовано'
          : 'Работа сделана',
    );
  };

  const buyUpgrade = (upgrade: Upgrade) => {
    const level = game.upgrades[upgrade.id];
    const cost = getUpgradeCost(upgrade, level);
    if (game.money < cost) {
      showToast('Сначала соберите ещё немного капитала');
      return;
    }

    setGame((current) => ({
      ...current,
      money: current.money - cost,
      upgrades: {
        ...current.upgrades,
        [upgrade.id]: current.upgrades[upgrade.id] + 1,
      },
      lastTick: Date.now(),
    }));
    showToast(`${upgrade.name} улучшен`);
  };

  const canRunAction = (action: (typeof ACTIONS)[number]) =>
    action.id === 'rest'
      ? game.energy < MAX_ENERGY
      : game.energy >= (action.energyCost ?? 0) &&
        (action.id !== 'develop' || game.money >= 125);

  return (
    <div className="game-shell">
      <div className="ambient-orb orb-one" aria-hidden="true" />
      <div className="ambient-orb orb-two" aria-hidden="true" />

      <main className="app-frame">
        <header className="topbar">
          <div className="brand-mark">
            <div className="brand-symbol" aria-hidden="true">
              <span>A</span>
            </div>
            <div>
              <div className="brand-name">ПУТЬ ARCHI</div>
              <div className="brand-subtitle">Ярославль / сезон 01</div>
            </div>
          </div>
          <div className="save-status">
            <span className="save-dot" aria-hidden="true" />
            автосохранение
          </div>
        </header>

        <section className={`stat-board ${pulse ? 'pulse' : ''}`} aria-label="Показатели ARCHI">
          <div className="stat-item stat-money">
            <span className="stat-emoji" aria-hidden="true">💰</span>
            <span className="stat-label">деньги</span>
            <strong>{formatMoney(game.money)} ₽</strong>
          </div>
          <div className="stat-item stat-level">
            <span className="stat-emoji" aria-hidden="true">⭐</span>
            <span className="stat-label">уровень</span>
            <strong>{game.level}</strong>
          </div>
          <div className="stat-item stat-energy">
            <span className="stat-emoji" aria-hidden="true">❤️</span>
            <span className="stat-label">энергия</span>
            <strong>{Math.round(game.energy)}</strong>
          </div>
          <div className="stat-item stat-subscribers">
            <span className="stat-emoji" aria-hidden="true">📱</span>
            <span className="stat-label">подписчики</span>
            <strong>{formatCompact(game.subscribers)}</strong>
          </div>
          <div className="stat-item stat-reputation">
            <span className="stat-emoji" aria-hidden="true">🔥</span>
            <span className="stat-label">репутация</span>
            <strong>{game.reputation}</strong>
          </div>
        </section>

        <div className="energy-line">
          <div className="energy-line-copy">
            <span><BatteryCharging size={13} aria-hidden="true" /> заряд ARCHI</span>
            <strong>{Math.round(game.energy)} / {MAX_ENERGY}</strong>
          </div>
          <div className="energy-track" aria-label={`Энергия ${Math.round(game.energy)} из ${MAX_ENERGY}`}>
            <div className="energy-fill" style={{ width: `${game.energy}%` }} />
          </div>
        </div>

        {view === 'home' && (
          <div className="home-view">
            <section className="hero-card">
              <div className="hero-copy">
                <div className="eyebrow">точка старта · ярославль</div>
                <h1>С нуля.<br /><em>По-своему.</em></h1>
                <p>Каждое действие приближает ARCHI к своему первому большому проекту.</p>
              </div>
              <div className="hero-stamp" aria-hidden="true">
                <span>01</span>
                <small>путь</small>
              </div>
            </section>

            <section className="level-card" aria-label="Прокачка персонажа">
              <div className="level-card-top">
                <div className="level-avatar" aria-hidden="true"><UserRound size={19} /></div>
                <div>
                  <div className="eyebrow">прокачка ARCHI</div>
                  <h2>Уровень {game.level}</h2>
                </div>
                <span className="level-badge">+{xpNeeded - game.xp} XP</span>
              </div>
              <div className="xp-copy">
                <span>опыт пути</span>
                <strong>{game.xp} / {xpNeeded}</strong>
              </div>
              <div className="xp-track" role="progressbar" aria-valuenow={Math.round(xpProgress)} aria-valuemin={0} aria-valuemax={100} aria-label="Опыт до следующего уровня">
                <div className="xp-fill" style={{ width: `${xpProgress}%` }} />
              </div>
              <div className="level-footer">
                <span><Zap size={12} aria-hidden="true" /> {actionProgress} действий в сезоне</span>
                <span>следующий уровень <ChevronRight size={12} aria-hidden="true" /></span>
              </div>
            </section>

            <section className="actions-section" aria-label="Действия ARCHI">
              <div className="section-heading-row">
                <div>
                  <div className="eyebrow">решение за вами</div>
                  <h2 className="section-title">Что делаем сегодня?</h2>
                </div>
                {passiveIncome > 0 && (
                  <div className="passive-pill">
                    <Clock3 size={13} aria-hidden="true" />
                    +{formatMoney(passiveIncome)} ₽/сек
                  </div>
                )}
              </div>

              <div className="action-grid">
                {ACTIONS.map((action) => {
                  const Icon = action.icon;
                  const isReady = canRunAction(action);
                  const isDevelop = action.id === 'develop';
                  return (
                    <button
                      className={`action-card action-${action.accent}`}
                      key={action.id}
                      type="button"
                      onClick={() => runAction(action.id)}
                      disabled={!isReady}
                      data-testid={`button-action-${action.id}`}
                    >
                      <span className="action-icon"><Icon size={21} aria-hidden="true" /></span>
                      <span className="action-main">
                        <strong>{action.title}</strong>
                        <small>{action.subtitle}</small>
                      </span>
                      <span className="action-effect">
                        {action.id === 'work' && `+${formatMoney(38 + game.upgrades.office * 8 + game.level * 4)} ₽`}
                        {action.id === 'video' && `+${8 + game.upgrades.phone * 6 + game.upgrades.team * 14} подпис.`}
                        {action.id === 'rest' && '+38 энергия'}
                        {isDevelop && '125 ₽'}
                      </span>
                      <span className="action-cost">
                        {action.energyCost ? `−${action.energyCost} энергии` : 'без затрат'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="season-card">
              <div className="season-icon" aria-hidden="true"><CircleDollarSign size={21} /></div>
              <div>
                <div className="eyebrow">личный капитал</div>
                <h2>{formatCompact(game.totalEarned)} ₽ заработано за путь</h2>
                <p>{passiveIncome > 0 ? 'Ваши активы работают, пока вы отдыхаете.' : 'Купите первое усиление, чтобы деньги начали работать сами.'}</p>
              </div>
              <ArrowUpRight size={18} aria-hidden="true" />
            </section>
          </div>
        )}

        {view === 'shop' && (
          <section className="shop-view">
            <section className="page-intro">
              <div className="eyebrow">инвестируйте в себя</div>
              <h1>Усиления</h1>
              <p>Каждая покупка меняет то, как ARCHI зарабатывает, растёт и звучит.</p>
            </section>
            <div className="capital-banner">
              <WalletCards size={18} aria-hidden="true" />
              <span>доступно для инвестиций</span>
              <strong>{formatMoney(game.money)} ₽</strong>
            </div>
            <UpgradeList game={game} onBuy={buyUpgrade} />
          </section>
        )}

        {view === 'achievements' && (
          <section className="achievement-view">
            <section className="page-intro">
              <div className="eyebrow">следы пути</div>
              <h1>Достижения</h1>
              <p>Отмечайте моменты, когда идея превращается в результат.</p>
            </section>
            <AchievementGrid game={game} />
          </section>
        )}

        {floatingValues.map((item) => (
          <span className={`float-value float-${item.kind}`} key={item.id} aria-hidden="true">{item.text}</span>
        ))}

        <nav className="bottom-nav" aria-label="Разделы игры">
          <button className={`nav-item ${view === 'home' ? 'active' : ''}`} type="button" onClick={() => setView('home')} data-testid="button-nav-home">
            <House size={18} aria-hidden="true" />
            <span>Путь</span>
          </button>
          <button className={`nav-item ${view === 'shop' ? 'active' : ''}`} type="button" onClick={() => setView('shop')} data-testid="button-nav-shop">
            <Hammer size={18} aria-hidden="true" />
            <span>Развитие</span>
          </button>
          <button className={`nav-item ${view === 'achievements' ? 'active' : ''}`} type="button" onClick={() => setView('achievements')} data-testid="button-nav-achievements">
            <Trophy size={18} aria-hidden="true" />
            <span>Трофеи</span>
          </button>
        </nav>
      </main>

      {toast && (
        <div className="toast-message" role="status" data-testid="status-toast">
          <Check size={14} aria-hidden="true" />
          {toast}
        </div>
      )}
    </div>
  );
}

function UpgradeList({ game, onBuy }: { game: GameState; onBuy: (upgrade: Upgrade) => void }) {
  return (
    <div className="upgrade-list">
      {UPGRADES.map((upgrade) => {
        const level = game.upgrades[upgrade.id];
        const cost = getUpgradeCost(upgrade, level);
        const Icon = upgrade.icon;
        const canBuy = game.money >= cost;
        return (
          <div className="upgrade-row" key={upgrade.id} data-testid={`card-upgrade-${upgrade.id}`}>
            <div className={`upgrade-icon upgrade-${upgrade.id}`}><Icon size={20} aria-hidden="true" /></div>
            <div className="upgrade-copy">
              <div className="upgrade-name">{upgrade.name}</div>
              <div className="upgrade-description">{upgrade.description}</div>
              <div className="upgrade-level">уровень {level}</div>
            </div>
            <button
              className="upgrade-buy"
              type="button"
              disabled={!canBuy}
              onClick={() => onBuy(upgrade)}
              aria-label={`Купить улучшение ${upgrade.name} за ${formatMoney(cost)} рублей`}
              data-testid={`button-buy-${upgrade.id}`}
            >
              <strong>{formatMoney(cost)} ₽</strong>
              <span>{canBuy ? 'улучшить' : 'не хватает'}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

function AchievementGrid({ game }: { game: GameState }) {
  const achievements = [
    { name: 'Стартовый капитал', note: 'Начать путь с 500 ₽', unlocked: game.money + game.totalEarned >= 500, icon: CircleDollarSign },
    { name: 'Первый ролик', note: 'Снять первое видео', unlocked: game.actionCounts.video >= 1, icon: Video },
    { name: 'Свой ритм', note: 'Восстановить энергию', unlocked: game.actionCounts.rest >= 1, icon: Moon },
    { name: 'Первые 100', note: 'Собрать 100 подписчиков', unlocked: game.subscribers >= 100, icon: Star },
    { name: 'Репутация', note: 'Достичь 25 репутации', unlocked: game.reputation >= 25, icon: Flame },
    { name: 'Большая идея', note: 'Достичь 5 уровня', unlocked: game.level >= 5, icon: Rocket },
  ];

  return (
    <div className="achievement-grid">
      {achievements.map((achievement) => {
        const Icon = achievement.icon;
        return (
          <div className={`achievement ${achievement.unlocked ? 'unlocked' : ''}`} key={achievement.name}>
            <div className="achievement-icon">{achievement.unlocked ? <Icon size={18} aria-hidden="true" /> : <LockKeyhole size={18} aria-hidden="true" />}</div>
            <div className="achievement-name">{achievement.name}</div>
            <div className="achievement-note">{achievement.note}</div>
          </div>
        );
      })}
    </div>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Router />
    </WouterRouter>
  );
}

export default App;
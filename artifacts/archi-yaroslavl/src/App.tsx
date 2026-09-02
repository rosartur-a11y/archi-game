import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Building2,
  Check,
  CircleDollarSign,
  Hammer,
  House,
  Landmark,
  Layers3,
  LockKeyhole,
  Pickaxe,
  Rocket,
  TrendingUp,
  Trophy,
  WalletCards,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

type UpgradeId = 'precision' | 'office' | 'crew' | 'portfolio';
type View = 'home' | 'shop' | 'achievements';

type GameState = {
  balance: number;
  totalEarned: number;
  clicks: number;
  levels: Record<UpgradeId, number>;
  lastTick: number;
};

type Upgrade = {
  id: UpgradeId;
  name: string;
  description: string;
  icon: LucideIcon;
  baseCost: number;
  factor: number;
  clickGain: number;
  passiveGain: number;
};

const STORAGE_KEY = 'archi-yaroslavl-save';
const queryClient = new QueryClient();

const UPGRADES: Upgrade[] = [
  {
    id: 'precision',
    name: 'Точная рука',
    description: '+0,75 ₽ к каждому касанию',
    icon: Pickaxe,
    baseCost: 35,
    factor: 1.48,
    clickGain: 0.75,
    passiveGain: 0,
  },
  {
    id: 'office',
    name: 'Рабочее место',
    description: '+0,70 ₽ в секунду',
    icon: Hammer,
    baseCost: 180,
    factor: 1.58,
    clickGain: 0,
    passiveGain: 0.7,
  },
  {
    id: 'crew',
    name: 'Своя бригада',
    description: '+2,80 ₽ в секунду',
    icon: Building2,
    baseCost: 560,
    factor: 1.65,
    clickGain: 0,
    passiveGain: 2.8,
  },
  {
    id: 'portfolio',
    name: 'Портфель объектов',
    description: '+7,50 ₽ в секунду',
    icon: Landmark,
    baseCost: 2400,
    factor: 1.72,
    clickGain: 0,
    passiveGain: 7.5,
  },
];

const RANKS = [
  { name: 'Нулевой цикл', threshold: 0, next: 200 },
  { name: 'Первый объект', threshold: 200, next: 1500 },
  { name: 'Своя бригада', threshold: 1500, next: 7000 },
  { name: 'Архитектор', threshold: 7000, next: Number.POSITIVE_INFINITY },
];

const emptyLevels = (): Record<UpgradeId, number> => ({
  precision: 0,
  office: 0,
  crew: 0,
  portfolio: 0,
});

const getClickIncome = (levels: Record<UpgradeId, number>) =>
  1.5 + UPGRADES.reduce((sum, upgrade) => sum + upgrade.clickGain * levels[upgrade.id], 0);

const getPassiveIncome = (levels: Record<UpgradeId, number>) =>
  UPGRADES.reduce((sum, upgrade) => sum + upgrade.passiveGain * levels[upgrade.id], 0);

const getUpgradeCost = (upgrade: Upgrade, level: number) =>
  Math.round(upgrade.baseCost * Math.pow(upgrade.factor, level) * 100) / 100;

const formatMoney = (value: number) =>
  new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.max(0, value)).replace(/\u00a0/g, ' ');

const formatCompact = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1).replace('.', ',')} млн`;
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace('.', ',')} тыс.`;
  return formatMoney(value);
};

const getSavedGame = (): GameState => {
  const fallback: GameState = {
    balance: 0,
    totalEarned: 0,
    clicks: 0,
    levels: emptyLevels(),
    lastTick: Date.now(),
  };

  if (typeof window === 'undefined') return fallback;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return fallback;
    const parsed = JSON.parse(stored) as Partial<GameState>;
    const levels = { ...emptyLevels(), ...(parsed.levels ?? {}) };
    const passive = getPassiveIncome(levels);
    const awaySeconds = Math.min(Math.max((Date.now() - Number(parsed.lastTick ?? Date.now())) / 1000, 0), 60 * 60 * 8);
    const awayIncome = passive * awaySeconds;
    return {
      balance: Number(parsed.balance ?? 0) + awayIncome,
      totalEarned: Number(parsed.totalEarned ?? 0) + awayIncome,
      clicks: Number(parsed.clicks ?? 0),
      levels,
      lastTick: Date.now(),
    };
  } catch {
    return fallback;
  }
};

function Home() {
  const [game, setGame] = useState<GameState>(getSavedGame);
  const [view, setView] = useState<View>('home');
  const [isPulsing, setIsPulsing] = useState(false);
  const [floatingValues, setFloatingValues] = useState<number[]>([]);
  const [toast, setToast] = useState('');
  const [loadedFromSave] = useState(() => typeof window !== 'undefined' && Boolean(window.localStorage.getItem(STORAGE_KEY)));

  const clickIncome = useMemo(() => getClickIncome(game.levels), [game.levels]);
  const passiveIncome = useMemo(() => getPassiveIncome(game.levels), [game.levels]);
  const rankIndex = useMemo(() => {
    let index = 0;
    RANKS.forEach((rank, rankPosition) => {
      if (game.totalEarned >= rank.threshold) index = rankPosition;
    });
    return index;
  }, [game.totalEarned]);
  const rank = RANKS[rankIndex];
  const progress = rank.next === Number.POSITIVE_INFINITY
    ? 100
    : Math.min(100, Math.max(3, ((game.totalEarned - rank.threshold) / (rank.next - rank.threshold)) * 100));
  const nextRank = rank.next === Number.POSITIVE_INFINITY ? null : RANKS[rankIndex + 1];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
    }
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
          balance: current.balance + income,
          totalEarned: current.totalEarned + income,
          lastTick: now,
        };
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [passiveIncome]);

  useEffect(() => {
    if (!loadedFromSave) return;
    setToast('Доход за время отсутствия добавлен');
    const timer = window.setTimeout(() => setToast(''), 3600);
    return () => window.clearTimeout(timer);
  }, [loadedFromSave]);

  const handleEarn = useCallback(() => {
    const value = clickIncome;
    setGame((current) => ({
      ...current,
      balance: current.balance + value,
      totalEarned: current.totalEarned + value,
      clicks: current.clicks + 1,
      lastTick: Date.now(),
    }));
    const id = Date.now() + Math.random();
    setFloatingValues((current) => [...current.slice(-3), id]);
    window.setTimeout(() => {
      setFloatingValues((current) => current.filter((item) => item !== id));
    }, 820);
    setIsPulsing(true);
    window.setTimeout(() => setIsPulsing(false), 260);
  }, [clickIncome]);

  const buyUpgrade = useCallback((upgrade: Upgrade) => {
    const level = game.levels[upgrade.id];
    const cost = getUpgradeCost(upgrade, level);
    if (game.balance < cost) {
      setToast('Сначала соберите ещё немного капитала');
      window.setTimeout(() => setToast(''), 2400);
      return;
    }
    setGame((current) => ({
      ...current,
      balance: current.balance - cost,
      levels: { ...current.levels, [upgrade.id]: current.levels[upgrade.id] + 1 },
      lastTick: Date.now(),
    }));
    setToast(`${upgrade.name} усилено`);
    window.setTimeout(() => setToast(''), 2400);
  }, [game.balance, game.levels]);

  const selectView = (nextView: View) => setView(nextView);

  return (
    <div className="game-shell">
      <div className="ambient-orb" aria-hidden="true" />
      <main className="app-frame">
        <header className="topbar">
          <div className="brand-mark">
            <div className="brand-symbol" aria-hidden="true"><span>A</span></div>
            <div>
              <div className="brand-name" data-testid="text-brand-name">ПУТЬ ARCHI</div>
              <div className="brand-subtitle">Ярославль / 01</div>
            </div>
          </div>
          <div className="save-status" data-testid="status-save">
            <span className="save-dot" aria-hidden="true" />
            сохранено
          </div>
        </header>

        <section className="balance-card" aria-label="Текущий баланс">
          <div>
            <div className="eyebrow">личный капитал</div>
            <div className={`balance-value ${isPulsing ? 'pulse' : ''}`} aria-live="polite" data-testid="text-balance">
              {formatMoney(game.balance)} <span className="balance-unit">₽</span>
            </div>
          </div>
          <div className="income-strip" data-testid="text-passive-income">
            <TrendingUp aria-hidden="true" />
            <strong>+{formatMoney(passiveIncome)} ₽ / сек</strong>
            <span>работает, пока вас нет</span>
          </div>
        </section>

        {view === 'home' && (
          <div className="dashboard-grid">
            <section className="earn-panel" aria-label="Панель заработка">
              <div className="earn-heading">
                <div>
                  <div className="eyebrow">точка старта</div>
                  <h1>Каждый шаг —<br />в вашу историю</h1>
                </div>
                <p>Нажмите, чтобы превратить намерение в капитал.</p>
              </div>
              <div className="earn-button-wrap">
                {floatingValues.map((id) => (
                  <span className="float-value" key={id} aria-hidden="true">+{formatMoney(clickIncome)} ₽</span>
                ))}
                <button
                  className={`earn-button ${isPulsing ? 'is-pressed' : ''}`}
                  type="button"
                  onClick={handleEarn}
                  aria-label={`Заработать ${formatMoney(clickIncome)} рублей`}
                  data-testid="button-earn"
                >
                  <span className="earn-button-content">
                    <CircleDollarSign aria-hidden="true" />
                    <span className="earn-button-label">ЗАРАБОТАТЬ</span>
                    <span className="earn-button-hint">КАЖДОЕ КАСАНИЕ ИМЕЕТ ВЕС</span>
                  </span>
                </button>
              </div>
              <div className="earn-meta">
                <div className="metric">
                  <div className="metric-label">доход с клика</div>
                  <div className="metric-value gold" data-testid="text-click-income">+{formatMoney(clickIncome)} ₽</div>
                </div>
                <div className="metric">
                  <div className="metric-label">сделано шагов</div>
                  <div className="metric-value" data-testid="text-click-count">{game.clicks.toLocaleString('ru-RU')}</div>
                </div>
              </div>
            </section>

            <div className="side-column">
              <ProgressCard rank={rank} progress={progress} nextRank={nextRank} totalEarned={game.totalEarned} />
              <ShopCard game={game} onBuy={buyUpgrade} />
            </div>
          </div>
        )}

        {view === 'shop' && (
          <section className="shop-view">
            <ProgressCard rank={rank} progress={progress} nextRank={nextRank} totalEarned={game.totalEarned} />
            <div className="shop-card shop-view-card">
              <SectionHeading eyebrow="инструменты роста" title="Магазин усилений" />
              <p className="shop-caption">Соберите систему, которая работает на вас.</p>
              <UpgradeList game={game} onBuy={buyUpgrade} />
            </div>
          </section>
        )}

        {view === 'achievements' && (
          <section className="achievement-section achievement-view">
            <SectionHeading eyebrow="следы пути" title="Ваши достижения" />
            <p className="shop-caption">Большая история складывается из маленьких подтверждений.</p>
            <AchievementGrid game={game} />
          </section>
        )}

        <nav className="bottom-nav" aria-label="Разделы игры">
          <button className={`nav-item ${view === 'home' ? 'active' : ''}`} type="button" onClick={() => selectView('home')} data-testid="button-nav-home">
            <House aria-hidden="true" />
            Главная
          </button>
          <button className={`nav-item ${view === 'shop' ? 'active' : ''}`} type="button" onClick={() => selectView('shop')} data-testid="button-nav-shop">
            <WalletCards aria-hidden="true" />
            Усиления
          </button>
          <button className={`nav-item ${view === 'achievements' ? 'active' : ''}`} type="button" onClick={() => selectView('achievements')} data-testid="button-nav-achievements">
            <Trophy aria-hidden="true" />
            Достижения
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

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="section-top">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h2 className="section-title">{title}</h2>
      </div>
    </div>
  );
}

function ProgressCard({
  rank,
  progress,
  nextRank,
  totalEarned,
}: {
  rank: (typeof RANKS)[number];
  progress: number;
  nextRank: (typeof RANKS)[number] | null;
  totalEarned: number;
}) {
  return (
    <section className="progress-card" aria-label="Прогресс пути">
      <div className="section-top">
        <SectionHeading eyebrow="уровень пути" title={rank.name} />
        <span className="rank-pill" data-testid="text-rank">уровень {RANKS.indexOf(rank) + 1}</span>
      </div>
      <div className="progress-copy">
        <strong data-testid="text-total-earned">{formatCompact(totalEarned)} ₽</strong>
        <span>{nextRank ? `цель: ${formatCompact(nextRank.threshold)} ₽` : 'высшая точка'}</span>
      </div>
      <div className="progress-track" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Прогресс до следующего уровня">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <p className="progress-note" data-testid="text-progress-note">
        {nextRank ? <>До «<strong>{nextRank.name}</strong>» — ещё {formatCompact(Math.max(0, nextRank.threshold - totalEarned))} ₽</> : <>Вы собрали собственную систему. Дальше — только выше.</>}
      </p>
    </section>
  );
}

function ShopCard({ game, onBuy }: { game: GameState; onBuy: (upgrade: Upgrade) => void }) {
  return (
    <section className="shop-card" aria-label="Магазин усилений">
      <SectionHeading eyebrow="инструменты роста" title="Усиления" />
      <p className="shop-caption">Инвестируйте в следующий рывок.</p>
      <UpgradeList game={game} onBuy={onBuy} />
    </section>
  );
}

function UpgradeList({ game, onBuy }: { game: GameState; onBuy: (upgrade: Upgrade) => void }) {
  return (
    <div className="upgrade-list">
      {UPGRADES.map((upgrade) => {
        const level = game.levels[upgrade.id];
        const cost = getUpgradeCost(upgrade, level);
        const Icon = upgrade.icon;
        const canBuy = game.balance >= cost;
        return (
          <div className="upgrade-row" key={upgrade.id} data-testid={`card-upgrade-${upgrade.id}`}>
            <div className="upgrade-icon"><Icon aria-hidden="true" /></div>
            <div>
              <div className="upgrade-name">{upgrade.name}</div>
              <div className="upgrade-level"><b>ур. {level}</b> · {upgrade.description}</div>
            </div>
            <button
              className="upgrade-buy"
              type="button"
              disabled={!canBuy}
              onClick={() => onBuy(upgrade)}
              aria-label={`Купить улучшение ${upgrade.name} за ${formatMoney(cost)} рублей`}
              data-testid={`button-buy-${upgrade.id}`}
            >
              <span className="upgrade-buy-cost">{formatMoney(cost)} ₽</span>
              <span className="upgrade-buy-caption">{canBuy ? 'купить' : 'нужно ещё'}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

function AchievementGrid({ game }: { game: GameState }) {
  const achievements = [
    { id: 'start', name: 'Первый шаг', note: 'Сделать первое касание', unlocked: game.clicks >= 1, icon: Zap },
    { id: 'hundred', name: 'В деле', note: 'Заработать 100 ₽', unlocked: game.totalEarned >= 100, icon: BarChart3 },
    { id: 'system', name: 'Система', note: 'Запустить доход в секунду', unlocked: getPassiveIncome(game.levels) > 0, icon: Layers3 },
    { id: 'architect', name: 'Архитектор', note: 'Собрать 7 000 ₽', unlocked: game.totalEarned >= 7000, icon: Rocket },
  ];
  return (
    <div className="achievement-grid">
      {achievements.map((achievement) => {
        const Icon = achievement.icon;
        return (
          <div className={`achievement ${achievement.unlocked ? 'unlocked' : ''}`} key={achievement.id} data-testid={`card-achievement-${achievement.id}`}>
            <div className="achievement-icon">{achievement.unlocked ? <Icon size={16} aria-hidden="true" /> : <LockKeyhole size={16} aria-hidden="true" />}</div>
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
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
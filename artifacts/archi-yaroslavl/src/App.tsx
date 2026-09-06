// ============================================================
// ПУТЬ ARCHI: Ярославль — мобильная игра
// ============================================================

import { useState } from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import { useGame } from './game/useGame';
import { GameIcon } from './components/GameIcons';
import {
  EventModal,
  InterstitialOverlay,
  IntroModal,
  RewardModal,
} from './components/Modals';
import { HomeScreen } from './screens/HomeScreen';
import { DevScreen, LevelsScreen } from './screens/DevScreen';
import { TrophiesScreen } from './screens/TrophiesScreen';

type View = 'path' | 'dev' | 'trophies' | 'levels';

// ------------------------------------------------------------
// Фон-мир: небо, звёзды, силуэты Ярославля
// ------------------------------------------------------------

function WorldBackground() {
  return (
    <div className="world-bg" aria-hidden="true">
      <div className="sky-glow" />
      <div className="stars-layer" />
      <div className="skyline skyline-far" />
      <div className="skyline skyline-near" />
      <div className="ground-haze" />
    </div>
  );
}

// ------------------------------------------------------------
// Верхняя панель
// ------------------------------------------------------------

function TopBar({ saved }: { saved: boolean }) {
  return (
    <header className="topbar">
      <div className="brand-mark">
        <div className="brand-symbol" aria-hidden="true">
          <GameIcon name="flag" size={19} />
        </div>
        <div>
          <div className="brand-name">ПУТЬ ARCHI</div>
          <div className="brand-subtitle">Ярославль · сезон 01</div>
        </div>
      </div>
      <div className="save-status">
        <span className={`save-dot ${saved ? 'is-on' : ''}`} aria-hidden="true" />
        автосохранение
      </div>
    </header>
  );
}

// ------------------------------------------------------------
// Нижняя навигация
// ------------------------------------------------------------

function BottomNav({ view, onChange }: { view: View; onChange: (view: View) => void }) {
  const items: Array<{ id: View; icon: 'map' | 'growth' | 'trophy'; label: string }> = [
    { id: 'path', icon: 'map', label: 'ПУТЬ' },
    { id: 'dev', icon: 'growth', label: 'РАЗВИТИЕ' },
    { id: 'trophies', icon: 'trophy', label: 'ТРОФЕИ' },
  ];

  return (
    <nav className="bottom-nav" aria-label="Разделы игры">
      {items.map((item) => {
        const active = view === item.id;
        return (
          <button
            className={`nav-item ${active ? 'active' : ''}`}
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            aria-current={active ? 'page' : undefined}
            data-testid={`button-nav-${item.id}`}
          >
            <span className="nav-icon">
              <GameIcon name={item.icon} size={20} />
            </span>
            <span className="nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ------------------------------------------------------------
// Приложение
// ------------------------------------------------------------

function GameApp() {
  const game = useGame();
  const { state, toast, floats } = game;
  const [view, setView] = useState<View>('path');

  const closeInterstitial = () => {
    game.commitStateDraft((current) => ({
      ...current,
      pendingAds: Math.max(0, current.pendingAds - 1),
    }));
  };

  return (
    <div className="game-shell">
      <WorldBackground />

      <main className="app-frame">
        <TopBar saved={state.introSeen} />

        {view === 'path' && <HomeScreen game={game} />}
        {view === 'dev' && <DevScreen game={game} onShowLevels={() => setView('levels')} />}
        {view === 'levels' && <LevelsScreen game={game} onBack={() => setView('dev')} />}
        {view === 'trophies' && <TrophiesScreen game={game} />}
      </main>

      <BottomNav view={view} onChange={setView} />

      {floats.map((item) => (
        <span
          className={`float-value float-${item.kind}`}
          key={item.id}
          aria-hidden="true"
        >
          {item.text}
        </span>
      ))}

      {toast && (
        <div className={`toast-message toast-${toast.kind ?? 'default'}`} role="status" data-testid="status-toast">
          <GameIcon name="sparkle" size={14} />
          {toast.text}
        </div>
      )}

      {!state.introSeen && <IntroModal onStart={game.startGame} />}
      {state.introSeen && game.nextReward && (
        <RewardModal reward={game.nextReward} onTake={game.takeReward} />
      )}
      {state.introSeen && !game.nextReward && game.activeEvent && (
        <EventModal
          event={game.activeEvent}
          onChoose={game.chooseEvent}
          onDismiss={game.dismissEvent}
        />
      )}
      {state.introSeen && !game.nextReward && !game.activeEvent && state.pendingAds > 0 && (
        <InterstitialOverlay onClose={closeInterstitial} />
      )}
    </div>
  );
}

function Router() {
  return (
    <ErrorBoundary>
      <GameApp />
    </ErrorBoundary>
  );
}

function App() {
  return <Router />;
}

export default App;
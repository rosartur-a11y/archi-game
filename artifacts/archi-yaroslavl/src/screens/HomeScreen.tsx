// ============================================================
// ПУТЬ ARCHI — главный игровой экран «ПУТЬ»
// Один экран: HUD → сцена ARCHI → цель → «ЧТО ДЕЛАЕМ СЕГОДНЯ?»
// Задания / карта / сезон открываются игровыми панелями-оверлеями
// ============================================================

import { useState, type ReactNode } from 'react';
import { ACTIONS, LOCATIONS, STAGES, locationConditionLabel, locationUnlocked } from '../game/data';
import {
  MAX_ENERGY,
  formatCompact,
  formatMoney,
  moneyBuffActive,
} from '../game/engine';
import type { useGame } from '../game/useGame';
import { GameIcon } from '../components/GameIcons';

type Game = ReturnType<typeof useGame>;
type Sheet = null | 'quests' | 'map' | 'season';

const assetPath = (fileName: string) => `${import.meta.env.BASE_URL}images/${fileName}`;
const charAsset = (fileName: string) => `${import.meta.env.BASE_URL}images/archi/${fileName}`;

// ------------------------------------------------------------
// HUD: пять характеристик
// ------------------------------------------------------------

function StatChip({
  icon,
  label,
  value,
  tone,
}: {
  icon: Parameters<typeof GameIcon>[0]['name'];
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className={`stat-chip stat-${tone}`}>
      <span className="stat-chip-icon">
        <GameIcon name={icon} size={13} />
      </span>
      <strong className="stat-chip-value">{value}</strong>
      <span className="stat-chip-label">{label}</span>
    </div>
  );
}

function HudStats({ game }: { game: Game }) {
  const { state } = game;
  return (
    <section className="hud-stats" aria-label="Показатели ARCHI">
      <StatChip icon="coins" label="ДЕНЬГИ" value={`${formatMoney(state.money)} ₽`} tone="gold" />
      <StatChip icon="star" label="УРОВЕНЬ" value={String(state.level)} tone="lime" />
      <StatChip icon="bolt" label="ЭНЕРГИЯ" value={String(Math.round(state.energy))} tone="pink" />
      <StatChip icon="subs" label="ПОДП." value={formatCompact(state.subscribers)} tone="sky" />
      <StatChip icon="megaphone" label="РЕПУТ." value={String(state.reputation)} tone="violet" />
    </section>
  );
}

// ------------------------------------------------------------
// Энергия + бонусы за рекламу
// ------------------------------------------------------------

function EnergyBlock({ game }: { game: Game }) {
  const { state, watchAd, adLoading } = game;
  const buffed = moneyBuffActive(state);
  const buffSeconds = Math.max(0, Math.ceil((state.moneyBuffUntil - Date.now()) / 1000));

  return (
    <section className="energy-block" aria-label="Энергия">
      <span className="energy-badge">
        <GameIcon name="bolt" size={17} />
      </span>
      <div className="energy-main">
        <div className="energy-copy">
          <span className="energy-label">ЭНЕРГИЯ ARCHI</span>
          <strong>
            {Math.round(state.energy)} / {MAX_ENERGY}
          </strong>
        </div>
        <div
          className="energy-track"
          role="progressbar"
          aria-valuenow={Math.round(state.energy)}
          aria-valuemin={0}
          aria-valuemax={MAX_ENERGY}
          aria-label={`Энергия ${Math.round(state.energy)} из ${MAX_ENERGY}`}
        >
          <div className="energy-fill" style={{ width: `${state.energy}%` }} />
        </div>
      </div>
      <div className="ad-row">
        <button
          className={`ad-reward-btn ${adLoading === 'energy' ? 'is-loading' : ''}`}
          type="button"
          onClick={() => watchAd('energy')}
          disabled={adLoading !== null}
          aria-label="Посмотреть рекламу: +50 энергии"
        >
          <span>
            <GameIcon name="bolt" size={9} /> +50
          </span>
          <small>за рекламу</small>
        </button>
        <button
          className={`ad-reward-btn ${buffed ? 'is-buffed' : ''} ${adLoading === 'money' ? 'is-loading' : ''}`}
          type="button"
          onClick={() => watchAd('money')}
          disabled={adLoading !== null}
          aria-label="Посмотреть рекламу: x2 к деньгам"
        >
          <span>
            <GameIcon name="coins" size={9} /> {buffed ? `ЕЩЁ ${buffSeconds} С` : 'x2'}
          </span>
          <small>{buffed ? 'бонус' : 'к деньгам'}</small>
        </button>
      </div>
    </section>
  );
}

// ------------------------------------------------------------
// Игровая сцена: Ярославль + спрайт ARCHI
// ------------------------------------------------------------

function HeroScene({ game }: { game: Game }) {
  const { state, stage } = game;
  const nextStage = STAGES.find((s) => s.minLevel > state.level) ?? null;
  const chapter =
    [...game.chapters].reverse().find((c) => c.level <= state.level) ?? game.chapters[0];

  return (
    <section className="hero-scene" aria-label="Ярославль — город ARCHI">
      <img
        className="hero-scene-photo"
        src={assetPath('archi-location-start.jpg')}
        alt=""
        loading="lazy"
      />
      <div className="hero-scene-shade" aria-hidden="true" />
      <div className="hero-scene-ground" aria-hidden="true" />

      <div className="scene-sign">
        <span className="scene-sign-pin">
          <GameIcon name="pin" size={12} />
        </span>
        <span className="scene-sign-city">ЯРОСЛАВЛЬ</span>
        <span className="scene-sign-note">СЕЗОН 01</span>
      </div>

      <div className="scene-level-badge" aria-hidden="true">
        <span>{String(state.level).padStart(2, '0')}</span>
        <small>УРОВЕНЬ</small>
      </div>

      <div className="scene-stage-chip">
        <span className={`stage-dot stage-dot-${stage.accent}`} />
        {stage.name}
      </div>

      <div className="scene-chapter">
        <GameIcon name="flag" size={11} />
        {chapter ? `ГЛАВА ${chapter.title}` : 'СЕЗОН 02'}
      </div>

      <div className="scene-character" data-archi-look={stage.id}>
        <div className="scene-character-shadow" aria-hidden="true" />
        <img
          src={charAsset(stage.file)}
          alt={`ARCHI — ${stage.name}`}
          fetchPriority="high"
        />
      </div>

      <div className="scene-corner corner-tl" aria-hidden="true" />
      <div className="scene-corner corner-tr" aria-hidden="true" />
      <div className="scene-corner corner-bl" aria-hidden="true" />
      <div className="scene-corner corner-br" aria-hidden="true" />

      {nextStage && (
        <div className="scene-next-hint" aria-hidden="true">
          <GameIcon name="down" size={10} />
          ДО {nextStage.name} — {nextStage.minLevel} УР.
        </div>
      )}
    </section>
  );
}

// ------------------------------------------------------------
// Главная цель (компактная полоса)
// ------------------------------------------------------------

function GoalStrip({ game }: { game: Game }) {
  const { state, stage } = game;
  const legendProgress = Math.min(100, (state.level / 30) * 100);
  const atLegend = state.level >= 30;

  return (
    <section className="goal-card" aria-label="Главная цель">
      <span className={`goal-icon ${atLegend ? 'is-legend' : ''}`}>
        <GameIcon name={atLegend ? 'crown' : 'flag'} size={17} />
      </span>
      <div className="goal-main">
        <div className="goal-eyebrow">{atLegend ? 'СЕЗОН ПРОЙДЕН' : 'ГЛАВНАЯ ЦЕЛЬ'}</div>
        <h3>{atLegend ? `ARCHI — ${stage.name}` : 'ДОЙТИ ДО 30 УРОВНЯ'}</h3>
      </div>
      <div
        className="goal-track"
        role="progressbar"
        aria-valuenow={Math.round(legendProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="goal-fill" style={{ width: `${legendProgress}%` }}>
          <span>{state.level} / 30</span>
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------
// «ЧТО ДЕЛАЕМ СЕГОДНЯ?» — главный интерактивный центр
// ------------------------------------------------------------

function ActionsSection({ game }: { game: Game }) {
  const { state, runAction } = game;

  const isLockedBySubs = (id: (typeof ACTIONS)[number]['id']) => {
    const def = ACTIONS.find((a) => a.id === id)!;
    return def.minSubs !== undefined && state.subscribers < def.minSubs;
  };

  const canRun = (id: (typeof ACTIONS)[number]['id']) => {
    const def = ACTIONS.find((a) => a.id === id)!;
    if (id === 'rest') return state.energy < MAX_ENERGY;
    if (isLockedBySubs(id)) return false;
    return state.energy >= def.energyCost;
  };

  return (
    <section className="actions-section" aria-label="Что делаем сегодня">
      <div className="section-heading">
        <span className="section-heading-icon icon-coral">
          <GameIcon name="bolt" size={15} />
        </span>
        <div>
          <h2>ЧТО ДЕЛАЕМ СЕГОДНЯ?</h2>
          <p>Выбери действие — путь продолжается</p>
        </div>
      </div>

      <div className="action-grid">
        {ACTIONS.map((action) => {
          const locked = isLockedBySubs(action.id);
          const ready = canRun(action.id);
          const restDisabled = action.id === 'rest' && state.energy >= MAX_ENERGY;
          return (
            <button
              className={[
                'action-card',
                `action-${action.accent}`,
                !ready && action.id !== 'rest' ? 'is-disabled' : '',
                locked ? 'is-subs-locked' : '',
                restDisabled ? 'is-disabled' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              key={action.id}
              type="button"
              onClick={() => runAction(action.id)}
              disabled={(action.id !== 'rest' && !ready) || restDisabled}
              data-testid={`button-action-${action.id}`}
            >
              <span className="action-card-icon">
                <GameIcon name={action.icon} size={19} />
              </span>
              <span className="action-card-copy">
                <strong>{action.title}</strong>
                <small>
                  <GameIcon name={locked ? 'lock' : action.id === 'rest' ? 'bolt' : action.icon} size={8} />
                  {action.subtitle}
                </small>
              </span>
              <span className="action-card-cost">
                {action.id === 'rest' ? (
                  <>
                    <GameIcon name="bolt" size={10} /> +45
                  </>
                ) : locked ? (
                  <>
                    <GameIcon name="lock" size={10} /> {action.minSubs} ПОДП.
                  </>
                ) : (
                  <>
                    <GameIcon name="bolt" size={10} /> −{action.energyCost}
                  </>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ------------------------------------------------------------
// Быстрые игровые панели: задания / карта / сезон
// ------------------------------------------------------------

function ExtraChips({ onOpen }: { onOpen: (sheet: Sheet) => void }) {
  return (
    <div className="home-extra">
      <button className="extra-chip" type="button" onClick={() => onOpen('quests')}>
        <GameIcon name="quest" size={13} />
        ЗАДАНИЯ
      </button>
      <button className="extra-chip" type="button" onClick={() => onOpen('map')}>
        <GameIcon name="map" size={13} />
        КАРТА ПУТИ
      </button>
      <button className="extra-chip wide" type="button" onClick={() => onOpen('season')}>
        <GameIcon name="clock" size={13} />
        СЕЗОН 01 · ЯРОСЛАВЛЬ
      </button>
    </div>
  );
}

// ------------------------------------------------------------
// Оверлеи (нижние игровые панели)
// ------------------------------------------------------------

function GameSheet({
  title,
  note,
  icon,
  toneClass,
  onClose,
  children,
  center,
}: {
  title: string;
  note?: string;
  icon: Parameters<typeof GameIcon>[0]['name'];
  toneClass: string;
  onClose: () => void;
  children: ReactNode;
  center?: boolean;
}) {
  return (
    <div className={`sheet-backdrop ${center ? 'sheet-center' : ''}`} onClick={onClose}>
      <div
        className={`game-sheet ${center ? 'center' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <span className="sheet-handle" aria-hidden="true" />
        <div className="sheet-head">
          <span className={`sheet-head-icon ${toneClass}`}>
            <GameIcon name={icon} size={19} />
          </span>
          <div>
            <h2>{title}</h2>
            {note && <p>{note}</p>}
          </div>
          <button className="sheet-close" type="button" onClick={onClose} aria-label="Закрыть">
            <GameIcon name="x" size={15} />
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}

function QuestsSheet({ game, onClose }: { game: Game; onClose: () => void }) {
  const { state, quests, claimQuest } = game;
  const doneCount = state.claimedQuests.length;

  return (
    <GameSheet
      title="ЗАДАНИЯ НА СЕГОДНЯ"
      note="Награды обновляются каждый день"
      icon="quest"
      toneClass="sheet-c-gold"
      onClose={onClose}
    >
      <div className="quest-list">
        {game.dailyQuests.map((quest) => {
          const progress = Math.min(quest.target, quests[quest.id] ?? 0);
          const claimed = state.claimedQuests.includes(quest.id);
          const ready = progress >= quest.target;
          const percent = Math.min(100, (progress / quest.target) * 100);
          return (
            <div className={`quest-row ${claimed ? 'is-claimed' : ''}`} key={quest.id}>
              <span className={`quest-check ${claimed || ready ? 'is-ready' : ''}`}>
                {claimed ? <GameIcon name="check" size={15} /> : <GameIcon name="quest" size={14} />}
              </span>
              <div className="quest-copy">
                <div className="quest-name">{quest.name}</div>
                <div className="quest-track">
                  <div className="quest-fill" style={{ width: `${percent}%` }} />
                </div>
                <div className="quest-meta">
                  <span>
                    {progress} / {quest.target}
                  </span>
                  <span className="quest-reward">
                    {quest.reward.map((r) => r.label).join(' · ')}
                  </span>
                </div>
              </div>
              <button
                className="quest-claim"
                type="button"
                disabled={!ready || claimed}
                onClick={() => claimQuest(quest.id)}
                aria-label={claimed ? 'Задание выполнено' : 'Забрать награду'}
              >
                {claimed ? <GameIcon name="check" size={15} /> : <GameIcon name="gift" size={16} />}
              </button>
            </div>
          );
        })}
        <div style={{ padding: '2px 4px', fontFamily: 'var(--font-num)', fontSize: 8, color: 'var(--ink-dim)' }}>
          ВЫПОЛНЕНО: {doneCount} / {game.dailyQuests.length}
        </div>
      </div>
    </GameSheet>
  );
}

function MapSheet({ game, onClose }: { game: Game; onClose: () => void }) {
  const { state } = game;
  const opened = state.unlockedLocations.length;

  return (
    <GameSheet
      title="КАРТА ПУТИ"
      note="Локации открываются уровнем, репутацией и подписчиками"
      icon="map"
      toneClass="sheet-c-violet"
      onClose={onClose}
    >
      <div className="map-list">
        {LOCATIONS.map((location, index) => {
          const unlocked = locationUnlocked(location, state);
          const isOpen = state.unlockedLocations.includes(location.id);
          const isNext =
            !isOpen &&
            index > 0 &&
            !LOCATIONS.slice(0, index).some((l) => !state.unlockedLocations.includes(l.id));
          return (
            <div
              className={`map-node ${isOpen ? 'is-open' : 'is-locked'} ${isNext ? 'is-next' : ''}`}
              key={location.id}
            >
              <div className="map-node-photo">
                <img src={assetPath(location.image)} alt="" loading="lazy" />
                <div className="map-node-photo-shade" aria-hidden="true" />
                {!isOpen && (
                  <div className="map-node-lock">
                    <GameIcon name="lock" size={18} />
                    <span>{locationConditionLabel(location)}</span>
                  </div>
                )}
              </div>
              <div className="map-node-copy">
                <div className="map-node-copy-top">
                  <span className="map-node-icon">
                    <GameIcon name={location.icon} size={13} />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div className="map-node-name">{location.name}</div>
                    <div className="map-node-place">{location.place}</div>
                  </div>
                  {isNext && <span style={{ marginLeft: 'auto', color: 'var(--lime)', fontFamily: 'var(--font-num)', fontSize: 7 }}>СЛЕДУЮЩАЯ</span>}
                </div>
                <p className="map-node-desc">{location.desc}</p>
              </div>
            </div>
          );
        })}
        <div style={{ padding: '2px 4px', fontFamily: 'var(--font-num)', fontSize: 8, color: 'var(--ink-dim)' }}>
          ОТКРЫТО: {opened} / {LOCATIONS.length}
        </div>
      </div>
    </GameSheet>
  );
}

function SeasonSheet({ game, onClose }: { game: Game; onClose: () => void }) {
  const { state } = game;
  return (
    <GameSheet
      title="СЕЗОН 01 · ЯРОСЛАВЛЬ"
      note="История пути ARCHI"
      icon="clock"
      toneClass="sheet-c-gold"
      onClose={onClose}
    >
      <div className="season-panel">
        <div className="season-card">
          <span className="season-icon">
            <GameIcon name="coins" size={21} />
          </span>
          <div>
            <div className="season-eyebrow">ЗАРАБОТАНО ЗА ПУТЬ</div>
            <h3>{formatCompact(state.totalEarned)} ₽</h3>
            <p>
              {state.upgrades.studio > 0
                ? `Студия приносит ${state.upgrades.studio * 0.8} ₽/сек, пока ARCHI отдыхает.`
                : 'Купи «Свою студию» в разделе Развитие, чтобы деньги работали даже вне игры.'}
            </p>
          </div>
        </div>

        <div className="season-card">
          <span className="season-icon">
            <GameIcon name="crown" size={21} />
          </span>
          <div>
            <div className="season-eyebrow">ЛЕГЕНДА ЯРОСЛАВЛЯ</div>
            <h3>{state.level >= 30 ? 'СЕЗОН 01 ПРОЙДЕН' : 'ДО 30 УРОВНЯ'}</h3>
            <p>
              {state.level >= 30
                ? 'ARCHI стал легендой Ярославля. Впереди — СЕЗОН 02.'
                : 'Стадии: НОВИЧОК → РАЗВИТИЕ → УСПЕШНЫЙ → ЛЕГЕНДА.'}
            </p>
          </div>
        </div>

        <button
          className="danger-btn"
          type="button"
          onClick={() => {
            // eslint-disable-next-line no-alert
            if (window.confirm('Начать сезон заново? Весь прогресс будет удалён.')) {
              game.resetProgress();
              onClose();
            }
          }}
        >
          <GameIcon name="x" size={13} />
          Начать сезон заново
        </button>
      </div>
    </GameSheet>
  );
}

// ------------------------------------------------------------
// Экран целиком
// ------------------------------------------------------------

export function HomeScreen({ game }: { game: Game }) {
  const [sheet, setSheet] = useState<Sheet>(null);

  return (
    <div className="view home-view">
      <HudStats game={game} />
      <EnergyBlock game={game} />
      <HeroScene game={game} />
      <GoalStrip game={game} />
      <ActionsSection game={game} />
      <ExtraChips onOpen={setSheet} />

      {sheet === 'quests' && <QuestsSheet game={game} onClose={() => setSheet(null)} />}
      {sheet === 'map' && <MapSheet game={game} onClose={() => setSheet(null)} />}
      {sheet === 'season' && <SeasonSheet game={game} onClose={() => setSheet(null)} />}
    </div>
  );
}

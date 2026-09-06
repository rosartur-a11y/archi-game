// ============================================================
// ПУТЬ ARCHI — экран «РАЗВИТИЕ»
// Один экран: герой → XP → статы → 4 стадии эволюции
// Улучшения и полная прогрессия открываются отдельными панелями
// ============================================================

import { useState, type ReactNode } from 'react';
import { STAGES, UPGRADES } from '../game/data';
import { formatCompact, formatMoney, upgradeCost, xpNeeded, xpProgress } from '../game/engine';
import type { useGame } from '../game/useGame';
import { GameIcon } from '../components/GameIcons';

type Game = ReturnType<typeof useGame>;

const charAsset = (fileName: string) => `${import.meta.env.BASE_URL}images/archi/${fileName}`;

// ------------------------------------------------------------
// Карточка героя: спрайт + уровень + стадия
// ------------------------------------------------------------

function CharacterCard({ game }: { game: Game }) {
  const { state, stage } = game;
  const progress = xpProgress(state);
  const toNext = xpNeeded(state.level) - state.xp;

  return (
    <section className="dev-hero" aria-label="Развитие ARCHI">
      <div className="dev-hero-copy">
        <div className="eyebrow-row">
          <span className="eyebrow-chip eyebrow-lime">РАЗВИТИЕ ARCHI</span>
        </div>
        <h1 className="dev-hero-name">ARCHI</h1>
        <div className="dev-hero-level-row">
          <span className="dev-level-chip">{state.level} УРОВЕНЬ</span>
          <span className={`dev-stage-chip stage-${stage.accent}`}>
            <span className={`stage-dot stage-dot-${stage.accent}`} />
            {stage.name}
          </span>
        </div>
      </div>
      <div className="dev-hero-art">
        <img
          src={charAsset(stage.file)}
          alt={`ARCHI — ${stage.name}`}
          fetchPriority="high"
        />
        <div className="dev-hero-shadow" aria-hidden="true" />
      </div>
    </section>
  );
}

// ------------------------------------------------------------
// XP до следующего уровня
// ------------------------------------------------------------

function XpBlock({ game }: { game: Game }) {
  const { state } = game;
  const progress = xpProgress(state);
  const toNext = Math.max(0, xpNeeded(state.level) - state.xp);

  return (
    <section className="dev-xp" aria-label="Опыт">
      <div className="dev-xp-copy">
        <span>XP ДО СЛЕДУЮЩЕГО УРОВНЯ</span>
        <strong>{toNext} XP</strong>
      </div>
      <div
        className="dev-xp-track"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="dev-xp-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="dev-xp-numbers">
        <span>{state.xp} XP</span>
        <span>{xpNeeded(state.level)} XP</span>
      </div>
    </section>
  );
}

// ------------------------------------------------------------
// Мини-статы
// ------------------------------------------------------------

function DevStats({ game }: { game: Game }) {
  const { state } = game;
  return (
    <div className="dev-stats">
      <div className="dev-stat">
        <GameIcon name="subs" size={13} />
        <span>АУДИТОРИЯ</span>
        <strong>{formatCompact(state.subscribers)}</strong>
      </div>
      <div className="dev-stat">
        <GameIcon name="megaphone" size={13} />
        <span>РЕПУТАЦИЯ</span>
        <strong>{state.reputation}</strong>
      </div>
      <div className="dev-stat">
        <GameIcon name="coins" size={13} />
        <span>КАПИТАЛ</span>
        <strong>{formatMoney(state.money)} ₽</strong>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Эволюция: четыре образа ARCHI в ряд
// ------------------------------------------------------------

function EvolutionStrip({ game }: { game: Game }) {
  const { state } = game;

  return (
    <section className="evolution-section" aria-label="Эволюция ARCHI">
      <div className="evolution-head">
        <span className="section-heading-icon icon-sky">
          <GameIcon name="growth" size={14} />
        </span>
        <h2>ЭВОЛЮЦИЯ ARCHI</h2>
        <p>4 ОБРАЗА</p>
      </div>

      <div className="evolution-grid">
        {STAGES.map((stageItem, index) => {
          const unlocked = state.level >= stageItem.minLevel;
          const isCurrent =
            unlocked &&
            (index === STAGES.length - 1 || state.level < STAGES[index + 1].minLevel);
          return (
            <div
              key={stageItem.id}
              className={[
                'evolution-card',
                `evolution-stage-${stageItem.accent}`,
                unlocked ? 'is-unlocked' : 'is-locked',
                isCurrent ? 'is-current' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <div className="evolution-art">
                <img
                  src={charAsset(stageItem.file)}
                  alt={stageItem.name}
                  loading="lazy"
                />
                {!unlocked && (
                  <span className="evolution-lock">
                    <GameIcon name="lock" size={12} />
                  </span>
                )}
              </div>
              <div className="evolution-name">{stageItem.name}</div>
              <div className="evolution-level">
                {unlocked ? 'ОТКРЫТ' : `${stageItem.minLevel}+`}
              </div>
              {isCurrent && (
                <span className="evolution-status is-open">
                  <GameIcon name="bolt" size={8} />
                  ТЕКУЩИЙ
                </span>
              )}
              {unlocked && !isCurrent && (
                <span className="evolution-status is-open">
                  <GameIcon name="check" size={9} />
                  ОТКРЫТ
                </span>
              )}
              {!unlocked && (
                <span className="evolution-status is-closed">
                  <GameIcon name="lock" size={9} />
                  {stageItem.minLevel}+
                </span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ------------------------------------------------------------
// Оверлей-панель
// ------------------------------------------------------------

function DevSheet({
  title,
  note,
  icon,
  toneClass,
  onClose,
  children,
}: {
  title: string;
  note: string;
  icon: Parameters<typeof GameIcon>[0]['name'];
  toneClass: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="game-sheet"
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
            <p>{note}</p>
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

// ------------------------------------------------------------
// Магазин улучшений (панель)
// ------------------------------------------------------------

function ShopSheet({ game, onClose }: { game: Game; onClose: () => void }) {
  const { state, buyUpgradeItem } = game;

  return (
    <DevSheet
      title="УЛУЧШЕНИЯ"
      note="Вложи деньги — путь станет быстрее"
      icon="coins"
      toneClass="sheet-c-gold"
      onClose={onClose}
    >
      <div className="upgrade-list">
        {UPGRADES.map((upgrade) => {
          const level = state.upgrades[upgrade.id];
          const cost = upgradeCost(upgrade.id, level);
          const canBuy = state.money >= cost;
          return (
            <div className="upgrade-row" key={upgrade.id}>
              <span className={`upgrade-icon upgrade-${upgrade.id}`}>
                <GameIcon name={upgrade.icon} size={19} />
              </span>
              <div className="upgrade-copy">
                <div className="upgrade-name">
                  {upgrade.name}
                  {level > 0 && <span className="upgrade-lvl">УР. {level}</span>}
                </div>
                <div className="upgrade-desc">{upgrade.desc}</div>
              </div>
              <button
                className={`upgrade-buy ${canBuy ? '' : 'is-poor'}`}
                type="button"
                disabled={!canBuy}
                onClick={() => buyUpgradeItem(upgrade.id)}
                aria-label={`Купить ${upgrade.name} за ${formatMoney(cost)} рублей`}
              >
                <strong>{formatMoney(cost)} ₽</strong>
                <span>{canBuy ? 'КУПИТЬ' : 'НЕ ХВАТАЕТ'}</span>
              </button>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 12, textAlign: 'center', fontFamily: 'var(--font-num)', fontSize: 8, color: 'var(--ink-dim)' }}>
        БАЛАНС: {formatMoney(state.money)} ₽
      </div>
    </DevSheet>
  );
}

// ------------------------------------------------------------
// Экран «Развитие»
// ------------------------------------------------------------

export function DevScreen({ game, onShowLevels }: { game: Game; onShowLevels: () => void }) {
  const [showShop, setShowShop] = useState(false);

  return (
    <div className="view dev-view">
      <CharacterCard game={game} />
      <XpBlock game={game} />
      <DevStats game={game} />
      <EvolutionStrip game={game} />

      <div className="dev-actions-row">
        <button className="dev-quick-btn q-levels" type="button" onClick={onShowLevels}>
          <GameIcon name="growth" size={15} />
          ВСЕ УРОВНИ
        </button>
        <button className="dev-quick-btn q-shop" type="button" onClick={() => setShowShop(true)}>
          <GameIcon name="coins" size={15} />
          УЛУЧШЕНИЯ
        </button>
      </div>

      {showShop && <ShopSheet game={game} onClose={() => setShowShop(false)} />}
    </div>
  );
}

// ------------------------------------------------------------
// Экран «Все уровни» (полная прогрессия)
// ------------------------------------------------------------

const LEVEL_MILESTONES: Record<number, { label: string; art?: string }> = {
  2: { label: 'ПЕРВЫЕ ДЕНЬГИ' },
  3: { label: 'ПЕРВЫЕ ПОДПИСЧИКИ' },
  5: { label: 'ПЕРВЫЕ СЪЁМКИ' },
  8: { label: 'ПЕРВАЯ ПОПУЛЯРНОСТЬ' },
  10: { label: 'НОВЫЙ ОБРАЗ ARCHI', art: 'level-10.sprite.png' },
  12: { label: 'ПЕРВЫЙ ЗАКАЗ' },
  15: { label: 'НОВЫЙ РИТМ' },
  18: { label: 'РОСТ' },
  20: { label: 'НОВЫЙ ОБРАЗ ARCHI', art: 'level-20.sprite.png' },
  25: { label: 'ИЗВЕСТНОСТЬ' },
  30: { label: 'ARCHI — ЛЕГЕНДА', art: 'level-30.sprite.png' },
};

export function LevelsScreen({ game, onBack }: { game: Game; onBack: () => void }) {
  const { state } = game;
  const maxLevel = 30;
  const levels = Array.from({ length: maxLevel }, (_, index) => index + 1);

  return (
    <div className="view levels-view">
      <div className="levels-head">
        <button className="icon-btn" type="button" onClick={onBack} aria-label="Назад">
          <GameIcon name="right" size={18} className="flip-x" />
        </button>
        <div>
          <div className="eyebrow-row">
            <span className="eyebrow-chip eyebrow-sky">ПРОГРЕССИЯ</span>
          </div>
          <h1>ВСЕ УРОВНИ</h1>
        </div>
        <span className="wallet-pill" style={{ marginLeft: 'auto' }}>
          <GameIcon name="star" size={11} />
          {state.level} / 30
        </span>
      </div>

      <div className="levels-progress-note">
        Путь ARCHI: от новичка до легенды Ярославля. На 10, 20 и 30 уровне
        персонаж получает новый образ.
      </div>

      <div className="levels-list">
        {levels.map((level) => {
          const milestone = LEVEL_MILESTONES[level];
          const reached = state.level >= level;
          const isCurrent = state.level === level;
          return (
            <div key={level}>
              {milestone?.art && (
                <div className={`level-milestone ${reached ? 'is-reached' : ''}`}>
                  <div className="level-milestone-art">
                    <img src={charAsset(milestone.art)} alt="" loading="lazy" />
                  </div>
                  <div className="level-milestone-copy">
                    <GameIcon name={level === 30 ? 'crown' : 'burst'} size={16} />
                    <span>{milestone.label}</span>
                  </div>
                </div>
              )}
              <div
                className={`level-row ${reached ? 'is-reached' : ''} ${isCurrent ? 'is-current' : ''}`}
              >
                <span className="level-row-num">
                  {reached ? <GameIcon name="check" size={13} /> : String(level).padStart(2, '0')}
                </span>
                <div className="level-row-copy">
                  <strong>УРОВЕНЬ {level}</strong>
                  {milestone && !milestone.art && <span>{milestone.label}</span>}
                  {!milestone && (
                    <span>{level === 1 ? 'Старт пути' : `${xpNeeded(level)} XP до следующего`}</span>
                  )}
                </div>
                <span className="level-row-state">
                  {isCurrent ? 'СЕЙЧАС' : reached ? 'ПРОЙДЕН' : <GameIcon name="lock" size={12} />}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="levels-end-card">
        <GameIcon name="crown" size={22} />
        <div>
          <strong>СЕЗОН 02</strong>
          <p>Когда ARCHI станет легендой, откроется новая история. Готовься.</p>
        </div>
      </div>
    </div>
  );
}

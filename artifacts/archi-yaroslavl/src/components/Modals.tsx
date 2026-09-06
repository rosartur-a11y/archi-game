// ============================================================
// ПУТЬ ARCHI — игровые модальные окна
// ============================================================

import { useEffect, useState } from 'react';
import { STAGES, stageFile, type EventDef } from '../game/data';
import type { Reward } from '../game/types';
import { GameIcon } from './GameIcons';

const assetPath = (fileName: string) => `${import.meta.env.BASE_URL}images/archi/${fileName}`;

// ------------------------------------------------------------
// Награда
// ------------------------------------------------------------

export function RewardModal({
  reward,
  onTake,
}: {
  reward: Reward;
  onTake: () => void;
}) {
  const isChapter = reward.kind === 'chapter';
  const isStage = reward.kind === 'stage';
  const isLevel = reward.kind === 'level';
  const title =
    reward.kind === 'reward'
      ? 'НОВАЯ НАГРАДА!'
      : isChapter
        ? 'НОВАЯ ГЛАВА'
        : isStage
          ? 'НОВЫЙ ОБРАЗ ARCHI'
          : 'УРОВЕНЬ ПОВЫШЕН';

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <div className={`reward-modal reward-kind-${reward.kind}`}>
        <div className="reward-sparkles" aria-hidden="true">
          <span className="sparkle s1"><GameIcon name="burst" size={26} /></span>
          <span className="sparkle s2"><GameIcon name="burst" size={18} /></span>
          <span className="sparkle s3"><GameIcon name="sparkle" size={22} /></span>
          <span className="sparkle s4"><GameIcon name="sparkle" size={14} /></span>
        </div>

        {isStage && reward.art && (
          <div className="reward-art">
            <img
              src={assetPath(stageFile(reward.art))}
              alt={reward.title}
              width="137"
              height="235"
            />
          </div>
        )}

        <div className="reward-title">
          {isLevel ? <GameIcon name="star" size={30} /> : isChapter ? <GameIcon name="flag" size={30} /> : <GameIcon name="gift" size={30} />}
          <h2>{title}</h2>
        </div>

        <div className="reward-name">{reward.title}</div>
        {reward.text && <p className="reward-text">{reward.text}</p>}

        <ul className="reward-items">
          {reward.items.map((item, index) => (
            <li key={`${item.label}-${index}`}>
              <span className="reward-item-icon">
                <GameIcon name={item.icon} size={17} />
              </span>
              {item.label}
            </li>
          ))}
        </ul>

        <button className="game-btn game-btn-lime reward-take" type="button" onClick={onTake}>
          <GameIcon name="check" size={18} />
          {isChapter ? 'ЧИТАТЬ' : 'ЗАБРАТЬ'}
        </button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Событие
// ------------------------------------------------------------

export function EventModal({
  event,
  onChoose,
  onDismiss,
}: {
  event: EventDef;
  onChoose: (choiceIndex: number) => void;
  onDismiss: () => void;
}) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Событие">
      <div className="event-modal">
        <div className="event-badge">
          <GameIcon name="burst" size={26} />
        </div>
        <h2>СОБЫТИЕ</h2>
        <p className="event-text">{event.text}</p>

        <div className="event-choices">
          {event.choices.map((choice, index) => (
            <button
              className="event-choice"
              key={choice.label}
              type="button"
              onClick={() => onChoose(index)}
            >
              <span className="event-choice-label">{choice.label}</span>
              <span className="event-choice-hint">{choice.hint}</span>
            </button>
          ))}
        </div>

        <button className="event-skip" type="button" onClick={onDismiss}>
          Пропустить
        </button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Интро
// ------------------------------------------------------------

export function IntroModal({ onStart }: { onStart: () => void }) {
  return (
    <div className="modal-backdrop intro-backdrop" role="dialog" aria-modal="true">
      <div className="intro-modal">
        <div className="intro-skyline" aria-hidden="true" />
        <div className="intro-art">
          <img
            src={assetPath(stageFile('novice'))}
            alt="ARCHI — Новичок"
            width="137"
            height="235"
          />
        </div>
        <div className="intro-title">
          <h1>ПУТЬ ARCHI</h1>
          <p>ЯРОСЛАВЛЬ · СЕЗОН 01</p>
        </div>
        <p className="intro-text">
          ARCHI начинает с нуля в Ярославле. Деньги, подписчики, репутация —
          и большая цель: дойти до 30 уровня и стать ЛЕГЕНДОЙ.
        </p>
        <ul className="intro-goals">
          <li><GameIcon name="bolt" size={16} /> Трать энергию на действия</li>
          <li><GameIcon name="subs" size={16} /> Собирай подписчиков</li>
          <li><GameIcon name="crown" size={16} /> Открой все 4 образа ARCHI</li>
        </ul>
        <button className="game-btn game-btn-lime intro-start" type="button" onClick={onStart}>
          <GameIcon name="play" size={20} />
          НАЧАТЬ ПУТЬ
        </button>
        <div className="intro-stages" aria-hidden="true">
          {STAGES.map((stage) => (
            <span key={stage.id} className={`intro-stage intro-stage-${stage.id}`}>
              {stage.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Межстраничная реклама (заглушка)
// ------------------------------------------------------------

export function InterstitialOverlay({ onClose }: { onClose: () => void }) {
  const [left, setLeft] = useState(3);
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setCanClose(true);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="modal-backdrop ad-backdrop" role="dialog" aria-modal="true" aria-label="Реклама">
      <div className="ad-modal">
        <div className="ad-logo">
          <GameIcon name="burst" size={30} />
        </div>
        <div className="ad-copy">
          <span>РЕКЛАМА</span>
          <small>межстраничная · заглушка</small>
        </div>
        <div className="ad-timer" aria-hidden="true">
          {left > 0 ? left : <GameIcon name="check" size={20} />}
        </div>
        {canClose && (
          <button className="ad-close" type="button" onClick={onClose}>
            <GameIcon name="x" size={16} />
            Продолжить
          </button>
        )}
        <p className="ad-note">В Яндекс Играх здесь будет настоящая реклама</p>
      </div>
    </div>
  );
}


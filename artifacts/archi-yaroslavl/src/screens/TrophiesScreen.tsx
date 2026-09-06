// ============================================================
// ПУТЬ ARCHI — экран «ТРОФЕИ»
// Компактная игровая сетка 2×N: иконка + имя + условие + награда
// ============================================================

import type { useGame } from '../game/useGame';
import { GameIcon } from '../components/GameIcons';
import type { IconName } from '../game/types';

type Game = ReturnType<typeof useGame>;

const ACCENT_BY_ICON: Partial<Record<IconName, string>> = {
  clapper: 'trophy-a-clapper',
  star: 'trophy-a-star',
  coins: 'trophy-a-coins',
  subs: 'trophy-a-subs',
  broadcast: 'trophy-a-broadcast',
  megaphone: 'trophy-a-megaphone',
  briefcase: 'trophy-a-briefcase',
  camera: 'trophy-a-camera',
  burst: 'trophy-a-burst',
  crown: 'trophy-a-crown',
};

export function TrophiesScreen({ game }: { game: Game }) {
  const { state, achievements } = game;
  const unlockedCount = achievements.filter((a) => state.achieved.includes(a.id)).length;
  const percent = achievements.length ? (unlockedCount / achievements.length) * 100 : 0;

  return (
    <div className="view trophies-view">
      <div className="trophies-head">
        <span className="trophies-head-icon">
          <GameIcon name="trophy" size={24} />
        </span>
        <div>
          <div className="eyebrow-row">
            <span className="eyebrow-chip eyebrow-gold">ДОСТИЖЕНИЯ</span>
          </div>
          <h1>ТРОФЕИ</h1>
          <p>Каждый трофей — шаг ARCHI к легенде</p>
        </div>
        <span className="trophies-count">
          {unlockedCount} / {achievements.length}
        </span>
      </div>

      <div className="trophies-progress" aria-hidden="true">
        <div className="trophies-progress-fill" style={{ width: `${percent}%` }} />
      </div>

      <div className="trophy-grid">
        {achievements.map((achievement) => {
          const unlocked = state.achieved.includes(achievement.id);
          const accent = ACCENT_BY_ICON[achievement.icon] ?? '';
          return (
            <article
              className={`trophy-card ${accent} ${unlocked ? 'is-unlocked' : 'is-locked'}`}
              key={achievement.id}
            >
              <div className="trophy-icon">
                {unlocked ? (
                  <GameIcon name={achievement.icon} size={19} />
                ) : (
                  <GameIcon name="lock" size={16} />
                )}
              </div>
              <div className="trophy-name">{achievement.name}</div>
              <div className="trophy-desc">{achievement.desc}</div>
              <div className="trophy-reward">
                {achievement.reward.map((r) => (
                  <span key={r.label}>
                    <GameIcon name={r.icon} size={9} />
                    {r.label}
                  </span>
                ))}
              </div>
              <span className="trophy-state">
                {unlocked ? (
                  <>
                    <GameIcon name="check" size={10} />
                    ПОЛУЧЕН
                  </>
                ) : (
                  <>
                    <GameIcon name="lock" size={10} />
                    ЗАКРЫТ
                  </>
                )}
              </span>
            </article>
          );
        })}
      </div>
    </div>
  );
}

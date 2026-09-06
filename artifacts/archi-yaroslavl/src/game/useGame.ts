// ============================================================
// ПУТЬ ARCHI — хук состояния игры
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { showRewardedAd } from './ads';
import {
  ACHIEVEMENTS,
  ACTIONS,
  CHAPTERS,
  DAILY_QUESTS,
  EVENTS,
  LOCATIONS,
  STAGES,
  eventById,
  getStage,
  locationUnlocked,
} from './data';
import {
  MAX_ENERGY,
  STORAGE_KEY,
  addXp,
  applyAction,
  applyEventChoice,
  buyUpgrade,
  formatMoney,
  initialState,
  loadGame,
  newlySeenChapters,
  newlyUnlockedAchievements,
  questClaimed,
  questProgress,
  todayStr,
} from './engine';
import type {
  ActionId,
  GameState,
  Reward,
  RewardLine,
  UpgradeId,
} from './types';

export type FloatItem = {
  id: number;
  text: string;
  kind: string;
};

const INTERSTITIAL_EVERY = 12;

const line = (icon: RewardLine['icon'], label: string): RewardLine => ({ icon, label });

export function useGame() {
  const [state, setState] = useState<GameState>(() => loadGame());
  const [toast, setToast] = useState<{ text: string; kind?: string } | null>(null);
  const [floats, setFloats] = useState<FloatItem[]>([]);
  const [adLoading, setAdLoading] = useState<'energy' | 'money' | null>(null);

  const stateRef = useRef(state);
  stateRef.current = state;

  const toastTimer = useRef<number | null>(null);
  const floatIds = useRef(0);

  const showToast = useCallback((text: string, kind?: string) => {
    setToast({ text, kind });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const addFloat = useCallback((text: string, kind: string) => {
    const id = ++floatIds.current;
    setFloats((current) => [...current.slice(-3), { id, text, kind }]);
    window.setTimeout(() => {
      setFloats((current) => current.filter((item) => item.id !== id));
    }, 950);
  }, []);

  // ------------------------------------------------------------
  // Персистентность
  // ------------------------------------------------------------

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Игнорируем ошибки хранилища.
    }
  }, [state]);

  // ------------------------------------------------------------
  // «Финальный проход»: достижения, главы, события, смена дня
  // ------------------------------------------------------------

  const finalize = useCallback(
    (next: GameState, extraRewards: Reward[] = []): GameState => {
      let draft = next;

      // Смена дня → сброс ежедневных заданий.
      const today = todayStr();
      if (draft.lastDay !== today) {
        draft = {
          ...draft,
          lastDay: today,
          daily: { videos: 0, earned: 0, subs: 0, actions: 0 },
          claimedQuests: [],
        };
      }

      // Новые достижения → награды в очередь.
      const freshAchievements = newlyUnlockedAchievements(draft);
      if (freshAchievements.length > 0) {
        draft = {
          ...draft,
          achieved: [...draft.achieved, ...freshAchievements.map((a) => a.id)],
        };
        for (const a of freshAchievements) {
          const moneyGift = a.reward
            .filter((r) => r.icon === 'coins')
            .reduce(
              (sum, r) => sum + (parseInt(r.label.replace(/[^\d]/g, ''), 10) || 0),
              0,
            );
          draft = {
            ...draft,
            pendingRewards: [
              ...draft.pendingRewards,
              {
                id: `achievement-${a.id}`,
                kind: 'reward' as const,
                title: `ТРОФЕЙ: ${a.name}`,
                text: a.desc,
                items: a.reward,
                gift: moneyGift,
              },
            ],
          };
        }
      }

      // Новые главы истории.
      const freshChapters = newlySeenChapters(draft);
      if (freshChapters.length > 0) {
        draft = {
          ...draft,
          seenChapters: [...draft.seenChapters, ...freshChapters.map((c) => c.title)],
        };
        for (const chapter of freshChapters) {
          draft = {
            ...draft,
            pendingRewards: [
              ...draft.pendingRewards,
              {
                id: `chapter-${chapter.title}`,
                kind: 'chapter' as const,
                title: `ГЛАВА · ${chapter.title}`,
                text: chapter.text,
                items: [line('flag', 'ИСТОРИЯ ПРОДОЛЖАЕТСЯ')],
              },
            ],
          };
        }
      }

      // Открытие новых локаций на карте.
      for (const location of LOCATIONS) {
        if (
          !draft.unlockedLocations.includes(location.id) &&
          locationUnlocked(location, draft)
        ) {
          draft = {
            ...draft,
            unlockedLocations: [...draft.unlockedLocations, location.id],
            pendingRewards: [
              ...draft.pendingRewards,
              {
                id: `location-${location.id}`,
                kind: 'reward' as const,
                title: 'ЛОКАЦИЯ ОТКРЫТА',
                text: `${location.name} · ${location.place}`,
                items: [line('pin', location.name)],
              },
            ],
          };
        }
      }

      // Случайное событие (не чаще раза в 75 секунд, не поверх наград).
      if (
        draft.activeEvent === null &&
        draft.pendingRewards.length === 0 &&
        Date.now() >= draft.eventCooldownUntil
      ) {
        if (Math.random() < 0.16) {
          const candidates = EVENTS.filter((event) => {
            if (event.minLevel !== undefined && draft.level < event.minLevel) return false;
            if (event.minSubs !== undefined && draft.subscribers < event.minSubs) return false;
            if (event.minRep !== undefined && draft.reputation < event.minRep) return false;
            return true;
          });
          if (candidates.length > 0) {
            const picked = candidates[Math.floor(Math.random() * candidates.length)];
            draft = { ...draft, activeEvent: picked.id };
          }
        }
      }

      // Награды, добавленные действием.
      if (extraRewards.length > 0) {
        draft = { ...draft, pendingRewards: [...draft.pendingRewards, ...extraRewards] };
      }

      return draft;
    },
    [],
  );

  const commit = useCallback(
    (next: GameState, extraRewards: Reward[] = []) => {
      setState(finalize(next, extraRewards));
    },
    [finalize],
  );

  /** Прямое изменение состояния без финализа (для UI-мелочей). */
  const commitStateDraft = useCallback(
    (fn: (current: GameState) => GameState) => {
      setState((prev) => fn(prev));
    },
    [],
  );

  // ------------------------------------------------------------
  // Тик: восстановление энергии и доход от студии
  // ------------------------------------------------------------

  useEffect(() => {
    const interval = window.setInterval(() => {
      const current = stateRef.current;
      const now = Date.now();
      const elapsed = Math.max(0, (now - current.lastTick) / 1000);
      if (elapsed < 0.3) return;

      const regen = elapsed * 0.6;
      const studioIncome = current.upgrades.studio * 0.8 * elapsed;

      setState((prev) => ({
        ...prev,
        energy: Math.min(MAX_ENERGY, prev.energy + regen),
        money: prev.money + studioIncome,
        totalEarned: prev.totalEarned + studioIncome,
        lastTick: now,
      }));
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  // ------------------------------------------------------------
  // Действия
  // ------------------------------------------------------------

  const runAction = useCallback(
    (actionId: ActionId) => {
      const current = stateRef.current;
      const def = ACTIONS.find((a) => a.id === actionId) ?? ACTIONS[4];

      if (actionId === 'rest') {
        if (current.energy >= MAX_ENERGY) {
          showToast('Энергия уже полная');
          return;
        }
        const outcome = applyAction(current, actionId);
        commit(outcome.next, outcome.rewards);
        addFloat('+45 энергии', 'blue');
        showToast('Пауза пошла на пользу');
        return;
      }

      if (def.minSubs !== undefined && current.subscribers < def.minSubs) {
        showToast(`Нужно ${def.minSubs} подписчиков, чтобы открыть это действие`);
        return;
      }
      if (current.energy < def.energyCost) {
        showToast('Нужно восстановить энергию');
        return;
      }

      const outcome = applyAction(current, actionId);
      commit(outcome.next, outcome.rewards);

      const gains = outcome.gains;
      const parts: string[] = [];
      if (gains.money > 0) parts.push(`+${formatMoney(gains.money)} ₽`);
      if (gains.subs > 0) parts.push(`+${gains.subs} подпис.`);
      if (gains.rep > 0) parts.push(`+${gains.rep} реп.`);
      addFloat(parts.join(' · ') || `+${gains.xp} XP`, def.accent);

      if (outcome.leveledUp) {
        showToast(`НОВЫЙ УРОВЕНЬ ${outcome.next.level}!`, 'gold');
      } else {
        showToast(
          actionId === 'video'
            ? 'Видео опубликовано'
            : actionId === 'work'
              ? 'Работа сделана'
              : actionId === 'stream'
                ? 'Стрим завершён'
                : 'Контент снят',
        );
      }

      // Межстраничная реклама: каждые N действий.
      if (outcome.next.sinceAd >= INTERSTITIAL_EVERY) {
        commit(
          { ...outcome.next, sinceAd: 0, pendingAds: outcome.next.pendingAds + 1 },
          [],
        );
      }
    },
    [addFloat, commit, showToast],
  );

  // ------------------------------------------------------------
  // Выбор варианта события
  // ------------------------------------------------------------

  const chooseEvent = useCallback(
    (choiceIndex: number) => {
      const current = stateRef.current;
      const event = current.activeEvent ? eventById(current.activeEvent) : undefined;
      if (!event || !event.choices[choiceIndex]) return;

      const apply = event.choices[choiceIndex].apply;
      const { next, rewards } = applyEventChoice(current, apply);
      commit(next, rewards);

      const parts: string[] = [];
      if (apply.money) parts.push(`+${formatMoney(apply.money)} ₽`);
      if (apply.subs) parts.push(`+${apply.subs} подпис.`);
      if (apply.rep) parts.push(`+${apply.rep} реп.`);
      if (apply.xp) parts.push(`+${apply.xp} XP`);
      if (apply.energy && apply.energy > 0) parts.push(`+${apply.energy} энергии`);
      if (apply.energy && apply.energy < 0) parts.push(`−${-apply.energy} энергии`);
      addFloat(parts.join(' · ') || 'Событие пройдено', 'gold');
    },
    [addFloat, commit],
  );

  const dismissEvent = useCallback(() => {
    const current = stateRef.current;
    commit({
      ...current,
      activeEvent: null,
      eventCooldownUntil: Date.now() + 75_000,
    });
  }, [commit]);

  // ------------------------------------------------------------
  // Ежедневные задания
  // ------------------------------------------------------------

  const claimQuest = useCallback(
    (questId: string) => {
      const current = stateRef.current;
      if (questClaimed(current, questId)) return;

      const quest = DAILY_QUESTS.find((q) => q.id === questId);
      if (!quest) return;
      if ((current.daily[quest.counter] as number) < quest.target) return;

      const moneyGift = quest.reward
        .filter((r) => r.icon === 'coins')
        .reduce((sum, r) => sum + (parseInt(r.label.replace(/[^\d]/g, ''), 10) || 0), 0);
      const xpGift = quest.reward
        .filter((r) => r.icon === 'star')
        .reduce((sum, r) => sum + (parseInt(r.label.replace(/[^\d]/g, ''), 10) || 0), 0);

      let next: GameState = {
        ...current,
        money: current.money + moneyGift,
        totalEarned: current.totalEarned + moneyGift,
        claimedQuests: [...current.claimedQuests, questId],
        lastTick: Date.now(),
      };
      const extraRewards: Reward[] = [];
      if (xpGift > 0) {
        const leveled = addXp(next, xpGift);
        next = leveled.state;
        if (leveled.levelsGained > 0) {
          const moneyReward = 30 * next.level;
          next = {
            ...next,
            money: next.money + moneyReward,
            totalEarned: next.totalEarned + moneyReward,
          };
          extraRewards.push({
            id: `level-${next.level}-quest`,
            kind: 'level',
            title: `УРОВЕНЬ ${next.level}!`,
            text: 'Задание принесло новый уровень!',
            items: [{ icon: 'coins', label: `+${formatMoney(moneyReward)} ₽` }],
          });
        }
      }
      commit(next, extraRewards);
      addFloat(`+${formatMoney(moneyGift)} ₽`, 'gold');
      showToast('Задание выполнено!');
    },
    [addFloat, commit, showToast],
  );

  // ------------------------------------------------------------
  // Награды: закрыть модалку
  // ------------------------------------------------------------

  const takeReward = useCallback(() => {
    const current = stateRef.current;
    const [first, ...rest] = current.pendingRewards;
    if (!first) return;

    let next: GameState = {
      ...current,
      pendingRewards: rest,
      lastTick: Date.now(),
    };

    // Денежный подарок из наград (выдаётся при получении трофея).
    const gift = (first as Reward & { gift?: number }).gift ?? 0;
    if (gift > 0) {
      next = {
        ...next,
        money: next.money + gift,
        totalEarned: next.totalEarned + gift,
      };
    }

    setState(next);
  }, []);

  // ------------------------------------------------------------
  // Реклама за награду
  // ------------------------------------------------------------

  const watchAd = useCallback(
    async (kind: 'energy' | 'money') => {
      if (adLoading) return;
      setAdLoading(kind);
      const rewarded = await showRewardedAd();
      setAdLoading(null);
      if (!rewarded) {
        showToast('Реклама не досмотрена — попробуй ещё раз');
        return;
      }

      if (kind === 'energy') {
        setState((prev) => ({
          ...prev,
          energy: Math.min(MAX_ENERGY, prev.energy + 50),
        }));
        addFloat('+50 энергии', 'blue');
        showToast('Энергия восстановлена');
      } else {
        setState((prev) => ({
          ...prev,
          moneyBuffUntil: Date.now() + 2 * 60 * 1000,
        }));
        addFloat('x2 К ДЕНЬГАМ · 2 МИН', 'gold');
        showToast('Деньги x2 на 2 минуты');
      }
    },
    [adLoading, addFloat, showToast],
  );

  // ------------------------------------------------------------
  // Интро
  // ------------------------------------------------------------

  const startGame = useCallback(() => {
    const current = stateRef.current;
    commit({ ...current, introSeen: true });
  }, [commit]);

  // ------------------------------------------------------------
  // Покупка улучшений
  // ------------------------------------------------------------

  const buyUpgradeItem = useCallback(
    (upgradeId: UpgradeId) => {
      const current = stateRef.current;
      const result = buyUpgrade(current, upgradeId);
      if (!result.ok) {
        showToast(`Нужно ещё ${formatMoney(result.cost - current.money)} ₽`);
        return;
      }
      commit(result.next, result.rewards);
      addFloat(`−${formatMoney(result.cost)} ₽`, 'amber');
      showToast('Улучшение куплено');
    },
    [addFloat, commit, showToast],
  );

  // ------------------------------------------------------------
  // Сброс прогресса (для отладки / нового сезона)
  // ------------------------------------------------------------

  const resetProgress = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setState(initialState());
  }, []);

  const stage = getStage(state.level);
  const quests = questProgress(state);
  const nextReward = state.pendingRewards[0] ?? null;
  const activeEvent = state.activeEvent ? eventById(state.activeEvent) ?? null : null;

  return {
    state,
    toast,
    floats,
    adLoading,
    nextReward,
    activeEvent,
    quests,
    stage,
    achievements: ACHIEVEMENTS,
    chapters: CHAPTERS,
    dailyQuests: DAILY_QUESTS,
    runAction,
    chooseEvent,
    dismissEvent,
    claimQuest,
    takeReward,
    watchAd,
    startGame,
    buyUpgradeItem,
    resetProgress,
    commitStateDraft,
    showToast,
    addFloat,
  };
}
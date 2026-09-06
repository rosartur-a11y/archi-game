// ============================================================
// ПУТЬ ARCHI — монетизация (Яндекс Игры)
//
// Архитектура подготовлена для интеграции с Яндекс Играми:
// - РЕКЛАМА ЗА НАГРАДУ: +50 энергии, x2 к деньгам
// - МЕЖСТРАНИЧНАЯ РЕКЛАМА: редкие показы, не блокируют игру
//
// Когда игра будет опубликована на Яндекс Играх, достаточно,
// чтобы window.YaGames существовал — реальные вызовы SDK
// подставятся автоматически. Пока его нет — работают заглушки.
// ============================================================

type RewardedResult = { status: 'opened' | 'rewarded' | 'closed' };

type YaGamesSDK = {
  adv: {
    showRewardedVideo: (options?: {
      callbacks?: {
        onOpen?: () => void;
        onRewarded?: () => void;
        onClose?: () => void;
        onError?: (error: unknown) => void;
      };
    }) => Promise<RewardedResult>;
    showFullscreenAdv: (options?: {
      callbacks?: {
        onOpen?: () => void;
        onClose?: () => void;
        onError?: (error: unknown) => void;
      };
    }) => Promise<{ status: 'opened' | 'closed' }>;
  };
};

declare global {
  interface Window {
    YaGames?: {
      init: () => Promise<YaGamesSDK>;
    };
  }
}

let sdkPromise: Promise<YaGamesSDK | null> | null = null;

const getSdk = (): Promise<YaGamesSDK | null> => {
  if (!sdkPromise) {
    sdkPromise = (async () => {
      try {
        if (typeof window !== 'undefined' && window.YaGames) {
          return await window.YaGames.init();
        }
      } catch (error) {
        console.warn('[ads] SDK Яндекс Игр недоступен:', error);
      }
      return null;
    })();
  }
  return sdkPromise;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Реклама за награду. Возвращает true, если награда получена.
 * В продакшене на Яндекс Играх — настоящая rewarded-реклама.
 */
export async function showRewardedAd(): Promise<boolean> {
  const sdk = await getSdk();
  if (sdk) {
    try {
      return new Promise<boolean>((resolve) => {
        void sdk.adv
          .showRewardedVideo({
            callbacks: {
              onRewarded: () => resolve(true),
              onClose: () => resolve(false),
              onError: () => resolve(false),
            },
          })
          .catch(() => resolve(false));
      });
    } catch {
      return false;
    }
  }

  // Заглушка: имитация просмотра.
  await sleep(900);
  return true;
}

/**
 * Межстраничная реклама (редкая, ненавязчивая).
 * Заглушка просто коротко «блокирует» экран — счётчик в UI.
 */
export async function showInterstitialAd(): Promise<void> {
  const sdk = await getSdk();
  if (sdk) {
    try {
      await sdk.adv.showFullscreenAdv();
    } catch {
      // Игнорируем: реклама не должна ломать игру.
    }
  }
  // Заглушка: пауза, чтобы имитировать показ.
  await sleep(600);
}
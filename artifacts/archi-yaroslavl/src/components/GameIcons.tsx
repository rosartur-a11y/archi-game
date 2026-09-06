// ============================================================
// ПУТЬ ARCHI — собственные игровые SVG-иконки
// Единый стиль: обводка 2.2, скруглённые концы, один сет 24×24.
// Никаких системных эмодзи.
// ============================================================

import type { ReactNode } from 'react';

export type IconProps = {
  size?: number;
  className?: string;
};

function makeIcon(children: ReactNode) {
  return function GameIcon({ size = 22, className }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
        focusable="false"
      >
        {children}
      </svg>
    );
  };
}

/** Монеты — деньги. */
export const IconCoins = makeIcon(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.6" />
    <path d="M12 8.2v7.6" />
    <path d="M13.8 9.6c-.4-.5-1.1-.8-1.8-.8-1.2 0-2.1.7-2.1 1.6 0 2 4.2.9 4.2 2.9 0 .9-.9 1.6-2.1 1.6-.8 0-1.5-.3-1.9-.8" />
  </>,
);

/** Звезда — уровень. */
export const IconStar = makeIcon(
  <>
    <path d="M12 3.4l2.5 5.2 5.7.8-4.1 4 .9 5.7-5-2.6-5 2.6.9-5.7-4.1-4 5.7-.8L12 3.4z" />
    <circle cx="12" cy="12.5" r="2" />
  </>,
);

/** Молния — энергия. */
export const IconBolt = makeIcon(
  <>
    <path d="M13.2 2.6L5 13.4h5.2l-1.4 8 8.2-10.8H12l1.2-8z" />
  </>,
);

/** Плей в круге — подписчики. */
export const IconSubs = makeIcon(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M10 8.8l5 3.2-5 3.2V8.8z" />
  </>,
);

/** Рупор — репутация. */
export const IconMegaphone = makeIcon(
  <>
    <path d="M3.5 10.6v2.8c0 .7.5 1.2 1.2 1.2h1.6l1.8 4.2c.3.7 1.2 1 1.9.7l1.6-.6" />
    <path d="M4.7 8.6L17.5 4c1.2-.4 2.4.5 2.4 1.8v9.6c0 1.3-1.2 2.2-2.4 1.8L4.7 12.8c-.8-.3-1.2-1-1.2-1.9s.4-1.9 1.2-2.3z" />
    <path d="M8 14.6v2.7c0 .9.7 1.6 1.6 1.6" />
  </>,
);

/** Хлопушка — снять видео. */
export const IconClapper = makeIcon(
  <>
    <rect x="3" y="5.5" width="18" height="14" rx="2.5" />
    <path d="M3 10h18" />
    <path d="M6.5 5.5l2 3.2M11 5.5l2 3.2M15.5 5.5l2 3.2" />
    <path d="M10 13.5l4 2.2-4 2.2v-4.4z" />
  </>,
);

/** Портфель — работа. */
export const IconBriefcase = makeIcon(
  <>
    <rect x="3" y="7.5" width="18" height="12" rx="2.5" />
    <path d="M8.5 7.5V6a2 2 0 012-2h3a2 2 0 012 2v1.5" />
    <path d="M3 13h18" />
    <path d="M10 13v2h4v-2" />
  </>,
);

/** Трансляция — стрим. */
export const IconBroadcast = makeIcon(
  <>
    <circle cx="12" cy="12" r="2.4" />
    <path d="M8.8 8.8a4.5 4.5 0 000 6.4" />
    <path d="M15.2 8.8a4.5 4.5 0 010 6.4" />
    <path d="M6.4 6.4a8 8 0 000 11.2" />
    <path d="M17.6 6.4a8 8 0 010 11.2" />
  </>,
);

/** Луна — отдых. */
export const IconMoon = makeIcon(
  <>
    <path d="M20 13.5A8.5 8.5 0 1110.5 4a6.8 6.8 0 009.5 9.5z" />
    <path d="M18.5 5.5l.9 1.9 1.9.9-1.9.9-.9 1.9-.9-1.9-1.9-.9 1.9-.9.9-1.9z" />
  </>,
);

/** Камера — контент в городе. */
export const IconCamera = makeIcon(
  <>
    <rect x="2.5" y="7" width="19" height="13" rx="3" />
    <circle cx="12" cy="13.2" r="3.6" />
    <path d="M16.6 7L15 4.6h-6L7.4 7" />
    <path d="M6.2 11.6h.01" />
  </>,
);

/** Карта с флажком — «Путь». */
export const IconMap = makeIcon(
  <>
    <path d="M9 4.5L3.5 6.5v13L9 17.5l6 2 5.5-2v-13L15 6.5l-6-2z" />
    <path d="M9 4.5v13M15 6.5v13" />
    <path d="M12 6.5v1.4M12 11.5v1.4" />
  </>,
);

/** Рост — «Развитие». */
export const IconGrowth = makeIcon(
  <>
    <path d="M3.5 20.5h17" />
    <path d="M6 16v-4.2M11 16V7.2M16 16v-6.8" />
    <path d="M14.4 7.6l1.8-1.8 1.8 1.8" />
  </>,
);

/** Кубок — «Трофеи». */
export const IconTrophy = makeIcon(
  <>
    <path d="M7.5 4h9v6.2a4.5 4.5 0 01-9 0V4z" />
    <path d="M7.5 6H4.6a2 2 0 002.3 3M16.5 6h2.9a2 2 0 01-2.3 3" />
    <path d="M12 14.6V17M8.5 20h7M10 20c0-1 .9-1.9 2-1.9s2 .9 2 1.9" />
  </>,
);

/** Замок — закрыто. */
export const IconLock = makeIcon(
  <>
    <rect x="5" y="10.5" width="14" height="9.5" rx="2.5" />
    <path d="M8 10.5V8a4 4 0 018 0v2.5" />
    <path d="M12 14.5v2" />
  </>,
);

/** Галочка в круге — выполнено. */
export const IconCheck = makeIcon(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M8 12.4l2.6 2.6L16.5 9" />
  </>,
);

/** Крестик. */
export const IconX = makeIcon(
  <>
    <path d="M6 6l12 12M18 6L6 18" />
  </>,
);

/** Плюс. */
export const IconPlus = makeIcon(
  <>
    <path d="M12 5v14M5 12h14" />
  </>,
);

/** Подарок — награда. */
export const IconGift = makeIcon(
  <>
    <rect x="3.5" y="9.5" width="17" height="11" rx="2" />
    <path d="M12 9.5V20" />
    <path d="M3.5 14h17" />
    <path d="M12 9.5S8.7 9.5 7.6 8.4a1.9 1.9 0 112.7-2.7C11.6 7 12 9.5 12 9.5z" />
    <path d="M12 9.5s3.3 0 4.4-1.1a1.9 1.9 0 10-2.7-2.7C12.4 7 12 9.5 12 9.5z" />
  </>,
);

/** Планшет заданий — ежедневные задания. */
export const IconQuest = makeIcon(
  <>
    <rect x="5" y="3.5" width="14" height="17" rx="2.5" />
    <path d="M9 3.5V2.4a1 1 0 011-1h4a1 1 0 011 1v1.1" />
    <path d="M8.5 11l2.3 2.3L15.5 8.5" />
    <path d="M9 16.5h6" />
  </>,
);

/** Вспышка-звезда — событие. */
export const IconBurst = makeIcon(
  <>
    <path d="M12 2.5l1.8 6 6 1.8-6 1.8-1.8 6-1.8-6-6-1.8 6-1.8L12 2.5z" />
    <path d="M19 2.8v3M20.6 4.3h-3.2" />
    <path d="M17.5 17.5v2.4M18.7 16.3h-2.4" />
  </>,
);

/** Пин — локация. */
export const IconPin = makeIcon(
  <>
    <path d="M12 21.5S5.5 15.2 5.5 10a6.5 6.5 0 0113 0c0 5.2-6.5 11.5-6.5 11.5z" />
    <circle cx="12" cy="10" r="2.5" />
  </>,
);

/** Стрелка вниз. */
export const IconDown = makeIcon(
  <>
    <path d="M5.5 9.5L12 16l6.5-6.5" />
  </>,
);

/** Стрелка вправо. */
export const IconRight = makeIcon(
  <>
    <path d="M9 5.5l6.5 6.5L9 18.5" />
  </>,
);

/** Флаг — цель. */
export const IconFlag = makeIcon(
  <>
    <path d="M5.5 21V4.5" />
    <path d="M5.5 5c2.5-1.7 5-1.7 7.5 0 2.5 1.7 5 1.7 7.5 0v9c-2.5 1.7-5 1.7-7.5 0-2.5-1.7-5-1.7-7.5 0" />
  </>,
);

/** Искорка. */
export const IconSparkle = makeIcon(
  <>
    <path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3z" />
    <path d="M18.5 15.5l.7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7.7-2.3z" />
  </>,
);

/** Телефон — улучшение. */
export const IconPhone = makeIcon(
  <>
    <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
    <path d="M10.5 5h3" />
    <path d="M11 18.5h2" />
  </>,
);

/** Микрофон — улучшение. */
export const IconMic = makeIcon(
  <>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5.5 11.5a6.5 6.5 0 0013 0" />
    <path d="M12 18v3M9 21h6" />
  </>,
);

/** Лампочка — улучшение. */
export const IconBulb = makeIcon(
  <>
    <path d="M9.5 17.5h5" />
    <path d="M9.7 20h4.6" />
    <path d="M12 3a6.5 6.5 0 00-3.8 11.7c.7.5 1 1.3 1 2h5.6c0-.7.3-1.5 1-2A6.5 6.5 0 0012 3z" />
    <path d="M9.5 13.5h5" />
  </>,
);

/** Дрон — улучшение. */
export const IconDrone = makeIcon(
  <>
    <circle cx="12" cy="13" r="3" />
    <path d="M8.5 13H3.5M5 11.5L3.5 13 5 14.5" />
    <path d="M15.5 13h5M19 11.5l1.5 1.5-1.5 1.5" />
    <path d="M8.5 17.5l-2.5 2M15.5 17.5l2.5 2" />
    <path d="M4 19.5L6 17.8" />
  </>,
);

/** Студия — улучшение. */
export const IconStudio = makeIcon(
  <>
    <rect x="3" y="4.5" width="18" height="12" rx="2.5" />
    <path d="M10 8l5 2.8-5 2.8V8z" />
    <path d="M8.5 20h7M12 16.5V20" />
  </>,
);

/** Корона — легенда. */
export const IconCrown = makeIcon(
  <>
    <path d="M4 17.5h16" />
    <path d="M4.5 17.5L3 8l4.8 3.4L12 5.5l4.2 5.9L21 8l-1.5 9.5h-15z" />
    <path d="M12 8.6l.9 1.2 1.5.2-1.1 1 .3 1.5-1.6-.8-1.6.8.3-1.5-1.1-1 1.5-.2.9-1.2z" />
  </>,
);

/** Дом — старт. */
export const IconHome = makeIcon(
  <>
    <path d="M4 10.5L12 4l8 6.5" />
    <path d="M6 9.5V19a1 1 0 001 1h10a1 1 0 001-1V9.5" />
    <path d="M10 20v-5.5h4V20" />
  </>,
);

/** Часы. */
export const IconClock = makeIcon(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7v5l3.5 2" />
  </>,
);

/** Рука-кнопка — сыграть/начать. */
export const IconPlay = makeIcon(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M10 8.8l5 3.2-5 3.2V8.8z" />
  </>,
);

/** Карта-иконка соответствует IconName. */
export const ICON_MAP = {
  coins: IconCoins,
  star: IconStar,
  bolt: IconBolt,
  subs: IconSubs,
  megaphone: IconMegaphone,
  clapper: IconClapper,
  briefcase: IconBriefcase,
  broadcast: IconBroadcast,
  moon: IconMoon,
  camera: IconCamera,
  map: IconMap,
  growth: IconGrowth,
  trophy: IconTrophy,
  lock: IconLock,
  check: IconCheck,
  x: IconX,
  plus: IconPlus,
  gift: IconGift,
  quest: IconQuest,
  burst: IconBurst,
  pin: IconPin,
  down: IconDown,
  right: IconRight,
  flag: IconFlag,
  sparkle: IconSparkle,
  phone: IconPhone,
  mic: IconMic,
  bulb: IconBulb,
  drone: IconDrone,
  studio: IconStudio,
  crown: IconCrown,
  home: IconHome,
  clock: IconClock,
  play: IconPlay,
} as const;

export type GameIconName = keyof typeof ICON_MAP;

export function GameIcon({
  name,
  size,
  className,
}: {
  name: GameIconName;
  size?: number;
  className?: string;
}) {
  const Cmp = ICON_MAP[name] ?? IconSparkle;
  return <Cmp size={size} className={className} />;
}
import { useEffect, useState } from 'react';
import originalArchiCharacter from '@assets/generated_images/archi-character.png';

type ArchiLook = {
  id: string;
  minLevel: number;
  fileName: string;
  alt: string;
};

/**
 * Replace the files in public/images/archi/ with real ARCHI photos.
 * The level thresholds keep the visual progression independent from game state.
 */
const ARCHI_LOOKS: ArchiLook[] = [
  {
    id: 'season-04',
    minLevel: 30,
    fileName: 'level-30.png',
    alt: 'ARCHI — образ четвёртого этапа пути',
  },
  {
    id: 'season-03',
    minLevel: 20,
    fileName: 'level-20.png',
    alt: 'ARCHI — образ третьего этапа пути',
  },
  {
    id: 'season-02',
    minLevel: 10,
    fileName: 'level-10.png',
    alt: 'ARCHI — образ второго этапа пути',
  },
  {
    id: 'season-01',
    minLevel: 1,
    fileName: 'level-01.png',
    alt: 'ARCHI — образ первого этапа пути',
  },
];

const getArchiLook = (level: number) =>
  ARCHI_LOOKS.find((look) => level >= look.minLevel) ?? ARCHI_LOOKS.at(-1)!;

type ArchiCharacterProps = {
  level: number;
};

export function ArchiCharacter({ level }: ArchiCharacterProps) {
  const look = getArchiLook(level);
  const lookImage =
    look.minLevel === 1
      ? originalArchiCharacter
      : `${import.meta.env.BASE_URL}images/archi/${look.fileName}`;
  const [failedImage, setFailedImage] = useState<string | null>(null);

  useEffect(() => {
    setFailedImage(null);
  }, [lookImage]);

  const imageSource =
    failedImage === lookImage ? originalArchiCharacter : lookImage;

  return (
    <div className="archi-character" aria-label="Персонаж ARCHI" data-archi-look={look.id}>
      <img
        src={imageSource}
        alt={look.alt}
        className="archi-image archi-photo"
        width="1024"
        height="1024"
        fetchPriority="high"
        onError={() => setFailedImage(lookImage)}
      />
    </div>
  );
}
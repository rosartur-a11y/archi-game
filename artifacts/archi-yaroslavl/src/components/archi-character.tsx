import { useEffect, useState } from 'react';
import originalArchiCharacter from '@assets/generated_images/archi-character.png';

type ArchiLook = {
  id: string;
  minLevel: number;
  fileName: string;
  alt: string;
};

/**
 * These four assets are cropped from the "СТИЛИ ПЕРСОНАЖА" row in the
 * uploaded reference sheet. Only the portrait area is used; the source
 * sheet's headings, labels, frames, and other panels are not part of the
 * in-game character assets.
 */
const ARCHI_LOOKS: ArchiLook[] = [
  {
    id: 'legend',
    minLevel: 30,
    fileName: 'level-30.png',
    alt: 'ARCHI — образ «Легенда»',
  },
  {
    id: 'successful',
    minLevel: 20,
    fileName: 'level-20.png',
    alt: 'ARCHI — образ «Успешный»',
  },
  {
    id: 'development',
    minLevel: 10,
    fileName: 'level-10.png',
    alt: 'ARCHI — образ «Развитие»',
  },
  {
    id: 'novice',
    minLevel: 1,
    fileName: 'level-01.png',
    alt: 'ARCHI — образ «Новичок»',
  },
];

const getArchiLook = (level: number) =>
  ARCHI_LOOKS.find((look) => level >= look.minLevel) ?? ARCHI_LOOKS.at(-1)!;

type ArchiCharacterProps = {
  level: number;
};

export function ArchiCharacter({ level }: ArchiCharacterProps) {
  const look = getArchiLook(level);
  const lookImage = `${import.meta.env.BASE_URL}images/archi/${look.fileName}`;
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
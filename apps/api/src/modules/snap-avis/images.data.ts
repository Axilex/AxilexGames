import { SnapAvisImage } from '@wiki-race/shared';

/**
 * Catalogue d'images organisées par catégorie.
 * Format Picsum : https://picsum.photos/id/{id}/800/600 (stable, sans authentification)
 */
export const IMAGE_POOL: SnapAvisImage[] = [
  // Urbain
  { id: 'urbain-001', url: 'https://picsum.photos/id/1015/800/600', category: 'urbain' },
  { id: 'urbain-002', url: 'https://picsum.photos/id/1016/800/600', category: 'urbain' },
  { id: 'urbain-003', url: 'https://picsum.photos/id/1040/800/600', category: 'urbain' },
  { id: 'urbain-004', url: 'https://picsum.photos/id/1042/800/600', category: 'urbain' },
  { id: 'urbain-005', url: 'https://picsum.photos/id/1044/800/600', category: 'urbain' },
  { id: 'urbain-006', url: 'https://picsum.photos/id/1047/800/600', category: 'urbain' },
  { id: 'urbain-007', url: 'https://picsum.photos/id/1050/800/600', category: 'urbain' },
  { id: 'urbain-008', url: 'https://picsum.photos/id/1052/800/600', category: 'urbain' },
  { id: 'urbain-009', url: 'https://picsum.photos/id/1060/800/600', category: 'urbain' },
  { id: 'urbain-010', url: 'https://picsum.photos/id/1062/800/600', category: 'urbain' },
  // Nature
  { id: 'nature-001', url: 'https://picsum.photos/id/10/800/600', category: 'nature' },
  { id: 'nature-002', url: 'https://picsum.photos/id/11/800/600', category: 'nature' },
  { id: 'nature-003', url: 'https://picsum.photos/id/12/800/600', category: 'nature' },
  { id: 'nature-004', url: 'https://picsum.photos/id/13/800/600', category: 'nature' },
  { id: 'nature-005', url: 'https://picsum.photos/id/15/800/600', category: 'nature' },
  { id: 'nature-006', url: 'https://picsum.photos/id/16/800/600', category: 'nature' },
  { id: 'nature-007', url: 'https://picsum.photos/id/17/800/600', category: 'nature' },
  { id: 'nature-008', url: 'https://picsum.photos/id/18/800/600', category: 'nature' },
  { id: 'nature-009', url: 'https://picsum.photos/id/19/800/600', category: 'nature' },
  { id: 'nature-010', url: 'https://picsum.photos/id/20/800/600', category: 'nature' },
  // Nourriture
  { id: 'food-001', url: 'https://picsum.photos/id/292/800/600', category: 'nourriture' },
  { id: 'food-002', url: 'https://picsum.photos/id/294/800/600', category: 'nourriture' },
  { id: 'food-003', url: 'https://picsum.photos/id/312/800/600', category: 'nourriture' },
  { id: 'food-004', url: 'https://picsum.photos/id/326/800/600', category: 'nourriture' },
  { id: 'food-005', url: 'https://picsum.photos/id/431/800/600', category: 'nourriture' },
  { id: 'food-006', url: 'https://picsum.photos/id/493/800/600', category: 'nourriture' },
  { id: 'food-007', url: 'https://picsum.photos/id/545/800/600', category: 'nourriture' },
  { id: 'food-008', url: 'https://picsum.photos/id/593/800/600', category: 'nourriture' },
  { id: 'food-009', url: 'https://picsum.photos/id/674/800/600', category: 'nourriture' },
  { id: 'food-010', url: 'https://picsum.photos/id/755/800/600', category: 'nourriture' },
  // Animaux
  { id: 'animaux-001', url: 'https://picsum.photos/id/200/800/600', category: 'animaux' },
  { id: 'animaux-002', url: 'https://picsum.photos/id/237/800/600', category: 'animaux' },
  { id: 'animaux-003', url: 'https://picsum.photos/id/357/800/600', category: 'animaux' },
  { id: 'animaux-004', url: 'https://picsum.photos/id/433/800/600', category: 'animaux' },
  { id: 'animaux-005', url: 'https://picsum.photos/id/500/800/600', category: 'animaux' },
  { id: 'animaux-006', url: 'https://picsum.photos/id/582/800/600', category: 'animaux' },
  { id: 'animaux-007', url: 'https://picsum.photos/id/659/800/600', category: 'animaux' },
  { id: 'animaux-008', url: 'https://picsum.photos/id/718/800/600', category: 'animaux' },
  { id: 'animaux-009', url: 'https://picsum.photos/id/883/800/600', category: 'animaux' },
  // Sport
  { id: 'sport-001', url: 'https://picsum.photos/id/145/800/600', category: 'sport' },
  { id: 'sport-002', url: 'https://picsum.photos/id/169/800/600', category: 'sport' },
  { id: 'sport-003', url: 'https://picsum.photos/id/219/800/600', category: 'sport' },
  { id: 'sport-004', url: 'https://picsum.photos/id/306/800/600', category: 'sport' },
  { id: 'sport-005', url: 'https://picsum.photos/id/376/800/600', category: 'sport' },
  { id: 'sport-006', url: 'https://picsum.photos/id/386/800/600', category: 'sport' },
  { id: 'sport-007', url: 'https://picsum.photos/id/387/800/600', category: 'sport' },
  { id: 'sport-009', url: 'https://picsum.photos/id/539/800/600', category: 'sport' },
  { id: 'sport-010', url: 'https://picsum.photos/id/574/800/600', category: 'sport' },
  // Bizarre / insolite
  { id: 'bizarre-001', url: 'https://picsum.photos/id/3/800/600', category: 'bizarre' },
  { id: 'bizarre-002', url: 'https://picsum.photos/id/24/800/600', category: 'bizarre' },
  { id: 'bizarre-003', url: 'https://picsum.photos/id/96/800/600', category: 'bizarre' },
  { id: 'bizarre-004', url: 'https://picsum.photos/id/103/800/600', category: 'bizarre' },
  { id: 'bizarre-005', url: 'https://picsum.photos/id/160/800/600', category: 'bizarre' },
  { id: 'bizarre-006', url: 'https://picsum.photos/id/318/800/600', category: 'bizarre' },
  { id: 'bizarre-007', url: 'https://picsum.photos/id/398/800/600', category: 'bizarre' },
  { id: 'bizarre-008', url: 'https://picsum.photos/id/426/800/600', category: 'bizarre' },
  { id: 'bizarre-009', url: 'https://picsum.photos/id/504/800/600', category: 'bizarre' },
  { id: 'bizarre-010', url: 'https://picsum.photos/id/643/800/600', category: 'bizarre' },
  // Vintage
  { id: 'vintage-001', url: 'https://picsum.photos/id/30/800/600', category: 'vintage' },
  { id: 'vintage-002', url: 'https://picsum.photos/id/36/800/600', category: 'vintage' },
  { id: 'vintage-003', url: 'https://picsum.photos/id/60/800/600', category: 'vintage' },
  { id: 'vintage-004', url: 'https://picsum.photos/id/63/800/600', category: 'vintage' },
  { id: 'vintage-005', url: 'https://picsum.photos/id/76/800/600', category: 'vintage' },
  { id: 'vintage-006', url: 'https://picsum.photos/id/116/800/600', category: 'vintage' },
  { id: 'vintage-007', url: 'https://picsum.photos/id/126/800/600', category: 'vintage' },
  { id: 'vintage-008', url: 'https://picsum.photos/id/136/800/600', category: 'vintage' },
  { id: 'vintage-009', url: 'https://picsum.photos/id/180/800/600', category: 'vintage' },
  { id: 'vintage-010', url: 'https://picsum.photos/id/189/800/600', category: 'vintage' },
  // Abstrait
  { id: 'abstrait-001', url: 'https://picsum.photos/id/0/800/600', category: 'abstrait' },
  { id: 'abstrait-002', url: 'https://picsum.photos/id/25/800/600', category: 'abstrait' },
  { id: 'abstrait-003', url: 'https://picsum.photos/id/42/800/600', category: 'abstrait' },
  { id: 'abstrait-004', url: 'https://picsum.photos/id/56/800/600', category: 'abstrait' },
  { id: 'abstrait-005', url: 'https://picsum.photos/id/89/800/600', category: 'abstrait' },
  { id: 'abstrait-006', url: 'https://picsum.photos/id/100/800/600', category: 'abstrait' },
  { id: 'abstrait-007', url: 'https://picsum.photos/id/163/800/600', category: 'abstrait' },
  { id: 'abstrait-008', url: 'https://picsum.photos/id/193/800/600', category: 'abstrait' },
  { id: 'abstrait-009', url: 'https://picsum.photos/id/240/800/600', category: 'abstrait' },
  { id: 'abstrait-010', url: 'https://picsum.photos/id/249/800/600', category: 'abstrait' },
  // Objets
  { id: 'objets-001', url: 'https://picsum.photos/id/48/800/600', category: 'objets' },
  { id: 'objets-002', url: 'https://picsum.photos/id/65/800/600', category: 'objets' },
  { id: 'objets-003', url: 'https://picsum.photos/id/119/800/600', category: 'objets' },
  { id: 'objets-004', url: 'https://picsum.photos/id/149/800/600', category: 'objets' },
  { id: 'objets-005', url: 'https://picsum.photos/id/188/800/600', category: 'objets' },
  { id: 'objets-006', url: 'https://picsum.photos/id/225/800/600', category: 'objets' },
  { id: 'objets-007', url: 'https://picsum.photos/id/256/800/600', category: 'objets' },
  { id: 'objets-008', url: 'https://picsum.photos/id/288/800/600', category: 'objets' },
  { id: 'objets-009', url: 'https://picsum.photos/id/342/800/600', category: 'objets' },
  { id: 'objets-010', url: 'https://picsum.photos/id/366/800/600', category: 'objets' },
];

/** Fisher-Yates shuffle */
export function shuffleImages(images: SnapAvisImage[]): SnapAvisImage[] {
  const arr = [...images];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

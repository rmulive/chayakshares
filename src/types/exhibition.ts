export type AwardTier = 
  | 'Best of Show'
  | 'FIAP Gold'
  | 'PSA Gold'
  | 'FIAP Silver'
  | 'PSA Bronze'
  | 'FIAP Ribbon'
  | 'Honorable Mention'
  | 'Salon Acceptance';

export type GalleryTheme = 
  | 'minimalist-alabaster'
  | 'dark-noir'
  | 'warm-travertine'
  | 'brutalist-concrete';

export interface ArtworkEXIF {
  camera: string;
  lens: string;
  focalLength: string;
  aperture: string;
  shutterSpeed: string;
  iso: string;
  location: string;
  year: number;
}

export interface Artwork {
  id: string;
  title: string;
  photographer: string;
  photographerHonors?: string; // e.g. "EFIAP/d3, MPSA"
  country: string;
  countryCode: string;
  category: string;
  awardTier: AwardTier;
  imageUrl: string;
  thumbnailUrl?: string;
  aspectRatio: number; // width / height
  description: string;
  curatorNote?: string;
  exif: ArtworkEXIF;
  isHero?: boolean;
  // Spatial coordinates in 3D world (calculated or assigned)
  position?: [number, number, number];
  rotationY?: number;
  wallSide?: 'left' | 'right' | 'center' | 'hero';
}

export interface CategoryWing {
  id: string;
  name: string;
  description: string;
  iconName: string;
  colorHex: string;
  zStart: number;
  zEnd: number;
}

export interface GuestbookEntry {
  id: string;
  author: string;
  country: string;
  message: string;
  timestamp: number;
  rating: number; // 1 to 5 stars
  avatarColor?: string;
}

export interface CameraPose {
  x: number;
  y: number;
  z: number;
  targetX: number;
  targetY: number;
  targetZ: number;
}

export interface SalonInfo {
  name: string;
  edition: string;
  year: number;
  patronages: {
    fiap: string;
    psa: string;
  };
  totalSubmissions: number;
  acceptedCount: number;
  countriesRepresented: number;
  juryChair: string;
}

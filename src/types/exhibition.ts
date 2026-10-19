export type AwardTier = 
  | 'Best of Show'
  | 'FIAP Gold'
  | 'PSA Gold'
  | 'FIAP Silver'
  | 'PSA Bronze'
  | 'FIAP Ribbon'
  | 'Honorable Mention'
  | 'Salon Acceptance'
  | string;

export type GalleryTheme = 
  | 'minimalist-alabaster'
  | 'dark-noir'
  | 'warm-travertine'
  | 'brutalist-concrete';

export interface ArtworkEXIF {
  camera?: string;
  lens?: string;
  focalLength?: string;
  aperture?: string;
  shutterSpeed?: string;
  iso?: string;
  location?: string;
  year?: number;
}

export interface Artwork {
  id: string;
  title: string;
  photographer: string;
  photographerHonors?: string;
  school?: string;             // School / Institution
  place?: string;              // Specific award ranking (e.g. "1st Place - Gold Award")
  country?: string;
  countryCode?: string;
  category: string;
  awardTier: AwardTier;
  imageUrl: string;
  thumbnailUrl?: string;
  aspectRatio: number; // width / height, dynamically adjusted!
  description?: string;
  curatorNote?: string;
  exif?: ArtworkEXIF; // Camera data is optional
  isHero?: boolean;
  position?: [number, number, number];
  rotationY?: number;
  wallSide?: 'left' | 'right' | 'center' | 'hero';
}

export interface SectionAward {
  id: string;
  name: string;
  spotlightColorHex: string;
  plaqueStyle: 'gold' | 'silver' | 'bronze' | 'slate';
  medalType?: 'trophy' | 'gold' | 'silver' | 'bronze' | 'ribbon' | 'acceptance';
}

export interface CategoryWing {
  id: string;
  name: string;
  description: string;
  iconName: string;
  colorHex: string;
  zStart: number;
  zEnd: number;
  awards?: SectionAward[]; // Specific awards defined for this section
}

export interface GuestbookEntry {
  id: string;
  author: string;
  country: string;
  message: string;
  timestamp: number;
  rating: number;
  avatarColor?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  provider: 'google' | 'password';
}

export interface AwardDefinition {
  id: string;
  name: string;
  spotlightColorHex: string;
  plaqueStyle: 'gold' | 'silver' | 'bronze' | 'slate';
  medalType: 'trophy' | 'gold' | 'silver' | 'bronze' | 'ribbon' | 'acceptance';
  description?: string;
}

export interface SalonJudge {
  id: string;
  name: string;
  country: string;
  honors: string;
  role?: string;
  imageUrl?: string;
}

export interface PatronageOrg {
  id: string;
  organization: string; // e.g. "IAAP", "FIAP", "PSA", etc.
  patronageNumber: string; // e.g. "2026/503"
  certificateUrl?: string;
}

export interface SalonInfo {
  name: string;
  edition: string;
  year: number;
  organizedBy: string;
  school: string;
  officialUrl?: string;
  iaapResultsUrl?: string; // Link to IAAP Results Page
  catalogPdfUrl?: string;
  catalogPdfName?: string;
  patronageList: PatronageOrg[]; // Admin managed organizations and patronage numbers
  patronages?: {
    iaap?: string;
    fiap?: string;
    psa?: string;
  };
  totalSubmissions: number;
  acceptedCount: number;
  countriesRepresented: number;
  juryChair: string;
  judges?: SalonJudge[];
}

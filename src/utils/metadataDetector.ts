import type { SectionAward } from '../types/exhibition';

export interface ParsedFilenameMetadata {
  award: string;
  photographer: string;
  title: string;
  isAutoDetected: boolean;
  detectedParts: number;
}

export interface ParticipantSchoolRecord {
  name: string;
  school: string;
  normalizedName: string;
  photoTitle?: string;
}

/**
 * Escapes special characters for regex matching
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Normalizes a participant name for flexible matching
 * e.g. "H. D. Pamudu Chethana" -> "h d pamudu chethana"
 */
export function normalizeParticipantName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[.,\-_/\\()[\]{}'"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detects Award, Photographer Name, and Photo Title from photograph filename.
 * Expected format: {Award Name} - {Photographer} - {Photo Title}.jpg
 * Examples:
 *   - "1st Place - Gold Award - Seniru Jayawardena - The Whispering Mist.jpg"
 *   - "National Gold - H D Pamudu Chethana - The Forked Tongue.jpg"
 *   - "Merit Award - K.G. Perera - Sunset at Yala.PNG"
 */
export function parsePhotographFilename(
  filename: string,
  availableAwards: SectionAward[] = [],
  defaultAwardName: string = 'Salon Acceptance'
): ParsedFilenameMetadata {
  // 1. Strip file extension (.jpg, .jpeg, .png, .webp, etc.)
  const rawBaseName = filename.replace(/\.[^/.]+$/, '').trim();

  // 2. Normalize dashes (en-dash –, em-dash —, hyphens)
  const normalized = rawBaseName.replace(/[\u2013\u2014\u2015\u2212]/g, '-');

  // Strategy A: Check if filename starts with any known configured award name (even with hyphens)
  if (availableAwards.length > 0) {
    // Sort awards by length descending so longer matching awards match first
    const sortedAwards = [...availableAwards].sort((a, b) => b.name.length - a.name.length);
    for (const aw of sortedAwards) {
      const awPattern = new RegExp(`^${escapeRegex(aw.name)}\\s*[-–—]\\s*`, 'i');
      if (awPattern.test(normalized)) {
        const remainder = normalized.replace(awPattern, '').trim();
        const restParts = remainder.split(/\s*[-–—]\s*/);
        if (restParts.length >= 2) {
          return {
            award: aw.name,
            photographer: capitalizeWords(restParts[0]),
            title: capitalizeWords(restParts.slice(1).join(' - ')),
            isAutoDetected: true,
            detectedParts: 3,
          };
        } else if (restParts.length === 1) {
          return {
            award: aw.name,
            photographer: '',
            title: capitalizeWords(restParts[0]),
            isAutoDetected: true,
            detectedParts: 2,
          };
        }
      }
    }
  }

  // Strategy B: Split by hyphen with optional surrounding whitespace: " - " or "-"
  let parts = normalized.split(/\s*[-–—]\s*/).map(p => p.trim()).filter(Boolean);

  if (parts.length >= 3) {
    // Full 3-part format: {Award Name} - {Photographer} - {Photo Title}
    const rawAward = parts[0];
    const photographer = capitalizeWords(parts[1]);
    const title = capitalizeWords(parts.slice(2).join(' - '));

    const matchedAward = matchAwardName(rawAward, availableAwards, defaultAwardName);

    return {
      award: matchedAward,
      photographer,
      title,
      isAutoDetected: true,
      detectedParts: parts.length,
    };
  }

  if (parts.length === 2) {
    // 2-part format: Could be {Photographer} - {Photo Title} OR {Award} - {Title}
    const part0 = parts[0];
    const part1 = parts[1];

    // Check if part0 is an award tier
    const awardKeywords = ['gold', 'silver', 'bronze', 'merit', 'acceptance', 'place', 'trophy', 'ribbon', 'honor', 'winner', '1st', '2nd', '3rd'];
    const isFirstPartAward = awardKeywords.some(kw => part0.toLowerCase().includes(kw));

    if (isFirstPartAward) {
      const matchedAward = matchAwardName(part0, availableAwards, defaultAwardName);
      return {
        award: matchedAward,
        photographer: '',
        title: capitalizeWords(part1),
        isAutoDetected: true,
        detectedParts: 2,
      };
    } else {
      // Default interpretation: {Photographer} - {Photo Title}
      return {
        award: defaultAwardName,
        photographer: capitalizeWords(part0),
        title: capitalizeWords(part1),
        isAutoDetected: true,
        detectedParts: 2,
      };
    }
  }

  // 1-part format: Just {Photo Title}
  const cleanTitle = capitalizeWords(rawBaseName.replace(/[_-]/g, ' '));
  return {
    award: defaultAwardName,
    photographer: '',
    title: cleanTitle,
    isAutoDetected: false,
    detectedParts: 1,
  };
}

/**
 * Smart award matcher: matches raw award text against section's defined awards
 */
export function matchAwardName(
  rawAward: string,
  availableAwards: SectionAward[],
  fallbackAward: string
): string {
  if (!rawAward || availableAwards.length === 0) return rawAward || fallbackAward;

  const rawLower = rawAward.toLowerCase().trim();

  // 1. Exact match (case-insensitive)
  const exact = availableAwards.find(a => a.name.toLowerCase() === rawLower);
  if (exact) return exact.name;

  // 2. Contains match
  const contains = availableAwards.find(a => {
    const aLower = a.name.toLowerCase();
    return aLower.includes(rawLower) || rawLower.includes(aLower);
  });
  if (contains) return contains.name;

  // 3. Keyword based matching
  if (rawLower.includes('1st') || rawLower.includes('first') || (rawLower.includes('gold') && !rawLower.includes('silver') && !rawLower.includes('bronze'))) {
    const gold = availableAwards.find(a => a.name.toLowerCase().includes('gold') || a.name.toLowerCase().includes('1st'));
    if (gold) return gold.name;
  }
  if (rawLower.includes('2nd') || rawLower.includes('second') || rawLower.includes('silver')) {
    const silver = availableAwards.find(a => a.name.toLowerCase().includes('silver') || a.name.toLowerCase().includes('2nd'));
    if (silver) return silver.name;
  }
  if (rawLower.includes('3rd') || rawLower.includes('third') || rawLower.includes('bronze')) {
    const bronze = availableAwards.find(a => a.name.toLowerCase().includes('bronze') || a.name.toLowerCase().includes('3rd'));
    if (bronze) return bronze.name;
  }
  if (rawLower.includes('merit')) {
    const merit = availableAwards.find(a => a.name.toLowerCase().includes('merit'));
    if (merit) return merit.name;
  }
  if (rawLower.includes('acceptance') || rawLower.includes('accepted')) {
    const acc = availableAwards.find(a => a.name.toLowerCase().includes('acceptance'));
    if (acc) return acc.name;
  }

  // If no match found among configured section awards, return the raw award string cleanly formatted
  return capitalizeWords(rawAward);
}

/**
 * Capitalizes names and titles cleanly while keeping small particles formatted
 */
export function capitalizeWords(str: string): string {
  if (!str) return '';
  return str
    .split(' ')
    .filter(Boolean)
    .map((word) => {
      // Check for initials like "H.", "D."
      if (word.length <= 2 && word.toUpperCase() === word) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Loads the SheetJS parser asynchronously from local vendor bundle or global window
 */
async function getXLSXParser(): Promise<any> {
  if (typeof window !== 'undefined' && (window as any).XLSX) {
    return (window as any).XLSX;
  }

  if (typeof document !== 'undefined') {
    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector('script[src*="xlsx"]');
      if (existing) {
        let attempts = 0;
        const check = setInterval(() => {
          attempts++;
          if ((window as any).XLSX) {
            clearInterval(check);
            resolve();
          } else if (attempts > 50) {
            clearInterval(check);
            reject(new Error('Timeout waiting for XLSX library'));
          }
        }, 50);
        return;
      }

      const script = document.createElement('script');
      script.src = '/vendor/xlsx.full.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load local Excel parser library'));
      document.head.appendChild(script);
    });

    return (window as any).XLSX;
  }

  throw new Error('Excel parser not available in this environment');
}

/**
 * Lightweight pure-JS CSV parser fallback
 */
function parseCSVRows(csvText: string): Record<string, any>[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, any>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, any> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    rows.push(row);
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if ((char === ',' || char === '\t') && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur.trim());
  return result;
}

/**
 * Parses an Excel (.xlsx, .xls) or CSV file containing participant records
 * and extracts participant names and their associated schools.
 */
export async function parseParticipantsExcel(file: File): Promise<{
  records: ParticipantSchoolRecord[];
  detectedColumns: { nameCol: string; schoolCol: string; titleCol?: string };
  rowCount: number;
  fileName: string;
}> {
  let rawRows: Record<string, any>[] = [];

  const isCsv = file.name.endsWith('.csv') || file.name.endsWith('.tsv') || file.type === 'text/csv';

  if (isCsv) {
    const text = await file.text();
    rawRows = parseCSVRows(text);
  } else {
    const XLSX = await getXLSXParser();
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('Excel workbook contains no sheets.');
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  }

  if (rawRows.length === 0) {
    throw new Error('The uploaded spreadsheet contains no data rows.');
  }

  // Detect column headers
  const sampleRow = rawRows[0];
  const colKeys = Object.keys(sampleRow);

  let nameCol = colKeys.find(k => /^(participant\s*name|photographer\s*name|photographer|student\s*name|full\s*name|name)$/i.test(k.trim()))
    || colKeys.find(k => /name|photographer|participant|student/i.test(k))
    || colKeys[0];

  let schoolCol = colKeys.find(k => /^(school|institution|college|school\s*name|school\/institution|institute|academy)$/i.test(k.trim()))
    || colKeys.find(k => /school|institution|college|institute/i.test(k))
    || colKeys[1]
    || colKeys[0];

  let titleCol = colKeys.find(k => /title|photograph\s*title|photo\s*title|caption/i.test(k));

  const records: ParticipantSchoolRecord[] = [];

  for (const row of rawRows) {
    const rawName = String(row[nameCol] || '').trim();
    const rawSchool = String(row[schoolCol] || '').trim();
    const rawTitle = titleCol ? String(row[titleCol] || '').trim() : undefined;

    if (!rawName) continue;

    records.push({
      name: rawName,
      school: rawSchool,
      normalizedName: normalizeParticipantName(rawName),
      photoTitle: rawTitle,
    });
  }

  return {
    records,
    detectedColumns: {
      nameCol,
      schoolCol,
      titleCol,
    },
    rowCount: records.length,
    fileName: file.name,
  };
}

/**
 * Searches the participant database for a matching school according to participant name.
 * Uses exact, substring, and token-based fuzzy matching.
 */
export function findSchoolForParticipant(
  photographerName: string,
  records: ParticipantSchoolRecord[]
): { school: string; matchedName: string; confidence: 'exact' | 'high' | 'partial' } | null {
  if (!photographerName || records.length === 0) return null;

  const targetNorm = normalizeParticipantName(photographerName);
  if (!targetNorm) return null;

  // 1. Exact normalized match
  for (const rec of records) {
    if (rec.normalizedName === targetNorm && rec.school) {
      return { school: rec.school, matchedName: rec.name, confidence: 'exact' };
    }
  }

  // 2. Contains match (e.g. "Pamudu Chethana" inside "H D Pamudu Chethana")
  for (const rec of records) {
    if (!rec.school) continue;
    if (rec.normalizedName.includes(targetNorm) || targetNorm.includes(rec.normalizedName)) {
      return { school: rec.school, matchedName: rec.name, confidence: 'high' };
    }
  }

  // 3. Multi-token overlap (e.g. matching significant names like ["pamudu", "chethana"])
  const targetTokens = targetNorm.split(' ').filter(t => t.length > 2);
  if (targetTokens.length >= 2) {
    for (const rec of records) {
      if (!rec.school) continue;
      const recTokens = rec.normalizedName.split(' ').filter(t => t.length > 2);
      
      const matches = targetTokens.filter(t => recTokens.includes(t));
      if (matches.length >= 2 || (targetTokens.length === 2 && matches.length === 2)) {
        return { school: rec.school, matchedName: rec.name, confidence: 'high' };
      }
    }
  }

  // 4. Single significant surname/first-name match (if distinct in dataset)
  if (targetTokens.length === 1 && targetTokens[0].length >= 4) {
    const singleMatches = records.filter(r => r.normalizedName.includes(targetTokens[0]) && r.school);
    if (singleMatches.length === 1) {
      return { school: singleMatches[0].school, matchedName: singleMatches[0].name, confidence: 'partial' };
    }
  }

  return null;
}

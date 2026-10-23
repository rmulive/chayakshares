import React, { useState, useRef } from 'react';
import {
  X,
  Palette,
  PlusCircle,
  Plus,
  Trash2,
  Check,
  Eye,
  Lock,
  LogOut,
  UserCheck,
  School,
  Award,
  Upload,
  Layers,
  FileUp,
  Globe,
  Settings,
  CheckSquare,
  Square,
  Users,
  ShieldCheck,
  Copy,
  ExternalLink,
  ArrowLeft,
  FileDown,
  Edit2,
  Edit3,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  FileSpreadsheet,
  Sparkles,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { exhibitionStore, useExhibitionStore } from '../store/exhibitionStore';
import {
  uploadImageToStorage,
  uploadCatalogPdfToStorage,
} from '../firebase/firebaseService';
import { optimizeImageFile, saveImageToIndexedDb } from '../utils/imageOptimizer';
import {
  parsePhotographFilename,
  parseParticipantsExcel,
  findSchoolForParticipant,
  type ParticipantSchoolRecord,
} from '../utils/metadataDetector';
import type {
  Artwork,
  GalleryTheme,
  CategoryWing,
  SectionAward,
  PatronageOrg,
  SalonJudge,
} from '../types/exhibition';

interface BulkUploadItem {
  id: string;
  file?: File;
  imageUrl: string;
  localDataUrl?: string;
  title: string;
  photographer: string;
  school: string;
  award: string;
  aspectRatio: number;
  originalFilename?: string;
  isAutoDetected?: boolean;
  detectedSchool?: boolean;
  matchedParticipantName?: string;
}

interface AdminPortalPageProps {
  onExit: () => void;
}

export const AdminPortalPage: React.FC<AdminPortalPageProps> = ({ onExit }) => {
  const { artworks, wings, salonInfo, guestbook, adminUser } = useExhibitionStore();

  const [activeTab, setActiveTab] = useState<
    'bulk-upload' | 'artworks' | 'sections' | 'judges' | 'patronages' | 'details' | 'themes' | 'guestbook'
  >('bulk-upload');

  // Authentication state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Global notification banner
  const [successMsg, setSuccessMsg] = useState('');
  const [isSyncingFirebase, setIsSyncingFirebase] = useState(false);
  const showBanner = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleSyncToFirebase = async () => {
    setIsSyncingFirebase(true);
    try {
      const res = await exhibitionStore.syncToFirebase();
      if (res.success) {
        showBanner('Exhibition data synchronized to Cloud Firestore!');
      } else {
        alert(`Firebase sync notice: ${res.message}`);
      }
    } catch (e: any) {
      alert(`Sync notice: ${e?.message || e}`);
    } finally {
      setIsSyncingFirebase(false);
    }
  };

  // -------------------------------------------------------------
  // TAB 1: BULK GRID VIEW UPLOAD STATE (Photo Title, Award, Photographer, School)
  // -------------------------------------------------------------
  const [selectedSectionId, setSelectedSectionId] = useState<string>(wings[1]?.id || wings[0]?.id || 'awards');
  const [bulkQueue, setBulkQueue] = useState<BulkUploadItem[]>([]);
  const [singleImageUrlInput, setSingleImageUrlInput] = useState('');
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  // Participant School Database state (loaded from Excel / CSV or localStorage)
  const [participantRecords, setParticipantRecords] = useState<ParticipantSchoolRecord[]>(() => {
    try {
      const cached = localStorage.getItem('chayaksha_participants_db');
      if (cached) {
        const parsed = JSON.parse(cached);
        return Array.isArray(parsed.records) ? parsed.records : [];
      }
    } catch (e) {
      console.warn('Could not restore participant records from localStorage', e);
    }
    return [];
  });

  const [excelFileInfo, setExcelFileInfo] = useState<{
    fileName: string;
    rowCount: number;
    columns: { nameCol: string; schoolCol: string; titleCol?: string };
  } | null>(() => {
    try {
      const cached = localStorage.getItem('chayaksha_participants_db');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.fileName && parsed.rowCount) {
          return {
            fileName: parsed.fileName,
            rowCount: parsed.rowCount,
            columns: parsed.detectedColumns || { nameCol: 'Name', schoolCol: 'School' },
          };
        }
      }
    } catch (e) {}
    return null;
  });

  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [excelError, setExcelError] = useState<string | null>(null);
  const excelFileInputRef = useRef<HTMLInputElement>(null);

  // Drag and drop state for bulk uploading order
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Active section's defined awards
  const activeWing = wings.find(w => w.id === selectedSectionId) || wings[0];
  const sectionAwards: SectionAward[] = activeWing?.awards && activeWing.awards.length > 0
    ? activeWing.awards
    : [
        { id: 'def-1', name: '1st Place - Gold Award', spotlightColorHex: '#ffd700', plaqueStyle: 'gold' },
        { id: 'def-2', name: '2nd Place - Silver Award', spotlightColorHex: '#e0e7ff', plaqueStyle: 'silver' },
        { id: 'def-3', name: '3rd Place - Bronze Award', spotlightColorHex: '#f59e0b', plaqueStyle: 'bronze' },
        { id: 'def-4', name: 'Merit Award', spotlightColorHex: '#fef08a', plaqueStyle: 'gold' },
        { id: 'def-5', name: 'Salon Acceptance', spotlightColorHex: '#f8fafc', plaqueStyle: 'slate' },
      ];

  const defaultAwardName = sectionAwards[0]?.name || '1st Place - Gold Award';

  // Excel file parsing and school auto-detection
  const handleProcessExcelFile = async (file: File) => {
    setIsParsingExcel(true);
    setExcelError(null);
    try {
      const result = await parseParticipantsExcel(file);
      setParticipantRecords(result.records);
      setExcelFileInfo({
        fileName: result.fileName,
        rowCount: result.rowCount,
        columns: result.detectedColumns,
      });

      // Cache to localStorage
      try {
        localStorage.setItem(
          'chayaksha_participants_db',
          JSON.stringify({
            records: result.records,
            fileName: result.fileName,
            rowCount: result.rowCount,
            detectedColumns: result.detectedColumns,
            updatedAt: Date.now(),
          })
        );
      } catch (err) {
        console.warn('Could not cache participants in localStorage:', err);
      }

      // Retroactively match schools for photographs currently queued in grid!
      let retroMatchedCount = 0;
      setBulkQueue(prev =>
        prev.map(item => {
          if (!item.photographer) return item;
          const match = findSchoolForParticipant(item.photographer, result.records);
          if (match) {
            retroMatchedCount++;
            return {
              ...item,
              school: match.school,
              detectedSchool: true,
              matchedParticipantName: match.matchedName,
            };
          }
          return item;
        })
      );

      showBanner(
        `Excel loaded: ${result.rowCount} participants indexed. Columns: "${result.detectedColumns.nameCol}" & "${result.detectedColumns.schoolCol}".` +
        (retroMatchedCount > 0 ? ` Matched schools for ${retroMatchedCount} queued item(s)!` : '')
      );
    } catch (err: any) {
      console.error('Failed to parse participant spreadsheet:', err);
      setExcelError(err?.message || 'Failed to read spreadsheet file');
      alert(`Spreadsheet processing error: ${err?.message || 'Unable to parse Excel file.'}`);
    } finally {
      setIsParsingExcel(false);
    }
  };

  const handleClearExcelDatabase = () => {
    if (confirm('Clear the loaded participant database from the admin portal?')) {
      setParticipantRecords([]);
      setExcelFileInfo(null);
      localStorage.removeItem('chayaksha_participants_db');
      showBanner('Participant spreadsheet database cleared.');
    }
  };

  const handleReapplySchoolMatching = () => {
    if (participantRecords.length === 0) {
      alert('Please upload a participants Excel or CSV file first.');
      return;
    }
    let matchedCount = 0;
    setBulkQueue(prev =>
      prev.map(item => {
        if (!item.photographer) return item;
        const match = findSchoolForParticipant(item.photographer, participantRecords);
        if (match) {
          matchedCount++;
          return {
            ...item,
            school: match.school,
            detectedSchool: true,
            matchedParticipantName: match.matchedName,
          };
        }
        return item;
      })
    );
    showBanner(`School auto-match re-applied: ${matchedCount} of ${bulkQueue.length} photograph(s) matched.`);
  };

  // Modal / Inline Edit States
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
  const [editingSection, setEditingSection] = useState<CategoryWing | null>(null);
  const [editingSectionAward, setEditingSectionAward] = useState<{ wingId: string; award: SectionAward } | null>(null);
  const [addingAwardWingId, setAddingAwardWingId] = useState<string | null>(null);
  const [newSecAwardName, setNewSecAwardName] = useState('');
  const [newSecAwardSpotlight, setNewSecAwardSpotlight] = useState('#ffd700');
  const [newSecAwardPlaque, setNewSecAwardPlaque] = useState<'gold' | 'silver' | 'bronze' | 'slate'>('gold');

  const [editingJudge, setEditingJudge] = useState<SalonJudge | null>(null);
  const [editingPatronage, setEditingPatronage] = useState<PatronageOrg | null>(null);

  const handleSectionChange = (newSecId: string) => {
    setSelectedSectionId(newSecId);
    const targetWing = wings.find(w => w.id === newSecId);
    const targetAwards = targetWing?.awards && targetWing.awards.length > 0
      ? targetWing.awards
      : [
          { id: 'def-1', name: '1st Place - Gold Award', spotlightColorHex: '#ffd700', plaqueStyle: 'gold' as const },
          { id: 'def-2', name: '2nd Place - Silver Award', spotlightColorHex: '#e0e7ff', plaqueStyle: 'silver' as const },
          { id: 'def-3', name: '3rd Place - Bronze Award', spotlightColorHex: '#f59e0b', plaqueStyle: 'bronze' as const },
          { id: 'def-4', name: 'Merit Award', spotlightColorHex: '#fef08a', plaqueStyle: 'gold' as const },
          { id: 'def-5', name: 'Salon Acceptance', spotlightColorHex: '#f8fafc', plaqueStyle: 'slate' as const },
        ];
    const targetDefaultAward = targetAwards[0]?.name || 'Salon Acceptance';

    // Synchronize queued items to ensure award dropdown strictly belongs to the new section!
    setBulkQueue(prev => prev.map(item => {
      const exists = targetAwards.some(a => a.name === item.award);
      return exists ? item : { ...item, award: targetDefaultAward };
    }));
  };

  const handleDropReorder = (fromIndex: number | null, toIndex: number) => {
    if (fromIndex === null || fromIndex === toIndex) return;
    setBulkQueue(prev => {
      const copy = [...prev];
      const [movedItem] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, movedItem);
      return copy;
    });
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleMoveItem = (index: number, direction: 'prev' | 'next') => {
    const targetIndex = direction === 'prev' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= bulkQueue.length) return;
    handleDropReorder(index, targetIndex);
  };

  const handleProcessFilesList = (files: File[]) => {
    if (!files || files.length === 0) return;

    // Check if user included an Excel / CSV spreadsheet
    const excelFiles = files.filter(f =>
      f.name.endsWith('.xlsx') || f.name.endsWith('.xls') || f.name.endsWith('.csv') ||
      f.type === 'text/csv' || f.type.includes('spreadsheet')
    );
    if (excelFiles.length > 0) {
      handleProcessExcelFile(excelFiles[0]);
    }

    const imageFiles = files.filter(f =>
      f.type.startsWith('image/') || /\.(jpe?g|png|webp|avif|gif)$/i.test(f.name)
    );
    if (imageFiles.length === 0) return;

    let autoDetectedCount = 0;
    let schoolMatchedCount = 0;

    imageFiles.forEach(async (file) => {
      try {
        // High-performance optimizer: extracts exact natural aspect ratio & produces lightweight texture
        const opt = await optimizeImageFile(file, 2048, 0.88);
        const itemId = `bulk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

        // Smart Filename Metadata Detector
        // Format: {Award Name} - {Photographer} - {Photo Title}.jpg
        const parsedMeta = parsePhotographFilename(file.name, sectionAwards, defaultAwardName);
        if (parsedMeta.isAutoDetected) {
          autoDetectedCount++;
        }

        // Auto-match school from participant records if photographer was detected
        let matchedSchool = salonInfo.school || 'Rajapaksa Central College, Weeraketiya';
        let detectedSchool = false;
        let matchedName: string | undefined = undefined;

        if (parsedMeta.photographer && participantRecords.length > 0) {
          const schoolLookup = findSchoolForParticipant(parsedMeta.photographer, participantRecords);
          if (schoolLookup) {
            matchedSchool = schoolLookup.school;
            detectedSchool = true;
            matchedName = schoolLookup.matchedName;
            schoolMatchedCount++;
          }
        }

        // Save to IndexedDB immediately for instant offline/local rendering
        await saveImageToIndexedDb(itemId, opt.dataUrl);

        const newItem: BulkUploadItem = {
          id: itemId,
          file,
          imageUrl: opt.dataUrl,
          localDataUrl: opt.dataUrl,
          title: parsedMeta.title || file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
          photographer: parsedMeta.photographer || '',
          school: matchedSchool,
          award: parsedMeta.award || defaultAwardName,
          aspectRatio: opt.aspectRatio,
          originalFilename: file.name,
          isAutoDetected: parsedMeta.isAutoDetected,
          detectedSchool,
          matchedParticipantName: matchedName,
        };

        setBulkQueue(prev => [...prev, newItem]);

        // Asynchronously upload original to Firebase Cloud Storage bucket
        uploadImageToStorage(file, 'photographs')
          .then((fireUrl) => {
            handleUpdateBulkItem(newItem.id, 'imageUrl', fireUrl);
          })
          .catch((err) => {
            console.warn('Firebase Storage upload notice (using optimized local texture):', err);
          });
      } catch (err) {
        console.error('Failed to process image file:', file.name, err);
      }
    });

    if (autoDetectedCount > 0) {
      setTimeout(() => {
        showBanner(
          `Auto-detected details from filename for ${autoDetectedCount} image(s)!` +
          (schoolMatchedCount > 0 ? ` ${schoolMatchedCount} school(s) matched from spreadsheet.` : '')
        );
      }, 500);
    }
  };

  const handleBulkFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    handleProcessFilesList(Array.from(files));
    if (e.target) e.target.value = '';
  };

  const handleAddImageUrlToBulk = () => {
    if (!singleImageUrlInput.trim()) return;
    const url = singleImageUrlInput.trim();

    const img = new Image();
    if (url.startsWith('http://') || url.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      const ratio = (img.naturalWidth && img.naturalHeight)
        ? Number((img.naturalWidth / img.naturalHeight).toFixed(3))
        : 1.5;

      const newItem: BulkUploadItem = {
        id: `bulk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        imageUrl: url,
        title: 'Curated Photographic Work',
        photographer: '',
        school: salonInfo.school || 'Rajapaksa Central College, Weeraketiya',
        award: defaultAwardName,
        aspectRatio: ratio,
      };

      setBulkQueue(prev => [...prev, newItem]);
      setSingleImageUrlInput('');
    };
    img.onerror = () => {
      // Retry without CORS in case server blocks anonymous crossOrigin
      const retryImg = new Image();
      retryImg.onload = () => {
        const ratio = (retryImg.naturalWidth && retryImg.naturalHeight)
          ? Number((retryImg.naturalWidth / retryImg.naturalHeight).toFixed(3))
          : 1.5;

        const newItem: BulkUploadItem = {
          id: `bulk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          imageUrl: url,
          title: 'Curated Photographic Work',
          photographer: '',
          school: salonInfo.school || 'Rajapaksa Central College, Weeraketiya',
          award: defaultAwardName,
          aspectRatio: ratio,
        };

        setBulkQueue(prev => [...prev, newItem]);
        setSingleImageUrlInput('');
      };
      retryImg.onerror = () => {
        alert('Unable to load image from the provided URL. Please verify the link is accessible.');
      };
      retryImg.src = url;
    };
    img.src = url;
  };

  const handleUpdateBulkItem = (id: string, field: keyof BulkUploadItem, val: string | number) => {
    setBulkQueue(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: val };
        // When photographer name is updated, auto-match school from participant database if available
        if (field === 'photographer' && typeof val === 'string' && val.trim().length > 2 && participantRecords.length > 0) {
          const match = findSchoolForParticipant(val.trim(), participantRecords);
          if (match) {
            updated.school = match.school;
            updated.detectedSchool = true;
            updated.matchedParticipantName = match.matchedName;
          }
        }
        return updated;
      })
    );
  };

  const handleRemoveBulkItem = (id: string) => {
    setBulkQueue(prev => prev.filter(item => item.id !== id));
  };

  const handleBatchSetSchool = () => {
    const schoolVal = prompt('Enter School / Institution to apply to all items in grid:', salonInfo.school);
    if (!schoolVal) return;
    setBulkQueue(prev => prev.map(item => ({ ...item, school: schoolVal.trim() })));
  };

  const handleBatchSetAward = () => {
    const awardVal = prompt(`Enter Award name to apply to all items (e.g. "${defaultAwardName}"):`, defaultAwardName);
    if (!awardVal) return;
    setBulkQueue(prev => prev.map(item => ({ ...item, award: awardVal.trim() })));
  };

  const handlePublishAllBulkArtworks = () => {
    if (bulkQueue.length === 0) return;

    // Validate
    const invalid = bulkQueue.find(item => !item.title.trim() || !item.photographer.trim());
    if (invalid) {
      alert(`Please provide both Photograph Title and Photographer Name for all items in the grid.`);
      return;
    }

    const wing = activeWing;

    const newArtworks: Artwork[] = bulkQueue.map((item, idx) => {
      const artId = `art-curator-${Date.now()}-${idx}`;
      const localUrl = item.localDataUrl || item.imageUrl;
      if (localUrl) {
        saveImageToIndexedDb(artId, localUrl).catch(() => {});
      }

      return {
        id: artId,
        title: item.title.trim(),
        photographer: item.photographer.trim(),
        school: item.school.trim() || salonInfo.school,
        place: item.award,
        awardTier: item.award,
        imageUrl: item.imageUrl,
        aspectRatio: item.aspectRatio || 1.5,
        category: selectedSectionId,
        country: 'Sri Lanka',
        countryCode: 'LK',
        description: `Exhibition piece for ${wing?.name || 'Chayaksha 26\' Section'}.`,
        wallSide: 'left',
      };
    });

    exhibitionStore.bulkAddArtworks(newArtworks);
    setBulkQueue([]);
    showBanner(`Successfully published ${newArtworks.length} artworks into "${wing?.name}" section!`);
  };

  // -------------------------------------------------------------
  // TAB 2: ARTWORKS DIRECTORY & BULK DELETE
  // -------------------------------------------------------------
  const [selectedArtIds, setSelectedArtIds] = useState<string[]>([]);
  const [artFilterSection, setArtFilterSection] = useState<string>('all');

  const filteredArtworks = artworks.filter(a =>
    artFilterSection === 'all' ? true : a.category === artFilterSection
  );

  const handleSelectAllArt = () => {
    if (selectedArtIds.length === filteredArtworks.length) {
      setSelectedArtIds([]);
    } else {
      setSelectedArtIds(filteredArtworks.map(a => a.id));
    }
  };

  const handleToggleSelectArt = (id: string) => {
    setSelectedArtIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkDeleteArtworks = () => {
    if (selectedArtIds.length === 0) return;
    if (confirm(`Are you sure you want to bulk delete ${selectedArtIds.length} selected artworks from the exhibition?`)) {
      exhibitionStore.bulkDeleteArtworks(selectedArtIds);
      setSelectedArtIds([]);
      showBanner(`Successfully deleted selected artworks!`);
    }
  };

  // -------------------------------------------------------------
  // TAB 3: SECTIONS & SECTION AWARDS (with Copy from Previous Section)
  // -------------------------------------------------------------
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionDesc, setNewSectionDesc] = useState('');
  const [newSectionColor, setNewSectionColor] = useState('#eab308');
  const [newSectionAwards, setNewSectionAwards] = useState<SectionAward[]>([
    { id: '1', name: '1st Place - Gold Award', spotlightColorHex: '#ffd700', plaqueStyle: 'gold' },
    { id: '2', name: '2nd Place - Silver Award', spotlightColorHex: '#e0e7ff', plaqueStyle: 'silver' },
    { id: '3', name: '3rd Place - Bronze Award', spotlightColorHex: '#f59e0b', plaqueStyle: 'bronze' },
    { id: '4', name: 'Merit Award', spotlightColorHex: '#fef08a', plaqueStyle: 'gold' },
    { id: '5', name: 'Salon Acceptance', spotlightColorHex: '#f8fafc', plaqueStyle: 'slate' },
  ]);

  // Form to add single award to this section being created
  const [tempAwardName, setTempAwardName] = useState('');
  const [tempAwardSpotlight, setTempAwardSpotlight] = useState('#ffd700');
  const [tempAwardPlaque, setTempAwardPlaque] = useState<'gold' | 'silver' | 'bronze' | 'slate'>('gold');

  const handleCopyAwardsFromPreviousSection = () => {
    if (wings.length === 0) {
      alert('No previous section exists to copy awards from.');
      return;
    }
    const prevWing = wings[wings.length - 1];
    if (prevWing.awards && prevWing.awards.length > 0) {
      setNewSectionAwards(
        prevWing.awards.map((aw, i) => ({
          ...aw,
          id: `copied-${Date.now()}-${i}`,
        }))
      );
      showBanner(`Copied ${prevWing.awards.length} awards from previous section "${prevWing.name}"!`);
    } else {
      alert(`The previous section "${prevWing.name}" does not have custom defined awards.`);
    }
  };

  const handleAddTempAward = () => {
    if (!tempAwardName.trim()) return;
    const aw: SectionAward = {
      id: `aw-${Date.now()}`,
      name: tempAwardName.trim(),
      spotlightColorHex: tempAwardSpotlight,
      plaqueStyle: tempAwardPlaque,
    };
    setNewSectionAwards(prev => [...prev, aw]);
    setTempAwardName('');
  };

  const handleRemoveTempAward = (id: string) => {
    setNewSectionAwards(prev => prev.filter(a => a.id !== id));
  };

  const handleCreateSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionName.trim()) return;

    const lastWing = wings[wings.length - 1];
    const zStart = lastWing ? lastWing.zEnd : 0;
    const zEnd = zStart + 28;

    const newWing: CategoryWing = {
      id: `wing-${Date.now()}`,
      name: newSectionName.trim(),
      description: newSectionDesc.trim() || 'Curated salon exhibition section.',
      iconName: 'Sparkles',
      colorHex: newSectionColor,
      zStart,
      zEnd,
      awards: [...newSectionAwards],
    };

    exhibitionStore.addCategoryWing(newWing);
    setNewSectionName('');
    setNewSectionDesc('');
    showBanner(`Section "${newWing.name}" created with ${newSectionAwards.length} section-specific awards!`);
  };

  // -------------------------------------------------------------
  // TAB 4: JUDGES PROFILES
  // -------------------------------------------------------------
  const [judgeName, setJudgeName] = useState('');
  const [judgeCountry, setJudgeCountry] = useState('');
  const [judgeHonors, setJudgeHonors] = useState('');
  const [judgeRole, setJudgeRole] = useState('International Juror');
  const [judgeImageUrl, setJudgeImageUrl] = useState('');
  const judgeFileRef = useRef<HTMLInputElement>(null);

  const handleJudgePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const opt = await optimizeImageFile(file, 800, 0.88);
      setJudgeImageUrl(opt.dataUrl);
      uploadImageToStorage(file, 'judges')
        .then(fireUrl => setJudgeImageUrl(fireUrl))
        .catch(() => {});
    } catch (err) {
      console.error('Error optimizing judge photo:', err);
    }
  };

  const handleAddJudge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!judgeName.trim() || !judgeCountry.trim()) {
      alert('Please provide judge name and country.');
      return;
    }

    const newJudge: SalonJudge = {
      id: `judge-${Date.now()}`,
      name: judgeName.trim(),
      country: judgeCountry.trim(),
      honors: judgeHonors.trim() || 'M IAAP',
      role: judgeRole.trim(),
      imageUrl: judgeImageUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
    };

    exhibitionStore.addJudge(newJudge);
    setJudgeName('');
    setJudgeCountry('');
    setJudgeHonors('');
    setJudgeImageUrl('');
    showBanner(`Judge profile for "${newJudge.name}" added successfully!`);
  };

  // -------------------------------------------------------------
  // TAB 5: ORGANIZATIONS & PATRONAGES (Admin can add org & code)
  // -------------------------------------------------------------
  const [patronOrgName, setPatronOrgName] = useState('IAAP');
  const [patronCode, setPatronCode] = useState('');

  const handleAddPatronage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patronOrgName.trim() || !patronCode.trim()) {
      alert('Please provide organization name and patronage code.');
      return;
    }

    const newOrg: PatronageOrg = {
      id: `pat-${Date.now()}`,
      organization: patronOrgName.trim().toUpperCase(),
      patronageNumber: patronCode.trim(),
    };

    exhibitionStore.addPatronageOrg(newOrg);
    setPatronCode('');
    showBanner(`Patronage for "${newOrg.organization}" (${newOrg.patronageNumber}) added!`);
  };

  // -------------------------------------------------------------
  // TAB 6: EXHIBITION DETAILS, IAAP RESULTS URL & CATALOG PDF
  // -------------------------------------------------------------
  const [editTitle, setEditTitle] = useState(salonInfo.name);
  const [editEdition, setEditEdition] = useState(salonInfo.edition);
  const [editYear, setEditYear] = useState(salonInfo.year);
  const [editOrganizedBy, setEditOrganizedBy] = useState(salonInfo.organizedBy);
  const [editSchool, setEditSchool] = useState(salonInfo.school);
  const [editOfficialUrl, setEditOfficialUrl] = useState(salonInfo.officialUrl || 'https://chayaksha.rmulive.com');
  const [editIaapResultsUrl, setEditIaapResultsUrl] = useState(salonInfo.iaapResultsUrl || 'https://chayaksha.rmulive.com/results');
  const [editCatalogUrl, setEditCatalogUrl] = useState(salonInfo.catalogPdfUrl || '');
  const [editAmbientYoutubeUrl, setEditAmbientYoutubeUrl] = useState(salonInfo.ambientYoutubeUrl || '');
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const handleCatalogUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      exhibitionStore.setCatalogPdf(dataUrl, file.name);
      setEditCatalogUrl(dataUrl);
      showBanner(`Catalog PDF "${file.name}" uploaded successfully!`);
    };
    reader.readAsDataURL(file);

    uploadCatalogPdfToStorage(file)
      .then(fireUrl => {
        exhibitionStore.setCatalogPdf(fireUrl, file.name);
        setEditCatalogUrl(fireUrl);
      })
      .catch(() => {});
  };

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    exhibitionStore.updateSalonInfo({
      name: editTitle,
      edition: editEdition,
      year: editYear,
      organizedBy: editOrganizedBy,
      school: editSchool,
      officialUrl: editOfficialUrl,
      iaapResultsUrl: editIaapResultsUrl,
      catalogPdfUrl: editCatalogUrl,
      ambientYoutubeUrl: editAmbientYoutubeUrl.trim(),
    });
    showBanner('Exhibition details and links successfully updated and synchronized!');
  };

  // -------------------------------------------------------------
  // TAB 7: GUESTBOOK
  // -------------------------------------------------------------
  const [selectedGbIds, setSelectedGbIds] = useState<string[]>([]);

  const handleBulkDeleteGuestbook = () => {
    if (selectedGbIds.length === 0) return;
    if (confirm(`Delete ${selectedGbIds.length} guestbook signatures?`)) {
      exhibitionStore.bulkDeleteGuestbook(selectedGbIds);
      setSelectedGbIds([]);
      showBanner('Selected guestbook entries deleted!');
    }
  };

  // -------------------------------------------------------------
  // THEMES
  // -------------------------------------------------------------
  const themesList: { id: GalleryTheme; name: string; desc: string; colors: string[] }[] = [
    {
      id: 'minimalist-alabaster',
      name: 'Minimalist Alabaster',
      desc: 'Pristine museum white plaster with Carrara marble reflections and crisp daylight.',
      colors: ['#ffffff', '#e2e8f0', '#94a3b8'],
    },
    {
      id: 'dark-noir',
      name: 'Dark Noir Velvet',
      desc: 'Moody charcoal acoustic walls, warm gold directional spotlights, and walnut wood.',
      colors: ['#0f172a', '#1e293b', '#ca8a04'],
    },
    {
      id: 'warm-travertine',
      name: 'Warm Travertine Stone',
      desc: 'Natural Italian limestone with horizontal strata fissures and golden hour warmth.',
      colors: ['#eae2cf', '#d8cbba', '#b45309'],
    },
    {
      id: 'brutalist-concrete',
      name: 'Honed Modern Concrete',
      desc: 'Smooth architectural concrete with fine mineral aggregate (zero tie-rod holes).',
      colors: ['#64748b', '#475569', '#cbd5e1'],
    },
  ];

  // -------------------------------------------------------------
  // AUTHENTICATION SCREEN
  // -------------------------------------------------------------
  if (!adminUser) {
    return (
      <div className="min-h-screen w-screen bg-slate-950 flex flex-col justify-between items-center p-6 text-slate-100 select-none">
        {/* Header */}
        <div className="w-full max-w-4xl flex items-center justify-between py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <img src="/logos/chayaksha_logo.png" alt="Chayaksha" className="h-10 w-auto" />
            <div>
              <h2 className="font-serif font-black text-sm tracking-wider text-poster-gold">
                CHAYAKSHA 26'
              </h2>
              <span className="text-[10px] text-amber-300 font-mono">Curator Administration Suite</span>
            </div>
          </div>
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-all border border-slate-800 cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to Exhibition
          </button>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-md bg-slate-900/90 rounded-3xl p-8 border border-amber-500/30 shadow-2xl backdrop-blur-xl relative">
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 mb-3">
              <Lock size={28} />
            </div>
            <h1 className="font-serif text-2xl font-bold text-white tracking-wide">
              Curator Portal Access
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Secure administrative access for salon organizers and jurists
            </p>
          </div>

          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-xs text-red-300">
              {authError}
            </div>
          )}

          {/* Google Sign-In */}
          <button
            onClick={async () => {
              setIsAuthenticating(true);
              try {
                await exhibitionStore.loginWithGoogle();
              } catch {
                setAuthError('Google sign-in could not be completed.');
              } finally {
                setIsAuthenticating(false);
              }
            }}
            disabled={isAuthenticating}
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2.5 shadow-lg transition-all cursor-pointer mb-4"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Sign In with Google Workspace
          </button>

          <div className="flex items-center gap-3 my-4">
            <div className="h-px bg-slate-800 flex-1" />
            <span className="text-[10px] text-slate-500 uppercase font-mono">or email credentials</span>
            <div className="h-px bg-slate-800 flex-1" />
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setIsAuthenticating(true);
              setAuthError('');
              const ok = await exhibitionStore.loginWithEmail(loginEmail.trim(), loginPassword);
              if (!ok) {
                setAuthError('Invalid credentials. Check email & password.');
              }
              setIsAuthenticating(false);
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Curator Email</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="curator@chayaksha.rmulive.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold text-xs shadow-lg transition-all cursor-pointer mt-2"
            >
              Sign In to Admin Portal
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setLoginEmail('admin@chayaksha.lk');
              setLoginPassword('admin2026');
              setAuthError('');
            }}
            className="w-full mt-3 text-center text-[11px] text-amber-400/80 hover:text-amber-300 underline cursor-pointer"
          >
            Auto-fill Curatorial Demo Credentials
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          CHAYAKSHA 26' • Radapasa Media Unit • Rajapaksa Central College
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // AUTHENTICATED ADMIN DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none">
      {/* Top Navbar */}
      <header className="h-16 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <img src="/logos/school_crest.png" alt="RCCW" className="h-9 w-auto" />
          <img src="/logos/chayaksha_logo.png" alt="Chayaksha" className="h-9 w-auto" />
          <div className="border-l border-slate-800 pl-3">
            <h1 className="font-serif font-black text-sm text-poster-gold tracking-wide">
              CHAYAKSHA 26' CURATOR PORTAL
            </h1>
            <span className="text-[10px] text-slate-400 font-mono">
              Admin Suite • Dedicated /admin route
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncToFirebase}
            disabled={isSyncingFirebase}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-all cursor-pointer shadow"
            title="Sync all exhibition sections, artworks, awards, judges and patronages directly to Cloud Firestore"
          >
            <UploadCloud size={14} className={isSyncingFirebase ? 'animate-pulse' : ''} />
            <span>{isSyncingFirebase ? 'Syncing...' : 'Sync to Firebase'}</span>
          </button>

          {successMsg && (
            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold animate-fadeIn">
              ✓ {successMsg}
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <UserCheck size={14} className="text-amber-400" />
            <span className="text-slate-300 font-medium">{adminUser.name}</span>
          </div>

          <button
            onClick={() => exhibitionStore.logoutAdmin()}
            className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>

          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold text-xs transition-all shadow cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to 3D Exhibition
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-slate-900/60 border-r border-slate-800 p-4 flex flex-col justify-between shrink-0 overflow-y-auto">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase px-3 mb-2 block tracking-wider">
              Management Modules
            </span>

            <button
              onClick={() => setActiveTab('bulk-upload')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'bulk-upload'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Upload size={16} />
              <span>Bulk Upload (Grid View)</span>
              {bulkQueue.length > 0 && (
                <span className="ml-auto px-1.5 py-0.5 rounded-full bg-amber-950 text-amber-300 text-[10px] font-bold">
                  {bulkQueue.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('artworks')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'artworks'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Eye size={16} />
              <span>Artworks Directory ({artworks.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('sections')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'sections'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Layers size={16} />
              <span>Sections & Awards</span>
            </button>

            <button
              onClick={() => setActiveTab('judges')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'judges'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Users size={16} />
              <span>Judges Profiles ({salonInfo.judges?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('patronages')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'patronages'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck size={16} />
              <span>Organizations & Patronages</span>
            </button>

            <button
              onClick={() => setActiveTab('details')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'details'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Settings size={16} />
              <span>Exhibition Links & PDF</span>
            </button>

            <button
              onClick={() => setActiveTab('guestbook')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'guestbook'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Globe size={16} />
              <span>Guestbook Signatures ({guestbook.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('themes')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'themes'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Palette size={16} />
              <span>Architectural Themes</span>
            </button>
          </div>

          {/* Quick link preview */}
          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
            <span className="block font-semibold text-slate-300">Quick Exhibition Links:</span>
            {salonInfo.iaapResultsUrl && (
              <a
                href={salonInfo.iaapResultsUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-amber-300 hover:underline"
              >
                <ExternalLink size={11} /> IAAP Results Page
              </a>
            )}
            {salonInfo.catalogPdfUrl && (
              <a
                href={salonInfo.catalogPdfUrl}
                download={salonInfo.catalogPdfName || 'Catalogue.pdf'}
                className="flex items-center gap-1 text-amber-300 hover:underline"
              >
                <FileDown size={11} /> Catalog PDF
              </a>
            )}
          </div>
        </aside>

        {/* Content Pane */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-950">
          {/* TAB 1: BULK GRID VIEW UPLOAD */}
          {activeTab === 'bulk-upload' && (
            <div className="space-y-6 max-w-6xl">
              <div>
                <h2 className="font-serif text-xl font-bold text-white flex items-center gap-2">
                  <Upload size={22} className="text-amber-400" />
                  Bulk Artwork Upload (Grid View)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Upload multiple photographs in grid view. Define only: Photograph Title, Award, Photographer Name, and School. Frame ratios automatically adjust!
                </p>
              </div>

              {/* Target Section Selector & Bulk Helpers */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-300">Target Section:</span>
                  <select
                    value={selectedSectionId}
                    onChange={(e) => handleSectionChange(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-amber-500/40 text-xs text-white font-medium focus:outline-none"
                  >
                    {wings.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.awards?.length || 5} Defined Awards)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleBatchSetSchool}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 border border-cyan-500/30 transition-all cursor-pointer"
                  >
                    <School size={13} className="inline mr-1" />
                    Set School for All
                  </button>
                  <button
                    onClick={handleBatchSetAward}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-amber-300 border border-amber-500/30 transition-all cursor-pointer"
                  >
                    <Award size={13} className="inline mr-1" />
                    Set Award for All
                  </button>
                  {bulkQueue.length > 0 && (
                    <button
                      onClick={() => setBulkQueue([])}
                      className="px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 text-xs font-semibold text-red-300 border border-red-500/30 transition-all cursor-pointer"
                    >
                      Clear Grid ({bulkQueue.length})
                    </button>
                  )}
                </div>
              </div>

              {/* Participant School Database (Excel / CSV Auto-Detection) */}
              <div className={`p-4 rounded-2xl border transition-all ${
                excelFileInfo
                  ? 'bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                  : 'bg-slate-900 border-slate-800'
              }`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${excelFileInfo ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'}`}>
                      <FileSpreadsheet size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                          Participant School Database (Excel / CSV)
                        </h3>
                        {excelFileInfo ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 size={10} /> {excelFileInfo.rowCount} Participants Indexed
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-medium border border-slate-700">
                            Upload to Auto-Detect School
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Upload participant list (.xlsx, .xls, .csv). Filenames matching <span className="font-mono text-amber-300 font-semibold">{"{Award} - {Photographer} - {Title}.jpg"}</span> auto-populate and match school instantly!
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      ref={excelFileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleProcessExcelFile(file);
                        if (e.target) e.target.value = '';
                      }}
                    />
                    {excelFileInfo ? (
                      <>
                        <button
                          type="button"
                          onClick={handleReapplySchoolMatching}
                          disabled={bulkQueue.length === 0}
                          className="px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 text-xs font-semibold text-cyan-300 border border-cyan-500/30 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                          title="Re-run school matching for all photographs currently in the grid"
                        >
                          <RefreshCw size={12} className={isParsingExcel ? 'animate-spin' : ''} />
                          Re-match Schools ({bulkQueue.length} in Grid)
                        </button>
                        <button
                          type="button"
                          onClick={() => excelFileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Upload size={12} /> Replace Spreadsheet
                        </button>
                        <button
                          type="button"
                          onClick={handleClearExcelDatabase}
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/30 transition-all cursor-pointer"
                          title="Clear participant spreadsheet database"
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        disabled={isParsingExcel}
                        onClick={() => excelFileInputRef.current?.click()}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/30 transition-all cursor-pointer transform hover:scale-102"
                      >
                        <FileSpreadsheet size={15} />
                        {isParsingExcel ? 'Reading Spreadsheet...' : 'Upload Participants Excel (.xlsx, .csv)'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Active Database Info Bar */}
                {excelFileInfo && (
                  <div className="pt-2.5 mt-2.5 border-t border-emerald-500/20 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-3 text-slate-300 flex-wrap">
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        <FileSpreadsheet size={13} className="text-emerald-400" />
                        {excelFileInfo.fileName}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        Matched Columns:
                        <span className="text-cyan-300 font-mono ml-1 font-semibold">"{excelFileInfo.columns.nameCol}"</span> &rarr;
                        <span className="text-emerald-300 font-mono ml-1 font-semibold">"{excelFileInfo.columns.schoolCol}"</span>
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-400/90 font-medium flex items-center gap-1">
                      <CheckCircle2 size={11} /> Saved & active across all section uploads
                    </span>
                  </div>
                )}

                {excelError && (
                  <div className="mt-2 text-xs text-red-400 bg-red-950/40 p-2.5 rounded-xl border border-red-500/30">
                    Spreadsheet Error: {excelError}
                  </div>
                )}
              </div>

              {/* Upload Zone */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  onClick={() => bulkFileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const files = e.dataTransfer.files;
                    if (files && files.length > 0) {
                      handleProcessFilesList(Array.from(files));
                    }
                  }}
                  className="md:col-span-2 border-2 border-dashed border-amber-500/40 hover:border-amber-400 rounded-2xl p-6 text-center cursor-pointer bg-slate-900/60 transition-all flex flex-col items-center justify-center gap-2 group"
                >
                  <input
                    ref={bulkFileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.xlsx,.xls,.csv"
                    onChange={handleBulkFilesSelect}
                    className="hidden"
                  />
                  <div className="p-3 rounded-full bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
                    <FileUp size={32} />
                  </div>
                  <span className="text-sm font-bold text-white">
                    Click to Select Multiple Images or Drop Images / Spreadsheets Here
                  </span>
                  <span className="text-xs text-slate-400 max-w-lg">
                    Supports JPG, PNG, WebP & Excel. Filenames matching <strong className="text-amber-300">"{'{'}Award{'}'} - {'{'}Photographer{'}'} - {'{'}Title{'}'}.jpg"</strong> automatically auto-fill metadata!
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-300 block mb-1">
                      Or Add by Image URL:
                    </span>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={singleImageUrlInput}
                      onChange={(e) => setSingleImageUrlInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-400 mb-2"
                    />
                  </div>
                  <button
                    onClick={handleAddImageUrlToBulk}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-300 border border-amber-500/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <PlusCircle size={14} /> Add Image URL to Grid
                  </button>
                </div>
              </div>

              {/* Grid View of Items */}
              {bulkQueue.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">
                      Grid View: {bulkQueue.length} Photographs ready to publish
                    </span>
                    <button
                      onClick={handlePublishAllBulkArtworks}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs flex items-center gap-2 shadow-xl shadow-amber-500/20 transition-all transform hover:scale-102 cursor-pointer"
                    >
                      <Check size={16} /> Publish All {bulkQueue.length} Photographs to "{activeWing?.name}"
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bulkQueue.map((item, idx) => {
                      const isDragging = draggedIndex === idx;
                      const isDragOver = dragOverIndex === idx;

                      return (
                        <div
                          key={item.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', String(idx));
                            setDraggedIndex(idx);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDragOverIndex(idx);
                          }}
                          onDragLeave={() => {
                            if (dragOverIndex === idx) setDragOverIndex(null);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDropReorder(draggedIndex, idx);
                          }}
                          onDragEnd={() => {
                            setDraggedIndex(null);
                            setDragOverIndex(null);
                          }}
                          className={`rounded-2xl bg-slate-900 border overflow-hidden flex flex-col justify-between shadow-lg transition-all ${
                            isDragging
                              ? 'opacity-40 scale-95 border-dashed border-amber-400'
                              : isDragOver
                              ? 'ring-2 ring-amber-400 bg-amber-500/10 scale-102 border-amber-400'
                              : 'border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {/* Top Reorder Header */}
                          <div className="px-3 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                            <div
                              className="flex items-center gap-1.5 cursor-grab active:cursor-grabbing text-slate-400 hover:text-white"
                              title="Drag and drop to reorder gallery sequence"
                            >
                              <GripVertical size={14} className="text-amber-400" />
                              <span className="text-[11px] font-mono font-bold text-amber-300">
                                #{idx + 1}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveItem(idx, 'prev')}
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-25 disabled:cursor-not-allowed text-slate-300 transition-colors"
                                title="Move Left / Earlier"
                              >
                                <ChevronLeft size={13} />
                              </button>
                              <button
                                type="button"
                                disabled={idx === bulkQueue.length - 1}
                                onClick={() => handleMoveItem(idx, 'next')}
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-25 disabled:cursor-not-allowed text-slate-300 transition-colors"
                                title="Move Right / Later"
                              >
                                <ChevronRight size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveBulkItem(item.id)}
                                className="p-1 ml-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
                                title="Remove"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          </div>

                          {/* Thumbnail with Aspect Ratio Badge & Detection Badges */}
                          <div className="relative aspect-[4/3] bg-black overflow-hidden flex items-center justify-center">
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-full h-full object-contain pointer-events-none"
                            />
                            <div className="absolute top-2 left-2 flex items-center gap-1">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-950/85 text-amber-300 border border-amber-500/30 font-mono font-bold">
                                {item.aspectRatio >= 1.2
                                  ? `Landscape (${item.aspectRatio}:1)`
                                  : item.aspectRatio < 0.85
                                  ? `Portrait (${item.aspectRatio}:1)`
                                  : `Square (${item.aspectRatio}:1)`}
                              </span>
                            </div>
                            {item.isAutoDetected && (
                              <div className="absolute top-2 right-2 flex items-center gap-1">
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 font-semibold flex items-center gap-1 shadow">
                                  <Sparkles size={10} /> Auto-Detected
                                </span>
                              </div>
                            )}
                            {item.detectedSchool && (
                              <div className="absolute bottom-2 left-2 flex items-center gap-1">
                                <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-950/90 text-cyan-200 border border-cyan-500/40 font-semibold flex items-center gap-1 shadow">
                                  <School size={9} /> Excel Matched
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Inline Form Fields (ONLY 4 required details) */}
                          <div className="p-3.5 space-y-2.5 text-xs">
                            {/* 1. Photograph Title */}
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-300 mb-0.5">
                                Photograph Title *
                              </label>
                              <input
                                type="text"
                                value={item.title}
                                onChange={(e) => handleUpdateBulkItem(item.id, 'title', e.target.value)}
                                placeholder="Title of photograph"
                                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                              />
                              {item.originalFilename && (
                                <div className="text-[10px] text-slate-500 truncate mt-0.5" title={item.originalFilename}>
                                  File: {item.originalFilename}
                                </div>
                              )}
                            </div>

                            {/* 2. Award (From Section Defined Awards ONLY) */}
                            <div>
                              <label className="block text-[11px] font-semibold text-amber-300 mb-0.5">
                                Award / Ranking * ({activeWing?.name})
                              </label>
                              <select
                                value={item.award}
                                onChange={(e) => handleUpdateBulkItem(item.id, 'award', e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-amber-500/40 text-xs text-amber-200 font-semibold focus:outline-none"
                              >
                                {sectionAwards.map(aw => (
                                  <option key={aw.id} value={aw.name}>
                                    {aw.name} ({aw.plaqueStyle} plaque)
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* 3. Photographer Name */}
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-300 mb-0.5">
                                Photographer Name *
                              </label>
                              <input
                                type="text"
                                value={item.photographer}
                                onChange={(e) => handleUpdateBulkItem(item.id, 'photographer', e.target.value)}
                                placeholder="e.g. Seniru Jayawardena"
                                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                              />
                              {item.isAutoDetected && item.photographer && (
                                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium mt-0.5">
                                  <Sparkles size={10} /> Detected from filename
                                </span>
                              )}
                            </div>

                            {/* 4. School */}
                            <div>
                              <label className="block text-[11px] font-semibold text-cyan-300 mb-0.5">
                                School / Institution *
                              </label>
                              <input
                                type="text"
                                value={item.school}
                                onChange={(e) => handleUpdateBulkItem(item.id, 'school', e.target.value)}
                                placeholder="e.g. Rajapaksa Central College, Weeraketiya"
                                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-cyan-500/40 text-xs text-cyan-200 focus:outline-none"
                              />
                              {item.detectedSchool ? (
                                <span className="text-[10px] text-cyan-300 flex items-center gap-1 font-medium mt-0.5">
                                  <CheckCircle2 size={11} /> Matched from Excel {item.matchedParticipantName ? `("${item.matchedParticipantName}")` : ''}
                                </span>
                              ) : participantRecords.length > 0 && item.photographer ? (
                                <span className="text-[10px] text-slate-500 mt-0.5 block">
                                  No spreadsheet match found for "{item.photographer}"
                                </span>
                              ) : null}
                            </div>

                            {/* 5. Image URL & Direct Firebase Storage Upload */}
                            <div>
                              <div className="flex items-center justify-between mb-0.5">
                                <label className="text-[11px] font-semibold text-slate-300">
                                  Image URL / Cloud Storage
                                </label>
                                <label className="text-[10px] text-amber-300 hover:text-amber-200 cursor-pointer flex items-center gap-1 font-semibold">
                                  <Upload size={10} /> Upload to Firebase
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      try {
                                        const opt = await optimizeImageFile(file, 2048, 0.88);
                                        handleUpdateBulkItem(item.id, 'imageUrl', opt.dataUrl);
                                        handleUpdateBulkItem(item.id, 'aspectRatio', opt.aspectRatio);
                                        saveImageToIndexedDb(item.id, opt.dataUrl).catch(() => {});

                                        uploadImageToStorage(file, 'photographs')
                                          .then(fireUrl => {
                                            handleUpdateBulkItem(item.id, 'imageUrl', fireUrl);
                                            showBanner('Uploaded image to Firebase Storage!');
                                          })
                                          .catch(() => {});
                                      } catch (err) {
                                        console.error('Error optimizing image:', err);
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                              <input
                                type="url"
                                value={item.imageUrl}
                                onChange={(e) => handleUpdateBulkItem(item.id, 'imageUrl', e.target.value)}
                                placeholder="https://..."
                                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-[11px] text-slate-300 font-mono focus:outline-none focus:border-amber-400 truncate"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      onClick={handlePublishAllBulkArtworks}
                      className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm flex items-center gap-2 shadow-xl shadow-amber-500/25 transition-all transform hover:scale-102 cursor-pointer"
                    >
                      <Check size={18} /> Publish All {bulkQueue.length} Photographs to "{activeWing?.name}"
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 text-center text-slate-500 text-xs">
                  No photographs queued for bulk upload. Select or drag images above to populate the grid.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ARTWORKS DIRECTORY & BULK DELETE */}
          {activeTab === 'artworks' && (
            <div className="space-y-4 max-w-6xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif text-xl font-bold text-white flex items-center gap-2">
                    <Eye size={22} className="text-amber-400" />
                    Artworks Directory & Multi-Select Bulk Delete
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Filter by section, select multiple artworks with checkboxes, and bulk delete in one click
                  </p>
                </div>

                {selectedArtIds.length > 0 && (
                  <button
                    onClick={handleBulkDeleteArtworks}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-red-600/30 transition-all cursor-pointer"
                  >
                    <Trash2 size={14} /> Bulk Delete Selected ({selectedArtIds.length})
                  </button>
                )}
              </div>

              {/* Filter & Select Bar */}
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSelectAllArt}
                    className="flex items-center gap-1.5 text-slate-300 hover:text-white cursor-pointer"
                  >
                    {selectedArtIds.length === filteredArtworks.length && filteredArtworks.length > 0 ? (
                      <CheckSquare size={16} className="text-amber-400" />
                    ) : (
                      <Square size={16} />
                    )}
                    <span>Select All ({filteredArtworks.length})</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Filter Section:</span>
                  <select
                    value={artFilterSection}
                    onChange={(e) => setArtFilterSection(e.target.value)}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                  >
                    <option value="all">All Sections ({artworks.length})</option>
                    {wings.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Artworks List Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {filteredArtworks.map(art => {
                  const isSelected = selectedArtIds.includes(art.id);
                  return (
                    <div
                      key={art.id}
                      className={`p-3 rounded-2xl bg-slate-900 border transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-amber-400 bg-slate-900/90 shadow-md shadow-amber-500/10'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-black mb-2">
                        <img src={art.imageUrl} alt={art.title} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleToggleSelectArt(art.id)}
                          className="absolute top-2 left-2 p-1 rounded-md bg-black/60 hover:bg-black/80 text-white cursor-pointer transition-colors"
                          title={isSelected ? 'Deselect' : 'Select for Bulk Delete'}
                        >
                          {isSelected ? (
                            <CheckSquare size={16} className="text-amber-400 drop-shadow" />
                          ) : (
                            <Square size={16} className="text-white/80 drop-shadow" />
                          )}
                        </button>

                        <div className="absolute top-2 right-2 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingArtwork(art)}
                            className="p-1.5 rounded-lg bg-black/70 hover:bg-amber-500 text-slate-300 hover:text-slate-950 transition-colors cursor-pointer"
                            title="Edit Photograph Details"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Permanently delete artwork "${art.title}" by ${art.photographer}?`)) {
                                exhibitionStore.deleteArtwork(art.id);
                                showBanner(`Deleted "${art.title}"!`);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-black/70 hover:bg-red-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="Delete Photograph"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        <span className="absolute bottom-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-slate-950/80 text-amber-300 font-bold border border-amber-500/30 truncate max-w-[85%]">
                          {art.place || art.awardTier}
                        </span>
                      </div>

                      <div className="text-xs">
                        <h4 className="font-bold text-white truncate">{art.title}</h4>
                        <p className="text-amber-300 text-[11px] font-semibold truncate">{art.photographer}</p>
                        <p className="text-cyan-300 text-[10px] truncate">{art.school}</p>
                        <span className="text-[10px] text-slate-500 font-mono block mt-1">
                          Section: {wings.find(w => w.id === art.category)?.name || art.category}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: SECTIONS & SECTION AWARDS (with Copy from Previous Section) */}
          {activeTab === 'sections' && (
            <div className="space-y-6 max-w-5xl">
              <div>
                <h2 className="font-serif text-xl font-bold text-white flex items-center gap-2">
                  <Layers size={22} className="text-amber-400" />
                  Exhibition Sections & Section Awards
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Add new gallery sections with dedicated awards. Use the "Copy from previous section" option to replicate awards effortlessly.
                </p>
              </div>

              {/* Create Section Form */}
              <form onSubmit={handleCreateSection} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <h3 className="font-serif font-bold text-sm text-white flex items-center gap-2">
                  <PlusCircle size={16} className="text-amber-400" />
                  Add New Gallery Section
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-300 mb-1">Section Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Wildlife & Avian Sanctuary"
                      value={newSectionName}
                      onChange={(e) => setNewSectionName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1">Section Accent Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newSectionColor}
                        onChange={(e) => setNewSectionColor(e.target.value)}
                        className="w-10 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={newSectionColor}
                        onChange={(e) => setNewSectionColor(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1">Description</label>
                    <input
                      type="text"
                      placeholder="Brief curatorial note"
                      value={newSectionDesc}
                      onChange={(e) => setNewSectionDesc(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Section Awards Definition Area */}
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-amber-300 block">
                        Awards Defined for this Section ({newSectionAwards.length})
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Photographs added to this section will select from these awards
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyAwardsFromPreviousSection}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow"
                    >
                      <Copy size={13} />
                      Keep / Copy Awards from Previous Section
                    </button>
                  </div>

                  {/* List of currently defined awards for this new section */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {newSectionAwards.map((aw) => (
                      <div
                        key={aw.id}
                        className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3.5 h-3.5 rounded-full border border-white/30"
                            style={{ backgroundColor: aw.spotlightColorHex }}
                          />
                          <div>
                            <span className="font-semibold text-white block">{aw.name}</span>
                            <span className="text-[10px] text-slate-400 capitalize">{aw.plaqueStyle} Plaque</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveTempAward(aw.id)}
                          className="p-1 text-slate-500 hover:text-red-400 cursor-pointer"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add award item to this section */}
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Add award tier (e.g. 1st Place - Gold, Best Avian Photo)"
                      value={tempAwardName}
                      onChange={(e) => setTempAwardName(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                    />
                    <select
                      value={tempAwardSpotlight}
                      onChange={(e) => setTempAwardSpotlight(e.target.value)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                    >
                      <option value="#ffd700">Gold Spotlight (#ffd700)</option>
                      <option value="#e0e7ff">Silver Spotlight (#e0e7ff)</option>
                      <option value="#f59e0b">Bronze Spotlight (#f59e0b)</option>
                      <option value="#f8fafc">Gallery White (#f8fafc)</option>
                    </select>
                    <select
                      value={tempAwardPlaque}
                      onChange={(e) => setTempAwardPlaque(e.target.value as any)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                    >
                      <option value="gold">Gold Plaque</option>
                      <option value="silver">Silver Plaque</option>
                      <option value="bronze">Bronze Plaque</option>
                      <option value="slate">Slate Plaque</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleAddTempAward}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-300 border border-amber-500/30 cursor-pointer"
                    >
                      + Add Award
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs cursor-pointer shadow"
                  >
                    Create Section & Expand 3D Hallway
                  </button>
                </div>
              </form>

              {/* Existing Sections List */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-300 block">Existing Sections ({wings.length})</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {wings.map(wing => (
                    <div
                      key={wing.id}
                      className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between"
                    >
                      {/* Section Info & Edit/Delete Controls */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <h4 className="font-bold text-sm text-white flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: wing.colorHex }} />
                            {wing.name}
                          </h4>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 font-mono mr-1">
                              Z: {wing.zStart}m - {wing.zEnd}m
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditingSection(wing)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 text-slate-300 hover:text-slate-950 transition-colors cursor-pointer"
                              title="Edit Section Details"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Permanently delete section "${wing.name}"?`)) {
                                  exhibitionStore.deleteCategoryWing(wing.id);
                                  showBanner(`Section "${wing.name}" deleted!`);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                              title="Delete Section"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 mb-3">{wing.description}</p>
                      </div>

                      {/* Section-Specific Awards Management */}
                      <div className="pt-3 border-t border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-semibold text-amber-300">
                            Defined Awards ({wing.awards?.length || 0}):
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setAddingAwardWingId(wing.id);
                              setNewSecAwardName('');
                              setNewSecAwardSpotlight('#ffd700');
                              setNewSecAwardPlaque('gold');
                            }}
                            className="text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                          >
                            <Plus size={11} /> + Add Award
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          {wing.awards && wing.awards.length > 0 ? (
                            wing.awards.map(a => (
                              <div
                                key={a.id}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0"
                                    style={{ backgroundColor: a.spotlightColorHex }}
                                  />
                                  <span className="text-white font-medium">{a.name}</span>
                                  <span className="text-[10px] text-slate-400 font-mono capitalize">
                                    ({a.plaqueStyle} plaque)
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setEditingSectionAward({ wingId: wing.id, award: { ...a } })}
                                    className="p-1 text-slate-400 hover:text-amber-400 cursor-pointer"
                                    title="Edit Award"
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (confirm(`Remove award "${a.name}" from "${wing.name}"?`)) {
                                        exhibitionStore.deleteSectionAward(wing.id, a.id);
                                        showBanner(`Award "${a.name}" deleted from section!`);
                                      }
                                    }}
                                    className="p-1 text-slate-500 hover:text-red-400 cursor-pointer"
                                    title="Delete Award"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-500 italic block">
                              No awards defined yet for this section.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: JUDGES PROFILES */}
          {activeTab === 'judges' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h2 className="font-serif text-xl font-bold text-white flex items-center gap-2">
                  <Users size={22} className="text-amber-400" />
                  International Panel of Judges
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Add, update, or remove juror profiles. Juror photos and distinction credentials appear on the public exhibition information portal.
                </p>
              </div>

              {/* Add Judge Form */}
              <form onSubmit={handleAddJudge} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <h3 className="font-serif font-bold text-sm text-white flex items-center gap-2">
                  <PlusCircle size={16} className="text-amber-400" />
                  Add International Juror Profile
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-300 mb-1">Juror Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jan Sranko"
                      value={judgeName}
                      onChange={(e) => setJudgeName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1">Country *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Slovakia"
                      value={judgeCountry}
                      onChange={(e) => setJudgeCountry(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1">Honors & Distinctions</label>
                    <input
                      type="text"
                      placeholder="e.g. M IAAP, Hon.PESGSPC, MZSF"
                      value={judgeHonors}
                      onChange={(e) => setJudgeHonors(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1">Juror Role</label>
                    <input
                      type="text"
                      placeholder="e.g. Jury Chairperson, Salon Juror"
                      value={judgeRole}
                      onChange={(e) => setJudgeRole(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block text-slate-300 mb-1">Profile Photo (Upload or URL)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="https://... or upload below"
                      value={judgeImageUrl}
                      onChange={(e) => setJudgeImageUrl(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => judgeFileRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-amber-300 border border-amber-500/30 cursor-pointer flex items-center gap-1.5"
                    >
                      <Upload size={13} /> Upload Photo
                    </button>
                    <input
                      ref={judgeFileRef}
                      type="file"
                      accept="image/*"
                      onChange={handleJudgePhotoUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs cursor-pointer shadow"
                  >
                    Add Judge Profile
                  </button>
                </div>
              </form>

              {/* Current Judges Profiles */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-300 block">
                  Current Panel of Judges ({salonInfo.judges?.length || 0})
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {salonInfo.judges?.map(judge => (
                    <div
                      key={judge.id}
                      className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <img
                          src={judge.imageUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80'}
                          alt={judge.name}
                          className="w-12 h-12 rounded-full object-cover border border-amber-400/40 shadow"
                        />
                        <div>
                          <h4 className="font-serif font-bold text-sm text-white">{judge.name}</h4>
                          <span className="text-xs text-amber-300 font-mono block">{judge.country}</span>
                        </div>
                      </div>

                      <div className="text-xs space-y-1 mb-3">
                        <p className="text-[11px] text-slate-300 font-mono font-semibold">{judge.honors}</p>
                        <p className="text-[11px] text-slate-500 italic">{judge.role}</p>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => setEditingJudge({ ...judge })}
                          className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <Edit2 size={13} /> Edit Profile
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Remove juror profile "${judge.name}"?`)) {
                              exhibitionStore.deleteJudge(judge.id);
                              showBanner(`Removed judge "${judge.name}"!`);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/30 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          title="Remove Judge"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ORGANIZATIONS & PATRONAGES */}
          {activeTab === 'patronages' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h2 className="font-serif text-xl font-bold text-white flex items-center gap-2">
                  <ShieldCheck size={22} className="text-amber-400" />
                  Patronages & Recognized Organizations
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Add international organizations (IAAP, GPU, National Federation, etc.) and their official patronage numbers. Default numbers are removed; you have full control.
                </p>
              </div>

              {/* Add Patronage Form */}
              <form onSubmit={handleAddPatronage} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <h3 className="font-serif font-bold text-sm text-white flex items-center gap-2">
                  <PlusCircle size={16} className="text-amber-400" />
                  Add Organization & Patronage Number
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-300 mb-1">Organization Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. IAAP, GPU, National Federation"
                      value={patronOrgName}
                      onChange={(e) => setPatronOrgName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1">Patronage / Recognition Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2026/503"
                      value={patronCode}
                      onChange={(e) => setPatronCode(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs cursor-pointer shadow"
                  >
                    Add Patronage Entry
                  </button>
                </div>
              </form>

              {/* Current Patronages */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-300 block">
                  Active Patronages ({salonInfo.patronageList?.length || 0})
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {salonInfo.patronageList?.map(pat => (
                    <div
                      key={pat.id}
                      className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Award size={18} />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white font-mono">{pat.organization} Patronage</h4>
                          <span className="text-xs text-amber-300 font-mono font-semibold">{pat.patronageNumber}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingPatronage({ ...pat })}
                          className="p-2 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Edit Patronage"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete patronage for "${pat.organization}"?`)) {
                              exhibitionStore.deletePatronageOrg(pat.id);
                              showBanner(`Patronage for "${pat.organization}" removed!`);
                            }
                          }}
                          className="p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Delete Patronage"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: EXHIBITION DETAILS, IAAP RESULTS URL & CATALOG PDF */}
          {activeTab === 'details' && (
            <form onSubmit={handleSaveDetails} className="space-y-6 max-w-4xl bg-slate-900 p-6 rounded-2xl border border-slate-800">
              <div>
                <h2 className="font-serif text-xl font-bold text-white flex items-center gap-2">
                  <Settings size={22} className="text-amber-400" />
                  Exhibition Details, IAAP Results & Catalog PDF
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Configure primary exhibition metadata, direct link to the IAAP results page, and digital catalog PDF
                </p>
              </div>

              {/* Core Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-amber-300 font-semibold mb-1">
                    IAAP Results Page URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={editIaapResultsUrl}
                    onChange={(e) => setEditIaapResultsUrl(e.target.value)}
                    placeholder="https://chayaksha.rmulive.com/results"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-amber-500/40 text-white font-mono text-xs focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Public visitors can click "IAAP Results Page" on the welcome modal and navbar to open this page.
                  </span>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Official Salon Website URL
                  </label>
                  <input
                    type="text"
                    value={editOfficialUrl}
                    onChange={(e) => setEditOfficialUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Catalog PDF */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-amber-300 block">Exhibition Catalog PDF</span>
                <div className="flex items-center gap-3">
                  <input
                    type="url"
                    placeholder="https://... or upload local PDF below"
                    value={editCatalogUrl}
                    onChange={(e) => setEditCatalogUrl(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => pdfInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-amber-300 border border-amber-500/30 cursor-pointer flex items-center gap-1.5"
                  >
                    <Upload size={13} /> Upload Local PDF
                  </button>
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleCatalogUpload}
                    className="hidden"
                  />
                </div>
                {salonInfo.catalogPdfUrl && (
                  <div className="flex items-center gap-2 text-xs text-emerald-300">
                    <Check size={14} /> Active Catalog: {salonInfo.catalogPdfName || 'Catalog.pdf'}
                  </div>
                )}
              </div>

              {/* YouTube Ambient Background Sound */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="block text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <span>YouTube Ambient Sound URL (Optional)</span>
                </label>
                <input
                  type="url"
                  placeholder="e.g. https://www.youtube.com/watch?v=5qap5aO4i9A or https://youtu.be/..."
                  value={editAmbientYoutubeUrl}
                  onChange={(e) => setEditAmbientYoutubeUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                />
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  The 3D exhibition plays ambient sound exclusively from this YouTube URL. If no URL is provided, the exhibition stays completely silent.
                </p>
              </div>

              {/* Exhibition Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 mb-1">Exhibition Main Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Year</label>
                  <input
                    type="number"
                    value={editYear}
                    onChange={(e) => setEditYear(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-xs mb-1">Competition Subtitle / Edition</label>
                <input
                  type="text"
                  value={editEdition}
                  onChange={(e) => setEditEdition(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-amber-300 mb-1">Organizing Unit</label>
                  <input
                    type="text"
                    value={editOrganizedBy}
                    onChange={(e) => setEditOrganizedBy(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-amber-500/40 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-cyan-300 mb-1">College / School</label>
                  <input
                    type="text"
                    value={editSchool}
                    onChange={(e) => setEditSchool(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-cyan-500/40 text-white text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs cursor-pointer shadow"
                >
                  Save & Synchronize Exhibition Details
                </button>
              </div>
            </form>
          )}

          {/* TAB 7: GUESTBOOK */}
          {activeTab === 'guestbook' && (
            <div className="space-y-4 max-w-4xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-xl font-bold text-white flex items-center gap-2">
                    <Globe size={22} className="text-amber-400" />
                    Visitor Guestbook Moderation
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Moderate international visitor signatures and reviews
                  </p>
                </div>

                {selectedGbIds.length > 0 && (
                  <button
                    onClick={handleBulkDeleteGuestbook}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer"
                  >
                    <Trash2 size={14} /> Bulk Delete Signatures ({selectedGbIds.length})
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {guestbook.map(entry => {
                  const isSel = selectedGbIds.includes(entry.id);
                  return (
                    <div
                      key={entry.id}
                      onClick={() =>
                        setSelectedGbIds(prev =>
                          prev.includes(entry.id) ? prev.filter(x => x !== entry.id) : [...prev, entry.id]
                        )
                      }
                      className={`p-3.5 rounded-2xl bg-slate-900 border transition-all cursor-pointer flex items-start gap-3 ${
                        isSel ? 'border-amber-400 bg-slate-900/90' : 'border-slate-800'
                      }`}
                    >
                      {isSel ? (
                        <CheckSquare size={16} className="text-amber-400 shrink-0 mt-0.5" />
                      ) : (
                        <Square size={16} className="text-slate-600 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs text-white">{entry.author}</span>
                            {entry.distinction && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                {entry.distinction}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400">({entry.country})</span>
                          </div>
                          <span className="text-[10px] text-amber-400">{'★'.repeat(entry.rating)}</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">{entry.message}</p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete signature from "${entry.author}"?`)) {
                            exhibitionStore.deleteGuestbookEntry(entry.id);
                            showBanner(`Guestbook signature deleted!`);
                          }
                        }}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Delete Signature"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 8: THEMES */}
          {activeTab === 'themes' && (
            <div className="space-y-4 max-w-4xl">
              <div>
                <h2 className="font-serif text-xl font-bold text-white flex items-center gap-2">
                  <Palette size={22} className="text-amber-400" />
                  Architectural Gallery Themes
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Change the real-time procedural textures of the museum walls, floorboards, and ceiling
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {themesList.map(t => (
                  <div
                    key={t.id}
                    onClick={() => {
                      exhibitionStore.setTheme(t.id);
                      showBanner(`Gallery theme switched to "${t.name}"!`);
                    }}
                    className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {t.colors.map((c, i) => (
                          <span
                            key={i}
                            className="w-5 h-5 rounded-full border border-white/20"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <h4 className="font-serif font-bold text-base text-white">{t.name}</h4>
                      <p className="text-xs text-slate-400 mt-1">{t.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: EDIT ARTWORK (Strict Category-Filtered Awards)  */}
      {/* ========================================================= */}
      {editingArtwork && (() => {
        const artWing = wings.find(w => w.id === editingArtwork.category) || wings[0];
        const artAwards = artWing?.awards && artWing.awards.length > 0
          ? artWing.awards
          : [
              { id: 'def-1', name: '1st Place - Gold Award', spotlightColorHex: '#ffd700', plaqueStyle: 'gold' as const },
              { id: 'def-2', name: '2nd Place - Silver Award', spotlightColorHex: '#e0e7ff', plaqueStyle: 'silver' as const },
              { id: 'def-3', name: '3rd Place - Bronze Award', spotlightColorHex: '#f59e0b', plaqueStyle: 'bronze' as const },
              { id: 'def-4', name: 'Merit Award', spotlightColorHex: '#fef08a', plaqueStyle: 'gold' as const },
              { id: 'def-5', name: 'Salon Acceptance', spotlightColorHex: '#f8fafc', plaqueStyle: 'slate' as const },
            ];

        return (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Edit3 size={18} className="text-amber-400" />
                  <h3 className="font-serif font-bold text-base text-white">Edit Photograph Details</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingArtwork(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  exhibitionStore.updateArtwork(editingArtwork);
                  setEditingArtwork(null);
                  showBanner(`Updated "${editingArtwork.title}" successfully!`);
                }}
                className="space-y-3 text-xs"
              >
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Photograph Title *</label>
                  <input
                    type="text"
                    required
                    value={editingArtwork.title}
                    onChange={(e) => setEditingArtwork({ ...editingArtwork, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Photographer Name *</label>
                    <input
                      type="text"
                      required
                      value={editingArtwork.photographer}
                      onChange={(e) => setEditingArtwork({ ...editingArtwork, photographer: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-cyan-300 font-semibold mb-1">School / Institution</label>
                    <input
                      type="text"
                      value={editingArtwork.school || ''}
                      onChange={(e) => setEditingArtwork({ ...editingArtwork, school: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-cyan-500/40 text-cyan-200 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Section / Category *</label>
                    <select
                      value={editingArtwork.category}
                      onChange={(e) => {
                        const newCat = e.target.value;
                        const targetWing = wings.find(w => w.id === newCat);
                        const targetAwards = targetWing?.awards && targetWing.awards.length > 0 ? targetWing.awards : artAwards;
                        const newAward = targetAwards[0]?.name || 'Salon Acceptance';
                        setEditingArtwork({
                          ...editingArtwork,
                          category: newCat,
                          place: newAward,
                          awardTier: newAward,
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                    >
                      {wings.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-amber-300 font-semibold mb-1">
                      Award / Ranking * ({artWing.name})
                    </label>
                    <select
                      value={editingArtwork.place || editingArtwork.awardTier}
                      onChange={(e) => setEditingArtwork({
                        ...editingArtwork,
                        place: e.target.value,
                        awardTier: e.target.value,
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-amber-500/40 text-amber-200 font-semibold focus:outline-none"
                    >
                      {artAwards.map(aw => (
                        <option key={aw.id} value={aw.name}>
                          {aw.name} ({aw.plaqueStyle} plaque)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-semibold">Photograph Image (URL or Upload)</label>
                    <label className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold cursor-pointer flex items-center gap-1 transition-all">
                      <Upload size={11} /> Upload to Firebase Storage
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const opt = await optimizeImageFile(file, 2048, 0.88);
                            setEditingArtwork(prev => prev ? {
                              ...prev,
                              imageUrl: opt.dataUrl,
                              aspectRatio: opt.aspectRatio,
                            } : null);
                            saveImageToIndexedDb(editingArtwork.id, opt.dataUrl).catch(() => {});

                            uploadImageToStorage(file, 'photographs')
                              .then(fireUrl => {
                                setEditingArtwork(prev => prev ? { ...prev, imageUrl: fireUrl } : null);
                                showBanner('Photograph uploaded to Firebase Storage!');
                              })
                              .catch(err => console.warn('Storage upload notice:', err));
                          } catch (err) {
                            console.error('Error optimizing image:', err);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <input
                    type="url"
                    value={editingArtwork.imageUrl}
                    onChange={(e) => setEditingArtwork({ ...editingArtwork, imageUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono"
                  />
                  {editingArtwork.imageUrl && (
                    <div className="mt-2 relative aspect-[16/9] rounded-xl overflow-hidden bg-black border border-slate-800">
                      <img src={editingArtwork.imageUrl} alt="Preview" className="w-full h-full object-contain" />
                      {editingArtwork.imageUrl.includes('firebasestorage') && (
                        <span className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 font-mono font-bold">
                          ☁ Firebase Cloud Storage
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingArtwork(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-bold shadow cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ========================================================= */}
      {/* MODAL 2: EDIT SECTION                                      */}
      {/* ========================================================= */}
      {editingSection && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 size={18} className="text-amber-400" />
                <h3 className="font-serif font-bold text-base text-white">Edit Gallery Section</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingSection(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                exhibitionStore.updateCategoryWing(editingSection);
                setEditingSection(null);
                showBanner(`Section "${editingSection.name}" updated!`);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Section Name *</label>
                <input
                  type="text"
                  required
                  value={editingSection.name}
                  onChange={(e) => setEditingSection({ ...editingSection, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editingSection.colorHex}
                    onChange={(e) => setEditingSection({ ...editingSection, colorHex: e.target.value })}
                    className="w-10 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={editingSection.colorHex}
                    onChange={(e) => setEditingSection({ ...editingSection, colorHex: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingSection.description}
                  onChange={(e) => setEditingSection({ ...editingSection, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingSection(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-bold shadow cursor-pointer"
                >
                  Save Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: EDIT SECTION AWARD                                */}
      {/* ========================================================= */}
      {editingSectionAward && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Award size={18} className="text-amber-400" />
                <h3 className="font-serif font-bold text-base text-white">Edit Section Award</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingSectionAward(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                exhibitionStore.updateSectionAward(editingSectionAward.wingId, editingSectionAward.award);
                setEditingSectionAward(null);
                showBanner(`Award "${editingSectionAward.award.name}" updated!`);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Award Name *</label>
                <input
                  type="text"
                  required
                  value={editingSectionAward.award.name}
                  onChange={(e) => setEditingSectionAward({
                    ...editingSectionAward,
                    award: { ...editingSectionAward.award, name: e.target.value }
                  })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Spotlight Illumination Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editingSectionAward.award.spotlightColorHex}
                    onChange={(e) => setEditingSectionAward({
                      ...editingSectionAward,
                      award: { ...editingSectionAward.award, spotlightColorHex: e.target.value }
                    })}
                    className="w-10 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={editingSectionAward.award.spotlightColorHex}
                    onChange={(e) => setEditingSectionAward({
                      ...editingSectionAward,
                      award: { ...editingSectionAward.award, spotlightColorHex: e.target.value }
                    })}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  {[
                    { label: 'Gold', hex: '#ffd700' },
                    { label: 'Silver', hex: '#e0e7ff' },
                    { label: 'Bronze', hex: '#f59e0b' },
                    { label: 'White', hex: '#f8fafc' },
                  ].map(p => (
                    <button
                      key={p.hex}
                      type="button"
                      onClick={() => setEditingSectionAward({
                        ...editingSectionAward,
                        award: { ...editingSectionAward.award, spotlightColorHex: p.hex }
                      })}
                      className="px-2 py-0.5 rounded text-[10px] bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Plaque Style</label>
                <select
                  value={editingSectionAward.award.plaqueStyle}
                  onChange={(e) => setEditingSectionAward({
                    ...editingSectionAward,
                    award: { ...editingSectionAward.award, plaqueStyle: e.target.value as any }
                  })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                >
                  <option value="gold">Gold Plaque</option>
                  <option value="silver">Silver Plaque</option>
                  <option value="bronze">Bronze Plaque</option>
                  <option value="slate">Slate Plaque</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingSectionAward(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-bold shadow cursor-pointer"
                >
                  Save Award
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: ADD AWARD TO EXISTING SECTION                    */}
      {/* ========================================================= */}
      {addingAwardWingId && (() => {
        const targetWing = wings.find(w => w.id === addingAwardWingId);
        return (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <PlusCircle size={18} className="text-amber-400" />
                  <h3 className="font-serif font-bold text-base text-white">
                    Add Award to "{targetWing?.name}"
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setAddingAwardWingId(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newSecAwardName.trim()) return;
                  const newAward: SectionAward = {
                    id: `sec-aw-${Date.now()}`,
                    name: newSecAwardName.trim(),
                    spotlightColorHex: newSecAwardSpotlight,
                    plaqueStyle: newSecAwardPlaque,
                  };
                  exhibitionStore.addAwardToSection(addingAwardWingId, newAward);
                  setAddingAwardWingId(null);
                  setNewSecAwardName('');
                  showBanner(`Added award "${newAward.name}" to "${targetWing?.name}"!`);
                }}
                className="space-y-3 text-xs"
              >
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Award Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Best Portrait Award, Special Merit"
                    value={newSecAwardName}
                    onChange={(e) => setNewSecAwardName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Spotlight Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newSecAwardSpotlight}
                      onChange={(e) => setNewSecAwardSpotlight(e.target.value)}
                      className="w-10 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={newSecAwardSpotlight}
                      onChange={(e) => setNewSecAwardSpotlight(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    {[
                      { label: 'Gold', hex: '#ffd700' },
                      { label: 'Silver', hex: '#e0e7ff' },
                      { label: 'Bronze', hex: '#f59e0b' },
                      { label: 'White', hex: '#f8fafc' },
                    ].map(p => (
                      <button
                        key={p.hex}
                        type="button"
                        onClick={() => setNewSecAwardSpotlight(p.hex)}
                        className="px-2 py-0.5 rounded text-[10px] bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Plaque Style</label>
                  <select
                    value={newSecAwardPlaque}
                    onChange={(e) => setNewSecAwardPlaque(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  >
                    <option value="gold">Gold Plaque</option>
                    <option value="silver">Silver Plaque</option>
                    <option value="bronze">Bronze Plaque</option>
                    <option value="slate">Slate Plaque</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setAddingAwardWingId(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-bold shadow cursor-pointer"
                  >
                    + Add Award
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ========================================================= */}
      {/* MODAL 5: EDIT JUDGE PROFILE                                */}
      {/* ========================================================= */}
      {editingJudge && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-amber-400" />
                <h3 className="font-serif font-bold text-base text-white">Edit Juror Profile</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingJudge(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                exhibitionStore.updateJudge(editingJudge);
                setEditingJudge(null);
                showBanner(`Juror profile for "${editingJudge.name}" updated!`);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Juror Full Name *</label>
                <input
                  type="text"
                  required
                  value={editingJudge.name}
                  onChange={(e) => setEditingJudge({ ...editingJudge, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Country *</label>
                  <input
                    type="text"
                    required
                    value={editingJudge.country}
                    onChange={(e) => setEditingJudge({ ...editingJudge, country: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Juror Role</label>
                  <input
                    type="text"
                    value={editingJudge.role || ''}
                    onChange={(e) => setEditingJudge({ ...editingJudge, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Honors & Distinctions</label>
                <input
                  type="text"
                  value={editingJudge.honors}
                  onChange={(e) => setEditingJudge({ ...editingJudge, honors: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold">Profile Photo (URL or Upload)</label>
                  <label className="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold cursor-pointer flex items-center gap-1 transition-all">
                    <Upload size={10} /> Upload to Storage
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setEditingJudge({ ...editingJudge, imageUrl: ev.target?.result as string });
                        };
                        reader.readAsDataURL(file);

                        uploadImageToStorage(file, 'judges')
                          .then(fireUrl => {
                            setEditingJudge(prev => prev ? { ...prev, imageUrl: fireUrl } : null);
                            showBanner('Juror photo uploaded to Firebase Storage!');
                          })
                          .catch(() => {});
                      }}
                    />
                  </label>
                </div>
                <input
                  type="url"
                  placeholder="https://..."
                  value={editingJudge.imageUrl || ''}
                  onChange={(e) => setEditingJudge({ ...editingJudge, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono"
                />
                {editingJudge.imageUrl && (
                  <div className="mt-2 flex items-center gap-2.5 p-2 rounded-xl bg-slate-950 border border-slate-800">
                    <img
                      src={editingJudge.imageUrl}
                      alt={editingJudge.name}
                      className="w-9 h-9 rounded-full object-cover border border-amber-400/40 shrink-0"
                    />
                    <span className="text-[11px] text-slate-400 truncate font-mono">
                      {editingJudge.imageUrl}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingJudge(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-bold shadow cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 6: EDIT PATRONAGE ENTRY                             */}
      {/* ========================================================= */}
      {editingPatronage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-amber-400" />
                <h3 className="font-serif font-bold text-base text-white">Edit Patronage Entry</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingPatronage(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                exhibitionStore.updatePatronageOrg(editingPatronage);
                setEditingPatronage(null);
                showBanner(`Patronage for "${editingPatronage.organization}" updated!`);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Organization Name *</label>
                <input
                  type="text"
                  required
                  value={editingPatronage.organization}
                  onChange={(e) => setEditingPatronage({ ...editingPatronage, organization: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono uppercase focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Patronage Number *</label>
                <input
                  type="text"
                  required
                  value={editingPatronage.patronageNumber}
                  onChange={(e) => setEditingPatronage({ ...editingPatronage, patronageNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPatronage(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-bold shadow cursor-pointer"
                >
                  Save Patronage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

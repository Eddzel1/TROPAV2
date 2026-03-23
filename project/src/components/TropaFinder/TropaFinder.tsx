import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from '../Layout/Header';
import { supabase } from '../../lib/supabase';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Users,
  Loader2,
  AlertCircle,
  ShieldBan,
  ShieldCheck,
  X,
  Upload,
  Image as ImageIcon,
  FileText,
  Eye,
} from 'lucide-react';

interface Voter {
  id: number;
  lastname: string;
  firstname: string;
  middlename: string | null;
  ext: string | null;
  lgu: string | null;
  brgy: string | null;
  status: string | null;
  PC: string | null;
  HHL: string | null;
}

interface BlocklistEntry {
  id: string;
  voter_id: number;
  note: string | null;
  image_url: string | null;
  image_path: string | null;
  created_at: string;
}

type SortField = 'lastname' | 'firstname' | 'middlename' | 'lgu' | 'brgy' | 'status';
type SortDir = 'asc' | 'desc';

interface TropaFinderProps {
  onMenuClick: () => void;
}

const PAGE_SIZE = 20;

// ─── Blocklist Modal ──────────────────────────────────────────────────────────
interface BlocklistModalProps {
  voter: Voter | null;
  existing: BlocklistEntry | null;
  onClose: () => void;
  onSaved: () => void;
}

// ── Image compression helper ──────────────────────────────────────────────────
async function compressImage(source: File | Blob, maxPx = 1200, quality = 0.75): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(source);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxPx || height > maxPx) {
        if (width > height) { height = Math.round((height * maxPx) / width); width = maxPx; }
        else { width = Math.round((width * maxPx) / height); height = maxPx; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Compression failed'));
          resolve(new File([blob], 'image.jpg', { type: 'image/jpeg' }));
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = url;
  });
}

function BlocklistModal({ voter, existing, onClose, onSaved }: BlocklistModalProps) {
  const [note, setNote] = useState(existing?.note ?? '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(existing?.image_url ?? null);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!voter) return null;

  const fullName = `${voter.lastname}, ${voter.firstname}${voter.middlename ? ' ' + voter.middlename : ''}${voter.ext ? ' ' + voter.ext : ''}`;

  // ── Paste support ──────────────────────────────────────────────────────────
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          if (!blob) continue;
          try {
            const compressed = await compressImage(blob);
            setImageFile(compressed);
            setImagePreview(URL.createObjectURL(compressed));
          } catch {
            setError('Could not process pasted image.');
          }
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // ── File input handler (with compression) ──────────────────────────────────
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setImageFile(compressed);
      setImagePreview(URL.createObjectURL(compressed));
    } catch {
      // Fallback: use original if compression fails
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      let image_url = existing?.image_url ?? null;
      let image_path = existing?.image_path ?? null;

      // Upload new image if selected (already compressed to JPEG)
      if (imageFile) {
        const path = `${voter.id}/${Date.now()}.jpg`;
        const { error: uploadErr } = await supabase.storage
          .from('blocklist-images')
          .upload(path, imageFile, { upsert: true, contentType: 'image/jpeg' });
        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage.from('blocklist-images').getPublicUrl(path);
        image_url = urlData.publicUrl;
        image_path = path;

        // Delete old image if replacing
        if (existing?.image_path && existing.image_path !== path) {
          await supabase.storage.from('blocklist-images').remove([existing.image_path]);
        }
      }

      if (existing) {
        // Update
        const { error: updateErr } = await supabase
          .from('voter_blocklist')
          .update({ note: note || null, image_url, image_path })
          .eq('id', existing.id);
        if (updateErr) throw updateErr;
      } else {
        // Insert
        const { error: insertErr } = await supabase
          .from('voter_blocklist')
          .insert({ voter_id: voter.id, note: note || null, image_url, image_path });
        if (insertErr) throw insertErr;
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save blocklist entry');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!existing) return;
    if (!window.confirm('Remove this voter from the blocklist?')) return;
    setRemoving(true);
    setError(null);
    try {
      if (existing.image_path) {
        await supabase.storage.from('blocklist-images').remove([existing.image_path]);
      }
      const { error: deleteErr } = await supabase
        .from('voter_blocklist')
        .delete()
        .eq('id', existing.id);
      if (deleteErr) throw deleteErr;
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove blocklist entry');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md z-10 overflow-hidden">
        {/* Header */}
        <div className={`p-5 flex items-center gap-3 ${existing ? 'bg-red-50 border-b border-red-100' : 'bg-orange-50 border-b border-orange-100'}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${existing ? 'bg-red-100' : 'bg-orange-100'}`}>
            <ShieldBan className={`w-5 h-5 ${existing ? 'text-red-600' : 'text-orange-600'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-900">
              {existing ? 'Edit Blocklist Entry' : 'Add to Blocklist'}
            </h2>
            <p className="text-sm text-gray-600 truncate">{fullName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <FileText className="w-4 h-4 inline mr-1 text-gray-500" />
              Note / Reason
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Enter reason for blocklisting this voter..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-red-400 text-sm resize-none"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <ImageIcon className="w-4 h-4 inline mr-1 text-gray-500" />
              Supporting Image
            </label>
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Supporting evidence"
                  className="w-full h-40 object-cover rounded-lg border border-gray-200"
                />
                <button
                  onClick={() => { setImagePreview(null); setImageFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/60 rounded-lg text-white text-xs hover:bg-black/80 transition-colors flex items-center gap-1"
                >
                  <Upload className="w-3 h-3" /> Change
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
              >
                <Upload className="w-6 h-6" />
                <span className="text-sm">Click to upload or <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Ctrl+V</kbd> to paste</span>
                <span className="text-xs">JPG, PNG, WEBP · Auto-compressed</span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex items-center gap-2">
          {existing && (
            <button
              onClick={handleRemove}
              disabled={removing || saving}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {removing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              Remove from Blocklist
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || removing}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldBan className="w-4 h-4" />}
            {existing ? 'Update' : 'Blocklist'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Blocklist View Modal (read-only) ────────────────────────────────────────
interface BlocklistViewModalProps {
  voter: Voter | null;
  entry: BlocklistEntry | null;
  onClose: () => void;
  onEdit: () => void;
}

function BlocklistViewModal({ voter, entry, onClose, onEdit }: BlocklistViewModalProps) {
  const [zoom, setZoom] = useState(1);
  const imgContainerRef = useRef<HTMLDivElement>(null);

  if (!voter || !entry) return null;
  const fullName = `${voter.lastname}, ${voter.firstname}${voter.middlename ? ' ' + voter.middlename : ''}${voter.ext ? ' ' + voter.ext : ''}`;
  const date = new Date(entry.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

  useEffect(() => {
    const container = imgContainerRef.current;
    if (!container) return;

    const handleWheelNative = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      e.stopPropagation();
      setZoom((prev) => {
        const delta = e.deltaY < 0 ? 0.15 : -0.15;
        return Math.min(5, Math.max(0.25, +(prev + delta).toFixed(2)));
      });
    };

    container.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => container.removeEventListener('wheel', handleWheelNative);
  }, []);

  const zoomIn  = () => setZoom((p) => Math.min(5,    +(p + 0.25).toFixed(2)));
  const zoomOut = () => setZoom((p) => Math.max(0.25, +(p - 0.25).toFixed(2)));
  const zoomReset = () => setZoom(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl z-10 overflow-hidden">
        {/* Header */}
        <div className="p-5 flex items-center gap-3 bg-red-50 border-b border-red-100">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <ShieldBan className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-900">Blocklist Details</h2>
            <p className="text-sm text-gray-600 truncate">{fullName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Meta */}
          <p className="text-xs text-gray-400">Blocklisted on {date}</p>

          {/* Note */}
          {entry.note ? (
            <div className="bg-red-50 border border-red-100 rounded-lg p-4">
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> Reason / Note
              </p>
              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{entry.note}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No reason provided.</p>
          )}

          {/* Image */}
          {entry.image_url && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5" /> Supporting Image
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={zoomOut}
                    disabled={zoom <= 0.25}
                    className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors text-base font-bold"
                  >−</button>
                  <button
                    onClick={zoomReset}
                    className="px-2 h-7 border border-gray-300 rounded-lg text-xs font-mono text-gray-600 hover:bg-gray-100 transition-colors min-w-[3.5rem] text-center"
                  >{Math.round(zoom * 100)}%</button>
                  <button
                    onClick={zoomIn}
                    disabled={zoom >= 5}
                    className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors text-base font-bold"
                  >+</button>
                  <span className="text-xs text-gray-400 ml-1">or Ctrl+Scroll</span>
                </div>
              </div>
              <div
                ref={imgContainerRef}
                className="rounded-lg border border-gray-200 bg-gray-50 overflow-auto"
                style={{ maxHeight: '24rem', cursor: zoom > 1 ? 'grab' : 'default' }}
              >
                <img
                  src={entry.image_url}
                  alt="Supporting evidence"
                  draggable={false}
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top left',
                    width: `${100 / zoom}%`,
                    display: 'block',
                    transition: 'transform 0.1s ease',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors">
            Close
          </button>
          <button onClick={onEdit} className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
            <ShieldBan className="w-4 h-4" /> Edit Entry
          </button>
        </div>
      </div>
    </div>
  );
}



// ─── Main Component ───────────────────────────────────────────────────────────
export function TropaFinder({ onMenuClick }: TropaFinderProps) {
  const [searchLastname, setSearchLastname] = useState('');
  const [searchFirstname, setSearchFirstname] = useState('');
  const [searchMiddlename, setSearchMiddlename] = useState('');
  const [filterLgu, setFilterLgu] = useState('');
  const [filterBrgy, setFilterBrgy] = useState('');

  const [sortField, setSortField] = useState<SortField>('lastname');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const [currentPage, setCurrentPage] = useState(1);

  const [voters, setVoters] = useState<Voter[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const [viewEntry, setViewEntry] = useState<{ voter: Voter; entry: BlocklistEntry } | null>(null);
  const [blocklist, setBlocklist] = useState<Map<number, BlocklistEntry>>(new Map());
  const [modalVoter, setModalVoter] = useState<Voter | null>(null);

  const [barangays, setBarangays] = useState<string[]>([]);
  const [lgus] = useState<string[]>([
    'BAUNGON', 'CABANGLASAN', 'DAMULOG', 'DANCAGAN', 'DANGCAGAN',
    'DON CARLOS', 'IMPASUG-ONG', 'KADINGILAN', 'KADINGILIAN',
    'KALILANGAN', 'KIBAWE', 'KITAOTAO', 'LANTAPAN', 'LIBONA',
    'MALAYBALAY CITY', 'MANOLO FORTICH', 'MARAMAG', 'PANGANTUCAN',
    'QUEZON', 'SAN FERNANDO', 'SUMILAO', 'TALAKAG', 'VALENCIA CITY',
  ]);


  // Fetch barangays when LGU changes
  useEffect(() => {
    setFilterBrgy('');
    if (!filterLgu) { setBarangays([]); return; }
    supabase
      .from('voters')
      .select('brgy')
      .ilike('lgu', filterLgu)
      .not('brgy', 'is', null)
      .order('brgy', { ascending: true })
      .then(({ data }) => {
        if (data) {
          const unique = [...new Set(data.map((r) => r.brgy as string).filter(Boolean))].sort();
          setBarangays(unique);
        }
      });
  }, [filterLgu]);

  // Fetch blocklist entries for current visible voters
  const fetchBlocklist = useCallback(async (voterIds: number[]) => {
    if (voterIds.length === 0) { setBlocklist(new Map()); return; }
    const { data } = await supabase
      .from('voter_blocklist')
      .select('*')
      .in('voter_id', voterIds);
    if (data) {
      const map = new Map<number, BlocklistEntry>();
      data.forEach((entry: BlocklistEntry) => map.set(entry.voter_id, entry));
      setBlocklist(map);
    }
  }, []);

  const fetchVoters = useCallback(async (page: number) => {
    const hasLastname = searchLastname.trim().length >= 2;
    const hasFirstname = searchFirstname.trim().length >= 2;
    const hasMiddlename = searchMiddlename.trim().length >= 2;
    const hasLgu = !!filterLgu;
    const hasBrgy = !!filterBrgy;

    if (!hasLastname && !hasFirstname && !hasMiddlename && !hasLgu && !hasBrgy) {
      setVoters([]);
      setTotalCount(0);
      setSearched(false);
      setBlocklist(new Map());
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const buildQuery = (base: any) => {
        let q = base;
        if (hasLastname) q = q.ilike('lastname', `%${searchLastname.trim()}%`);
        if (hasFirstname) q = q.ilike('firstname', `%${searchFirstname.trim()}%`);
        if (hasMiddlename) q = q.ilike('middlename', `%${searchMiddlename.trim()}%`);
        if (hasLgu) q = q.ilike('lgu', filterLgu);
        if (hasBrgy) q = q.ilike('brgy', filterBrgy);
        return q;
      };

      const countQuery = buildQuery(
        supabase.from('voters').select('id', { count: 'exact', head: true })
      );
      const { count, error: countError } = await countQuery;
      if (countError) throw countError;

      let dataQuery = buildQuery(
        supabase.from('voters').select('id, lastname, firstname, middlename, ext, lgu, brgy, status, PC, HHL')
      );
      dataQuery = dataQuery.order(sortField, { ascending: sortDir === 'asc' }).range(from, to);

      const { data, error: dataError } = await dataQuery;
      if (dataError) throw dataError;

      const voterList = (data as Voter[]) ?? [];
      setVoters(voterList);
      setTotalCount(count ?? 0);

      // Fetch blocklist entries for these voters
      await fetchBlocklist(voterList.map((v) => v.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch voters');
    } finally {
      setLoading(false);
    }
  }, [searchLastname, searchFirstname, searchMiddlename, filterLgu, filterBrgy, sortField, sortDir, fetchBlocklist]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchVoters(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  const handleBlocklistSaved = () => {
    fetchBlocklist(voters.map((v) => v.id));
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const getPageNumbers = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400 inline ml-1" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3.5 h-3.5 text-teal-600 inline ml-1" />
      : <ChevronDown className="w-3.5 h-3.5 text-teal-600 inline ml-1" />;
  };

  const thClass = (field: SortField) =>
    `px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 whitespace-nowrap transition-colors ${sortField === field ? 'bg-teal-50 text-teal-700' : ''}`;

  const blocklisted = voters.filter((v) => blocklist.has(v.id)).length;

  return (
    <div className="flex-1 bg-gray-50 min-h-0 overflow-auto">
      <Header title="Tropa Finder" subtitle="Search and browse the voters database" onMenuClick={onMenuClick} />

      <div className="p-4 lg:p-6">
        {/* Stats bar */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Search Results</p>
              <p className="text-2xl font-bold text-gray-900">{searched ? totalCount.toLocaleString() : '—'}</p>
            </div>
            {searched && totalCount > 0 && (
              <p className="text-sm text-gray-400 ml-auto">Page {currentPage}/{totalPages}</p>
            )}
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-red-100 p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <ShieldBan className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Blocklisted (this page)</p>
              <p className="text-2xl font-bold text-red-700">{searched ? blocklisted : '—'}</p>
            </div>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Search Filters</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Lastname" value={searchLastname}
                onChange={(e) => setSearchLastname(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-full text-sm" />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Firstname" value={searchFirstname}
                onChange={(e) => setSearchFirstname(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-full text-sm" />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Middlename" value={searchMiddlename}
                onChange={(e) => setSearchMiddlename(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-full text-sm" />
            </div>
            <select value={filterLgu}
              onChange={(e) => setFilterLgu(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm bg-white">
              <option value="">All LGUs</option>
              {lgus.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <select value={filterBrgy}
              onChange={(e) => setFilterBrgy(e.target.value)}
              disabled={!filterLgu}
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm bg-white disabled:opacity-50 disabled:cursor-not-allowed">
              <option value="">{filterLgu ? 'All Barangays' : 'Select LGU first'}</option>
              {barangays.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            💡 Press <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Enter</kbd> in any name field to search.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mr-3 text-teal-500" />
            <span className="text-sm font-medium">Searching voters...</span>
          </div>
        )}

        {!loading && searched && voters.length === 0 && !error && (
          <div className="text-center py-16 text-gray-400">
            <Users className="w-14 h-14 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium text-gray-500">No voters found</p>
            <p className="text-sm">Try adjusting your search filters</p>
          </div>
        )}

        {!loading && !searched && !error && (
          <div className="text-center py-16 text-gray-400">
            <Search className="w-14 h-14 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium text-gray-500">Search the voters database</p>
            <p className="text-sm">Use the filters above to find voters</p>
          </div>
        )}

        {/* Table */}
        {!loading && voters.length > 0 && (
          <>
            {/* Legend */}
            <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-red-100 border border-red-300 inline-block" />
                Blocklisted voter
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-white border border-gray-200 inline-block" />
                Normal voter
              </span>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">#</th>
                      <th className={thClass('lastname')} onClick={() => handleSort('lastname')}>Lastname <SortIcon field="lastname" /></th>
                      <th className={thClass('firstname')} onClick={() => handleSort('firstname')}>Firstname <SortIcon field="firstname" /></th>
                      <th className={thClass('middlename')} onClick={() => handleSort('middlename')}>Middlename <SortIcon field="middlename" /></th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Ext</th>
                      <th className={thClass('lgu')} onClick={() => handleSort('lgu')}>LGU <SortIcon field="lgu" /></th>
                      <th className={thClass('brgy')} onClick={() => handleSort('brgy')}>Barangay <SortIcon field="brgy" /></th>
                      <th className={thClass('status')} onClick={() => handleSort('status')}>Status <SortIcon field="status" /></th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">PC</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">HHL</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Blocklist</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {voters.map((voter, idx) => {
                      const rowNum = (currentPage - 1) * PAGE_SIZE + idx + 1;
                      const entry = blocklist.get(voter.id);
                      const isBlocklisted = !!entry;

                      return (
                        <tr
                          key={voter.id}
                          className={`transition-colors ${isBlocklisted
                              ? 'bg-red-50 hover:bg-red-100 border-l-4 border-l-red-500'
                              : 'hover:bg-teal-50'
                            }`}
                        >
                          <td className="px-3 py-3 text-gray-400 text-xs font-mono">{rowNum}</td>
                          <td className={`px-3 py-3 font-semibold ${isBlocklisted ? 'text-red-900' : 'text-gray-900'}`}>
                            {voter.lastname || '—'}
                          </td>
                          <td className={`px-3 py-3 ${isBlocklisted ? 'text-red-800' : 'text-gray-800'}`}>{voter.firstname || '—'}</td>
                          <td className={`px-3 py-3 ${isBlocklisted ? 'text-red-700' : 'text-gray-700'}`}>{voter.middlename || '—'}</td>
                          <td className="px-3 py-3 text-gray-500">{voter.ext || ''}</td>
                          <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{voter.lgu || '—'}</td>
                          <td className="px-3 py-3 text-gray-700">{voter.brgy || '—'}</td>
                          <td className="px-3 py-3">
                            {voter.status ? (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${voter.status.toUpperCase() === 'ACTIVE'
                                  ? 'bg-green-100 text-green-700'
                                  : voter.status.toUpperCase() === 'DEACTIVATED'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                {voter.status}
                              </span>
                            ) : '—'}
                          </td>
                          <td className="px-3 py-3 text-gray-700">{voter.PC || '—'}</td>
                          <td className="px-3 py-3 text-gray-700">{voter.HHL || '—'}</td>
                          <td className="px-3 py-3">
                            {isBlocklisted ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => setModalVoter(voter)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-600 text-white rounded-full text-xs font-bold hover:bg-red-700 transition-colors"
                                >
                                  <ShieldBan className="w-3 h-3" />
                                  BLOCKLISTED
                                </button>
                                <button
                                  onClick={() => setViewEntry({ voter, entry: entry! })}
                                  title="View details"
                                  className="p-1 rounded-full text-red-500 hover:bg-red-100 hover:text-red-700 transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setModalVoter(voter)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 border border-gray-300 text-gray-500 rounded-full text-xs hover:border-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <ShieldBan className="w-3 h-3" />
                                Blocklist
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between flex-wrap gap-3">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-medium">{(currentPage - 1) * PAGE_SIZE + 1}</span>
                  {' '}–{' '}
                  <span className="font-medium">{Math.min(currentPage * PAGE_SIZE, totalCount)}</span>
                  {' '}of{' '}
                  <span className="font-medium">{totalCount.toLocaleString()}</span> voters
                </p>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {getPageNumbers().map((page, i) => (
                    <button key={`${page}-${i}`}
                      onClick={() => typeof page === 'number' ? setCurrentPage(page) : undefined}
                      disabled={page === '...'}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${page === '...' ? 'cursor-default text-gray-400'
                          : currentPage === page ? 'bg-teal-600 text-white border border-teal-600'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}>
                      {page}
                    </button>
                  ))}
                  <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Blocklist Modal */}
      {modalVoter && (
        <BlocklistModal
          voter={modalVoter}
          existing={blocklist.get(modalVoter.id) ?? null}
          onClose={() => setModalVoter(null)}
          onSaved={handleBlocklistSaved}
        />
      )}

      {/* Blocklist View Modal */}
      {viewEntry && (
        <BlocklistViewModal
          voter={viewEntry.voter}
          entry={viewEntry.entry}
          onClose={() => setViewEntry(null)}
          onEdit={() => { setModalVoter(viewEntry.voter); setViewEntry(null); }}
        />
      )}
    </div>
  );
}

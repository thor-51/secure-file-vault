// FILE: frontend/src/pages/SearchPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { searchFiles, selectFiles, selectFilesLoading, selectPagination } from '../store/slices/filesSlice';
import FileCard from '../components/files/FileCard';
import ShareModal from '../components/files/ShareModal';
import Spinner from '../components/ui/Spinner';

const MIME_OPTIONS = [
  { label: 'All types', value: '' },
  { label: 'Images', value: 'image/' },
  { label: 'PDFs', value: 'application/pdf' },
  { label: 'Videos', value: 'video/' },
  { label: 'Audio', value: 'audio/' },
  { label: 'Archives', value: 'application/zip' },
  { label: 'Text', value: 'text/' },
];

export default function SearchPage() {
  const dispatch = useDispatch();
  const files = useSelector(selectFiles);
  const loading = useSelector(selectFilesLoading);
  const pagination = useSelector(selectPagination);

  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({ mimeType: '', minSize: '', maxSize: '', dateFrom: '', dateTo: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [shareTarget, setShareTarget] = useState(null);

  const doSearch = useCallback(() => {
    const params = { page, limit: 18, sortBy: 'createdAt', sortOrder: 'desc' };
    if (query) params.q = query;
    if (filters.mimeType) params.mimeType = filters.mimeType;
    if (filters.minSize) params.minSize = Number(filters.minSize) * 1024;
    if (filters.maxSize) params.maxSize = Number(filters.maxSize) * 1024;
    if (filters.dateFrom) params.dateFrom = new Date(filters.dateFrom).toISOString();
    if (filters.dateTo) params.dateTo = new Date(filters.dateTo).toISOString();
    dispatch(searchFiles(params));
  }, [dispatch, query, filters, page]);

  // Debounce search on query change
  useEffect(() => {
    const t = setTimeout(doSearch, 350);
    return () => clearTimeout(t);
  }, [doSearch]);

  const clearFilters = () => {
    setFilters({ mimeType: '', minSize: '', maxSize: '', dateFrom: '', dateTo: '' });
    setQuery('');
  };

  const hasActiveFilters = query || Object.values(filters).some(Boolean);

  return (
    <div className="space-y-5 fade-in">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Search</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Filter across all your files
        </p>
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            className="input pl-9"
            placeholder="Search by name or description…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            autoFocus
          />
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`btn-ghost gap-2 ${showFilters ? 'border-[color:var(--border-active)] text-[color:var(--accent)] bg-[color:var(--accent-soft)]' : ''}`}>
          <SlidersHorizontal size={15} /> Filters
          {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-[color:var(--accent)]" />}
        </button>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="btn-ghost px-3" title="Clear all">
            <X size={15} />
          </button>
        )}
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="card p-5 slide-up grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>File Type</label>
            <select className="input text-sm"
              value={filters.mimeType}
              onChange={(e) => setFilters({ ...filters, mimeType: e.target.value })}>
              {MIME_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Min Size (KB)</label>
            <input type="number" className="input text-sm" placeholder="0"
              value={filters.minSize} onChange={(e) => setFilters({ ...filters, minSize: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Max Size (KB)</label>
            <input type="number" className="input text-sm" placeholder="∞"
              value={filters.maxSize} onChange={(e) => setFilters({ ...filters, maxSize: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>From Date</label>
            <input type="date" className="input text-sm"
              value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>To Date</label>
            <input type="date" className="input text-sm"
              value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} />
          </div>
        </div>
      )}

      {/* Results */}
      <div>
        {pagination && (
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            {pagination.total} result{pagination.total !== 1 ? 's' : ''}
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-16"><Spinner size={32} /></div>
        ) : files.length === 0 ? (
          <div className="card p-16 text-center">
            <Search size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>No files found</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Try different keywords or adjust filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((f) => <FileCard key={f.id} file={f} onShare={setShareTarget} />)}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={!pagination.hasPrev} onClick={() => setPage(p => p - 1)} className="btn-ghost px-3 py-1.5 text-sm">Prev</button>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {pagination.page} / {pagination.totalPages}
          </span>
          <button disabled={!pagination.hasNext} onClick={() => setPage(p => p + 1)} className="btn-ghost px-3 py-1.5 text-sm">Next</button>
        </div>
      )}

      {shareTarget && <ShareModal file={shareTarget} onClose={() => setShareTarget(null)} />}
    </div>
  );
}

// FILE: frontend/src/pages/SharedPage.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Share2 } from 'lucide-react';
import { searchFiles, selectFiles, selectFilesLoading } from '../store/slices/filesSlice';
import FileCard from '../components/files/FileCard';
import ShareModal from '../components/files/ShareModal';
import Spinner from '../components/ui/Spinner';

export default function SharedPage() {
  const dispatch = useDispatch();
  const files = useSelector(selectFiles);
  const loading = useSelector(selectFilesLoading);
  const [shareTarget, setShareTarget] = useState(null);

  useEffect(() => {
    dispatch(searchFiles({ visibility: 'public', limit: 50 }));
  }, [dispatch]);

  return (
    <div className="space-y-5 fade-in">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Shared Files</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Files shared with you or publicly accessible</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={32} /></div>
      ) : files.length === 0 ? (
        <div className="card p-16 text-center">
          <Share2 size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>No shared files</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Files shared with you will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map((f) => <FileCard key={f.id} file={f} onShare={setShareTarget} />)}
        </div>
      )}

      {shareTarget && <ShareModal file={shareTarget} onClose={() => setShareTarget(null)} />}
    </div>
  );
}

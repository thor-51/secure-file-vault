// FILE: frontend/src/components/ui/FileIcon.jsx
import React from 'react';
import {
  FileText, FileImage, FileVideo, FileAudio, FileArchive,
  FileCode, FileSpreadsheet, File,
} from 'lucide-react';

const mimeMap = {
  'image/': { icon: FileImage, color: '#68d391' },
  'video/': { icon: FileVideo, color: '#9f7aea' },
  'audio/': { icon: FileAudio, color: '#f6ad55' },
  'text/': { icon: FileText, color: '#63b3ed' },
  'application/pdf': { icon: FileText, color: '#fc8181' },
  'application/zip': { icon: FileArchive, color: '#fbd38d' },
  'application/gzip': { icon: FileArchive, color: '#fbd38d' },
  'application/x-tar': { icon: FileArchive, color: '#fbd38d' },
  'application/json': { icon: FileCode, color: '#68d391' },
  'application/xml': { icon: FileCode, color: '#68d391' },
  'application/vnd.ms-excel': { icon: FileSpreadsheet, color: '#68d391' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml': { icon: FileSpreadsheet, color: '#68d391' },
};

export default function FileIcon({ mimeType, size = 20 }) {
  let match = { icon: File, color: 'var(--text-muted)' };

  for (const [key, val] of Object.entries(mimeMap)) {
    if (mimeType?.startsWith(key)) { match = val; break; }
  }

  const Icon = match.icon;
  return <Icon size={size} color={match.color} />;
}

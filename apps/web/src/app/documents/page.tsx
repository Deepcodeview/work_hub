'use client';

import React, { useState, useEffect } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Badge } from '@workhub/ui';

interface DocFolderItem {
  id: string;
  name: string;
  _count?: { files: number; subfolders: number };
}

interface DocFileItem {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  currentVersion: number;
  createdAt: string;
  versions?: { versionNumber: number; sizeBytes: number; createdAt: string }[];
}

export default function DocumentsPage() {
  const [folders, setFolders] = useState<DocFolderItem[]>([]);
  const [files, setFiles] = useState<DocFileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [fileName, setFileName] = useState('');
  const [mimeType, setMimeType] = useState('application/pdf');

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem('workhub_token') || localStorage.getItem('token') || ''}` };
      const [foldRes, fileRes] = await Promise.all([
        fetch('/api/v1/documents/folders', { headers }),
        fetch('/api/v1/documents/files', { headers }),
      ]);
      if (foldRes.ok) setFolders(await foldRes.json());
      if (fileRes.ok) setFiles(await fileRes.json());
    } catch {
      // offline fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/documents/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('workhub_token') || localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ name: folderName }),
      });
      if (res.ok) {
        setShowFolderModal(false);
        setFolderName('');
        fetchData();
      }
    } catch {
      // error handled
    }
  };

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/documents/files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('workhub_token') || localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          name: fileName,
          mimeType,
          sizeBytes: 1048576, // 1MB mock file
          storagePath: `/s3/documents/${fileName.toLowerCase().replace(/\s+/g, '-')}`,
        }),
      });
      if (res.ok) {
        setShowFileModal(false);
        setFileName('');
        fetchData();
      }
    } catch {
      // error handled
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">Company Documents &amp; Files</h1>
          <p className="text-sm text-[#64748B]">Cloud storage repository with folder permissions and version control</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowFolderModal(true)}>+ New Folder</Button>
          <Button onClick={() => setShowFileModal(true)}>+ Upload Document</Button>
        </div>
      </div>

      {showFolderModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm shadow-xl bg-white">
            <CardHeader>
              <CardTitle>Create Folder</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateFolder} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1">Folder Name</label>
                  <Input
                    required
                    placeholder="e.g. Legal Agreements"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" type="button" onClick={() => setShowFolderModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {showFileModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md shadow-xl bg-white">
            <CardHeader>
              <CardTitle>Upload Document</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUploadFile} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1">Document Name</label>
                  <Input
                    required
                    placeholder="e.g. Employee_Handbook_2026.pdf"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1">Document Format</label>
                  <select
                    className="w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A00]"
                    value={mimeType}
                    onChange={(e) => setMimeType(e.target.value)}
                  >
                    <option value="application/pdf">PDF Document (.pdf)</option>
                    <option value="application/vnd.openxmlformats-officedocument.wordprocessingml.document">Word Document (.docx)</option>
                    <option value="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet">Excel Spreadsheet (.xlsx)</option>
                    <option value="image/png">PNG Image (.png)</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" type="button" onClick={() => setShowFileModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Upload</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-[#64748B]">Loading files and repository...</div>
      ) : (
        <div className="space-y-6">
          {/* Folders Section */}
          <div>
            <h3 className="text-sm font-bold text-[#64748B] uppercase tracking-wider mb-3">Folders</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {folders.length === 0 ? (
                <div className="text-xs text-[#94A3B8] col-span-4 py-4">No folders created yet</div>
              ) : (
                folders.map((f) => (
                  <div key={f.id} className="p-3.5 bg-white border border-[#E2E8F0] rounded-lg hover:border-[#FF8A00] transition-colors cursor-pointer flex items-center gap-3">
                    <span className="text-2xl">📁</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1F2937] truncate">{f.name}</p>
                      <span className="text-xs text-[#64748B]">{f._count?.files || 0} files</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Files Section */}
          <div>
            <h3 className="text-sm font-bold text-[#64748B] uppercase tracking-wider mb-3">Files &amp; Documents</h3>
            <Card className="divide-y divide-[#E2E8F0]">
              {files.length === 0 ? (
                <div className="text-center py-12 text-sm text-[#94A3B8]">
                  No files uploaded yet. Add a new file using the upload button.
                </div>
              ) : (
                files.map((file) => (
                  <div key={file.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl">📄</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#1F2937] truncate">{file.name}</p>
                        <div className="flex items-center gap-2 text-xs text-[#64748B] mt-0.5">
                          <span className="font-mono bg-gray-100 px-1.5 py-0.2 rounded font-medium">v{file.currentVersion}</span>
                          <span>&bull;</span>
                          <span>{(file.sizeBytes / 1024 / 1024).toFixed(1)} MB</span>
                          <span>&bull;</span>
                          <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => alert(`Downloading ${file.name}`)}>
                      Download
                    </Button>
                  </div>
                ))
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

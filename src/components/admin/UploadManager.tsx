import { useEffect, useState, useRef } from "react";

type UploadFile = {
  filename: string;
  url: string;
  size: number;
  modified: number;
  type: string;
  path: string;
};

type Uploads = {
  covers: UploadFile[];
  pagebreaks: UploadFile[];
  general: UploadFile[];
};

export default function UploadManager() {
  const [uploads, setUploads] = useState<Uploads>({ covers: [], pagebreaks: [], general: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'covers' | 'pagebreaks' | 'general'>('covers');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadUploads();
  }, []);

  const loadUploads = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/images/manage.php', {
        credentials: 'same-origin'
      });
      if (!response.ok) throw new Error('Failed to load uploads');
      const data = await response.json();
      setUploads(data.uploads || { covers: [], pagebreaks: [], general: [] });
    } catch (err: any) {
      setError(err.message || 'Failed to load uploads');
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (file: UploadFile) => {
    if (!confirm(`Are you sure you want to delete "${file.filename}"? This action cannot be undone.`)) {
      return;
    }

    setError(null);
    try {
      const response = await fetch('/api/images/manage.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ action: 'delete', path: file.path })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete file');
      }

      setSuccess('File deleted successfully!');
      await loadUploads();
    } catch (err: any) {
      setError(err.message || 'Failed to delete file');
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
      return;
    }
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File too large. Maximum size is 5MB.');
      return;
    }
    
    setUploading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', 'general');
      
      const response = await fetch('/api/images/upload.php', {
        method: 'POST',
        credentials: 'same-origin',
        body: formData
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }
      
      const data = await response.json();
      setSuccess(`File "${file.name}" uploaded successfully!`);
      console.log('Upload response:', data);
      await loadUploads(); // Refresh the file list
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalFiles = () => {
    return uploads.covers.length + uploads.pagebreaks.length + uploads.general.length;
  };

  const getTotalSize = () => {
    const totalBytes = [...uploads.covers, ...uploads.pagebreaks, ...uploads.general]
      .reduce((sum, file) => sum + file.size, 0);
    return formatFileSize(totalBytes);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Upload Manager</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {getTotalFiles()} files • {getTotalSize()} total
          </p>
        </div>
        <button
          onClick={loadUploads}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {(['covers', 'pagebreaks', 'general'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                selectedTab === tab
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab} ({uploads[tab].length})
            </button>
          ))}
        </nav>
      </div>

      {/* Upload Interface for General Tab */}
      {selectedTab === 'general' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Upload Images</h3>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleFileInputChange}
                className="hidden"
              />
              
              {uploading ? (
                <div className="space-y-2">
                  <div className="animate-spin mx-auto h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  <p className="text-gray-600 dark:text-gray-400">Uploading...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Drag and drop an image here, or{' '}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                      >
                        browse to upload
                      </button>
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                      Supports JPEG, PNG, GIF, WebP (max 5MB)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* File Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">Loading uploads...</div>
          ) : uploads[selectedTab].length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No {selectedTab} found</p>
              {selectedTab === 'general' ? (
                <p className="text-sm mt-2">Use the upload area above to add images.</p>
              ) : (
                <p className="text-sm mt-2">Upload some {selectedTab} to see them here.</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {uploads[selectedTab].map((file, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                  <div className="aspect-w-16 aspect-h-9 bg-gray-100 dark:bg-gray-700">
                    <img
                      src={file.url}
                      alt={file.filename}
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden w-full h-32 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate" title={file.filename}>
                      {file.filename}
                    </h3>
                    <div className="mt-2 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                      <p>Size: {formatFileSize(file.size)}</p>
                      <p>Modified: {formatDate(file.modified)}</p>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-blue-600 text-white text-xs px-3 py-2 rounded hover:bg-blue-700 transition-colors text-center"
                      >
                        View
                      </a>
                      <button
                        onClick={() => deleteFile(file)}
                        className="flex-1 bg-red-600 text-white text-xs px-3 py-2 rounded hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

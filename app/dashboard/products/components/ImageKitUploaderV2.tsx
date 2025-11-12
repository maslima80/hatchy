'use client';

import { useState, useRef, useCallback } from 'react';
import { IKContext, IKUpload } from 'imagekitio-react';
import { Upload, X, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface ImageKitUploaderProps {
  productId: string;
  onUploadComplete: (url: string) => void;
  existingImages?: Array<{ id: string; url: string; alt?: string | null }>;
  onDeleteImage?: (mediaId: string) => void;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  url?: string;
}

export function ImageKitUploaderV2({ 
  productId, 
  onUploadComplete,
  existingImages = [],
  onDeleteImage 
}: ImageKitUploaderProps) {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const uploadRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!;
  const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!;

  const authenticator = async () => {
    try {
      const response = await fetch('/api/imagekit/auth');
      if (!response.ok) {
        throw new Error('Failed to authenticate');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Auth error:', error);
      throw error;
    }
  };

  const uploadFile = async (file: File) => {
    const fileName = file.name;
    
    // Add to uploads list
    setUploads(prev => [...prev, {
      fileName,
      progress: 0,
      status: 'uploading'
    }]);

    try {
      // Get auth params
      const authParams = await authenticator();
      
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', fileName);
      formData.append('folder', `/products/${productId}`);
      formData.append('publicKey', publicKey);
      formData.append('signature', authParams.signature);
      formData.append('expire', authParams.expire.toString());
      formData.append('token', authParams.token);

      // Upload with progress tracking
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploads(prev => prev.map(u => 
            u.fileName === fileName ? { ...u, progress } : u
          ));
        }
      });

      xhr.addEventListener('load', async () => {
        if (xhr.status === 200) {
          const result = JSON.parse(xhr.responseText);
          
          // Save to database
          const response = await fetch(`/api/products/${productId}/media`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: result.url,
              alt: result.name,
            }),
          });

          if (response.ok) {
            setUploads(prev => prev.map(u => 
              u.fileName === fileName 
                ? { ...u, progress: 100, status: 'success', url: result.url } 
                : u
            ));
            onUploadComplete(result.url);
            
            // Remove from list after 2 seconds
            setTimeout(() => {
              setUploads(prev => prev.filter(u => u.fileName !== fileName));
            }, 2000);
          } else {
            throw new Error('Failed to save to database');
          }
        } else {
          throw new Error('Upload failed');
        }
      });

      xhr.addEventListener('error', () => {
        setUploads(prev => prev.map(u => 
          u.fileName === fileName ? { ...u, status: 'error' } : u
        ));
      });

      xhr.open('POST', `${urlEndpoint}/api/v1/files/upload`);
      xhr.send(formData);

    } catch (error) {
      console.error('Upload error:', error);
      setUploads(prev => prev.map(u => 
        u.fileName === fileName ? { ...u, status: 'error' } : u
      ));
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    
    // Upload multiple files
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        uploadFile(file);
      }
    });
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  }, []);

  const handleDelete = async (mediaId: string) => {
    if (!confirm('Delete this image?')) return;

    try {
      const response = await fetch(`/api/products/${productId}/media`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId }),
      });

      if (response.ok && onDeleteImage) {
        onDeleteImage(mediaId);
      }
    } catch (error) {
      console.error('Failed to delete image:', error);
      alert('Failed to delete image');
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        ref={uploadRef}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}
        `}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-2 font-medium">
          Drag and drop images here, or click to browse
        </p>
        <p className="text-sm text-gray-500">
          Supports: JPG, PNG, WEBP (Max 5MB each) • Multiple files supported
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((upload, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium truncate flex-1">
                  {upload.fileName}
                </span>
                {upload.status === 'uploading' && (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                )}
                {upload.status === 'success' && (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                )}
                {upload.status === 'error' && (
                  <X className="w-4 h-4 text-red-600" />
                )}
              </div>
              <Progress value={upload.progress} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">
                {upload.status === 'uploading' && `${upload.progress}%`}
                {upload.status === 'success' && 'Upload complete!'}
                {upload.status === 'error' && 'Upload failed'}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Existing Images Grid */}
      {existingImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {existingImages.map((image, index) => (
            <div key={image.id} className="relative group aspect-square">
              <img
                src={image.url}
                alt={image.alt || 'Product image'}
                className="w-full h-full object-cover rounded-lg border border-gray-200"
              />
              {index === 0 && (
                <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                  Main
                </div>
              )}
              <button
                onClick={() => handleDelete(image.id)}
                className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

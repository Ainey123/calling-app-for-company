import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Camera, 
  Trash2, 
  CheckCircle2, 
  Link, 
  User, 
  Sparkles,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';
import { EmployeeExtension } from '../types';
import { processUploadedImage, getInitialsAvatar } from '../utils/imageUtils';

interface EmployeePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  extension: EmployeeExtension;
  onSavePhoto: (extensionId: string, newAvatarUrl: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const EmployeePhotoModal: React.FC<EmployeePhotoModalProps> = ({
  isOpen,
  onClose,
  extension,
  onSavePhoto,
  onShowToast,
}) => {
  const [photoPreview, setPhotoPreview] = useState<string>(extension.avatar || '');
  const [urlInput, setUrlInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const optimizedDataUrl = await processUploadedImage(file);
      setPhotoPreview(optimizedDataUrl);
      onShowToast('Real photo loaded and optimized. Click "Save Photo" to apply.', 'info');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to process image file.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) {
      onShowToast('Please enter an image URL.', 'error');
      return;
    }
    setPhotoPreview(urlInput.trim());
    onShowToast('Image URL applied. Click "Save Photo" to confirm.', 'info');
  };

  const handleSetInitials = () => {
    const initialsSvg = getInitialsAvatar(extension.name, extension.extension);
    setPhotoPreview(initialsSvg);
    onShowToast('Avatar reset to clean monogram initials.', 'info');
  };

  const handleSave = () => {
    if (!photoPreview) {
      onShowToast('Please upload or select an avatar image first.', 'error');
      return;
    }
    onSavePhoto(extension.id, photoPreview);
    onShowToast(`Updated profile photo for ${extension.name} (Ext ${extension.extension})`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Custom Employee Photo</h2>
              <p className="text-xs text-slate-400">Upload your own real photo for Ext {extension.extension}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[75dvh]">
          {/* Avatar Live Preview */}
          <div className="flex flex-col items-center justify-center space-y-3 p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
            <div className="relative group">
              <img
                src={photoPreview || getInitialsAvatar(extension.name, extension.extension)}
                alt={extension.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-2 ring-indigo-500/50 shadow-xl bg-slate-800"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg border border-indigo-400/30 transition cursor-pointer"
                title="Choose new file"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center">
              <div className="font-bold text-sm text-white">{extension.name}</div>
              <div className="text-xs text-indigo-400 font-mono mt-0.5">
                Ext {extension.extension} • {extension.role}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {photoPreview.startsWith('data:image/svg+xml') 
                  ? 'Currently using monogram initials' 
                  : photoPreview.startsWith('data:image/') 
                  ? 'Custom device photo uploaded' 
                  : 'Company image link'}
              </div>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeTab === 'upload' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload from Device</span>
            </button>
            <button
              onClick={() => setActiveTab('url')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeTab === 'url' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Link className="w-3.5 h-3.5" />
              <span>Image Link URL</span>
            </button>
          </div>

          {/* Tab 1: Upload from Device */}
          {activeTab === 'upload' ? (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-6 text-center cursor-pointer transition bg-slate-950/40 hover:bg-indigo-950/10 space-y-2 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 group-hover:bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto transition">
                  {isProcessing ? (
                    <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
                  ) : (
                    <ImageIcon className="w-6 h-6" />
                  )}
                </div>
                <div className="text-xs font-bold text-slate-200">
                  {isProcessing ? 'Optimizing photo...' : 'Click to select personal photo'}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                  Supports JPG, PNG, WEBP, HEIC from your phone, laptop, or camera. Auto-cropped to square avatar.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Browse Device Files</span>
                </button>

                <button
                  type="button"
                  onClick={handleSetInitials}
                  className="py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
                  title="Use clean initials monogram instead of stock picture"
                >
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>Initials Badge</span>
                </button>
              </div>
            </div>
          ) : (
            /* Tab 2: Direct URL */
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Direct Image URL:</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/my-photo.jpg"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleApplyUrl}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                You can link to an image on Google Drive, LinkedIn, corporate intranet, or Cloudinary.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="py-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save Photo</span>
          </button>
        </div>
      </div>
    </div>
  );
};

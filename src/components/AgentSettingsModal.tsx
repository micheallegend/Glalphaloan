import React, { useState, useRef } from 'react';
import { Agent } from '../types';
import { KeyRound, Lock, Upload, Camera, Trash2, X, CheckCircle2, ShieldCheck, Image as ImageIcon } from 'lucide-react';

interface AgentSettingsModalProps {
  currentAgent: Agent;
  onUpdateAgent: (updatedAgent: Agent) => void;
  onClose: () => void;
}

export const AgentSettingsModal: React.FC<AgentSettingsModalProps> = ({ currentAgent, onUpdateAgent, onClose }) => {
  const [newPin, setNewPin] = useState(currentAgent.pin);
  const [newPassword, setNewPassword] = useState(currentAgent.password);
  const [photoUrl, setPhotoUrl] = useState(currentAgent.photoUrl || '');
  const [successMsg, setSuccessMsg] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImageFile = (file: File) => {
    setUploadError('');

    // Accept PNG, JPG/JPEG, WEBP
    if (!file.type.match(/^image\/(png|jpeg|jpg|webp)$/i)) {
      setUploadError('Please select a valid image file (PNG, JPG, or JPEG).');
      return;
    }

    // Limit raw upload size before resizing (max 15MB)
    if (file.size > 15 * 1024 * 1024) {
      setUploadError('Image file is too large. Please select a photo under 15MB.');
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      setUploadError('Failed to read image file.');
    };
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => {
        setUploadError('Failed to decode image.');
      };
      img.onload = () => {
        // Create canvas to downscale/compress for optimal storage and sync
        const canvas = document.createElement('canvas');
        const maxDimension = 320;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Export as JPEG with 0.85 quality
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setPhotoUrl(compressedDataUrl);
        } else {
          setPhotoUrl(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Agent = {
      ...currentAgent,
      pin: newPin.trim(),
      password: newPassword.trim(),
      photoUrl: photoUrl.trim(),
    };

    onUpdateAgent(updated);
    setSuccessMsg('Agent profile photo and credentials updated successfully!');
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Agent Settings & Photo</div>
              <h3 className="text-xl font-bold text-white mt-0.5">{currentAgent.name}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMsg && (
          <div className="m-6 mb-0 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 p-3.5 rounded-xl flex items-center space-x-2 text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Agent Picture Upload Section */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>Agent Picture (Upload PNG or JPG from computer/photo)</span>
              </span>
              {photoUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="text-red-400 hover:text-red-300 text-xs flex items-center space-x-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove Photo</span>
                </button>
              )}
            </label>

            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Upload & Preview Box */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col sm:flex-row items-center gap-4 ${
                isDragging
                  ? 'bg-amber-500/10 border-amber-500 scale-[1.01]'
                  : photoUrl
                  ? 'bg-slate-800/40 border-slate-700 hover:border-amber-500/50'
                  : 'bg-slate-800/30 border-slate-700 hover:border-amber-500/50 hover:bg-slate-800/60'
              }`}
            >
              {/* Picture Preview */}
              <div className="w-20 h-20 rounded-2xl bg-slate-800 border-2 border-amber-500/40 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg relative group">
                {photoUrl ? (
                  <img src={photoUrl} alt={currentAgent.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <span className="text-2xl font-black text-amber-400">{currentAgent.name.charAt(0)}</span>
                  </div>
                )}
              </div>

              {/* Upload Controls & Description */}
              <div className="flex-1 text-center sm:text-left space-y-1">
                <div className="font-bold text-white text-sm flex items-center justify-center sm:justify-start space-x-1.5">
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span>{photoUrl ? 'Click or drag to replace image' : 'Click to select picture or take photo'}</span>
                </div>
                <p className="text-xs text-slate-400">
                  Supports PNG, JPG, or JPEG images from your computer or phone camera.
                </p>
                <div className="pt-1 flex flex-wrap gap-2 justify-center sm:justify-start">
                  <span className="bg-slate-800 border border-slate-700 text-[10px] text-amber-400 font-semibold px-2 py-0.5 rounded">
                    PNG / JPG
                  </span>
                  <span className="bg-slate-800 border border-slate-700 text-[10px] text-slate-400 px-2 py-0.5 rounded">
                    Auto-optimized
                  </span>
                </div>
              </div>
            </div>

            {uploadError && (
              <div className="text-xs text-red-400 font-semibold bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl">
                {uploadError}
              </div>
            )}
          </div>

          {/* Security Credentials */}
          <div className="border-t border-slate-800 pt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center space-x-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Security PIN ({currentAgent.name})</span>
              </label>
              <input
                type="text"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="Enter new PIN"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm font-mono tracking-widest focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Security Password</span>
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>

          <div className="flex space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold py-3 rounded-xl text-sm transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-3 rounded-xl text-sm shadow-lg shadow-amber-500/25 transition-all cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save & Update</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

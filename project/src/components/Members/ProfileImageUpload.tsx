import React, { useState, useRef } from 'react';
import { Camera, Upload, X, User, Loader2 } from 'lucide-react';
import { compressProfileImage, validateImageFile, createImagePreview, revokeImagePreview } from '../../lib/imageUtils';

interface ProfileImageUploadProps {
  currentImageUrl?: string;
  onImageChange: (file: File | null, previewUrl: string | null) => void;
  disabled?: boolean;
}

export function ProfileImageUpload({ currentImageUrl, onImageChange, disabled }: ProfileImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null); setIsCompressing(true);
    try {
      const validation = validateImageFile(file);
      if (!validation.isValid) { setError(validation.error || 'Invalid file'); setIsCompressing(false); return; }
      const compressedFile = await compressProfileImage(file);
      const newPreviewUrl = createImagePreview(compressedFile);
      if (previewUrl && previewUrl !== currentImageUrl) revokeImagePreview(previewUrl);
      setPreviewUrl(newPreviewUrl); onImageChange(compressedFile, newPreviewUrl);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to process image'); }
    finally { setIsCompressing(false); }
  };

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } });
      setStream(mediaStream); setShowCamera(true);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = mediaStream; }, 100);
    } catch (err) { setError('Unable to access camera.'); }
  };

  const stopCamera = () => { if (stream) { stream.getTracks().forEach(track => track.stop()); setStream(null); } setShowCamera(false); };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsCompressing(true); setError(null);
    try {
      const video = videoRef.current; const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) { throw new Error('Unable to get canvas context'); }
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      canvas.toBlob(async (blob) => {
        if (!blob) { setError('Failed to capture image'); setIsCompressing(false); return; }
        const timestamp = Date.now();
        const capturedFile = new File([blob], `captured-${timestamp}.jpg`, { type: 'image/jpeg', lastModified: timestamp });
        try {
          const validation = validateImageFile(capturedFile);
          if (!validation.isValid) { setError(validation.error || 'Invalid captured image'); setIsCompressing(false); return; }
          const compressedFile = await compressProfileImage(capturedFile);
          const newPreviewUrl = createImagePreview(compressedFile);
          if (previewUrl && previewUrl !== currentImageUrl) revokeImagePreview(previewUrl);
          setPreviewUrl(newPreviewUrl); onImageChange(compressedFile, newPreviewUrl); stopCamera();
        } catch (err) { setError(err instanceof Error ? err.message : 'Failed to process captured image'); }
        finally { setIsCompressing(false); }
      }, 'image/jpeg', 0.9);
    } catch (err) { setError('Failed to capture photo'); setIsCompressing(false); }
  };

  const handleRemoveImage = () => {
    if (previewUrl && previewUrl !== currentImageUrl) revokeImagePreview(previewUrl);
    setPreviewUrl(null); onImageChange(null, null); setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  React.useEffect(() => { return () => { if (stream) stream.getTracks().forEach(track => track.stop()); }; }, [stream]);

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">Profile Picture</label>
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold text-gray-900">Capture Photo</h3><button onClick={stopCamera} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"><X className="w-5 h-5" /></button></div>
            <div className="relative"><video ref={videoRef} autoPlay playsInline muted className="w-full h-64 bg-gray-100 rounded-lg object-cover" /><div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-48 h-48 border-4 border-white border-opacity-50 rounded-full"></div></div></div>
            <div className="flex justify-center gap-4 mt-4">
              <button onClick={stopCamera} disabled={isCompressing} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancel</button>
              <button onClick={capturePhoto} disabled={isCompressing} className="flex items-center gap-2 px-6 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white rounded-lg">{isCompressing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}{isCompressing ? 'Processing...' : 'Capture Photo'}</button>
            </div>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
      <div className="flex items-start gap-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 flex items-center justify-center">{isCompressing ? <Loader2 className="w-6 h-6 text-gray-400 animate-spin" /> : previewUrl ? <img src={previewUrl} alt="Profile preview" className="w-full h-full object-cover" /> : <User className="w-8 h-8 text-gray-400" />}</div>
          {previewUrl && !disabled && !isCompressing && (<button type="button" onClick={handleRemoveImage} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center"><X className="w-3 h-3" /></button>)}
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => !disabled && fileInputRef.current?.click()} disabled={disabled || isCompressing} className="flex items-center gap-2 px-3 py-2 text-sm bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white rounded-lg">{isCompressing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}{isCompressing ? 'Processing...' : 'Upload'}</button>
            <button type="button" onClick={startCamera} disabled={disabled || isCompressing || showCamera} className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg"><Camera className="w-4 h-4" />Capture</button>
            {previewUrl && (<button type="button" onClick={handleRemoveImage} disabled={disabled || isCompressing} className="px-3 py-2 text-sm text-gray-600 hover:text-red-600 border border-gray-300 hover:border-red-300 rounded-lg">Remove</button>)}
          </div>
          <div className="text-xs text-gray-500 space-y-1"><p>• Recommended: 400x400px or larger</p><p>• Formats: JPEG, PNG, WebP</p><p>• Max size: 10MB (will be compressed)</p></div>
          {error && (<div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>)}
        </div>
      </div>
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleFileSelect} className="hidden" disabled={disabled} />
    </div>
  );
}

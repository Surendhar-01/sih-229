import React, { useState, useRef } from 'react';
import { Camera, Upload, Trash2, AlertCircle, Loader2, X, ScanLine } from 'lucide-react';
import { compressImage, validateImageFile, CompressedImage, MAX_IMAGES } from '../../utils/imageCompressor';
import { useTranslation } from 'react-i18next';

interface ImageUploaderProps {
  images: CompressedImage[];
  onImagesChange: (images: CompressedImage[]) => void;
  disabled?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onImagesChange,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const [compressing, setCompressing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setErrorMessage(null);

    const availableSlots = MAX_IMAGES - images.length;
    if (availableSlots <= 0) {
      setErrorMessage(`Maximum ${MAX_IMAGES} images permitted.`);
      return;
    }

    const filesToProcess = Array.from(fileList).slice(0, availableSlots);
    setCompressing(true);

    try {
      const newlyCompressed: CompressedImage[] = [];

      for (const file of filesToProcess) {
        const validation = validateImageFile(file);
        if (!validation.valid) {
          setErrorMessage(validation.error || 'Invalid file');
          continue;
        }

        const compressed = await compressImage(file);
        newlyCompressed.push(compressed);
      }

      if (newlyCompressed.length > 0) {
        onImagesChange([...images, ...newlyCompressed]);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error processing image');
    } finally {
      setCompressing(false);
      // Reset inputs so user can select the same file again if desired
      if (galleryInputRef.current) galleryInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleRemove = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onImagesChange(updated);
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };

  const openCamera = async () => {
    if (disabled || compressing || images.length >= MAX_IMAGES) return;
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      cameraInputRef.current?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      streamRef.current = stream;
      setCameraOpen(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch {
      setCameraError('Camera access was denied or is unavailable. Please allow camera permission or upload from gallery.');
    }
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
    if (!blob) return;
    const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
    const transfer = new DataTransfer();
    transfer.items.add(file);
    stopCamera();
    await handleFiles(transfer.files);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="image-gallery space-y-4">
      {/* Hidden file inputs */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        disabled={disabled || images.length >= MAX_IMAGES || compressing}
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        disabled={disabled || images.length >= MAX_IMAGES || compressing}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Upload Action Area */}
      {images.length < MAX_IMAGES && (
        <div
          className={`upload-dropzone border-2 border-dashed rounded-xl p-6 text-center transition-all ${
            dragActive
              ? 'border-emerald-500 bg-emerald-50/10'
              : 'border-slate-700 hover:border-slate-500 bg-slate-900/60'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={openCamera}
                disabled={disabled || compressing}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-md transition disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                {t('lot.takePhoto')}
              </button>

              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={disabled || compressing}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-600 transition disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {t('lot.uploadGallery')}
              </button>
            </div>

            <p className="text-xs text-slate-400">
              {t('lot.dragDrop')} &bull; {images.length}/{MAX_IMAGES} photos uploaded
            </p>
            <p className="text-[11px] text-slate-500">
              {t('lot.maxPhotosNotice')}
            </p>
          </div>
          </div>
      )}

      {cameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-2 font-bold text-slate-900"><ScanLine className="h-5 w-5 text-emerald-600" /> Capture e-waste photo</div>
              <button type="button" onClick={stopCamera} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close camera"><X className="h-5 w-5" /></button>
            </div>
            <div className="bg-slate-950 p-3"><video ref={videoRef} playsInline muted className="aspect-video w-full rounded-xl object-cover" /></div>
            <div className="flex items-center justify-between gap-3 p-4">
              <span className="text-xs text-slate-500">Position the device inside the frame</span>
              <button type="button" onClick={capturePhoto} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white shadow-lg hover:bg-emerald-700"><Camera className="h-4 w-4" /> Capture photo</button>
            </div>
          </div>
        </div>
      )}

      {cameraError && <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"><AlertCircle className="h-4 w-4 shrink-0" />{cameraError}</div>}

      {/* Loading state */}
      {compressing && (
        <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-slate-800 text-emerald-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Compressing & preparing images locally...</span>
        </div>
      )}

      {/* Error display */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="photo-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {images.map((img, index) => (
            <div
              key={index}
              className="photo-tile relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-800 shadow-md aspect-square"
            >
              <img
                src={img.dataUrl}
                alt={img.originalName}
                className="photo-preview w-full h-full object-cover"
              />

              {/* Primary badge for first photo */}
              {index === 0 && (
                <div className="primary-badge absolute top-2 left-2 px-1.5 py-0.5 rounded bg-emerald-600 text-[10px] font-bold text-white shadow">
                  ★ Primary
                </div>
              )}

              {/* File size badge */}
              <div className="photo-meta absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-slate-950/80 text-[10px] text-slate-300 backdrop-blur-sm">
                Photo {index + 1} · {(img.fileSize / 1024).toFixed(0)} KB
              </div>

              {/* Delete button */}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="photo-delete absolute top-2 right-2 p-1.5 rounded-lg bg-rose-900/80 hover:bg-rose-700 text-white transition opacity-90 group-hover:opacity-100 shadow"
                  title="Remove photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

import React, { useState, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { api } from '../../services/api';
import {
  Image as ImageIcon,
  Upload,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export const AdminMediaTab: React.FC = () => {
  const { showToast, settings } = useStore();
  const [isUploading, setIsUploading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gallery of media
  const [mediaList, setMediaList] = useState<string[]>(() => {
    const list = [
      settings?.logoUrl?.trim(),
      settings?.faviconUrl?.trim(),
      settings?.heroImage?.trim(),
    ].filter((item): item is string => Boolean(item && item !== ''));
    return list.length > 0 ? list : ['/logo.jpg'];
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const res = await api.upload.image(file);
      if (res?.url) {
        setMediaList((prev) => [res.url, ...prev.filter((i) => i !== res.url)]);
        showToast('Image téléversée avec succès dans la médiathèque !', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Erreur lors du téléversement.', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    showToast('Lien de l’image copié dans le presse-papiers.', 'info');
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-orange-600" />
            <span>Médiathèque & Gestion des Images</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Téléversez des photos d'outils, logos ou bannières pour les réutiliser dans les fiches produits et la configuration.
          </p>
        </div>

        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition shadow-md disabled:bg-slate-400"
          >
            <Upload className="w-4 h-4" />
            <span>{isUploading ? 'Téléversement en cours...' : 'Téléverser une image'}</span>
          </button>
        </div>
      </div>

      {/* Grid of Images */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {mediaList.map((url, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-sm transition flex flex-col group"
          >
            <div className="h-40 bg-slate-50 p-3 flex items-center justify-center relative overflow-hidden">
              <img
                src={url?.trim() || '/logo.jpg'}
                alt={`Media ${idx}`}
                className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                onError={(e) => {
                  if (e.currentTarget.src !== '/logo.jpg') e.currentTarget.src = '/logo.jpg';
                }}
              />
            </div>

            <div className="p-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs bg-white">
              <span className="font-mono text-[11px] text-slate-500 truncate flex-1" title={url}>
                {url}
              </span>

              <button
                type="button"
                onClick={() => handleCopy(url)}
                aria-label={copiedUrl === url ? 'Lien copié' : `Copier le lien ${url}`}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition flex-shrink-0"
                title="Copier le lien"
              >
                {copiedUrl === url ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

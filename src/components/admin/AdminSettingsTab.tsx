import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { api } from '../../services/api';
import {
  Store,
  Phone,
  Share2,
  Truck,
  Layout,
  Save,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Image as ImageIcon,
} from 'lucide-react';

export const AdminSettingsTab: React.FC = () => {
  const { settings, refetchSettings, showToast, navigateTo } = useStore();

  const [formData, setFormData] = useState({
    storeName: '',
    storeDescription: '',
    logoUrl: '',
    faviconUrl: '',
    phone: '',
    whatsapp: '',
    whatsappNumber: '',
    email: '',
    address: '',
    workingHours: '',
    facebookUrl: '',
    instagramUrl: '',
    tiktokUrl: '',
    youtubeUrl: '',
    defaultShippingTND: 7,
    freeShippingThresholdTND: 300,
    currency: 'DT',
    primaryColor: '#ea580c',
    secondaryColor: '#0f172a',
    heroTitle: '',
    heroSubtitle: '',
    heroButtonText: '',
    heroButtonLink: '',
    heroImage: '',
  });

  const [initialData, setInitialData] = useState(formData);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);
  const [isUploadingHero, setIsUploadingHero] = useState(false);
  const [activeSection, setActiveSection] = useState<'store' | 'contact' | 'social' | 'shipping' | 'hero'>('store');

  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);

  // Sync initial settings into form
  useEffect(() => {
    if (settings) {
      const data = {
        storeName: settings.storeName || '',
        storeDescription: settings.storeDescription || '',
        logoUrl: settings.logoUrl || '/logo.jpg',
        faviconUrl: settings.faviconUrl || '/logo.jpg',
        phone: settings.phone,
        whatsapp: settings.whatsapp || settings.phone,
        whatsappNumber: settings.whatsappNumber || settings.whatsapp.replace(/\D/g, ''),
        email: settings.email || 'contact@reparation-gsm.tn',
        address: settings.address || 'Tunis,tunis',
        workingHours: settings.workingHours || 'Mar - Dim: 08:00 - 18:00 | Lundi: Fermé',
        facebookUrl: settings.facebookUrl || '',
        instagramUrl: settings.instagramUrl || '',
        tiktokUrl: settings.tiktokUrl || '',
        youtubeUrl: settings.youtubeUrl || '',
        defaultShippingTND: settings.defaultShippingTND ?? 7,
        freeShippingThresholdTND: settings.freeShippingThresholdTND ?? 300,
        currency: settings.currency || 'DT',
        primaryColor: settings.primaryColor || '#ea580c',
        secondaryColor: settings.secondaryColor || '#0f172a',
        heroTitle: settings.heroTitle || '',
        heroSubtitle: settings.heroSubtitle || '',
        heroButtonText: settings.heroButtonText || 'عرض جميع المنتجات',
        heroButtonLink: settings.heroButtonLink || 'products',
        heroImage: settings.heroImage || settings.logoUrl || '/logo.jpg',
      };
      setFormData(data);
      setInitialData(data);
    }
  }, [settings]);

  // Check for unsaved changes
  const hasUnsavedChanges = JSON.stringify(formData) !== JSON.stringify(initialData);

  // Warn before browser unload if dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Upload Logo handler
  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingLogo(true);
      const res = await api.settings.uploadLogo(file);
      if (res?.data?.logoUrl) {
        handleChange('logoUrl', res.data.logoUrl);
        showToast('Logo mis à jour avec succès.', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Erreur lors du téléversement du logo.', 'error');
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  // Upload Favicon handler
  const handleUploadFavicon = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingFavicon(true);
      const res = await api.settings.uploadFavicon(file);
      if (res?.data?.faviconUrl) {
        handleChange('faviconUrl', res.data.faviconUrl);
        showToast('Favicon mis à jour avec succès.', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Erreur lors du téléversement du favicon.', 'error');
    } finally {
      setIsUploadingFavicon(false);
      if (faviconInputRef.current) faviconInputRef.current.value = '';
    }
  };

  // Upload Hero Image handler
  const handleUploadHeroImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingHero(true);
      const res = await api.upload.image(file);
      if (res?.url) {
        handleChange('heroImage', res.url);
        showToast('Image Hero téléversée avec succès.', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Erreur lors du téléversement de l’image.', 'error');
    } finally {
      setIsUploadingHero(false);
      if (heroInputRef.current) heroInputRef.current.value = '';
    }
  };

  // Save Settings
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.storeName.trim()) {
      showToast('Le nom du magasin est obligatoire.', 'error');
      return;
    }
    if (!/^[1-9]\d{7,14}$/.test(formData.whatsappNumber)) {
      showToast('Le numéro WhatsApp doit être au format international, chiffres uniquement (8 à 15 chiffres).', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        ...formData,
        defaultShippingTND: Number(formData.defaultShippingTND),
        freeShippingThresholdTND: Number(formData.freeShippingThresholdTND),
      };

      const res = await api.settings.update(payload);
      if (res?.data) {
        setInitialData(formData);
        await refetchSettings();
        showToast('✅ Tous les paramètres du magasin ont été sauvegardés avec succès !', 'success');
      }
    } catch (err: any) {
      if (err?.status === 401 || err?.message?.includes('401') || err?.message?.toLowerCase().includes('connecter')) {
        showToast('Session expirée ou non autorisée. Veuillez vous connecter en tant qu’administrateur.', 'error');
        navigateTo('admin-login');
      } else if (err?.status === 403 || err?.message?.includes('403') || err?.message?.toLowerCase().includes('administrateur')) {
        showToast('Accès refusé : vous n’avez pas les droits ADMIN.', 'error');
      } else {
        showToast(err.message || 'Échec de la sauvegarde des paramètres.', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to saved
  const handleReset = () => {
    if (confirm('Voulez-vous annuler toutes les modifications non enregistrées ?')) {
      setFormData(initialData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Save Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Paramètres Généraux du Magasin
            </h2>
            {hasUnsavedChanges ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 animate-pulse">
                <AlertCircle className="w-3 h-3" />
                Modifications non enregistrées
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Synchronisé avec la BDD
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Toutes les modifications apportées ici sont immédiatement enregistrées dans la base de données et répercutées sur le Header, Footer, Hero et le Checkout.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition"
            >
              Annuler
            </button>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving || !hasUnsavedChanges}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition shadow-md ${
              isSaving
                ? 'bg-slate-400 text-white cursor-wait'
                : hasUnsavedChanges
                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Enregistrement en cours...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Enregistrer les modifications</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveSection('store')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition flex-shrink-0 ${
            activeSection === 'store'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Informations Magasin</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('contact')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition flex-shrink-0 ${
            activeSection === 'contact'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Phone className="w-4 h-4" />
          <span>Contact & Horaires</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('social')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition flex-shrink-0 ${
            activeSection === 'social'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>Réseaux Sociaux</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('shipping')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition flex-shrink-0 ${
            activeSection === 'shipping'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Tarifs Livraison & Devise</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('hero')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition flex-shrink-0 ${
            activeSection === 'hero'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layout className="w-4 h-4" />
          <span>Page d'Accueil (Hero CMS)</span>
        </button>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: STORE INFO */}
        {activeSection === 'store' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Store className="w-4 h-4 text-orange-600" />
              <span>Identité & Présentation du Magasin</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="settings-store-name" className="text-xs font-bold text-slate-700 block mb-1.5">
                  Nom officiel du Magasin *
                </label>
                <input
                  id="settings-store-name"
                  type="text"
                  value={formData.storeName}
                  onChange={(e) => handleChange('storeName', e.target.value)}
                  placeholder="Outils Réparation GSM Tunisie"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-semibold"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  S'affiche dans le Header, le Footer, la facture et la balise &lt;title&gt;.
                </p>
              </div>

              <div>
                <label htmlFor="settings-store-description" className="text-xs font-bold text-slate-700 block mb-1.5">
                  Description courte (SEO & Footer)
                </label>
                <textarea
                  id="settings-store-description"
                  rows={3}
                  value={formData.storeDescription}
                  onChange={(e) => handleChange('storeDescription', e.target.value)}
                  placeholder="Spécialiste de la vente d'équipements de réparation..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Logo and Favicon Uploaders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              {/* Logo Box */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 block">Logo de la Boutique</span>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border border-slate-300 bg-white p-1 flex-shrink-0 shadow-xs">
                    <img
                      src={formData.logoUrl?.trim() || '/logo.jpg'}
                      alt="Logo Preview"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        if (e.currentTarget.src !== '/logo.jpg') e.currentTarget.src = '/logo.jpg';
                      }}
                    />
                  </div>
                  <div className="space-y-2 flex-1">
                    <input
                      type="file"
                      aria-label="Téléverser un nouveau logo"
                      ref={logoInputRef}
                      onChange={handleUploadLogo}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={isUploadingLogo}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 transition"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingLogo ? 'Téléversement...' : 'Téléverser un nouveau logo'}</span>
                    </button>
                    <label htmlFor="settings-logo-url" className="sr-only">URL du logo</label>
                    <input
                      id="settings-logo-url"
                      type="text"
                      value={formData.logoUrl}
                      onChange={(e) => handleChange('logoUrl', e.target.value)}
                      placeholder="/logo.jpg ou URL externe"
                      className="w-full text-[11px] font-mono p-2 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Favicon Box */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 block">Favicon du Site (Icône onglet)</span>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-300 bg-white p-1 flex-shrink-0 shadow-xs">
                    <img
                      src={formData.faviconUrl?.trim() || '/logo.jpg'}
                      alt="Favicon Preview"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        if (e.currentTarget.src !== '/logo.jpg') e.currentTarget.src = '/logo.jpg';
                      }}
                    />
                  </div>
                  <div className="space-y-2 flex-1">
                    <input
                      type="file"
                      aria-label="Téléverser un favicon"
                      ref={faviconInputRef}
                      onChange={handleUploadFavicon}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => faviconInputRef.current?.click()}
                      disabled={isUploadingFavicon}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 transition"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingFavicon ? 'Téléversement...' : 'Téléverser un favicon'}</span>
                    </button>
                    <label htmlFor="settings-favicon-url" className="sr-only">URL du favicon</label>
                    <input
                      id="settings-favicon-url"
                      type="text"
                      value={formData.faviconUrl}
                      onChange={(e) => handleChange('faviconUrl', e.target.value)}
                      placeholder="/logo.jpg ou URL"
                      className="w-full text-[11px] font-mono p-2 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: CONTACT & SCHEDULE */}
        {activeSection === 'contact' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Phone className="w-4 h-4 text-orange-600" />
              <span>Coordonnées & Assistance Téléphonique</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label htmlFor="settings-phone" className="text-xs font-bold text-slate-700 block mb-1.5">
                  Numéro de Téléphone (Hotline) *
                </label>
                <input
                  id="settings-phone"
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="Indicatif pays + numéro"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 font-mono font-bold"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  S'affiche dans la barre supérieure, le Footer et les boutons d'appel.
                </p>
              </div>

              <div>
                <label htmlFor="settings-whatsapp" className="text-xs font-bold text-slate-700 block mb-1.5">
                  Numéro WhatsApp (Chat direct)
                </label>
                <input
                  id="settings-whatsapp"
                  type="text"
                  value={formData.whatsapp}
                  onChange={(e) => handleChange('whatsapp', e.target.value)}
                  placeholder="Indicatif pays + numéro"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 font-mono font-bold text-emerald-700"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Utilisé pour lancer les conversations WhatsApp wa.me.
                </p>
              </div>

              <div>
                <label htmlFor="settings-whatsapp-number" className="text-xs font-bold text-slate-700 block mb-1.5">
                  Numéro WhatsApp des commandes (international) *
                </label>
                <input
                  id="settings-whatsapp-number"
                  type="tel"
                  inputMode="numeric"
                  value={formData.whatsappNumber}
                  onChange={(e) => handleChange('whatsappNumber', e.target.value)}
                  placeholder="Indicatif pays + numéro"
                  minLength={8}
                  maxLength={15}
                  pattern="[1-9][0-9]{7,14}"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 font-mono font-bold text-emerald-700"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Indicatif international et numéro, sans « + », espaces ni tirets.
                </p>
              </div>

              <div>
                <label htmlFor="settings-email" className="text-xs font-bold text-slate-700 block mb-1.5">
                  Adresse Email de contact *
                </label>
                <input
                  id="settings-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="contact@reparation-gsm.tn"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 font-medium"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="settings-address" className="text-xs font-bold text-slate-700 block mb-1.5">
                  Adresse physique / Siège
                </label>
                <input
                  id="settings-address"
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Tunis,tunis"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label htmlFor="settings-working-hours" className="text-xs font-bold text-slate-700 block mb-1.5">
                  Horaires d'ouverture
                </label>
                <input
                  id="settings-working-hours"
                  type="text"
                  value={formData.workingHours}
                  onChange={(e) => handleChange('workingHours', e.target.value)}
                  placeholder="Mar - Dim: 08:00 - 18:00 | Lundi: Fermé"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: SOCIAL MEDIA */}
        {activeSection === 'social' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Share2 className="w-4 h-4 text-orange-600" />
              <span>Liens vers les Réseaux Sociaux</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="settings-facebook" className="text-xs font-bold text-slate-700 block mb-1.5">
                  Page Facebook
                </label>
                <input
                  id="settings-facebook"
                  type="url"
                  value={formData.facebookUrl}
                  onChange={(e) => handleChange('facebookUrl', e.target.value)}
                  placeholder="https://facebook.com/outils.reparation.gsm"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label htmlFor="settings-instagram" className="text-xs font-bold text-slate-700 block mb-1.5">
                  Compte Instagram
                </label>
                <input
                  id="settings-instagram"
                  type="url"
                  value={formData.instagramUrl}
                  onChange={(e) => handleChange('instagramUrl', e.target.value)}
                  placeholder="https://instagram.com/outils.reparation.gsm"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label htmlFor="settings-tiktok" className="text-xs font-bold text-slate-700 block mb-1.5">
                  Compte TikTok
                </label>
                <input
                  id="settings-tiktok"
                  type="url"
                  value={formData.tiktokUrl}
                  onChange={(e) => handleChange('tiktokUrl', e.target.value)}
                  placeholder="https://tiktok.com/@outilsreparationgsm"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label htmlFor="settings-youtube" className="text-xs font-bold text-slate-700 block mb-1.5">
                  Chaîne YouTube
                </label>
                <input
                  id="settings-youtube"
                  type="url"
                  value={formData.youtubeUrl}
                  onChange={(e) => handleChange('youtubeUrl', e.target.value)}
                  placeholder="https://youtube.com/@outilsreparationgsm"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: SHIPPING & CURRENCY */}
        {activeSection === 'shipping' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Truck className="w-4 h-4 text-orange-600" />
              <span>Frais de Livraison & Paramètres Comptables</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label htmlFor="settings-shipping-fee" className="text-xs font-bold text-slate-700 block mb-1.5">
                  Frais de livraison standard (TND) *
                </label>
                <input
                  id="settings-shipping-fee"
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.defaultShippingTND}
                  onChange={(e) => handleChange('defaultShippingTND', e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 font-mono font-bold"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Frais appliqués selon la configuration actuelle de la boutique.
                </p>
              </div>

              <div>
                <label htmlFor="settings-free-shipping-threshold" className="text-xs font-bold text-slate-700 block mb-1.5">
                  Seuil pour Livraison Gratuite (TND) *
                </label>
                <input
                  id="settings-free-shipping-threshold"
                  type="number"
                  step="1"
                  min="0"
                  value={formData.freeShippingThresholdTND}
                  onChange={(e) => handleChange('freeShippingThresholdTND', e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 font-mono font-bold text-emerald-700"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Les commandes dépassant ce montant bénéficient de la livraison gratuite.
                </p>
              </div>

              <div>
                <label htmlFor="settings-currency" className="text-xs font-bold text-slate-700 block mb-1.5">
                  Symbole de la monnaie
                </label>
                <input
                  id="settings-currency"
                  type="text"
                  value={formData.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  placeholder="DT"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 font-bold"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Par défaut : DT (Dinar Tunisien).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 5: HERO CMS */}
        {activeSection === 'hero' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Layout className="w-4 h-4 text-orange-600" />
              <span>Contenu de la Bannière d'Accueil (Hero Section)</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="settings-hero-title" className="text-xs font-bold text-slate-700 block mb-1.5">
                  Titre Principal du Hero *
                </label>
                <input
                  id="settings-hero-title"
                  type="text"
                  value={formData.heroTitle}
                  onChange={(e) => handleChange('heroTitle', e.target.value)}
                  placeholder="معدات وأدوات صيانة الهواتف الذكية للمحترفين"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label htmlFor="settings-hero-subtitle" className="text-xs font-bold text-slate-700 block mb-1.5">
                  Sous-titre / Texte explicatif
                </label>
                <textarea
                  id="settings-hero-subtitle"
                  rows={3}
                  value={formData.heroSubtitle}
                  onChange={(e) => handleChange('heroSubtitle', e.target.value)}
                  placeholder="محطات لحام دقيقة، ميكروسكوبات ثلاثية العيون، مبرمجات سوفتوير..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="settings-hero-button-text" className="text-xs font-bold text-slate-700 block mb-1.5">
                    Texte du Bouton d'action principal
                  </label>
                  <input
                    id="settings-hero-button-text"
                    type="text"
                    value={formData.heroButtonText}
                    onChange={(e) => handleChange('heroButtonText', e.target.value)}
                    placeholder="عرض جميع المنتجات"
                    className="w-full text-xs p-3 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label htmlFor="settings-hero-button-link" className="text-xs font-bold text-slate-700 block mb-1.5">
                    Lien cible du Bouton (Route interne)
                  </label>
                  <input
                    id="settings-hero-button-link"
                    type="text"
                    value={formData.heroButtonLink}
                    onChange={(e) => handleChange('heroButtonLink', e.target.value)}
                    placeholder="products"
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              {/* Hero Image Box */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 pt-4">
                <span className="text-xs font-bold text-slate-800 block">Image d'illustration du Hero</span>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-300 bg-white p-1 flex-shrink-0 shadow-xs">
                    <img
                      src={formData.heroImage?.trim() || '/logo.jpg'}
                      alt="Hero Preview"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        if (e.currentTarget.src !== '/logo.jpg') e.currentTarget.src = '/logo.jpg';
                      }}
                    />
                  </div>
                  <div className="space-y-2 flex-1">
                    <input
                      type="file"
                      aria-label="Téléverser une image Hero"
                      ref={heroInputRef}
                      onChange={handleUploadHeroImage}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => heroInputRef.current?.click()}
                      disabled={isUploadingHero}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 transition"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingHero ? 'Téléversement...' : 'Téléverser une image Hero'}</span>
                    </button>
                    <label htmlFor="settings-hero-image-url" className="sr-only">URL de l’image Hero</label>
                    <input
                      id="settings-hero-image-url"
                      type="text"
                      value={formData.heroImage}
                      onChange={(e) => handleChange('heroImage', e.target.value)}
                      placeholder="/logo.jpg ou URL"
                      className="w-full text-[11px] font-mono p-2 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Save Button Bar */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSaving || !hasUnsavedChanges}
            className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-bold text-xs transition shadow-md ${
              isSaving
                ? 'bg-slate-400 text-white cursor-wait'
                : hasUnsavedChanges
                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Enregistrement en cours...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Enregistrer toutes les modifications</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

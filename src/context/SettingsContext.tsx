import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { StoreSettings } from '../types';
import { api } from '../services/api';

const DEFAULT_SETTINGS: StoreSettings = {
  id: 'default',
  storeName: 'Outils Réparation GSM Tunisie',
  storeDescription: 'N°1 en Outillage & Équipements de Réparation Smartphone en Tunisie. Stations de soudure, microscopes, programmeurs et pièces détachées.',
  logoUrl: '/logo.jpg',
  faviconUrl: '/logo.jpg',
  phone: '+216 26 383 876',
  whatsapp: '+216 26 383 876',
  email: 'contact@reparation-gsm.tn',
  address: 'Tunis,tunis',
  facebookUrl: 'https://facebook.com/outils.reparation.gsm',
  instagramUrl: 'https://instagram.com/outils.reparation.gsm',
  tiktokUrl: 'https://tiktok.com/@outilsreparationgsm',
  youtubeUrl: 'https://youtube.com/@outilsreparationgsm',
  workingHours: 'Mar - Dim: 08:00 - 18:00 | Lundi: Fermé',
  defaultShippingTND: 7.0,
  freeShippingThresholdTND: 300.0,
  currency: 'DT',
  primaryColor: '#ea580c',
  secondaryColor: '#0f172a',
  heroTitle: 'معدات وأدوات صيانة الهواتف الذكية للمحترفين',
  heroSubtitle: 'محطات لحام دقيقة، ميكروسكوبات ثلاثية العيون، مبرمجات سوفتوير، ومزودات طاقة أصلية مع توصيل سريع 24/48 ساعة وضمان حقيقي.',
  heroButtonText: 'عرض جميع المنتجات',
  heroButtonLink: 'products',
  heroImage: '/logo.jpg',
};

interface SettingsContextType {
  settings: StoreSettings;
  isLoadingSettings: boolean;
  refetchSettings: () => Promise<void>;
  updateSettings: (data: Partial<StoreSettings>) => Promise<StoreSettings>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [isLoadingSettings, setIsLoadingSettings] = useState<boolean>(true);

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoadingSettings(true);
      const res = await api.settings.get();
      if (res?.data) {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...res.data,
        });
      }
    } catch (err) {
      console.warn('Using default store settings fallback:', err);
    } finally {
      setIsLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Sync document title, meta description, and favicon dynamically
  useEffect(() => {
    if (settings.storeName) {
      document.title = `${settings.storeName} | Matériel & Outillage GSM Tunisie`;
    }

    if (settings.storeDescription) {
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', settings.storeDescription);
      }
    }

    if (settings.faviconUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = settings.faviconUrl;
    }
  }, [settings.storeName, settings.storeDescription, settings.faviconUrl]);

  const updateSettings = async (data: Partial<StoreSettings>): Promise<StoreSettings> => {
    const res = await api.settings.update(data);
    if (res?.data) {
      const merged = { ...settings, ...res.data };
      setSettings(merged);
      return merged;
    }
    throw new Error(res?.message || 'Erreur lors de la mise à jour des paramètres.');
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoadingSettings,
        refetchSettings: fetchSettings,
        updateSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useStoreSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useStoreSettings must be used within a SettingsProvider');
  }
  return context;
};

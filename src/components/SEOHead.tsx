import { useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { setMetaContent } from '../utils/seo';

export const SEOHead = () => {
  const { currentRoute, routeParams, settings, categories, getLocalizedName, language } = useStore();

  useEffect(() => {
    const category = currentRoute === 'category'
      ? categories.find((item) => item.slug === routeParams.categorySlug)
      : undefined;
    const sectionName = category
      ? getLocalizedName(category)
      : currentRoute === 'products' || currentRoute === 'search'
        ? language === 'ar' ? 'المنتجات' : 'Catalogue'
        : currentRoute === 'track-order'
          ? language === 'ar' ? 'تتبع الطلب' : 'Suivi de commande'
          : currentRoute === 'profile'
            ? language === 'ar' ? 'حسابي' : 'Mon compte'
            : '';
    const title = sectionName
      ? `${sectionName} | ${settings.storeName}`
      : `${settings.storeName} | Matériel & Outillage GSM Tunisie`;
    const description = category
      ? `${getLocalizedName(category)} — ${settings.storeName}`
      : settings.storeDescription;

    document.title = title;
    setMetaContent('meta[name="description"]', 'name', 'description', description);
    setMetaContent('meta[property="og:title"]', 'property', 'og:title', title);
    setMetaContent('meta[property="og:description"]', 'property', 'og:description', description);
    setMetaContent('meta[property="og:type"]', 'property', 'og:type', 'website');
    setMetaContent('meta[property="og:url"]', 'property', 'og:url', window.location.href);
  }, [currentRoute, routeParams.categorySlug, categories, settings.storeName, settings.storeDescription, getLocalizedName, language]);

  return null;
};

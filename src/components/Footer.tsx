import React from 'react';
import { Mail, MapPin, MessageCircle, Phone, Truck } from 'lucide-react';
import { useStoreRouting, useStoreSettings } from '../context/StoreSlices';
import { whatsappLink } from '../lib/whatsapp';

export const Footer: React.FC = () => {
  const { language, settings, formatPrice } = useStoreSettings();
  const { navigateTo } = useStoreRouting();
  const phone = settings.phone?.trim() || '';
  const email = settings.email?.trim() || '';
  const whatsappNumber = settings.whatsappNumber || settings.whatsapp || phone;
  const whatsappUrl = whatsappNumber ? whatsappLink(whatsappNumber) : '';
  const storeName = settings.storeName || 'Outils Réparation GSM Tunisie';

  return (
    <footer className="mt-auto bg-[#0F1B2D] text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-9 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.3fr_1fr_1fr] lg:px-8">
        <div>
          <p className="text-lg font-black tracking-tight">{storeName}</p>
          <p className="mt-2 max-w-sm text-xs leading-6 text-white/60">
            {settings.storeDescription || (language === 'ar'
              ? 'أدوات ومعدات احترافية لصيانة الهواتف في تونس.'
              : language === 'en'
                ? 'Professional tools and equipment for phone repair in Tunisia.'
                : 'Outillage et équipements professionnels pour la réparation GSM en Tunisie.')}
          </p>
        </div>

        <nav aria-label={language === 'ar' ? 'روابط المتجر' : language === 'en' ? 'Store links' : 'Navigation'}>
          <h2 className="text-sm font-bold">{language === 'ar' ? 'روابط سريعة' : language === 'en' ? 'Quick links' : 'Navigation'}</h2>
          <div className="mt-3 flex flex-col items-start gap-2.5 text-xs text-white/70">
            <button type="button" onClick={() => navigateTo('products')} className="hover:text-white">
              {language === 'ar' ? 'كل المنتجات' : language === 'en' ? 'All products' : 'Tous les produits'}
            </button>
            <button type="button" onClick={() => navigateTo('track-order')} className="hover:text-white">
              {language === 'ar' ? 'تتبع طلبي' : language === 'en' ? 'Track my order' : 'Suivre ma commande'}
            </button>
            <button type="button" onClick={() => navigateTo('login')} className="hover:text-white">
              {language === 'ar' ? 'حسابي' : language === 'en' ? 'My account' : 'Mon compte'}
            </button>
          </div>
        </nav>

        <div>
          <h2 className="text-sm font-bold">{language === 'ar' ? 'خدمة العملاء' : language === 'en' ? 'Customer service' : 'Service client'}</h2>
          <div className="mt-3 space-y-2.5 text-xs text-white/70">
            <p className="flex items-center gap-2">
              <Truck className="h-4 w-4 shrink-0 text-orange-300" />
              {language === 'ar'
                ? 'توصيل 24/48 ساعة'
                : language === 'en'
                  ? `Delivery in 24/48h · ${formatPrice(settings.defaultShippingTND)}`
                  : `Livraison 24/48h · ${formatPrice(settings.defaultShippingTND)}`}
            </p>
            {phone && (
              <a href={`tel:${phone.replace(/[\s\-().]/g, '')}`} className="flex items-center gap-2 hover:text-white">
                <Phone className="h-4 w-4 shrink-0 text-orange-300" />
                {phone}
              </a>
            )}
            {email && (
              <a href={`mailto:${email}`} className="flex items-center gap-2 break-all hover:text-white">
                <Mail className="h-4 w-4 shrink-0 text-orange-300" />
                {email}
              </a>
            )}
            {settings.address && (
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-orange-300" />
                {settings.address}
              </p>
            )}
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-emerald-300 hover:text-emerald-200">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-[11px] text-white/45">
        © {new Date().getFullYear()} {storeName}. {language === 'ar' ? 'جميع الحقوق محفوظة.' : language === 'en' ? 'All rights reserved.' : 'Tous droits réservés.'}
      </div>
    </footer>
  );
};

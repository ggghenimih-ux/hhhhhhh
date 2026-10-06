import React from 'react';
import { useStore } from '../context/StoreContext';
import { Phone, MapPin, Truck, ShieldCheck, Mail, Clock, MessageCircle } from 'lucide-react';
import { Logo } from './Logo';

export const Footer: React.FC = () => {
  const { language, navigateTo, setIsTrackOrderModalOpen, setIsAuthModalOpen, settings } = useStore();

  const phone = settings?.phone || '+216 26 383 876';
  const whatsapp = settings?.whatsapp || '+216 26 383 876';
  const email = settings?.email || 'contact@reparation-gsm.tn';
  const address = settings?.address || 'Tunis,tunis';
  const workingHours = settings?.workingHours || 'Mar - Dim: 08:00 - 18:00 | Lundi: Fermé';
  const storeName = settings?.storeName || 'Outils Réparation GSM Tunisie';
  const storeDesc = settings?.storeDescription || 'Spécialiste de la vente d’outillage professionnel, stations de soudure, microscopes et pièces détachées pour ateliers GSM en Tunisie.';

  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  const cleanWhatsapp = whatsapp.replace(/[\s\-\(\)\+]/g, '');

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 text-xs mt-auto">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: Brand & Tagline */}
          <div className="space-y-3">
            <div className="bg-white p-2 rounded-xl inline-block">
              <Logo size="md" showTagline={false} />
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              {storeDesc}
            </p>
            <div className="flex items-center gap-2 pt-1 text-slate-400 text-[11px]">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{language === 'ar' ? 'معدات أصلية ومختبرة 100%' : '100% Produits Authentiques'}</span>
            </div>

            {/* Social Links */}
            {(settings?.facebookUrl || settings?.instagramUrl || settings?.tiktokUrl || settings?.youtubeUrl) && (
              <div className="flex items-center gap-3 pt-2">
                {settings.facebookUrl && (
                  <a
                    href={settings.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white flex items-center justify-center transition text-xs font-bold"
                    title="Facebook"
                  >
                    FB
                  </a>
                )}
                {settings.instagramUrl && (
                  <a
                    href={settings.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-pink-600 text-slate-300 hover:text-white flex items-center justify-center transition text-xs font-bold"
                    title="Instagram"
                  >
                    IG
                  </a>
                )}
                {settings.tiktokUrl && (
                  <a
                    href={settings.tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-black text-slate-300 hover:text-white flex items-center justify-center transition text-xs font-bold border border-slate-700"
                    title="TikTok"
                  >
                    TK
                  </a>
                )}
                {settings.youtubeUrl && (
                  <a
                    href={settings.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white flex items-center justify-center transition text-xs font-bold"
                    title="YouTube"
                  >
                    YT
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Column 2: Quick Store Links */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm">
              {language === 'ar' ? 'روابط سريعة' : 'Navigation'}
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('home')}
                  className="hover:text-white transition"
                >
                  {language === 'ar' ? 'الصفحة الرئيسية' : 'Accueil'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('products')}
                  className="hover:text-white transition"
                >
                  {language === 'ar' ? 'جميع المنتجات (الكتالوج)' : 'Catalogue complet'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setIsTrackOrderModalOpen(true)}
                  className="hover:text-white transition"
                >
                  {language === 'ar' ? 'تتبع طلبيتك' : 'Suivre ma commande'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="hover:text-white transition"
                >
                  {language === 'ar' ? 'حسابي / تسجيل الدخول' : 'Mon Compte / Connexion'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('admin-login')}
                  className="hover:text-orange-400 text-slate-500 transition text-[11px] flex items-center gap-1 pt-1"
                >
                  <span>🔒 {language === 'ar' ? 'فضاء الإدارة (Admin)' : 'Espace Administrateur'}</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact & Hotline */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm">
              {language === 'ar' ? 'خدمة العملاء والاتصال' : 'Service Client & Commandes'}
            </h4>
            <ul className="space-y-2.5 text-slate-400">
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                <div>
                  <a href={`tel:${cleanPhone}`} className="hover:text-white font-mono block font-semibold text-slate-200">
                    {phone}
                  </a>
                </div>
              </li>
              {whatsapp && (
                <li className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <a
                    href={`https://wa.me/${cleanWhatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-emerald-300 font-mono text-emerald-400"
                  >
                    WhatsApp: {whatsapp}
                  </a>
                </li>
              )}
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                <span>{address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-orange-400 flex-shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-white truncate">
                  {email}
                </a>
              </li>
              <li className="flex items-center gap-2 text-[11px] text-slate-400">
                <Clock className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                <span>{workingHours}</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Payment & Delivery Badges */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm">
              {language === 'ar' ? 'الشحن والدفع' : 'Livraison & Paiement'}
            </h4>
            <div className="space-y-2 text-slate-400 text-xs">
              <div className="flex items-center gap-2 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
                <Truck className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <div>
                  <span className="block font-medium text-slate-200">
                    {language === 'ar' ? `توصيل: ${settings?.defaultShippingTND ?? 7} DT` : `Livraison: ${settings?.defaultShippingTND ?? 7} DT`}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {language === 'ar'
                      ? `مجاني ابتداءً من ${settings?.freeShippingThresholdTND ?? 300} DT`
                      : `Gratuite dès ${settings?.freeShippingThresholdTND ?? 300} DT d'achats`}
                  </span>
                </div>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
                <span className="font-semibold text-slate-200 block mb-0.5">
                  {language === 'ar' ? 'الدفع عند الاستلام' : 'Paiement à la livraison'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {language === 'ar' ? 'نقداً بالدينار التونسي (DT) بعد المعاينة' : 'Espèces (TND) ou D17 à réception'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright */}
        <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
          <p>
            © {new Date().getFullYear()} {storeName}. {language === 'ar' ? 'جميع الحقوق محفوظة.' : 'Tous droits réservés.'}
          </p>
          <p className="flex items-center gap-1">
            <span>{language === 'ar' ? 'خدمة فنيي ومحترفي الصيانة في تونس 🇹🇳' : 'Pour les professionnels de la réparation GSM en Tunisie 🇹🇳'}</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

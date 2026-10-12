import React from 'react';
import { useStore } from '../context/StoreContext';
import { ArrowRight, Wrench, ShieldCheck, Truck } from 'lucide-react';

export const Hero: React.FC = () => {
  const { language, navigateTo, settings } = useStore();

  const title = settings?.heroTitle || (language === 'ar' ? 'معدات وأدوات صيانة الهواتف الذكية للمحترفين' : 'Outillage & Équipements Professionnels GSM en Tunisie');
  const subtitle = settings?.heroSubtitle || (language === 'ar' ? 'محطات لحام دقيقة، ميكروسكوبات ثلاثية العيون، مبرمجات سوفتوير، ومزودات طاقة أصلية مع توصيل سريع 24/48 ساعة وضمان حقيقي.' : 'Stations de soudure haute précision, microscopes trinoculaires, programmeurs JCID et pièces certifiées avec livraison rapide.');
  const buttonText = settings?.heroButtonText || (language === 'ar' ? 'عرض جميع المنتجات' : 'Voir tout le catalogue');
  const buttonLink = settings?.heroButtonLink || 'products';
  const logoOrHeroImg = settings?.heroImage?.trim() || settings?.logoUrl?.trim() || '/logo.jpg';
  const storeName = settings?.storeName || 'Outils Réparation GSM Tunisie';

  return (
    <section className="bg-slate-100/70 border-b border-slate-200">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Main Title & Content (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-orange-700">
              <Wrench className="w-3.5 h-3.5" />
              <span>
                {language === 'ar'
                  ? 'المرجع الأول لورشات ومخابر الصيانة الإلكترونية في تونس 🇹🇳'
                  : 'N°1 en Équipements de Réparation Smartphone en Tunisie 🇹🇳'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {title}
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
              {subtitle}
            </p>

            {/* Buttons (Primary + max 1 Secondary) */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigateTo(buttonLink as any || 'products')}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold transition shadow-xs"
              >
                <span>{buttonText}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => navigateTo('track-order')}
                className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-lg border border-slate-300 hover:bg-white text-slate-700 text-sm font-medium transition"
              >
                <span>{language === 'ar' ? 'تتبع طلبيتك' : 'Suivre ma commande'}</span>
              </button>
            </div>
          </div>

          {/* Clean Visual Showcase (5 cols on lg) */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-50 border border-slate-200 p-0.5 flex-shrink-0">
                  <img
                    src={logoOrHeroImg}
                    alt={storeName}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      if (e.currentTarget.src !== '/logo.jpg') {
                        e.currentTarget.src = '/logo.jpg';
                      }
                    }}
                  />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {storeName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {language === 'ar' ? 'متجر الأدوات والمعدات المعتمدة في تونس' : 'Boutique Certifiée GSM Tunisie'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="flex items-center gap-1.5 font-bold text-slate-900 mb-0.5">
                    <Truck className="w-3.5 h-3.5 text-orange-600" />
                    <span>{language === 'ar' ? 'توصيل 24/48h' : 'Livraison 24/48h'}</span>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {language === 'ar' ? `شحن ${settings?.defaultShippingTND ?? 7} DT` : `Frais: ${settings?.defaultShippingTND ?? 7} DT`}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="flex items-center gap-1.5 font-bold text-slate-900 mb-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{language === 'ar' ? 'ضمان حقيقي' : 'Garantie Réelle'}</span>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {language === 'ar' ? 'منتجات أصلية مختبرة' : 'Produits 100% testés'}
                  </span>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between text-xs text-slate-500">
                <span>{language === 'ar' ? 'الدفع نقداً عند الاستلام' : 'Paiement en espèces à la livraison'}</span>
                <span className="font-semibold text-slate-700">Tunis · Sousse · Sfax</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

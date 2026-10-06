import React from 'react';
import { useStore } from '../context/StoreContext';
import { Truck, CheckCircle2, ShieldCheck, Headphones } from 'lucide-react';

export const TrustBar: React.FC = () => {
  const { language } = useStore();

  const trustItems = [
    {
      icon: Truck,
      title: language === 'ar' ? 'توصيل داخل تونس' : 'Livraison Tunisie 24/48h',
      desc: language === 'ar' ? 'شحن سريع لكافة الـ 24 ولاية' : 'Sur tous les gouvernorats',
    },
    {
      icon: CheckCircle2,
      title: language === 'ar' ? 'دفع عند الاستلام' : 'Paiement à la Livraison',
      desc: language === 'ar' ? 'ادفع بعد معاينة وفحص الطرد' : 'Réglez en espèces au livreur',
    },
    {
      icon: ShieldCheck,
      title: language === 'ar' ? 'منتجات أصلية 100%' : 'Matériel Testé & Certifié',
      desc: language === 'ar' ? 'معدات صيانة معتمدة مع ضمان' : 'Qualité professionnelle garantie',
    },
    {
      icon: Headphones,
      title: language === 'ar' ? 'دعم فني واستشارة' : 'Support Technique GSM',
      desc: language === 'ar' ? 'مساعدة الفنيين وأصحاب الورشات' : 'Conseils et assistance d’experts',
    },
  ];

  return (
    <section className="bg-slate-50 border-y border-slate-200 py-6 sm:py-8 my-8">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-4">
          {trustItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-3.5 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs"
              >
                <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight truncate">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

import React from 'react';
import { ProductListing } from '../components/ProductListing';
import { useStore } from '../context/StoreContext';
import { Wrench } from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const { t, language } = useStore();

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 mb-4">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
          <span>{t.home}</span>
          <span>/</span>
          <span className="text-slate-900 font-bold">{t.shop}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Wrench className="w-6 h-6 text-orange-600" />
              <span>{language === 'ar' ? 'كتالوج معدات وقطع غيار GSM' : 'Catalogue Outillage & Matériel GSM'}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {language === 'ar'
                ? 'استعرض جميع المعدات المتوفرة في المخزن التونسي مع الأسعار الرسمية والضمان'
                : 'Tous les équipements en stock en Tunisie avec tarifs en Dinar Tunisien et garantie'}
            </p>
          </div>
        </div>
      </div>

      <ProductListing />
    </div>
  );
};

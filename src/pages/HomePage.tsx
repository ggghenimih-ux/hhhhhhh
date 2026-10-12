import React from 'react';
import { useStore } from '../context/StoreContext';
import { Hero } from '../components/Hero';
import { CategoryCard } from '../components/CategoryCard';
import { ProductGrid } from '../components/ProductGrid';
import { TrustBar } from '../components/TrustBar';
import { ArrowRight, Package } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { language, products, categories, getLocalizedName, isLoadingProducts, navigateTo } = useStore();
  const homeCategories = categories.slice(0, 6);

  // Select top featured products for home
  const featuredProducts = products
    .filter((p) => p.isFeatured || p.isNew || p.rating >= 4.7)
    .slice(0, 8);

  return (
    <div className="space-y-10 sm:space-y-12 pb-12">
      {/* 1. Hero Section (صغير ومنظم) */}
      <Hero />

      {/* 2. Category Section (قسم التصنيفات: 4 إلى 6 تصنيفات فقط، بطاقات متساوية) */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              {language === 'ar' ? 'تصفح حسب التصنيف' : 'Rayons Principaux'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'ar'
                ? 'اختر القسم للوصول السريع إلى الأدوات وقطع الغيار'
                : 'Accédez rapidement aux équipements spécialisés'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigateTo('products')}
            className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
          >
            <span>{language === 'ar' ? 'عرض الكل' : 'Tout afficher'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {homeCategories.map((category) => (
            <CategoryCard
              key={category.id}
              id={category.slug}
              name={getLocalizedName(category)}
              icon={Package}
            />
          ))}
        </div>
      </section>

      {/* 3. Featured Products Section (قسم المنتجات المميزة) */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              {language === 'ar' ? 'المعدات الأكثر طلباً' : 'Équipements Recommandés'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'ar'
                ? 'أجهزة ومعدات صيانة معتمدة ومتوفرة في المخزن التونسي'
                : 'Sélection des meilleurs outils testés pour ateliers GSM'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigateTo('products')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700 transition"
          >
            <span>{language === 'ar' ? 'عرض الكتالوج كاملاً' : 'Voir tout le catalogue'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <ProductGrid
          products={featuredProducts.length > 0 ? featuredProducts : products.slice(0, 8)}
          isLoading={isLoadingProducts}
        />
      </section>

      {/* 4. Trust Bar (شريط ثقة بسيط) */}
      <TrustBar />
    </div>
  );
};

import React from 'react';
import { useStore } from '../context/StoreContext';
import { Hero } from '../components/Hero';
import { CategoryCard } from '../components/CategoryCard';
import { ProductGrid } from '../components/ProductGrid';
import { TrustBar } from '../components/TrustBar';
import {
  Wrench,
  Flame,
  Eye,
  Zap,
  Cpu,
  Smartphone,
  ArrowRight
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { language, products, isLoadingProducts, navigateTo } = useStore();

  // 6 Core categories for the homepage category section
  const homeCategories = [
    {
      id: 'soldering-hot-air',
      name: language === 'ar' ? 'لحام وهواء ساخن' : 'Soudure & Air Chaud',
      icon: Flame,
      count: products.filter((p) => p.category === 'soldering-hot-air' || (p as any).categoryId === 'soldering-hot-air').length || 18,
    },
    {
      id: 'microscopes',
      name: language === 'ar' ? 'ميكروسكوبات' : 'Microscopes & Optique',
      icon: Eye,
      count: products.filter((p) => p.category === 'microscopes' || (p as any).categoryId === 'microscopes').length || 12,
    },
    {
      id: 'equipments-tools',
      name: language === 'ar' ? 'معدات وأدوات' : 'Outils & Équipements',
      icon: Wrench,
      count: products.filter((p) => p.category === 'equipments-tools' || (p as any).categoryId === 'equipments-tools').length || 24,
    },
    {
      id: 'power-supplies',
      name: language === 'ar' ? 'مزودات طاقة' : 'Alimentation & Test',
      icon: Zap,
      count: products.filter((p) => p.category === 'power-supplies' || (p as any).categoryId === 'power-supplies').length || 9,
    },
    {
      id: 'programmers',
      name: language === 'ar' ? 'مبرمجات وبوكسات' : 'Programmeurs & Dongles',
      icon: Cpu,
      count: products.filter((p) => p.category === 'programmers' || (p as any).categoryId === 'programmers').length || 15,
    },
    {
      id: 'spare-parts',
      name: language === 'ar' ? 'قطع غيار' : 'Pièces Détachées',
      icon: Smartphone,
      count: products.filter((p) => p.category === 'spare-parts' || (p as any).categoryId === 'spare-parts').length || 42,
    },
  ];

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
          {homeCategories.map((cat) => (
            <CategoryCard
              key={cat.id}
              id={cat.id}
              name={cat.name}
              icon={cat.icon}
              count={cat.count}
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

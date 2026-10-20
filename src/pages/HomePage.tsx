import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  CircuitBoard,
  Cpu,
  Package,
  Plus,
  Smartphone,
  Wrench,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useStoreCart, useStoreProducts, useStoreRouting, useStoreSettings } from '../context/StoreSlices';
import { api } from '../services/api';
import { Product } from '../types';
import { whatsappLink } from '../lib/whatsapp';
import { Hero } from '../components/Hero';
import { TrustBar } from '../components/TrustBar';

type HomeData = {
  products: Product[];
  categoryCounts: Record<string, number>;
};

const categoryIcons: Record<string, LucideIcon> = {
  package: Package,
  tools: Wrench,
  wrench: Wrench,
  phone: Smartphone,
  smartphone: Smartphone,
  circuitboard: CircuitBoard,
  circuit: CircuitBoard,
  cpu: Cpu,
  zap: Zap,
};

type NewProductCardProps = {
  product: Product;
  categoryName: string;
  name: string;
  priceLabel: string;
  outOfStock: boolean;
  newLabel: string;
  outOfStockLabel: string;
  addToCartLabel: string;
  onOpen: () => void;
  onAdd: () => void;
};

const NewProductCard: React.FC<NewProductCardProps> = ({
  product,
  categoryName,
  name,
  priceLabel,
  outOfStock,
  newLabel,
  outOfStockLabel,
  addToCartLabel,
  onOpen,
  onAdd,
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const image = product.images?.find((value) => typeof value === 'string' && value.trim()) || product.image;

  return (
    <article className="group min-w-0 overflow-hidden rounded-2xl border border-[#E3E8F0] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <button type="button" onClick={onOpen} className="relative block aspect-square w-full overflow-hidden bg-[#F3F5F9] text-left">
        {image && !imageFailed ? (
          <img
            src={image}
            alt={name}
            loading="lazy"
            decoding="async"
            width={360}
            height={360}
            onError={() => setImageFailed(true)}
            className="h-full w-full object-contain p-4 transition duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[#0F1B2D]/35">
            <Package className="h-16 w-16 stroke-[1.2]" />
            <span className="sr-only">{name}</span>
          </span>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-[#D63F06] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white">
          {newLabel}
        </span>
        {outOfStock && (
          <span className="absolute bottom-3 left-3 rounded-full bg-[#0F1B2D]/90 px-2.5 py-1 text-[10px] font-bold text-white">
            {outOfStockLabel}
          </span>
        )}
      </button>
      <div className="p-3.5 sm:p-4">
        <p className="truncate text-[10px] font-bold uppercase tracking-wide text-[#5B6B82]">{categoryName}</p>
        <button type="button" onClick={onOpen} className="mt-1.5 block min-h-10 w-full text-left text-sm font-bold leading-5 text-[#0F1B2D] hover:text-[#D63F06]">
          <span className="line-clamp-2">{name}</span>
        </button>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="truncate text-sm font-black text-[#0F1B2D]">
            {priceLabel}
          </span>
          <button
            type="button"
            onClick={onAdd}
            disabled={outOfStock}
            aria-label={`${addToCartLabel} : ${name}`}
            title={outOfStock ? outOfStockLabel : addToCartLabel}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0F1B2D] text-white transition hover:bg-[#D63F06] disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
};

export const HomePage: React.FC = () => {
  const { language, settings, formatPrice, t } = useStoreSettings();
  const { categories, getLocalizedName, getProductPrice, setFilters, isLoadingCategories } = useStoreProducts();
  const { addToCart } = useStoreCart();
  const { navigateTo } = useStoreRouting();
  const [homeData, setHomeData] = useState<HomeData>({ products: [], categoryCounts: {} });
  const [isLoadingHome, setIsLoadingHome] = useState(true);
  const [homeError, setHomeError] = useState('');

  useEffect(() => {
    let active = true;
    api.products.getHomeData()
      .then((response) => {
        if (!response.data || !Array.isArray(response.data.products)) {
          throw new Error(response.message || 'Le catalogue de la page d’accueil est invalide.');
        }
        if (active) setHomeData(response.data as HomeData);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setHomeError(error instanceof Error ? error.message : 'Impossible de charger les produits de la page d’accueil.');
      })
      .finally(() => {
        if (active) setIsLoadingHome(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const activeCategories = categories.filter((category) => category.isActive !== false);
  const whatsappNumber = settings.whatsappNumber || settings.whatsapp || settings.phone;
  const whatsappUrl = whatsappNumber ? whatsappLink(whatsappNumber) : '';
  const labels = {
    categories: language === 'ar' ? 'تسوق حسب الفئة' : language === 'en' ? 'Shop by category' : 'Nos catégories',
    categorySubtitle: language === 'ar' ? 'كل ما يحتاجه ورشك في مكان واحد' : language === 'en' ? 'Everything your repair shop needs' : 'Tout le nécessaire pour votre atelier',
    newest: language === 'ar' ? 'وصل حديثاً' : language === 'en' ? 'New arrivals' : 'Nouveautés',
    newestSubtitle: language === 'ar' ? 'أحدث المنتجات المضافة إلى متجرنا' : language === 'en' ? 'The latest products added to our store' : 'Les derniers produits ajoutés à la boutique',
    allProducts: language === 'ar' ? 'كل المنتجات' : language === 'en' ? 'All products' : 'Tous les produits',
    advice: language === 'ar' ? 'تحتاج إلى نصيحة قبل الشراء؟' : language === 'en' ? 'Need advice before you buy?' : 'Besoin d’un conseil avant d’acheter ?',
    contact: language === 'ar' ? 'تحدث معنا عبر WhatsApp' : language === 'en' ? 'Talk to us on WhatsApp' : 'Nous contacter sur WhatsApp',
  };

  const openCategory = (slug: string) => {
    setFilters((previous) => ({ ...previous, category: slug, subcategory: null, searchQuery: '' }));
    navigateTo('category', { categorySlug: slug });
  };

  const openProduct = (product: Product) => {
    navigateTo('product-detail', { productSlug: product.slug, productId: product.id });
  };

  return (
    <div className="space-y-9 bg-[#F3F5F9] pb-12 pt-1 sm:space-y-12 sm:pb-16">
      <Hero products={homeData.products.slice(0, 5)} />

      {homeError && (
        <div role="alert" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {homeError}
          </p>
        </div>
      )}

      <TrustBar />

      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-black tracking-tight text-[#0F1B2D] sm:text-2xl">{labels.categories}</h2>
            <p className="mt-1 text-xs text-[#5B6B82] sm:text-sm">{labels.categorySubtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => navigateTo('products')}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-[#D63F06] hover:underline"
          >
            {labels.allProducts}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {isLoadingCategories ? (
          <div
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
            aria-label={language === 'ar' ? 'جارٍ تحميل الفئات' : language === 'en' ? 'Loading categories' : 'Chargement des catégories'}
          >
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="h-32 animate-pulse rounded-2xl border border-[#E3E8F0] bg-white" />
            ))}
          </div>
        ) : activeCategories.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-6">
            {activeCategories.map((category) => {
              const Icon = categoryIcons[(category.iconName || '').replace(/[^a-z]/gi, '').toLowerCase()] || Package;
              const count = homeData.categoryCounts[category.slug] ?? homeData.categoryCounts[category.id] ?? 0;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => openCategory(category.slug)}
                  className="group flex min-h-32 flex-col items-start justify-between rounded-2xl border border-[#E3E8F0] bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:border-[#0F1B2D]/20 hover:shadow-md sm:p-5"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0F1B2D] text-white transition group-hover:bg-[#D63F06]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="mt-4">
                    <span className="block line-clamp-1 text-sm font-extrabold text-[#0F1B2D]">
                      {getLocalizedName(category)}
                    </span>
                    <span className="mt-1 block text-[11px] text-[#5B6B82]">
                      {count}{' '}
                      {language === 'ar'
                        ? 'منتج'
                        : language === 'en'
                          ? count === 1 ? 'product' : 'products'
                          : count === 1 ? 'produit' : 'produits'}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="rounded-2xl border border-[#E3E8F0] bg-white p-6 text-sm text-[#5B6B82]">
            {language === 'ar'
              ? 'لا توجد فئات متاحة حالياً.'
              : language === 'en'
                ? 'No categories are available right now.'
                : 'Aucune catégorie disponible pour le moment.'}
          </p>
        )}
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-black tracking-tight text-[#0F1B2D] sm:text-2xl">{labels.newest}</h2>
            <p className="mt-1 text-xs text-[#5B6B82] sm:text-sm">{labels.newestSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => navigateTo('products')}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-[#D63F06] hover:underline"
          >
            {labels.allProducts}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {isLoadingHome ? (
          <div
            className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4"
            aria-label={language === 'ar' ? 'جارٍ تحميل المنتجات الجديدة' : language === 'en' ? 'Loading new arrivals' : 'Chargement des nouveautés'}
          >
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="aspect-[4/5] animate-pulse rounded-2xl border border-[#E3E8F0] bg-white" />
            ))}
          </div>
        ) : homeData.products.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {homeData.products.slice(0, 8).map((product) => {
              const category = activeCategories.find((item) => item.slug === product.category || item.id === product.category);
              const name = getLocalizedName(product);
              return (
                <NewProductCard
                  key={product.id}
                  product={product}
                  categoryName={category ? getLocalizedName(category) : ''}
                  name={name}
                  priceLabel={formatPrice(getProductPrice(product))}
                  outOfStock={product.isOutOfStock === true}
                  newLabel={t.newArrivals}
                  outOfStockLabel={t.outOfStock}
                  addToCartLabel={t.addToCart}
                  onOpen={() => openProduct(product)}
                  onAdd={() => addToCart(product)}
                />
              );
            })}
          </div>
        ) : (
          <p className="rounded-2xl border border-[#E3E8F0] bg-white p-6 text-sm text-[#5B6B82]">
            {language === 'ar'
              ? 'لا توجد منتجات متاحة حالياً.'
              : language === 'en'
                ? 'No products are available right now.'
                : 'Aucun produit disponible pour le moment.'}
          </p>
        )}
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-5 rounded-[26px] bg-[#0F1B2D] px-6 py-8 text-white sm:flex-row sm:items-center sm:px-10 sm:py-9">
          <div>
            <h2 className="text-xl font-black sm:text-2xl">{labels.advice}</h2>
            <p className="mt-2 text-sm text-white/65">
              {language === 'ar'
                ? 'فريقنا يساعدك في اختيار أدوات ورشتك.'
                : language === 'en'
                  ? 'Our team can help you choose the right tools for your workshop.'
                  : 'Notre équipe vous aide à choisir les outils adaptés à votre atelier.'}
            </p>
          </div>
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#1FA855] px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              <span>{labels.contact}</span>
              <ArrowRight className="h-4 w-4" />
            </a>
          ) : (
            <p className="rounded-xl bg-white/10 px-4 py-3 text-sm text-white/75">
              {language === 'ar'
                ? 'رقم WhatsApp غير مضبوط بعد.'
                : language === 'en'
                  ? 'The store WhatsApp number is not configured yet.'
                  : 'Le numéro WhatsApp du magasin n’est pas encore configuré.'}
            </p>
          )}
        </div>
      </section>
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Package, Sparkles } from 'lucide-react';
import { useStoreProducts, useStoreRouting, useStoreSettings } from '../context/StoreSlices';
import { Product } from '../types';

type HeroProps = {
  products: Product[];
};

const SlideImage: React.FC<{ product: Product; name: string }> = ({ product, name }) => {
  const [failed, setFailed] = useState(false);
  const image = product.images?.find((value) => typeof value === 'string' && value.trim()) || product.image;

  if (!image || failed) {
    return (
      <div className="flex h-full min-h-52 w-full items-center justify-center rounded-3xl bg-white/10 text-white/60">
        <Package className="h-20 w-20 stroke-[1.2]" aria-hidden="true" />
        <span className="sr-only">{name}</span>
      </div>
    );
  }

  return (
    <img
      src={image}
      alt={name}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="h-full min-h-52 w-full rounded-3xl object-contain drop-shadow-2xl"
    />
  );
};

export const Hero: React.FC<HeroProps> = ({ products }) => {
  const { language, formatPrice } = useStoreSettings();
  const { getLocalizedName, getLocalizedDesc, getProductPrice } = useStoreProducts();
  const { navigateTo } = useStoreRouting();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const resumeTouchTimer = useRef<number | null>(null);

  useEffect(() => {
    if (products.length < 2 || isPaused) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % products.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [products.length, isPaused]);

  useEffect(() => {
    setActiveIndex(0);
  }, [products.length]);

  useEffect(() => () => {
    if (resumeTouchTimer.current !== null) window.clearTimeout(resumeTouchTimer.current);
  }, []);

  const changeSlide = (index: number) => {
    setActiveIndex(index);
  };

  const touchStart = () => {
    if (resumeTouchTimer.current !== null) window.clearTimeout(resumeTouchTimer.current);
    setIsPaused(true);
  };

  const touchEnd = () => {
    resumeTouchTimer.current = window.setTimeout(() => setIsPaused(false), 4500);
  };

  if (products.length === 0) {
    return (
      <section className="mx-auto w-full max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
        <div className="flex min-h-[300px] items-center justify-center rounded-[28px] bg-gradient-to-br from-[#0F1B2D] to-[#1b3554] p-8 text-center text-white sm:min-h-[360px]">
          <div>
            <Sparkles className="mx-auto mb-4 h-8 w-8 text-orange-300" />
            <h1 className="text-2xl font-black sm:text-4xl">
              {language === 'ar' ? 'أدوات احترافية لصيانة الهواتف' : language === 'en' ? 'Professional phone repair tools' : 'L’outillage GSM pensé pour les pros'}
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-white/70">
              {language === 'ar'
                ? 'اكتشفوا منتجاتنا وأدواتنا المتخصصة.'
                : language === 'en'
                  ? 'Explore our specialist repair tools and equipment.'
                  : 'Découvrez notre sélection d’outils et d’équipements de réparation.'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  const product = products[activeIndex] ?? products[0];
  const name = getLocalizedName(product);
  const description = getLocalizedDesc(product);
  const slideLabel = language === 'ar' ? 'اختيار الورشة' : language === 'en' ? 'Workshop selection' : 'Sélection atelier';

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
      <div
        className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0F1B2D] via-[#14263f] to-[#1a3554] text-white shadow-xl shadow-[#0F1B2D]/10"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={touchStart}
        onTouchEnd={touchEnd}
        onTouchCancel={touchEnd}
        aria-roledescription="carousel"
        aria-label={language === 'ar' ? 'منتجات مميزة' : language === 'en' ? 'Featured products' : 'Produits à découvrir'}
      >
        <div className="pointer-events-none absolute -right-20 -top-32 h-80 w-80 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-8 -top-20 h-64 w-64 rounded-full border border-white/10" />
        <div className="grid min-h-[420px] grid-cols-1 items-center gap-5 px-6 py-8 sm:px-10 sm:py-10 lg:min-h-[430px] lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:px-14">
          <div key={product.id} className="relative z-10 animate-in fade-in duration-500">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-orange-200">
              <Sparkles className="h-3.5 w-3.5" />
              {slideLabel}
            </span>
            <h1 className="mt-5 max-w-2xl text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              {name || (language === 'ar'
                ? 'أدوات احترافية لصيانة الهواتف'
                : language === 'en'
                  ? 'Essential tools for your workshop'
                  : 'Les outils essentiels de votre atelier')}
            </h1>
            <p className="mt-4 line-clamp-3 max-w-xl text-sm leading-7 text-white/70 sm:text-base">
              {description || (language === 'ar'
                ? 'معدات وأدوات مختارة لمهنيي صيانة الهواتف الذكية.'
                : language === 'en'
                  ? 'Equipment selected for professional smartphone repair workshops.'
                  : 'Des équipements sélectionnés pour les ateliers de réparation smartphone.')}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => navigateTo('product-detail', { productSlug: product.slug, productId: product.id })}
                className="inline-flex items-center gap-2 rounded-xl bg-[#D63F06] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-black/15 transition hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                {language === 'ar' ? 'اكتشف المنتج' : language === 'en' ? 'View product' : 'Voir le produit'}
                <ArrowRight className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold text-white/85">
                {language === 'ar' ? 'ابتداءً من' : language === 'en' ? 'From' : 'Dès'}{' '}
                <strong className="text-lg text-white">{formatPrice(getProductPrice(product))}</strong>
              </span>
            </div>
          </div>

          <div key={`${product.id}-image`} className="relative mx-auto h-52 w-full max-w-md animate-in fade-in duration-500 sm:h-64 lg:h-80">
            <div className="absolute inset-5 rounded-full bg-orange-400/10 blur-3xl" />
            <SlideImage product={product} name={name} />
          </div>
        </div>

        {products.length > 1 && (
          <div
            className="absolute inset-x-0 bottom-4 z-20 flex items-center justify-center gap-2"
            role="group"
            aria-label={language === 'ar' ? 'التنقل بين المنتجات' : language === 'en' ? 'Product navigation' : 'Navigation des produits'}
          >
            {products.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => changeSlide(index)}
                aria-label={`${language === 'ar' ? 'المنتج' : language === 'en' ? 'Product' : 'Produit'} ${index + 1}`}
                aria-current={index === activeIndex ? 'true' : undefined}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === activeIndex ? 'w-8 bg-[#D63F06]' : 'w-2 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Hero;

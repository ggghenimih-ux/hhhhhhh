import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Product, Review } from '../types';
import { getSafeImageUrl, handleImageError } from '../utils/image';
import { setMetaContent, setProductStructuredData } from '../utils/seo';
import {
  Star,
  ShoppingCart,
  Heart,
  Truck,
  Phone,
  Minus,
  Plus,
  Send,
  Share2,
  ChevronRight,
  ArrowLeft,
  Edit2,
  Trash2,
} from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { user } = useAuth();
  const {
    t,
    language,
    formatPrice,
    getProductPrice,
    getLocalizedName,
    getLocalizedDesc,
    routeParams,
    navigateTo,
    addToCart,
    toggleWishlist,
    isInWishlist,
    products,
    showToast,
    settings,
  } = useStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'specs' | 'desc' | 'reviews'>('specs');

  // Review form
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerRating, setReviewerRating] = useState(5);
  const [reviewerComment, setReviewerComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (!product) return;
    const name = getLocalizedName(product);
    const description = getLocalizedDesc(product);
    const image = getSafeImageUrl(product.image);
    const title = `${name} | ${settings.storeName}`;
    document.title = title;
    setMetaContent('meta[name="description"]', 'name', 'description', description);
    setMetaContent('meta[property="og:title"]', 'property', 'og:title', title);
    setMetaContent('meta[property="og:description"]', 'property', 'og:description', description);
    setMetaContent('meta[property="og:type"]', 'property', 'og:type', 'product');
    setMetaContent('meta[property="og:image"]', 'property', 'og:image', image);
    setMetaContent('meta[property="og:url"]', 'property', 'og:url', window.location.href);
    setProductStructuredData({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name,
      description,
      image,
      sku: product.id,
      offers: {
        '@type': 'Offer',
        priceCurrency: 'TND',
        price: getProductPrice(product),
        availability: product.isOutOfStock === true
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock',
        url: window.location.href,
      },
    });
    return () => setProductStructuredData(null);
  }, [product, getLocalizedName, getLocalizedDesc, getProductPrice, settings.storeName]);

  // Fetch product from backend
  useEffect(() => {
    const slug = routeParams.productSlug;
    const id = routeParams.productId;

    if (!slug && !id) {
      navigateTo('products');
      return;
    }

    const loadProduct = async () => {
      try {
        setIsLoading(true);
        let res: any;
        if (slug) {
          res = await api.products.getBySlug(slug);
        } else if (id) {
          res = await api.products.getById(id);
        }

        if (res?.data) {
          setProduct(res.data);
          setSelectedImageIndex(0);
          setQuantity(1);
        } else {
          navigateTo('not-found');
        }
      } catch (err) {
        console.error('Failed to load product details:', err);
        navigateTo('not-found');
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [routeParams.productSlug, routeParams.productId, navigateTo]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
          <div className="aspect-square bg-slate-200 rounded-3xl" />
          <div className="space-y-4">
            <div className="h-6 bg-slate-200 rounded w-1/3" />
            <div className="h-10 bg-slate-200 rounded w-4/5" />
            <div className="h-8 bg-slate-200 rounded w-1/4" />
            <div className="h-24 bg-slate-200 rounded" />
            <div className="h-12 bg-slate-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const name = getLocalizedName(product);
  const description = getLocalizedDesc(product);
  const price = getProductPrice(product);
  const comparePrice = product.compareAtPriceTND || product.originalPrice;
  const isFavorited = isInWishlist(product.id);
  const isOutOfStock = product.isOutOfStock === true;
  const imagesList = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : [product.image];

  const mainImage = getSafeImageUrl(imagesList[selectedImageIndex] || imagesList[0]);

  // Related products
  const relatedProducts = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || !reviewerComment.trim()) {
      showToast('Veuillez renseigner votre nom et votre avis.', 'error');
      return;
    }

    try {
      setIsSubmittingReview(true);
      const res = await api.reviews.create({
        productId: product.id,
        name: reviewerName,
        rating: reviewerRating,
        comment: reviewerComment,
      });

      if (res?.data) {
        showToast('Merci ! Votre avis a été enregistré avec succès.', 'success');
        setProduct((prev) =>
          prev
            ? {
                ...prev,
                reviews: [res.data, ...(prev.reviews || [])],
              }
            : prev
        );
        setReviewerComment('');
        setReviewerName('');
      }
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de la soumission de l’avis.', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="py-6 max-w-7xl mx-auto px-4 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500">
        <button onClick={() => navigateTo('home')} className="hover:text-orange-600 transition">
          {t.home}
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <button onClick={() => navigateTo('products')} className="hover:text-orange-600 transition">
          {t.shop}
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900 font-bold truncate max-w-xs">{name}</span>
      </nav>

      {/* Main Product Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        {/* Left: Image Gallery */}
        <div>
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 mb-4 shadow-xs">
            <img
              src={mainImage}
              alt={name}
              loading="lazy"
              width={800}
              height={800}
              onError={(e) => handleImageError(e)}
              className="w-full h-full object-cover"
            />
            {product.compareAtPriceTND && product.compareAtPriceTND > price && (
              <span className="absolute top-3 left-3 px-3 py-1 rounded-lg text-xs font-black bg-rose-600 text-white shadow-md">
                PROMO
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {imagesList.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {imagesList.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  aria-label={language === 'ar' ? `عرض الصورة ${idx + 1}` : `Afficher l’image ${idx + 1}`}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition flex-shrink-0 ${
                    selectedImageIndex === idx
                      ? 'border-orange-600 ring-2 ring-orange-500/20'
                      : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={getSafeImageUrl(img)}
                    alt=""
                    loading="lazy"
                    width={64}
                    height={64}
                    onError={(e) => handleImageError(e)}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          <div className="mt-5 p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-orange-500 flex-shrink-0" />
              <span>Livraison 24/48h Tunisie</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Hotline {settings.phone}</span>
            </div>
          </div>
        </div>

        {/* Right: Pricing & Actions */}
        <div className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
              <span className="font-bold text-slate-900 uppercase">
                {product.specs?.brand || 'PRO GSM'}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-slate-400">
                REF: {(product.sku || product.slug || product.id).toUpperCase().slice(0, 16)}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 leading-tight mb-3">
              {name}
            </h1>

            {/* Rating Stars */}
            <div className="flex items-center gap-2.5 mb-5">
              <div className="flex items-center text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(product.rating || 5)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-slate-800">
                {(product.rating || 5.0).toFixed(1)} / 5.0
              </span>
              <span className="text-xs text-slate-500">
                ({product.reviews?.length || 1} avis vérifiés)
              </span>
            </div>

            {/* Price Box */}
            <div className="p-4 bg-orange-50/60 rounded-2xl border border-orange-200/80 mb-5">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-orange-600">
                  {formatPrice(price)}
                </span>
                {comparePrice && comparePrice > price && (
                  <span className="text-base text-slate-400 line-through">
                    {formatPrice(comparePrice)}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Prix TTC en Dinar Tunisien. Facture avec TVA disponible. Paiement à la livraison ou virement.
              </p>
            </div>

            {/* Description Preview */}
            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              {description}
            </p>
            <p className={`mb-5 text-sm font-bold ${isOutOfStock ? 'text-rose-700' : 'text-emerald-700'}`}>
              {isOutOfStock ? t.outOfStock : t.available}
            </p>

          </div>

          {/* Action Row */}
          <div className="pt-6 border-t border-slate-100 space-y-3">
            <div className="flex items-center gap-3">
              {/* Stepper */}
              <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label={language === 'ar' ? 'إنقاص الكمية' : 'Diminuer la quantité'}
                  className="p-2 rounded-lg hover:bg-white text-slate-600 transition"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 text-sm font-bold text-slate-900 min-w-[32px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label={language === 'ar' ? 'زيادة الكمية' : 'Augmenter la quantité'}
                  className="p-2 rounded-lg hover:bg-white text-slate-600 transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add to cart */}
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-xs sm:text-sm font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/30 transition disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>{t.addToCart}</span>
              </button>

              {/* Wishlist */}
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`p-3.5 rounded-xl border transition ${
                  isFavorited
                    ? 'bg-rose-50 border-rose-300 text-rose-600'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
                title={t.addToWishlist}
                aria-label={isFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              >
                <Heart className={`w-5 h-5 ${isFavorited ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
            </div>

            <a
              href={`tel:${settings.phone.replace(/[\s\-\(\)]/g, '')}`}
              className="flex items-center justify-center gap-2 py-2 text-xs font-semibold text-slate-600 hover:text-orange-600 transition"
            >
              <Phone className="w-3.5 h-3.5 text-orange-500" />
              <span>Commander par téléphone au {settings.phone} </span>
            </a>

            {user?.role === 'ADMIN' && (
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => navigateTo('admin-products', { productId: product.id, productAction: 'edit' })}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  <Edit2 className="h-4 w-4" />
                  Modifier le produit
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('admin-products', { productId: product.id, productAction: 'delete' })}
                  className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer le produit
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs: Specifications, Description, Reviews */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4 border-b border-slate-200 mb-6">
          <button
            onClick={() => setActiveTab('specs')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition ${
              activeTab === 'specs'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {t.specs}
          </button>
          <button
            onClick={() => setActiveTab('desc')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition ${
              activeTab === 'desc'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {t.description}
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition ${
              activeTab === 'reviews'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {t.reviews} ({product.reviews?.length || 0})
          </button>
        </div>

        {/* Tab 1: Specs Table */}
        {activeTab === 'specs' && (
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
            {product.specs && Object.keys(product.specs).some((key) => !['source', 'remarque'].includes(key.toLocaleLowerCase())) ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {Object.entries(product.specs)
                  .filter(([key]) => !['source', 'remarque'].includes(key.toLocaleLowerCase()))
                  .map(([k, val]) => (
                  <div key={k} className="p-3 bg-white rounded-xl border border-slate-200 flex justify-between">
                    <span className="text-slate-500 font-semibold capitalize">
                      {k.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <strong className="text-slate-900">{String(val)}</strong>
                  </div>
                  ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Spécifications standards d’atelier.</p>
            )}
          </div>
        )}

        {/* Tab 2: Full Description */}
        {activeTab === 'desc' && (
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-slate-700 text-sm leading-relaxed space-y-4">
            <p>{description}</p>
            <h4 className="font-bold text-slate-900 text-sm">Assistance Technique Réparation GSM :</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
              <li>Testé et calibré avant expédition pour un fonctionnement optimal.</li>
              <li>Pièces de rechange et accessoires sélectionnés par Outils Réparation GSM Tunisie.</li>
              <li>Support technique assuré par des techniciens expérimentés au {settings.phone}.</li>
            </ul>
          </div>
        )}

        {/* Tab 3: Customer Reviews */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {/* Reviews List */}
            <div className="space-y-3">
              {product.reviews && product.reviews.length > 0 ? (
                product.reviews.map((rev) => (
                  <div key={rev.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <strong className="text-xs text-slate-900">{rev.name}</strong>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                          Avis Vérifié
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center text-amber-400 mb-1.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{rev.comment}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">Soyez le premier à donner votre avis sur cet outil !</p>
              )}
            </div>

            {/* Add Review Form */}
            <form onSubmit={handleReviewSubmit} className="p-5 bg-white rounded-2xl border border-orange-200 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Laisser un avis sur ce produit
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reviewer-name" className="text-xs font-semibold text-slate-700 block mb-1">
                    Votre Nom ou Atelier *
                  </label>
                  <input
                    id="reviewer-name"
                    type="text"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder="Ex: Anis GSM Sfax"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-orange-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="reviewer-rating" className="text-xs font-semibold text-slate-700 block mb-1">
                    Note *
                  </label>
                  <select
                    id="reviewer-rating"
                    value={reviewerRating}
                    onChange={(e) => setReviewerRating(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-orange-500 bg-white"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5/5) Excellent</option>
                    <option value={4}>⭐⭐⭐⭐ (4/5) Très bien</option>
                    <option value={3}>⭐⭐⭐ (3/5) Moyen</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="reviewer-comment" className="text-xs font-semibold text-slate-700 block mb-1">
                  Votre Commentaire *
                </label>
                <textarea
                  id="reviewer-comment"
                  rows={3}
                  value={reviewerComment}
                  onChange={(e) => setReviewerComment(e.target.value)}
                  placeholder="Partagez votre retour d’expérience technique sur cet équipement..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-orange-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingReview}
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmittingReview ? 'Enregistrement...' : 'Publier mon avis'}</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">
            {language === 'ar' ? 'منتجات مشابهة نوصي بها' : 'Produits Similaires Recommandés'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => navigateTo('product-detail', { productSlug: p.slug })}
                className="p-3 bg-white rounded-2xl border border-slate-200 hover:border-orange-300 hover:shadow-md cursor-pointer transition flex items-center gap-3"
              >
                <img
                  src={getSafeImageUrl(p.image)}
                  alt=""
                  loading="lazy"
                  width={56}
                  height={56}
                  onError={(e) => handleImageError(e)}
                  className="w-14 h-14 object-cover rounded-xl border border-slate-100 flex-shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {getLocalizedName(p)}
                  </h4>
                  <div className="text-xs font-black text-orange-600 mt-1">
                    {formatPrice(getProductPrice(p))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

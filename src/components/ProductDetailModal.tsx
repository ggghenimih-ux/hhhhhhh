import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { getSafeImageUrl, handleImageError } from '../utils/image';
import {
  X,
  Star,
  ShoppingCart,
  Heart,
  ShieldCheck,
  Truck,
  RotateCcw,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Minus,
  Plus,
  Send,
  Share2,
  FileText,
  HelpCircle
} from 'lucide-react';
import { Variant, Review } from '../types';

export const ProductDetailModal: React.FC = () => {
  const {
    t,
    language,
    formatPrice,
    getLocalizedName,
    getLocalizedDesc,
    getProductPrice,
    detailProduct,
    setDetailProduct,
    addToCart,
    toggleWishlist,
    isInWishlist,
    products,
    showToast
  } = useStore();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<Variant | undefined>(
    detailProduct?.variants?.[0]
  );
  const [activeTab, setActiveTab] = useState<'specs' | 'desc' | 'reviews'>('specs');

  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewName, setReviewName] = useState('');
  const [reviewCity, setReviewCity] = useState('Tunis');
  const [reviewComment, setReviewComment] = useState('');
  const [localReviews, setLocalReviews] = useState<Review[]>([
    {
      id: 'rev-1',
      userId: 'u1',
      userName: 'Sami Chérif (Atelier GSM Sousse)',
      userCity: 'Sousse',
      rating: 5,
      title: 'Matériel d’origine exceptionnel',
      comment: 'Reçu en 24h par Aramex à Sousse. Station conforme à la description, chauffe impeccable et régulation thermique ultra-précise.',
      helpful: 8,
      createdAt: '2024-03-20'
    },
    {
      id: 'rev-2',
      userId: 'u2',
      userName: 'Mehdi Karray (Labo Réparation Sfax)',
      userCity: 'Sfax',
      rating: 5,
      title: 'Très bon investissement pour mon atelier',
      comment: 'Produit original avec facture. Le service client de goods.tn / Outils GSM est très sérieux et joignable facilement au téléphone.',
      helpful: 5,
      createdAt: '2024-03-14'
    }
  ]);

  if (!detailProduct) return null;

  const product = detailProduct;
  const name = getLocalizedName(product);
  const description = getLocalizedDesc(product);
  const isFavorited = isInWishlist(product.id);
  const basePrice = getProductPrice(product);
  const currentPrice = basePrice + (selectedVariant?.priceAdjustment || 0);

  // Similar products
  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 3);

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedVariant);
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewComment.trim()) {
      showToast('Veuillez remplir votre nom et votre commentaire.', 'error');
      return;
    }
    const newRev: Review = {
      id: 'rev-' + Date.now(),
      userId: 'user-guest',
      userName: reviewName,
      userCity: reviewCity,
      rating: reviewRating,
      title: 'Avis vérifié',
      comment: reviewComment,
      helpful: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setLocalReviews([newRev, ...localReviews]);
    setReviewComment('');
    showToast(language === 'ar' ? 'شكراً ! تم نشر تقييمكم بنجاح.' : 'Merci pour votre avis !', 'success');
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast(language === 'ar' ? 'تم نسخ رابط المنتج بنجاح' : 'Lien copié dans le presse-papiers !');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Header Bar */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white uppercase">
              {product.specs?.brand || product.specifications?.brand || product.brand || 'GSM'}
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-xs text-slate-400 font-mono">
              SKU: {product.sku || product.slug || product.id.slice(0, 8)}
            </span>
          </div>
          <button
            onClick={() => setDetailProduct(null)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Main Top Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Left: Gallery */}
            <div>
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 mb-3 shadow-sm">
                <img
                  src={getSafeImageUrl(product.images?.[selectedImageIndex] || product.images?.[0] || product.image)}
                  alt={name}
                  onError={(e) => handleImageError(e)}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="flex items-center gap-2">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition ${
                        selectedImageIndex === idx
                          ? 'border-orange-600 ring-2 ring-orange-500/20'
                          : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={getSafeImageUrl(img)}
                        alt="mini"
                        onError={(e) => handleImageError(e)}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Trust badges */}
              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Garantie Matériel 12 Mois</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Truck className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  <span>Livraison Rapide Tunisie</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <RotateCcw className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>Échange sous 48h si défaut</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Hotline : +216 26 383 876</span>
                </div>
              </div>
            </div>

            {/* Right: Info & Pricing */}
            <div className="flex flex-col justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug mb-3">
                  {name}
                </h1>

                {/* Rating & Reviews counter */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-slate-800">
                    {product.rating.toFixed(1)} / 5.0
                  </span>
                  <span className="text-xs text-slate-500">
                    ({localReviews.length} avis vérifiés en Tunisie)
                  </span>
                </div>

                {/* Price block */}
                <div className="p-4 bg-orange-50/60 rounded-2xl border border-orange-200/80 mb-5">
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl sm:text-3xl font-black text-orange-600">
                      {formatPrice(currentPrice)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-base text-slate-400 line-through">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Prix TTC incluant TVA. Paiement disponible à la livraison en espèces ou par carte bancaire.
                  </p>
                </div>

                {/* Variants selector if available */}
                {product.variants && product.variants.length > 0 && (
                  <div className="mb-5">
                    <label className="text-xs font-bold text-slate-800 block mb-2 uppercase tracking-wide">
                      Configuration / Variante :
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {product.variants.map(v => (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVariant(v)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                            selectedVariant?.id === v.id
                              ? 'border-orange-600 bg-orange-600 text-white shadow-xs'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {v.value} {v.priceAdjustment > 0 && `(+${formatPrice(v.priceAdjustment)})`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stock status indicator */}
                <div className="mb-5">
                  {product.stock > 0 ? (
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{t.inStock} - {product.stock} unités disponibles à l’atelier</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-600">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{t.outOfStock} - Arrivage prochainement</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Add to cart / Action bar */}
              <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  {/* Quantity selector */}
                  <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="p-2 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition"
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 text-sm font-bold text-slate-900 min-w-[32px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                      className="p-2 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition"
                      disabled={quantity >= product.stock}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Add to Cart button */}
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock <= 0}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-sm font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/30 transition disabled:bg-slate-200 disabled:text-slate-400"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>{t.addToCart}</span>
                  </button>

                  {/* Wishlist button */}
                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className={`p-3.5 rounded-xl border transition ${
                      isFavorited
                        ? 'bg-rose-50 border-rose-300 text-rose-600'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                    title={t.addToWishlist}
                  >
                    <Heart className={`w-5 h-5 ${isFavorited ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>

                  {/* Share button */}
                  <button
                    onClick={copyShareLink}
                    className="p-3.5 rounded-xl border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition"
                    title={t.share}
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Direct Hotline Consultation */}
                <a
                  href="tel:+21626383876"
                  className="flex items-center justify-center gap-2 py-2 text-xs font-semibold text-slate-600 hover:text-orange-600 transition"
                >
                  <Phone className="w-3.5 h-3.5 text-orange-500" />
                  <span>Commander directement par téléphone au +216 26 383 876</span>
                </a>
              </div>
            </div>
          </div>

          {/* Tabs: Specifications, Description, Reviews */}
          <div className="border-t border-slate-200 pt-6">
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
                {t.reviews} ({localReviews.length})
              </button>
            </div>

            {/* TAB 1: SPECIFICATIONS TABLE */}
            {activeTab === 'specs' && (
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {Object.entries(product.specs || product.specifications || { Marque: product.brand || 'GSM' }).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-100">
                      <span className="font-semibold text-slate-500 capitalize">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </span>
                      <span className="font-bold text-slate-900">
                        {String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: DETAILED DESCRIPTION */}
            {activeTab === 'desc' && (
              <div className="prose prose-sm max-w-none text-slate-700 bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <p className="text-sm leading-relaxed mb-4">{description}</p>
                <h4 className="font-bold text-slate-900 text-sm mb-2">Points Clés & Avantages :</h4>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
                  <li>Testé et calibré avant expédition pour garantir un fonctionnement optimal.</li>
                  <li>Compatibilité totale avec les protocoles de réparation smartphone (iPhone, Samsung, Xiaomi, Huawei).</li>
                  <li>Pièces de rechange et accessoires disponibles en stock chez Outils Réparation GSM Tunisie.</li>
                  <li>Support technique assuré par des techniciens expérimentés au +216 26 383 876.</li>
                </ul>
              </div>
            )}

            {/* TAB 3: CUSTOMER REVIEWS */}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {/* Existing Reviews */}
                <div className="space-y-3">
                  {localReviews.map(rev => (
                    <div key={rev.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{rev.userName}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                            Achat vérifié
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">{rev.createdAt}</span>
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
                  ))}
                </div>

                {/* Add Review Form */}
                <form onSubmit={handleAddReview} className="p-5 bg-white rounded-2xl border border-orange-200 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4 text-orange-500" />
                    <span>Ajouter votre avis sur ce produit</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Votre Nom / Atelier
                      </label>
                      <input
                        type="text"
                        value={reviewName}
                        onChange={(e) => setReviewName(e.target.value)}
                        placeholder="Ex: Anis GSM"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-orange-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Gouvernorat / Ville
                      </label>
                      <input
                        type="text"
                        value={reviewCity}
                        onChange={(e) => setReviewCity(e.target.value)}
                        placeholder="Ex: Tunis, Sfax, Sousse..."
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Note
                      </label>
                      <select
                        value={reviewRating}
                        onChange={(e) => setReviewRating(Number(e.target.value))}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-orange-500 bg-white"
                      >
                        <option value={5}>⭐⭐⭐⭐⭐ (5/5) Excellent</option>
                        <option value={4}>⭐⭐⭐⭐ (4/5) Très bien</option>
                        <option value={3}>⭐⭐⭐ (3/5) Moyen</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Votre Commentaire
                    </label>
                    <textarea
                      rows={3}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Donnez vos impressions techniques sur cet équipement..."
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 outline-none focus:border-orange-500"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Publier mon avis</span>
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Related products */}
          {relatedProducts.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 mb-4">
                {t.relatedProducts}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {relatedProducts.map(rel => (
                  <div
                    key={rel.id}
                    onClick={() => {
                      setDetailProduct(rel);
                      setSelectedImageIndex(0);
                    }}
                    className="p-3 rounded-xl border border-slate-200 hover:border-orange-300 hover:shadow-md cursor-pointer transition flex items-center gap-3 bg-white"
                  >
                    <img
                      src={getSafeImageUrl(rel.images?.[0] || rel.image)}
                      alt={getLocalizedName(rel)}
                      onError={(e) => handleImageError(e)}
                      className="w-14 h-14 object-cover rounded-lg flex-shrink-0 border border-slate-100"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 truncate">
                        {getLocalizedName(rel)}
                      </h4>
                      <div className="text-xs font-black text-orange-600 mt-1">
                        {formatPrice(getProductPrice(rel))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

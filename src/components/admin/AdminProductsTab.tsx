import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { api } from '../../services/api';
import {
  Package,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Upload,
  RefreshCw,
  X,
  ExternalLink,
  Tag,
  Star,
  Layers,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';

interface AdminProductsTabProps {
  onRefreshData?: () => void;
}

export const AdminProductsTab: React.FC<AdminProductsTabProps> = ({ onRefreshData }) => {
  const { categories, formatPrice, refreshProducts, showToast, navigateTo } = useStore();

  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search & Sort & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'name'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Deletion & Confirmation Modal State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<any | null>(null);

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formPrice, setFormPrice] = useState<number>(45);
  const [formComparePrice, setFormComparePrice] = useState<number>(0);
  const [formStock, setFormStock] = useState<number>(10);
  const [formSku, setFormSku] = useState('');
  const [formBrand, setFormBrand] = useState('Mechanic');
  const [formWarranty, setFormWarranty] = useState('6 Mois');
  const [formShortDesc, setFormShortDesc] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load products from API
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const res = await api.products.getAll({ limit: 100, status: 'all', admin: 'true' });
      if (res?.data && Array.isArray(res.data)) {
        setProducts(res.data);
      }
    } catch (err: any) {
      showToast(err.message || 'Erreur lors du chargement des produits.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormName('');
    setFormSlug('');
    setFormCategory(categories[0]?.slug || 'soldering-hot-air');
    setFormPrice(45);
    setFormComparePrice(0);
    setFormStock(10);
    setFormSku(`GSM-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormBrand('Mechanic');
    setFormWarranty('6 Mois');
    setFormShortDesc('');
    setFormDesc('');
    setFormIsFeatured(false);
    setFormIsActive(true);
    setFormImageUrl('/logo.jpg');
    setFormImages([]);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (prod: any) => {
    setEditingProduct(prod);
    setFormName(prod.name || '');
    setFormSlug(prod.slug || '');
    setFormCategory(prod.category || categories[0]?.slug || 'soldering-hot-air');
    setFormPrice(prod.priceTND || prod.price || 0);
    setFormComparePrice(prod.compareAtPriceTND || prod.compareAtPrice || 0);
    setFormStock(prod.stock ?? 0);
    setFormSku(prod.sku || '');
    setFormBrand(prod.brand || prod.specs?.brand || 'Mechanic');
    setFormWarranty(prod.warranty || '6 Mois');
    setFormShortDesc(prod.shortDescription || '');
    setFormDesc(prod.description || '');
    setFormIsFeatured(Boolean(prod.isFeatured));
    setFormIsActive(prod.isActive !== false);
    setFormImageUrl(prod.image || '/logo.jpg');
    setFormImages(Array.isArray(prod.images) ? prod.images : prod.image ? [prod.image] : []);
    setIsModalOpen(true);
  };

  // Upload image handler
  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const res = await api.upload.image(file);
      if (res?.url) {
        setFormImageUrl(res.url);
        setFormImages((prev) => [...prev.filter((i) => i !== res.url), res.url]);
        showToast('Image téléversée avec succès.', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Erreur téléversement image.', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Submit Create or Edit Product
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPrice) {
      showToast('Nom et prix requis.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const slug = (formSlug || formName).toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      const fallbackImg = formImageUrl || formImages[0] || '/logo.jpg';
      const imagesList = formImages.length > 0 ? formImages : [fallbackImg];

      const payload = {
        name: formName.trim(),
        slug,
        category: formCategory,
        priceTND: Number(formPrice),
        compareAtPriceTND: Number(formComparePrice) > 0 ? Number(formComparePrice) : null,
        stock: Number(formStock),
        sku: formSku.trim(),
        brand: formBrand.trim(),
        warranty: formWarranty.trim(),
        shortDescription: formShortDesc.trim(),
        description: formDesc.trim() || 'Équipement professionnel de réparation GSM.',
        image: fallbackImg,
        images: imagesList,
        isFeatured: formIsFeatured,
        isActive: formIsActive,
      };

      if (editingProduct) {
        // Update
        const res = await api.products.update(editingProduct.id, payload);
        if (res?.data) {
          showToast('Produit mis à jour avec succès.', 'success');
          setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? { ...p, ...res.data } : p)));
        }
      } else {
        // Create
        const res = await api.products.create(payload);
        if (res?.data) {
          showToast('Nouveau produit créé avec succès.', 'success');
          setProducts((prev) => [res.data, ...prev]);
        }
      }

      setIsModalOpen(false);
      refreshProducts();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de l’enregistrement du produit.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick toggle active / inactive or reactivate
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const nextStatus = !currentStatus;
      const res = await api.products.patchStatus(id, nextStatus);
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isActive: nextStatus } : p))
      );
      showToast(
        res?.message || (nextStatus ? 'تمت إعادة تفعيل المنتج وعرضه في المتجر' : 'تم إخفاء المنتج من المتجر'),
        'info'
      );
      fetchProducts();
      refreshProducts();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      showToast(err.message || 'حدث خطأ أثناء تعديل حالة المنتج.', 'error');
    }
  };

  // Quick update stock
  const handleQuickStock = async (id: string, newStock: number) => {
    if (newStock < 0) return;
    try {
      await api.products.patchStock(id, newStock);
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, stock: newStock } : p))
      );
      showToast(`Stock mis à jour (${newStock} unités).`, 'success');
      refreshProducts();
    } catch (err: any) {
      showToast(err.message || 'Erreur mise à jour stock.', 'error');
    }
  };

  // Real Delete Product with Credentials & Verification
  const handleDeleteProduct = async (id: string) => {
    if (deletingId) return;

    try {
      setDeletingId(id);

      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          showToast('يجب تسجيل الدخول كمسؤول أولاً (401)', 'error');
          navigateTo('login');
          return;
        }
        if (response.status === 403) {
          showToast('ليس لديك صلاحية حذف المنتجات (403)', 'error');
          return;
        }
        throw new Error(data.message || data.error || 'فشل حذف المنتج');
      }

      if (data.softDeleted) {
        setProducts((current) =>
          current.map((product) =>
            product.id === id ? { ...product, isActive: false } : product
          )
        );
        showToast(
          data.message || 'المنتج مرتبط بطلبات سابقة وتم إخفاؤه للحفاظ على تاريخ الطلبات',
          'info'
        );
      } else {
        setProducts((current) =>
          current.filter((product) => product.id !== id)
        );
        showToast(data.message || 'تم حذف المنتج بنجاح', 'success');
      }

      setProductToDelete(null);
      fetchProducts();
      refreshProducts();
      if (onRefreshData) onRefreshData();
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : 'حدث خطأ أثناء حذف المنتج',
        'error'
      );
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered & Sorted products
  const filteredProducts = products.filter((prod) => {
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = prod.name?.toLowerCase().includes(q);
      const matchSku = prod.sku?.toLowerCase().includes(q);
      const matchBrand = (prod.brand || prod.specs?.brand || '')?.toLowerCase().includes(q);
      if (!matchName && !matchSku && !matchBrand) return false;
    }

    // Category
    if (categoryFilter !== 'all' && prod.category !== categoryFilter) {
      return false;
    }

    // Status Filter (All / Active / Inactive)
    if (statusFilter === 'active' && prod.isActive === false) {
      return false;
    }
    if (statusFilter === 'inactive' && prod.isActive !== false) {
      return false;
    }

    // Stock
    const stock = prod.stock ?? 0;
    if (stockFilter === 'in_stock' && stock <= 5) return false;
    if (stockFilter === 'low_stock' && (stock <= 0 || stock > 5)) return false;
    if (stockFilter === 'out_of_stock' && stock > 0) return false;

    return true;
  });

  // Sort
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }
    if (sortBy === 'oldest') {
      return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    }
    if (sortBy === 'price_asc') {
      return (a.priceTND || a.price || 0) - (b.priceTND || b.price || 0);
    }
    if (sortBy === 'price_desc') {
      return (b.priceTND || b.price || 0) - (a.priceTND || a.price || 0);
    }
    if (sortBy === 'name') {
      return (a.name || '').localeCompare(b.name || '');
    }
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage) || 1;
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Header with Search, Filter & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-600" />
            <span>Catalogue & Inventaire Produits ({products.length})</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ajoutez, modifiez le stock, activez ou supprimez des produits en temps réel dans SQLite.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchProducts}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
            title="Actualiser la liste"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un Produit</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-white p-4 rounded-2xl border border-slate-200 text-xs">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Rechercher par nom, SKU, marque..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white"
          />
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full py-2.5 px-3 rounded-xl border border-slate-300 bg-white font-medium"
          >
            <option value="all">Toutes les catégories ({products.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {typeof c.name === 'string' ? c.name : c.name.fr}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter (Active / Inactive / All) */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="w-full py-2.5 px-3 rounded-xl border border-slate-300 bg-white font-medium text-slate-700"
          >
            <option value="all">Tous les états (Actifs & Masqués)</option>
            <option value="active">✅ Actifs uniquement</option>
            <option value="inactive">⚠️ Masqués / Désactivés</option>
          </select>
        </div>

        {/* Stock Status Filter */}
        <div>
          <select
            value={stockFilter}
            onChange={(e) => {
              setStockFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="w-full py-2.5 px-3 rounded-xl border border-slate-300 bg-white font-medium"
          >
            <option value="all">Tous les niveaux de stock</option>
            <option value="in_stock">✅ En stock (&gt; 5)</option>
            <option value="low_stock">⚠️ Stock faible (1 à 5)</option>
            <option value="out_of_stock">❌ En rupture (0)</option>
          </select>
        </div>

        {/* Sort By */}
        <div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full py-2.5 px-3 rounded-xl border border-slate-300 bg-white font-medium"
          >
            <option value="newest">Plus récents d'abord</option>
            <option value="oldest">Plus anciens d'abord</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
            <option value="name">Nom (A - Z)</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-orange-600" />
            <p>Chargement des produits depuis la base de données...</p>
          </div>
        ) : paginatedProducts.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Package className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">Aucun produit trouvé avec ces critères</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('all');
                setStockFilter('all');
              }}
              className="text-xs text-orange-600 font-bold hover:underline"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 text-start">Produit</th>
                  <th className="py-3.5 px-4 text-start">Catégorie</th>
                  <th className="py-3.5 px-4 text-start">Prix (DT)</th>
                  <th className="py-3.5 px-4 text-center">Stock</th>
                  <th className="py-3.5 px-4 text-center">Statut</th>
                  <th className="py-3.5 px-4 text-end">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedProducts.map((prod) => {
                  const stock = prod.stock ?? 0;
                  const isOutOfStock = stock <= 0;
                  const isLowStock = stock > 0 && stock <= 5;
                  const isActive = prod.isActive !== false;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/60 transition">
                      {/* Product image & name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 bg-white p-0.5 flex-shrink-0">
                            <img
                              src={prod.image?.trim() || '/logo.jpg'}
                              alt={prod.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                if (e.currentTarget.src !== '/logo.jpg') e.currentTarget.src = '/logo.jpg';
                              }}
                            />
                          </div>
                          <div className="min-w-0 max-w-xs sm:max-w-sm">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 truncate block">
                                {prod.name}
                              </span>
                              {prod.isFeatured && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                                  En Vedette
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-mono text-slate-400 block">
                              SKU: {prod.sku || 'N/A'} {prod.brand ? `· ${prod.brand}` : ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold">
                          {prod.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900">
                          {formatPrice(prod.priceTND || prod.price)}
                        </div>
                        {prod.compareAtPriceTND ? (
                          <div className="text-[10px] text-slate-400 line-through font-mono">
                            {formatPrice(prod.compareAtPriceTND)}
                          </div>
                        ) : null}
                      </td>

                      {/* Stock with quick buttons */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleQuickStock(prod.id, Math.max(0, stock - 1))}
                            className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition"
                          >
                            -
                          </button>
                          <span
                            className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold ${
                              isOutOfStock
                                ? 'bg-rose-100 text-rose-700'
                                : isLowStock
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {stock}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuickStock(prod.id, stock + 1)}
                            className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Status toggle & badge */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(prod.id, isActive)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition shadow-2xs ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          }`}
                          title={isActive ? 'Cliquer pour masquer du magasin' : 'Cliquer pour réactiver'}
                        >
                          {isActive ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Actif (ظاهر)</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Masqué (مخفي)</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isActive && (
                            <button
                              type="button"
                              onClick={() => handleToggleActive(prod.id, false)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition border border-emerald-200/60"
                              title="إعادة تفعيل هذا المنتج في المتجر"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">إعادة تفعيل</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(prod)}
                            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                            title="Modifier ce produit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setProductToDelete(prod)}
                            disabled={deletingId === prod.id}
                            className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition disabled:opacity-50"
                            title="Supprimer ce produit"
                          >
                            {deletingId === prod.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {currentPage} sur {totalPages} ({sortedProducts.length} produits au total)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE / EDIT PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-400" />
                <h3 className="text-sm font-bold">
                  {editingProduct ? `Modifier : ${editingProduct.name}` : 'Nouveau Produit GSM'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmitForm} className="p-6 overflow-y-auto space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nom du Produit *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Station de Soudure JBC C245"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Slug URL</label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="station-soudure-jbc-c245"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-slate-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Catégorie *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {typeof c.name === 'string' ? c.name : c.name.fr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Marque</label>
                  <input
                    type="text"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    placeholder="Mechanic, JCID, Quick, Sunshine..."
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Garantie</label>
                  <input
                    type="text"
                    value={formWarranty}
                    onChange={(e) => setFormWarranty(e.target.value)}
                    placeholder="6 Mois, 1 An..."
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Prix Vente (DT) *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold text-orange-600"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Prix Barré (Promo DT)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={formComparePrice}
                    onChange={(e) => setFormComparePrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Quantité Stock *</label>
                  <input
                    type="number"
                    min="0"
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Code SKU</label>
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    placeholder="GSM-1234"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description Courte</label>
                <input
                  type="text"
                  value={formShortDesc}
                  onChange={(e) => setFormShortDesc(e.target.value)}
                  placeholder="Ex: Station ultra-rapide chauffe en 2 secondes."
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description Détaillée</label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Caractéristiques techniques, tension 220V, pannes compatibles..."
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              {/* Image Uploader & Preview */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 block">Photo Principale du Produit</span>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-300 bg-white p-1 flex-shrink-0 shadow-xs">
                    <img
                      src={formImageUrl?.trim() || '/logo.jpg'}
                      alt="Preview"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        if (e.currentTarget.src !== '/logo.jpg') e.currentTarget.src = '/logo.jpg';
                      }}
                    />
                  </div>
                  <div className="space-y-2 flex-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleUploadImage}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 font-bold text-slate-700 transition"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploading ? 'Téléversement...' : 'Téléverser une image'}</span>
                    </button>
                    <input
                      type="text"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      placeholder="/logo.jpg ou URL externe"
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              {/* Status & Featured Checkboxes */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                  />
                  <span>Produit Actif (Visible en boutique)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={formIsFeatured}
                    onChange={(e) => setFormIsFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                  />
                  <span>Produit en Vedette (Affiché sur l'accueil)</span>
                </label>
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold transition shadow-md disabled:bg-slate-400"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <span>{editingProduct ? 'Mettre à jour le produit' : 'Créer le produit'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL BEFORE DELETION */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  تأكيد حذف المنتج (Suppression)
                </h3>
                <p className="text-xs text-slate-500">
                  هل أنت متأكد من رغبتك في حذف هذا المنتج من المتجر؟
                </p>
              </div>
            </div>

            {/* Product card summary */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 bg-white p-0.5 flex-shrink-0">
                <img
                  src={productToDelete.image?.trim() || '/logo.jpg'}
                  alt={productToDelete.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    if (e.currentTarget.src !== '/logo.jpg') e.currentTarget.src = '/logo.jpg';
                  }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-slate-900 truncate">
                  {productToDelete.name}
                </h4>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  SKU: {productToDelete.sku || 'N/A'} · {formatPrice(productToDelete.priceTND || productToDelete.price || 0)}
                </div>
                <div className="mt-1">
                  <span
                    className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded ${
                      productToDelete.isActive !== false
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {productToDelete.isActive !== false ? 'Actif (ظاهر)' : 'Masqué (مخفي)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Order history safeguard explanation */}
            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/70 text-[11px] text-amber-900 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>حماية سجلات الطلبات القديمة:</span>
              </div>
              <p className="text-amber-800 leading-relaxed">
                إذا كان هذا المنتج مسجلاً ضمن طلبات سابقة للعملاء، فلن يتم حذفه نهائياً وإنما سيتم <strong>إخفاؤه وتعطيله</strong> لحماية تاريخ الطلبات وسجلات الفواتير. أما إذا لم يكن مرتبطاً بأي طلب، فسيتم حذفه نهائياً.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={deletingId !== null}
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 transition disabled:opacity-50"
              >
                إلغاء (Annuler)
              </button>
              <button
                type="button"
                onClick={() => handleDeleteProduct(productToDelete.id)}
                disabled={deletingId !== null}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-md transition disabled:opacity-50"
              >
                {deletingId === productToDelete.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري الحذف...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>تأكيد الحذف (Confirmer)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { getSafeImageUrl, handleImageError } from '../utils/image';
import {
  X,
  ShieldCheck,
  Package,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  Check,
  Save,
  CheckCircle2,
  Filter,
  Flame,
  Star
} from 'lucide-react';
import { Product, Order } from '../types';

export const AdminModal: React.FC = () => {
  const {
    t,
    language,
    formatPrice,
    getLocalizedName,
    products,
    setProducts,
    orders,
    updateOrderStatus,
    isAdminModalOpen,
    setIsAdminModalOpen,
    categories,
    showToast
  } = useStore();

  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'inventory'>('products');
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  // New product form state
  const [newSku, setNewSku] = useState('');
  const [newNameFr, setNewNameFr] = useState('');
  const [newNameAr, setNewNameAr] = useState('');
  const [newCategory, setNewCategory] = useState(categories[0].id);
  const [newBrand, setNewBrand] = useState('Mechanic');
  const [newPrice, setNewPrice] = useState(45);
  const [newStock, setNewStock] = useState(15);
  const [newImageUrl, setNewImageUrl] = useState('https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80');

  if (!isAdminModalOpen) return null;

  // KPIs
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalTND ?? o.totalPrice ?? 0), 0);
  const totalOrdersCount = orders.length;
  const lowStockItems = products.filter(p => p.stock <= 5);

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNameFr.trim() || !newPrice) {
      showToast('Veuillez renseigner le nom et le prix du produit.', 'error');
      return;
    }

    const prod: Product = {
      id: 'prod-' + Date.now(),
      sku: newSku || 'GSM-' + Math.floor(1000 + Math.random() * 9000),
      name: {
        fr: newNameFr,
        ar: newNameAr || newNameFr,
        en: newNameFr
      },
      description: {
        fr: 'Équipement professionnel de haute qualité garanti.',
        ar: 'معدة صيانة احترافية عالية الجودة معتمدة لدى ورشات الصيانة.',
        en: 'High quality certified mobile repair hardware.'
      },
      category: newCategory,
      subcategory: categories.find(c => c.id === newCategory)?.subcategories?.[0]?.id || 'hand-tools',
      price: Number(newPrice),
      stock: Number(newStock),
      images: [newImageUrl],
      specifications: {
        brand: newBrand,
        model: 'Pro 2024',
        warranty: '12 Mois'
      },
      rating: 5.0,
      reviewsCount: 1,
      tags: ['Nouveau', 'Admin'],
      isNew: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setProducts([prod, ...products]);
    setIsAddingProduct(false);
    setNewNameFr('');
    setNewNameAr('');
    setNewSku('');
    showToast('Nouveau produit ajouté au catalogue avec succès !', 'success');
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'فشل حذف المنتج');
      }

      if (data.softDeleted) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, isActive: false } : p))
        );
        showToast(data.message || 'المنتج مرتبط بطلبات سابقة وتم إخفاؤه', 'info');
      } else {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        showToast(data.message || 'تم حذف المنتج بنجاح', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de la suppression.', 'error');
    }
  };

  const handleUpdatePrice = (productId: string, price: number) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, price } : p));
    showToast('Prix mis à jour.', 'info');
  };

  const handleUpdateStock = (productId: string, stock: number) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: Math.max(0, stock) } : p));
    showToast('Niveau de stock ajusté.', 'info');
  };

  const handleQuickRestock = (productId: string) => {
    handleUpdateStock(productId, 20);
    showToast('Réapprovisionnement rapide effectué (+20 unités).', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[96vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight">
                  {t.adminTitle}
                </h2>
                <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded">
                  Live Mode
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Gestion des stocks, commandes et tarifs en Tunisie
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsAdminModalOpen(false)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Revenue */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block font-semibold">{t.kpiRevenue}</span>
                <strong className="text-base sm:text-lg text-slate-900 font-black">{formatPrice(totalRevenue)}</strong>
              </div>
            </div>

            {/* Orders */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block font-semibold">{t.kpiOrders}</span>
                <strong className="text-base sm:text-lg text-slate-900 font-black">{totalOrdersCount}</strong>
              </div>
            </div>

            {/* Products count */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block font-semibold">{t.kpiTotalProducts}</span>
                <strong className="text-base sm:text-lg text-slate-900 font-black">{products.length}</strong>
              </div>
            </div>

            {/* Low stock alerts */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block font-semibold">{t.kpiLowStock}</span>
                <strong className="text-base sm:text-lg text-rose-600 font-black">{lowStockItems.length}</strong>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab('products')}
                className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition ${
                  activeTab === 'products'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                {t.manageProducts} ({products.length})
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition ${
                  activeTab === 'orders'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                {t.manageOrders} ({orders.length})
              </button>
              <button
                onClick={() => setActiveTab('inventory')}
                className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition ${
                  activeTab === 'inventory'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Alertes Stock ({lowStockItems.length})
              </button>
            </div>

            {activeTab === 'products' && (
              <button
                onClick={() => setIsAddingProduct(!isAddingProduct)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-xs mb-2"
              >
                <Plus className="w-4 h-4" />
                <span>{isAddingProduct ? 'Fermer le formulaire' : t.addNewProduct}</span>
              </button>
            )}
          </div>

          {/* TAB 1: PRODUCT MANAGEMENT */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              {/* Add New Product Drawer/Form */}
              {isAddingProduct && (
                <form onSubmit={handleCreateProduct} className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-200 space-y-3">
                  <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wide">
                    Créer un nouveau produit au catalogue
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Nom en Français *
                      </label>
                      <input
                        type="text"
                        value={newNameFr}
                        onChange={(e) => setNewNameFr(e.target.value)}
                        placeholder="Ex: Station à souder JBC C210"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Nom en Arabe
                      </label>
                      <input
                        type="text"
                        value={newNameAr}
                        onChange={(e) => setNewNameAr(e.target.value)}
                        placeholder="Ex: كاوية لحام سريعة"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Réf / SKU
                      </label>
                      <input
                        type="text"
                        value={newSku}
                        onChange={(e) => setNewSku(e.target.value)}
                        placeholder="Ex: JBC-C210-PRO"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Catégorie
                      </label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{getLocalizedName(c)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Marque
                      </label>
                      <input
                        type="text"
                        value={newBrand}
                        onChange={(e) => setNewBrand(e.target.value)}
                        placeholder="Quick, Mechanic..."
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Prix (TND) *
                      </label>
                      <input
                        type="number"
                        value={newPrice}
                        onChange={(e) => setNewPrice(Number(e.target.value))}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Stock Initial
                      </label>
                      <input
                        type="number"
                        value={newStock}
                        onChange={(e) => setNewStock(Number(e.target.value))}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingProduct(false)}
                      className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-700"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
                    >
                      Enregistrer le produit
                    </button>
                  </div>
                </form>
              )}

              {/* Product Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-bold text-[10px]">
                      <tr>
                        <th className="p-3">Produit</th>
                        <th className="p-3">Réf / Marque</th>
                        <th className="p-3">Prix (DT)</th>
                        <th className="p-3">Stock</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {products.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition">
                          <td className="p-3 flex items-center gap-2.5">
                            <img
                              src={getSafeImageUrl(p.images?.[0] || p.image)}
                              alt={getLocalizedName(p)}
                              onError={(e) => handleImageError(e)}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                            />
                            <div className="min-w-0 max-w-xs">
                              <div className="font-bold text-slate-900 truncate">{getLocalizedName(p)}</div>
                              <div className="text-[10px] text-slate-400">{p.category}</div>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="font-mono text-slate-600 block">{p.sku || p.slug || p.id.slice(0, 8)}</span>
                            <span className="text-[10px] font-bold text-orange-600">{p.specs?.brand || p.specifications?.brand || p.brand || 'GSM'}</span>
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              defaultValue={p.priceTND ?? p.price ?? 0}
                              onBlur={(e) => handleUpdatePrice(p.id, Number(e.target.value))}
                              className="w-24 p-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-white"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              defaultValue={p.stock}
                              onBlur={(e) => handleUpdateStock(p.id, Number(e.target.value))}
                              className={`w-16 p-1.5 text-xs font-bold rounded-lg border bg-white ${
                                p.stock <= 5 ? 'border-rose-400 text-rose-600' : 'border-slate-200'
                              }`}
                            />
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ORDERS MANAGEMENT */}
          {activeTab === 'orders' && (
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-bold text-[10px]">
                    <tr>
                      <th className="p-3">N° Commande</th>
                      <th className="p-3">Client & Téléphone</th>
                      <th className="p-3">Destination</th>
                      <th className="p-3">Total (DT)</th>
                      <th className="p-3">Statut Commande</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map(o => (
                      <tr key={o.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3">
                          <strong className="font-mono text-slate-900 block">{o.orderNumber}</strong>
                          <span className="text-[10px] text-slate-400">{new Date(o.createdAt).toLocaleDateString()}</span>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{o.customerName}</div>
                          <a href={`tel:${o.customerPhone}`} className="text-orange-600 font-mono text-[11px] hover:underline">
                            {o.customerPhone}
                          </a>
                        </td>
                        <td className="p-3">
                          <span className="font-medium text-slate-800">{o.delegation || o.shippingAddress?.city || 'Tunis'}</span>
                          <span className="text-slate-400 block text-[10px]">({o.governorate || o.shippingAddress?.governorate || 'Tunisie'})</span>
                        </td>
                        <td className="p-3">
                          <strong className="text-orange-600 font-bold">{formatPrice(o.totalTND ?? o.totalPrice)}</strong>
                          <span className="block text-[10px] text-slate-400 uppercase">{o.paymentMethod}</span>
                        </td>
                        <td className="p-3">
                          <select
                            value={o.orderStatus}
                            onChange={(e) => updateOrderStatus(o.id, e.target.value as any)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800"
                          >
                            <option value="pending">En attente</option>
                            <option value="confirmed">Confirmé</option>
                            <option value="processing">En préparation</option>
                            <option value="shipped">Expédié (Aramex)</option>
                            <option value="delivered">Livré</option>
                            <option value="cancelled">Annulé</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: LOW STOCK ALERTS */}
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div>
                    <strong>Surveillance de rupture de stock</strong>
                    <p className="text-[11px] text-amber-800">
                      Les articles ci-dessous ont un niveau de stock inférieur ou égal à 5 unités.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {lowStockItems.map(item => (
                  <div key={item.id} className="p-4 rounded-xl border border-rose-200 bg-rose-50/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 truncate">
                      <img
                        src={getSafeImageUrl(item.images?.[0] || item.image)}
                        alt={getLocalizedName(item)}
                        onError={(e) => handleImageError(e)}
                        className="w-12 h-12 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                      />
                      <div className="truncate">
                        <h5 className="text-xs font-bold text-slate-900 truncate">{getLocalizedName(item)}</h5>
                        <span className="text-[10px] text-slate-500 font-mono">{item.sku || item.slug || item.id.slice(0, 8)}</span>
                        <div className="text-xs font-black text-rose-600 mt-0.5">
                          Reste : {item.stock} unité(s)
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleQuickRestock(item.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex-shrink-0 shadow-xs"
                    >
                      +20 Stock
                    </button>
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

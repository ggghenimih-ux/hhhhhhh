import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { api } from '../../services/api';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  X,
  Package,
} from 'lucide-react';

interface AdminCategoriesTabProps {
  onRefreshData?: () => void;
}

export const AdminCategoriesTab: React.FC<AdminCategoriesTabProps> = ({ onRefreshData }) => {
  const { categories, refreshCategories, showToast } = useStore();

  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formOrder, setFormOrder] = useState<number>(0);
  const [formIsActive, setFormIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const res = await api.categories.getAll();
      if (res?.data && Array.isArray(res.data)) {
        setCategoriesList(res.data);
      }
    } catch (err: any) {
      showToast(err.message || 'Erreur chargement des catégories.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormName('');
    setFormSlug('');
    setFormDesc('');
    setFormOrder(categoriesList.length + 1);
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: any) => {
    setEditingCategory(cat);
    const catName = typeof cat.name === 'string' ? cat.name : cat.name?.fr || '';
    setFormName(catName);
    setFormSlug(cat.slug || '');
    setFormDesc(typeof cat.description === 'string' ? cat.description : cat.description?.fr || '');
    setFormOrder(cat.order ?? 0);
    setFormIsActive(cat.isActive !== false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Le nom de la catégorie est requis.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const slug = (formSlug || formName).toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      const payload = {
        name: formName.trim(),
        slug,
        description: formDesc.trim() || null,
        order: Number(formOrder),
        isActive: formIsActive,
      };

      if (editingCategory) {
        const res = await api.categories.update(editingCategory.id, payload);
        if (res?.data) {
          showToast('Catégorie mise à jour avec succès.', 'success');
          setCategoriesList((prev) =>
            prev.map((c) => (c.id === editingCategory.id ? { ...c, ...res.data } : c))
          );
        }
      } else {
        const res = await api.categories.create(payload);
        if (res?.data) {
          showToast('Nouvelle catégorie créée avec succès.', 'success');
          setCategoriesList((prev) => [...prev, res.data]);
        }
      }

      setIsModalOpen(false);
      refreshCategories();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      showToast(err.message || 'Erreur enregistrement catégorie.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Confirmez-vous la suppression de la catégorie "${name}" ?`)) return;

    try {
      await api.categories.delete(id);
      showToast('Catégorie supprimée avec succès.', 'success');
      setCategoriesList((prev) => prev.filter((c) => c.id !== id));
      refreshCategories();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      showToast(err.message || 'Impossible de supprimer cette catégorie.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-orange-600" />
            <span>Gestion des Rayons & Catégories ({categoriesList.length})</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Organisez la navigation et l'arborescence du catalogue pour les ateliers et techniciens.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchCategories}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
            title="Actualiser"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter une Catégorie</span>
          </button>
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-orange-600" />
            <p>Chargement des catégories...</p>
          </div>
        ) : categoriesList.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <FolderTree className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">Aucune catégorie enregistrée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 text-start">Ordre</th>
                  <th className="py-3.5 px-4 text-start">Nom de la Catégorie</th>
                  <th className="py-3.5 px-4 text-start">Slug URL</th>
                  <th className="py-3.5 px-4 text-center">Produits Rattachés</th>
                  <th className="py-3.5 px-4 text-center">Statut</th>
                  <th className="py-3.5 px-4 text-end">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categoriesList.map((cat) => {
                  const catName = typeof cat.name === 'string' ? cat.name : cat.name?.fr || 'Catégorie';
                  const isActive = cat.isActive !== false;

                  return (
                    <tr key={cat.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-400">
                        #{cat.order ?? 0}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{catName}</div>
                        {cat.description && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">
                            {typeof cat.description === 'string' ? cat.description : cat.description?.fr}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {cat.slug}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                          <Package className="w-3 h-3 text-slate-400" />
                          <span>{cat.productsCount ?? 0}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>{isActive ? 'Active' : 'Désactivée'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(cat)}
                            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                            title="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(cat.id, catName)}
                            className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      </div>

      {/* CREATE / EDIT CATEGORY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-orange-400" />
                <h3 className="text-sm font-bold">
                  {editingCategory ? `Modifier : ${formName}` : 'Nouvelle Catégorie GSM'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nom de la Catégorie *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Stations de Soudure"
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
                  placeholder="stations-de-soudure"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ordre d'affichage</label>
                <input
                  type="number"
                  value={formOrder}
                  onChange={(e) => setFormOrder(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description courte</label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Matériel de soudure pour micro-électronique..."
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                  />
                  <span>Catégorie Active (Affichée sur le site)</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold transition shadow-md disabled:bg-slate-400"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <span>{editingCategory ? 'Mettre à jour' : 'Créer la catégorie'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

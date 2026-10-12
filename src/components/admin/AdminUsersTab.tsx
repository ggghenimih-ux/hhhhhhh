import React, { useEffect, useState } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, RefreshCw, Search, Users } from 'lucide-react';
import { api } from '../../services/api';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
  _count: { orders: number };
}

export const AdminUsersTab: React.FC = () => {
  const { showToast } = useStore();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await api.adminUsers.getAll({ page, limit: 25, search });
      setUsers(response.data || []);
      setTotal(response.pagination?.total || 0);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Impossible de charger les utilisateurs.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchUsers();
  }, [page, search]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleRoleChange = async (target: AdminUser) => {
    const role = target.role === 'ADMIN' ? 'CUSTOMER' : 'ADMIN';
    if (target.id === currentUser?.id && role !== 'ADMIN') {
      showToast('Vous ne pouvez pas retirer votre propre rôle administrateur.', 'error');
      return;
    }
    try {
      setUpdatingUserId(target.id);
      const response = await api.adminUsers.updateRole(target.id, role);
      if (!response?.data) throw new Error(response?.message || 'Le serveur n’a pas renvoyé le rôle modifié.');
      setUsers((current) => current.map((item) => item.id === target.id
        ? { ...item, ...response.data }
        : item));
      showToast(`Rôle modifié : ${role}.`, 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Impossible de modifier le rôle.', 'error');
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <section className="space-y-5">
      <header className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Users className="h-5 w-5 text-orange-600" />
            Utilisateurs ({total})
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Liste paginée des comptes et du nombre de commandes associées.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchUsers()}
          disabled={isLoading}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </header>

      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p className="text-xs leading-relaxed">
          Les rôles peuvent être modifiés ici. La suppression de comptes reste désactivée tant
          qu’une règle d’inactivité vérifiable et la synchronisation avec Firebase ne sont pas configurées.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Rechercher par nom, e-mail ou téléphone"
            className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-xs"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
        >
          Rechercher
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Téléphone</th>
              <th className="px-4 py-3">Rôle</th>
              <th className="px-4 py-3">Commandes</th>
              <th className="px-4 py-3">Créé le</th>
              <th className="px-4 py-3">Gestion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                  Chargement des utilisateurs…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                  Aucun utilisateur trouvé.
                </td>
              </tr>
            ) : users.map((user) => (
              <tr key={user.id} className="text-slate-700">
                <td className="px-4 py-3 font-semibold">{user.name}</td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">{user.phone || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                    user.role === 'ADMIN'
                      ? 'bg-violet-100 text-violet-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3">{user._count.orders}</td>
                <td className="px-4 py-3">
                  {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => void handleRoleChange(user)}
                    disabled={updatingUserId !== null || (user.id === currentUser?.id && user.role === 'ADMIN')}
                    className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-[10px] font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {updatingUserId === user.id ? 'Mise à jour…' : user.role === 'ADMIN' ? 'Rétrograder' : 'Promouvoir ADMIN'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-600">
        <span>Page {page} / {totalPages}</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1 || isLoading}
            className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
            aria-label="Page précédente"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page >= totalPages || isLoading}
            className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
            aria-label="Page suivante"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

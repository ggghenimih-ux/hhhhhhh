import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { api } from '../../services/api';
import { useDialogAccessibility } from '../../hooks/useDialogAccessibility';
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
  initialProductId?: string;
  initialProductAction?: 'edit' | 'delete';
  onInitialActionHandled?: () => void;
}

export const AdminProductsTab: React.FC<AdminProductsTabProps> = ({
  onRefreshData,
  initialProductId,
  initialProductAction,
  onInitialActionHandled,
}) => {
  const { categories, formatPrice, refreshProducts, showToast, navigateTo } = useStore();

  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search & Sort & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'name'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Deletion & Confirmation Modal State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<any | null>(null);
  const deleteDialogRef = useDialogAccessibility(Boolean(productToDelete), () => setProductToDelete(null));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Gestion des Produits</h2>
          <p className="text-sm text-gray-500">Gérez votre catalogue de produits et stocks.</p>
        </div>
      </div>
    </div>
  );
};
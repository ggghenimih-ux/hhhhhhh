import React from 'react';
import { useStore } from '../context/StoreContext';
import { LucideIcon } from 'lucide-react';

interface CategoryCardProps {
  id: string;
  name: string;
  icon: LucideIcon;
  count?: number;
  image?: string;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  id,
  name,
  icon: Icon,
  count,
  image,
}) => {
  const { setFilters, navigateTo } = useStore();

  const handleClick = () => {
    setFilters((prev) => ({
      ...prev,
      category: id,
      subcategory: null,
      searchQuery: '',
    }));
    navigateTo('category', { categorySlug: id });
  };

  return (
    <div
      onClick={handleClick}
      className="group bg-white rounded-xl border border-slate-200 p-4 hover:border-orange-500 hover:shadow-sm transition-all cursor-pointer flex flex-col items-center text-center justify-center min-h-[140px]"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`Voir la catégorie ${name}`}
    >
      <div className="w-12 h-12 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center mb-3 group-hover:bg-orange-600 group-hover:text-white transition-colors duration-200">
        <Icon className="w-6 h-6" />
      </div>

      <h3 className="text-sm font-semibold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1">
        {name}
      </h3>

      {typeof count === 'number' && (
        <span className="text-[11px] text-slate-400 mt-1">
          {count} {count > 1 ? 'articles' : 'article'}
        </span>
      )}
    </div>
  );
};

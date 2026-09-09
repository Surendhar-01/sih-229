import React, { useState, useMemo } from 'react';
import { X, Search, Laptop, Refrigerator, Tv, Cpu, Cable, AlertTriangle, Check } from 'lucide-react';
import { MaterialCategory, MaterialSubcategory } from '../../services/lotsService';
import { useTranslation } from 'react-i18next';

interface CategorySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: MaterialCategory[];
  selectedCategoryId?: number;
  selectedMaterialId?: number;
  onSelect: (category: MaterialCategory, subcategory?: MaterialSubcategory) => void;
}

export const CategorySelectorModal: React.FC<CategorySelectorModalProps> = ({
  isOpen,
  onClose,
  categories,
  selectedCategoryId,
  selectedMaterialId,
  onSelect,
}) => {
  const { i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const currentLang = i18n.language || 'en';

  const getLocalizedName = (item: { name: string; display_names?: Record<string, string> }) => {
    if (item.display_names && item.display_names[currentLang]) {
      return item.display_names[currentLang];
    }
    if (item.display_names && item.display_names.en) {
      return item.display_names.en;
    }
    return item.name;
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName?.toLowerCase()) {
      case 'laptop':
        return <Laptop className="w-5 h-5" />;
      case 'refrigerator':
        return <Refrigerator className="w-5 h-5" />;
      case 'tv':
        return <Tv className="w-5 h-5" />;
      case 'cpu':
        return <Cpu className="w-5 h-5" />;
      case 'cable':
      default:
        return <Cable className="w-5 h-5" />;
    }
  };

  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;
    const lower = searchTerm.toLowerCase();

    return categories
      .map((cat) => {
        const catNameMatch = getLocalizedName(cat).toLowerCase().includes(lower);
        const matchedSubcategories = (cat.subcategories || []).filter((sub) =>
          getLocalizedName(sub).toLowerCase().includes(lower)
        );

        if (catNameMatch) return cat;
        if (matchedSubcategories.length > 0) {
          return { ...cat, subcategories: matchedSubcategories };
        }
        return null;
      })
      .filter((c): c is MaterialCategory => c !== null);
  }, [categories, searchTerm, currentLang]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90">
          <div>
            <h3 className="text-lg font-bold text-white">Select E-Waste Material Category</h3>
            <p className="text-xs text-slate-400">
              Pick the specific category that best matches your electronic item
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/50">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search e-waste categories (e.g., Laptop, Battery, Refrigerator, Cable)..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Category List Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              No categories found matching "{searchTerm}".
            </div>
          ) : (
            filteredCategories.map((cat) => (
              <div
                key={cat.id}
                className="rounded-xl border border-slate-800 bg-slate-850/60 overflow-hidden hover:border-slate-700 transition"
              >
                {/* Category Header */}
                <div
                  onClick={() => onSelect(cat)}
                  className="flex items-center justify-between p-3.5 bg-slate-800/40 hover:bg-slate-800/80 cursor-pointer transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                      {getCategoryIcon(cat.icon_name)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {getLocalizedName(cat)}
                        </span>
                        {cat.is_hazardous && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <AlertTriangle className="w-3 h-3" />
                            Hazardous
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1">{cat.description}</p>
                    </div>
                  </div>

                  {selectedCategoryId === cat.id && !selectedMaterialId && (
                    <div className="p-1 rounded-full bg-emerald-500 text-white">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Subcategories */}
                {cat.subcategories && cat.subcategories.length > 0 && (
                  <div className="p-2.5 bg-slate-900/60 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {cat.subcategories.map((sub) => {
                      const isSubSelected =
                        selectedCategoryId === cat.id && selectedMaterialId === sub.id;

                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => onSelect(cat, sub)}
                          className={`flex items-center justify-between p-2 rounded-lg text-left text-xs transition ${
                            isSubSelected
                              ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                              : 'bg-slate-800/50 hover:bg-slate-800 text-slate-300 border border-slate-700/50'
                          }`}
                        >
                          <span>{getLocalizedName(sub)}</span>
                          {isSubSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-medium text-slate-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

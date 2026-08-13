export interface CategoryNavItem {
  id: string;
  name: string;
  imageId?: string | null;
  productCount: number;
}

export interface StorefrontCategoryNavProps {
  categories: CategoryNavItem[];
  activeCategoryId: string | null;
  onSelect: (categoryId: string) => void;
}

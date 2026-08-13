"use client";

import { Badge, Button, EmptyState, SortableList, toast } from "@qr-platform/ui";
import { GripVertical, ListTree, Loader2, Pencil, Plus, Tag, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import { CategoryFormDialog } from "./CategoryFormDialog";

import { ROUTES } from "@/config/routes";
import { deleteCategory, reorderCategories } from "@/services/category.service";
import type { Category } from "@/types/catalog";

export interface CategoryListProps {
  menuId: string;
  initialCategories: Category[];
}

export function CategoryList({ menuId, initialCategories }: CategoryListProps) {
  const [categories, setCategories] = useState<Category[]>(
    [...initialCategories].sort((a, b) => a.sortOrder - b.sortOrder),
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // `deletingId` (React state) drives the visible spinner/disabled row, but
  // its update is async - two clicks dispatched in the same tick (a real,
  // reproducible race, confirmed via a raw-DOM double dispatch, not just a
  // hypothetical) both read the OLD `deletingId` before either commits, so
  // both pass a state-only guard. A ref updates synchronously and closes
  // this window; window.confirm() is a second, string reason a state-only
  // check isn't enough - it's a blocking dialog that gives a second
  // dispatched click plenty of time to run its own confirm() before the
  // first click's state update has committed.
  const isDeletingRef = useRef(false);

  const handleSaved = (category: Category): void => {
    setCategories((current) => {
      const exists = current.some((item) => item.id === category.id);
      return exists
        ? current.map((item) => (item.id === category.id ? category : item))
        : [...current, category];
    });
  };

  const handleDelete = async (category: Category): Promise<void> => {
    if (isDeletingRef.current) {
      return;
    }
    isDeletingRef.current = true;

    if (!window.confirm(`"${category.name}" kategorisini silmek istediğinize emin misiniz?`)) {
      isDeletingRef.current = false;
      return;
    }

    setDeletingId(category.id);
    const result = await deleteCategory(category.id);
    setDeletingId(null);
    isDeletingRef.current = false;

    if (result.status === "error") {
      toast({ title: "Silinemedi", description: result.message, variant: "destructive" });
      return;
    }

    setCategories((current) => current.filter((item) => item.id !== category.id));
  };

  const handleReorder = async (reordered: Category[]): Promise<void> => {
    setCategories(reordered);
    const items = reordered.map((category, index) => ({ id: category.id, sortOrder: index }));
    const result = await reorderCategories(items);

    if (result.status === "error") {
      toast({ title: "Sıralama kaydedilemedi", description: result.message, variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={() => {
            setEditingCategory(undefined);
            setIsDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Yeni Kategori
        </Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          icon={ListTree}
          title="Henüz kategori yok"
          description="Bu menüye ilk kategoriyi ekleyin."
          action={
            <Button type="button" onClick={() => setIsDialogOpen(true)}>
              Yeni Kategori
            </Button>
          }
        />
      ) : (
        <SortableList
          items={categories}
          onReorder={(reordered) => void handleReorder(reordered)}
          renderItem={(category, { dragHandleAttributes, dragHandleListeners }) => (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
              <button
                type="button"
                className="cursor-grab text-muted-foreground active:cursor-grabbing"
                aria-label="Sürükle"
                {...dragHandleAttributes}
                {...dragHandleListeners}
              >
                <GripVertical className="h-4 w-4" aria-hidden="true" />
              </button>
              <div className="flex flex-1 items-center gap-2">
                <span className="font-medium text-foreground">{category.name}</span>
                {!category.active ? <Badge variant="secondary">Pasif</Badge> : null}
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`${ROUTES.businessProducts}?categoryId=${category.id}`}>
                  <Tag className="h-4 w-4" aria-hidden="true" />
                  Ürünler
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Düzenle"
                onClick={() => {
                  setEditingCategory(category);
                  setIsDialogOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                aria-label="Sil"
                disabled={deletingId === category.id}
                onClick={() => void handleDelete(category)}
              >
                {deletingId === category.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                )}
              </Button>
            </div>
          )}
        />
      )}

      <CategoryFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        menuId={menuId}
        category={editingCategory}
        onSaved={handleSaved}
      />
    </div>
  );
}

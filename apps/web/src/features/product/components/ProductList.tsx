"use client";

import { Badge, Button, Checkbox, EmptyState, Input, SortableList, Switch, toast } from "@qr-platform/ui";
import { Archive, Copy, GripVertical, ListChecks, Loader2, Pencil, Plus, RotateCcw, Tag } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ProductDetailDrawer } from "./ProductDetailDrawer";
import { ProductFormDialog } from "./ProductFormDialog";

import {
  bulkUpdateProducts,
  deleteProduct,
  duplicateProduct,
  listProductsByCategory,
  reorderProducts,
  restoreProduct,
  updateProduct,
} from "@/services/product.service";
import type { ProductListStatus } from "@/services/product.service";
import type { Product } from "@/types/catalog";

export interface ProductListProps {
  categoryId: string;
  initialProducts: Product[];
}

export function ProductList({ categoryId, initialProducts }: ProductListProps) {
  const [status, setStatus] = useState<ProductListStatus>("active");
  const [products, setProducts] = useState<Product[]>(
    [...initialProducts].sort((a, b) => a.sortOrder - b.sortOrder),
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [detailProduct, setDetailProduct] = useState<Product | undefined>(undefined);
  // One shared "which row is busy" flag - archive/restore/duplicate are
  // mutually exclusive per row in practice, so a single id is enough to
  // disable that row's buttons and guard against a rapid double click.
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isBulkPending, setIsBulkPending] = useState(false);
  // See CategoryList's own comment for why a ref, not just state, guards
  // against a rapid double click - shared across archive/restore/duplicate
  // since they're mutually exclusive per row anyway.
  const isRowPendingRef = useRef(false);
  const isBulkPendingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      const result = await listProductsByCategory(categoryId, status);
      if (!cancelled && result.status === "success") {
        setProducts([...result.data].sort((a, b) => a.sortOrder - b.sortOrder));
        setSelectedIds(new Set());
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [categoryId, status]);

  const handleSaved = (product: Product): void => {
    setProducts((current) => {
      const exists = current.some((item) => item.id === product.id);
      return exists
        ? current.map((item) => (item.id === product.id ? { ...item, ...product } : item))
        : [...current, product];
    });
  };

  const handleArchive = async (product: Product): Promise<void> => {
    if (isRowPendingRef.current) {
      return;
    }
    isRowPendingRef.current = true;

    if (!window.confirm(`"${product.name}" ürününü arşivlemek istediğinize emin misiniz?`)) {
      isRowPendingRef.current = false;
      return;
    }

    setPendingId(product.id);
    const result = await deleteProduct(product.id);
    setPendingId(null);
    isRowPendingRef.current = false;

    if (result.status === "error") {
      toast({ title: "Arşivlenemedi", description: result.message, variant: "destructive" });
      return;
    }

    setProducts((current) => current.filter((item) => item.id !== product.id));
  };

  const handleRestore = async (product: Product): Promise<void> => {
    if (isRowPendingRef.current) {
      return;
    }
    isRowPendingRef.current = true;

    setPendingId(product.id);
    const result = await restoreProduct(product.id);
    setPendingId(null);
    isRowPendingRef.current = false;

    if (result.status === "error") {
      toast({ title: "Geri getirilemedi", description: result.message, variant: "destructive" });
      return;
    }

    setProducts((current) => current.filter((item) => item.id !== product.id));
    toast({ title: "Ürün arşivden çıkarıldı", variant: "success" });
  };

  const handleDuplicate = async (product: Product): Promise<void> => {
    if (isRowPendingRef.current) {
      return;
    }
    isRowPendingRef.current = true;

    setPendingId(product.id);
    const result = await duplicateProduct(product.id);
    setPendingId(null);
    isRowPendingRef.current = false;

    if (result.status === "error") {
      toast({ title: "Kopyalanamadı", description: result.message, variant: "destructive" });
      return;
    }

    setProducts((current) => [...current, result.data]);
    toast({ title: "Ürün kopyalandı", variant: "success" });
  };

  const handleQuickField = async (product: Product, patch: { isAvailable?: boolean; isFeatured?: boolean }): Promise<void> => {
    setProducts((current) => current.map((item) => (item.id === product.id ? { ...item, ...patch } : item)));
    const result = await updateProduct(product.id, patch);

    if (result.status === "error") {
      toast({ title: "Güncellenemedi", description: result.message, variant: "destructive" });
      setProducts((current) => current.map((item) => (item.id === product.id ? product : item)));
    }
  };

  const handlePriceChange = async (product: Product, price: number): Promise<void> => {
    if (Number.isNaN(price) || price <= 0 || String(price) === product.price) {
      return;
    }

    setProducts((current) =>
      current.map((item) => (item.id === product.id ? { ...item, price: String(price) } : item)),
    );
    const result = await updateProduct(product.id, { price });

    if (result.status === "error") {
      toast({ title: "Fiyat güncellenemedi", description: result.message, variant: "destructive" });
    }
  };

  const handleReorder = async (reordered: Product[]): Promise<void> => {
    setProducts(reordered);
    const items = reordered.map((product, index) => ({ id: product.id, sortOrder: index }));
    const result = await reorderProducts(items);

    if (result.status === "error") {
      toast({ title: "Sıralama kaydedilemedi", description: result.message, variant: "destructive" });
    }
  };

  const toggleSelected = (id: string): void => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBulkAction = async (data: { isAvailable?: boolean; isFeatured?: boolean; archived?: boolean }): Promise<void> => {
    const ids = [...selectedIds];
    if (ids.length === 0 || isBulkPendingRef.current) {
      return;
    }
    isBulkPendingRef.current = true;

    setIsBulkPending(true);
    const result = await bulkUpdateProducts({ ids, data });
    setIsBulkPending(false);
    isBulkPendingRef.current = false;

    if (result.status === "error") {
      toast({ title: "Toplu işlem başarısız", description: result.message, variant: "destructive" });
      return;
    }

    setProducts((current) =>
      data.archived
        ? current.filter((item) => !ids.includes(item.id))
        : current.map((item) => (ids.includes(item.id) ? { ...item, ...data } : item)),
    );
    setSelectedIds(new Set());
    toast({ title: `${result.data.updated} ürün güncellendi`, variant: "success" });
  };

  const isArchivedView = status === "archived";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          <Button
            type="button"
            size="sm"
            variant={status === "active" ? "primary" : "ghost"}
            onClick={() => setStatus("active")}
          >
            Aktif
          </Button>
          <Button
            type="button"
            size="sm"
            variant={status === "archived" ? "primary" : "ghost"}
            onClick={() => setStatus("archived")}
          >
            Arşivlenenler
          </Button>
        </div>
        {!isArchivedView ? (
          <Button
            type="button"
            onClick={() => {
              setEditingProduct(undefined);
              setIsDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Yeni Ürün
          </Button>
        ) : null}
      </div>

      {selectedIds.size > 0 ? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3">
          <span className="text-sm font-medium text-foreground">{selectedIds.size} ürün seçildi</span>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" disabled={isBulkPending} onClick={() => void handleBulkAction({ isAvailable: true })}>
              {isBulkPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              Aktif Yap
            </Button>
            <Button size="sm" variant="outline" disabled={isBulkPending} onClick={() => void handleBulkAction({ isAvailable: false })}>
              Pasif Yap
            </Button>
            <Button size="sm" variant="outline" disabled={isBulkPending} onClick={() => void handleBulkAction({ isFeatured: true })}>
              Öne Çıkar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive"
              disabled={isBulkPending}
              onClick={() => void handleBulkAction({ archived: true })}
            >
              Arşivle
            </Button>
          </div>
        </div>
      ) : null}

      {products.length === 0 ? (
        <EmptyState
          icon={Tag}
          title={isArchivedView ? "Arşivlenmiş ürün yok" : "Henüz ürün yok"}
          description={isArchivedView ? "Arşivlenen ürünler burada listelenir." : "Bu kategoriye ilk ürünü ekleyin."}
          action={
            !isArchivedView ? (
              <Button type="button" onClick={() => setIsDialogOpen(true)}>
                Yeni Ürün
              </Button>
            ) : undefined
          }
        />
      ) : isArchivedView ? (
        <div className="flex flex-col gap-2">
          {products.map((product) => (
            <div key={product.id} className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
              <div className="flex flex-1 flex-col">
                <span className="font-medium text-foreground">{product.name}</span>
                <span className="text-sm text-muted-foreground">{product.price} ₺</span>
              </div>
              <Button variant="outline" size="sm" disabled={pendingId === product.id} onClick={() => void handleRestore(product)}>
                {pendingId === product.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                )}
                Geri Getir
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <SortableList
          items={products}
          onReorder={(reordered) => void handleReorder(reordered)}
          renderItem={(product, { dragHandleAttributes, dragHandleListeners }) => (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-background p-3">
              <Checkbox
                checked={selectedIds.has(product.id)}
                onCheckedChange={() => toggleSelected(product.id)}
                aria-label={`${product.name} seç`}
              />
              <button
                type="button"
                className="cursor-grab text-muted-foreground active:cursor-grabbing"
                aria-label="Sürükle"
                {...dragHandleAttributes}
                {...dragHandleListeners}
              >
                <GripVertical className="h-4 w-4" aria-hidden="true" />
              </button>
              <div className="flex min-w-[160px] flex-1 flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{product.name}</span>
                  {product.isFeatured ? <Badge variant="success">Öne Çıkan</Badge> : null}
                  {!product.isAvailable ? <Badge variant="secondary">Satışta Değil</Badge> : null}
                </div>
                <Input
                  type="number"
                  step="0.01"
                  defaultValue={product.price}
                  onBlur={(event) => void handlePriceChange(product, Number(event.target.value))}
                  className="h-7 w-24 text-sm"
                  aria-label="Fiyat"
                />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Switch
                  checked={product.isAvailable}
                  onCheckedChange={(checked) => void handleQuickField(product, { isAvailable: checked })}
                  aria-label="Aktif/Pasif"
                />
                <span className="hidden sm:inline">Aktif</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Switch
                  checked={product.isFeatured}
                  onCheckedChange={(checked) => void handleQuickField(product, { isFeatured: checked })}
                  aria-label="Öne çıkar"
                />
                <span className="hidden sm:inline">Öne Çıkar</span>
              </div>
              <Button variant="outline" size="sm" aria-label="Variant/Seçenek" onClick={() => setDetailProduct(product)}>
                <ListChecks className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Variant/Seçenek</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Kopyala"
                disabled={pendingId === product.id}
                onClick={() => void handleDuplicate(product)}
              >
                {pendingId === product.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden="true" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Düzenle"
                onClick={() => {
                  setEditingProduct(product);
                  setIsDialogOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                aria-label="Arşivle"
                disabled={pendingId === product.id}
                onClick={() => void handleArchive(product)}
              >
                {pendingId === product.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Archive className="h-4 w-4" aria-hidden="true" />
                )}
              </Button>
            </div>
          )}
        />
      )}

      <ProductFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        categoryId={categoryId}
        product={editingProduct}
        onSaved={handleSaved}
      />

      {detailProduct ? (
        <ProductDetailDrawer
          open={Boolean(detailProduct)}
          onOpenChange={(open) => {
            if (!open) {
              setDetailProduct(undefined);
            }
          }}
          product={detailProduct}
        />
      ) : null}
    </div>
  );
}

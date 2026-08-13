"use client";

import { Button, Checkbox, Drawer, DrawerContent, Input, Label, SortableList, toast } from "@qr-platform/ui";
import { GripVertical, Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  createOption,
  createOptionGroup,
  createVariant,
  deleteOption,
  deleteOptionGroup,
  deleteVariant,
  reorderOptionGroups,
  reorderOptions,
  reorderVariants,
} from "@/services/product.service";
import type { OptionGroup, Product, ProductOption, Variant } from "@/types/catalog";

export interface ProductDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
}

export function ProductDetailDrawer({ open, onOpenChange, product }: ProductDetailDrawerProps) {
  const [variants, setVariants] = useState<Variant[]>(product.variants ?? []);
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>(product.optionGroups ?? []);

  useEffect(() => {
    setVariants(product.variants ?? []);
    setOptionGroups(product.optionGroups ?? []);
  }, [product]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent side="right" className="max-w-lg gap-6 overflow-y-auto">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{product.name}</h2>
          <p className="text-sm text-muted-foreground">Variant ve seçenek gruplarını yönetin.</p>
        </div>

        <VariantSection productId={product.id} variants={variants} onChange={setVariants} />
        <OptionGroupSection productId={product.id} optionGroups={optionGroups} onChange={setOptionGroups} />
      </DrawerContent>
    </Drawer>
  );
}

function VariantSection({
  productId,
  variants,
  onChange,
}: {
  productId: string;
  variants: Variant[];
  onChange: (variants: Variant[]) => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // See CategoryList's own comment for why a ref, not just state.
  const isDeletingRef = useRef(false);

  const handleAdd = async (): Promise<void> => {
    if (!name.trim() || !price) {
      return;
    }

    setIsSubmitting(true);
    const result = await createVariant(productId, { name: name.trim(), price: Number(price) });
    setIsSubmitting(false);

    if (result.status === "error") {
      toast({ title: "Variant eklenemedi", description: result.message, variant: "destructive" });
      return;
    }

    onChange([...variants, result.data]);
    setName("");
    setPrice("");
  };

  const handleDelete = async (variant: Variant): Promise<void> => {
    if (isDeletingRef.current) {
      return;
    }
    isDeletingRef.current = true;

    setDeletingId(variant.id);
    const result = await deleteVariant(variant.id);
    setDeletingId(null);
    isDeletingRef.current = false;

    if (result.status === "error") {
      toast({ title: "Silinemedi", description: result.message, variant: "destructive" });
      return;
    }

    onChange(variants.filter((item) => item.id !== variant.id));
  };

  const handleReorder = async (reordered: Variant[]): Promise<void> => {
    onChange(reordered);
    const items = reordered.map((variant, index) => ({ id: variant.id, sortOrder: index }));
    const result = await reorderVariants(items);

    if (result.status === "error") {
      toast({ title: "Sıralama kaydedilemedi", description: result.message, variant: "destructive" });
    }
  };

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-foreground">Variantlar</h3>
      {variants.length === 0 ? (
        <p className="text-sm text-muted-foreground">Henüz variant eklenmedi (örn. Küçük/Orta/Büyük).</p>
      ) : (
        <SortableList
          items={variants}
          onReorder={(reordered) => void handleReorder(reordered)}
          renderItem={(variant, { dragHandleAttributes, dragHandleListeners }) => (
            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="cursor-grab text-muted-foreground active:cursor-grabbing"
                  aria-label="Sürükle"
                  {...dragHandleAttributes}
                  {...dragHandleListeners}
                >
                  <GripVertical className="h-4 w-4" aria-hidden="true" />
                </button>
                <span>
                  {variant.name} — {variant.price} ₺
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                aria-label="Sil"
                disabled={deletingId === variant.id}
                onClick={() => void handleDelete(variant)}
              >
                {deletingId === variant.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
        />
      )}
      <div className="flex gap-2">
        <Input placeholder="Ad (örn. Büyük)" value={name} onChange={(e) => setName(e.target.value)} />
        <Input
          placeholder="Fiyat"
          type="number"
          step="0.01"
          className="max-w-28"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <Button
          type="button"
          variant="outline"
          aria-label="Variant ekle"
          isLoading={isSubmitting}
          onClick={() => void handleAdd()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}

function OptionGroupSection({
  productId,
  optionGroups,
  onChange,
}: {
  productId: string;
  optionGroups: OptionGroup[];
  onChange: (groups: OptionGroup[]) => void;
}) {
  const [name, setName] = useState("");
  const [multiple, setMultiple] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // See CategoryList's own comment for why a ref, not just state.
  const isDeletingRef = useRef(false);

  const handleAdd = async (): Promise<void> => {
    if (!name.trim()) {
      return;
    }

    setIsSubmitting(true);
    const result = await createOptionGroup(productId, { name: name.trim(), multiple });
    setIsSubmitting(false);

    if (result.status === "error") {
      toast({ title: "Seçenek grubu eklenemedi", description: result.message, variant: "destructive" });
      return;
    }

    onChange([...optionGroups, { ...result.data, options: [] }]);
    setName("");
    setMultiple(false);
  };

  const handleDeleteGroup = async (group: OptionGroup): Promise<void> => {
    if (isDeletingRef.current) {
      return;
    }
    isDeletingRef.current = true;

    setDeletingId(group.id);
    const result = await deleteOptionGroup(group.id);
    setDeletingId(null);
    isDeletingRef.current = false;

    if (result.status === "error") {
      toast({ title: "Silinemedi", description: result.message, variant: "destructive" });
      return;
    }

    onChange(optionGroups.filter((item) => item.id !== group.id));
  };

  const handleGroupOptionsChange = (groupId: string, options: ProductOption[]): void => {
    onChange(optionGroups.map((group) => (group.id === groupId ? { ...group, options } : group)));
  };

  const handleReorder = async (reordered: OptionGroup[]): Promise<void> => {
    onChange(reordered);
    const items = reordered.map((group, index) => ({ id: group.id, sortOrder: index }));
    const result = await reorderOptionGroups(items);

    if (result.status === "error") {
      toast({ title: "Sıralama kaydedilemedi", description: result.message, variant: "destructive" });
    }
  };

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-foreground">Seçenek Grupları</h3>
      {optionGroups.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Henüz seçenek grubu yok (örn. Ekstralar, Soslar, Pişirme).
        </p>
      ) : (
        <SortableList
          items={optionGroups}
          onReorder={(reordered) => void handleReorder(reordered)}
          renderItem={(group, { dragHandleAttributes, dragHandleListeners }) => (
            <div className="rounded-md border border-border p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="cursor-grab text-muted-foreground active:cursor-grabbing"
                    aria-label="Sürükle"
                    {...dragHandleAttributes}
                    {...dragHandleListeners}
                  >
                    <GripVertical className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <span className="text-sm font-medium text-foreground">
                    {group.name} {group.multiple ? "(çoklu seçim)" : "(tekli seçim)"}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  aria-label="Sil"
                  disabled={deletingId === group.id}
                  onClick={() => void handleDeleteGroup(group)}
                >
                  {deletingId === group.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <OptionList
                optionGroupId={group.id}
                options={group.options ?? []}
                onChange={(options) => handleGroupOptionsChange(group.id, options)}
              />
            </div>
          )}
        />
      )}
      <div className="flex items-center gap-2">
        <Input placeholder="Grup adı (örn. Ekstralar)" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
          <Checkbox
            id="option-group-multiple"
            checked={multiple}
            onCheckedChange={(checked) => setMultiple(checked === true)}
          />
          <Label htmlFor="option-group-multiple" className="cursor-pointer font-normal">
            Çoklu
          </Label>
        </div>
        <Button
          type="button"
          variant="outline"
          aria-label="Seçenek grubu ekle"
          isLoading={isSubmitting}
          onClick={() => void handleAdd()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}

function OptionList({
  optionGroupId,
  options,
  onChange,
}: {
  optionGroupId: string;
  options: ProductOption[];
  onChange: (options: ProductOption[]) => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // See CategoryList's own comment for why a ref, not just state.
  const isDeletingRef = useRef(false);

  const handleAdd = async (): Promise<void> => {
    if (!name.trim()) {
      return;
    }

    setIsSubmitting(true);
    const result = await createOption(optionGroupId, {
      name: name.trim(),
      price: price ? Number(price) : 0,
    });
    setIsSubmitting(false);

    if (result.status === "error") {
      toast({ title: "Seçenek eklenemedi", description: result.message, variant: "destructive" });
      return;
    }

    onChange([...options, result.data]);
    setName("");
    setPrice("");
  };

  const handleDelete = async (option: ProductOption): Promise<void> => {
    if (isDeletingRef.current) {
      return;
    }
    isDeletingRef.current = true;

    setDeletingId(option.id);
    const result = await deleteOption(option.id);
    setDeletingId(null);
    isDeletingRef.current = false;

    if (result.status === "error") {
      toast({ title: "Silinemedi", description: result.message, variant: "destructive" });
      return;
    }

    onChange(options.filter((item) => item.id !== option.id));
  };

  const handleReorder = async (reordered: ProductOption[]): Promise<void> => {
    onChange(reordered);
    const items = reordered.map((option, index) => ({ id: option.id, sortOrder: index }));
    const result = await reorderOptions(items);

    if (result.status === "error") {
      toast({ title: "Sıralama kaydedilemedi", description: result.message, variant: "destructive" });
    }
  };

  return (
    <div className="mt-2 flex flex-col gap-2 border-t border-border pt-2">
      {options.length > 0 ? (
        <SortableList
          items={options}
          onReorder={(reordered) => void handleReorder(reordered)}
          renderItem={(option, { dragHandleAttributes, dragHandleListeners }) => (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="cursor-grab text-muted-foreground active:cursor-grabbing"
                  aria-label="Sürükle"
                  {...dragHandleAttributes}
                  {...dragHandleListeners}
                >
                  <GripVertical className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <span>
                  {option.name}
                  {Number(option.price) > 0 ? ` (+${option.price} ₺)` : ""}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive"
                aria-label="Sil"
                disabled={deletingId === option.id}
                onClick={() => void handleDelete(option)}
              >
                {deletingId === option.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          )}
        />
      ) : null}
      <div className="flex gap-2">
        <Input
          placeholder="Seçenek adı"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-8 text-sm"
        />
        <Input
          placeholder="Ek fiyat"
          type="number"
          step="0.01"
          className="h-8 max-w-24 text-sm"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Seçenek ekle"
          isLoading={isSubmitting}
          onClick={() => void handleAdd()}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

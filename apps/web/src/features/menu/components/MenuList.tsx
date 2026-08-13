"use client";

import {
  Badge,
  Button,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from "@qr-platform/ui";
import { ListTree, Loader2, Pencil, Plus, Trash2, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import { MenuFormDialog } from "./MenuFormDialog";

import { ROUTES } from "@/config/routes";
import { deleteMenu } from "@/services/menu.service";
import type { Menu } from "@/types/catalog";

export interface MenuListProps {
  initialMenus: Menu[];
}

export function MenuList({ initialMenus }: MenuListProps) {
  const [menus, setMenus] = useState<Menu[]>(initialMenus);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // See CategoryList's own comment: a ref, not just `deletingId` state, is
  // needed to close a real, confirmed race where two clicks dispatched in
  // the same tick both pass a state-only guard before either commits.
  const isDeletingRef = useRef(false);

  const handleSaved = (menu: Menu): void => {
    setMenus((current) => {
      const exists = current.some((item) => item.id === menu.id);
      return exists ? current.map((item) => (item.id === menu.id ? menu : item)) : [menu, ...current];
    });
  };

  const handleDelete = async (menu: Menu): Promise<void> => {
    if (isDeletingRef.current) {
      return;
    }
    isDeletingRef.current = true;

    if (!window.confirm(`"${menu.name}" menüsünü silmek istediğinize emin misiniz?`)) {
      isDeletingRef.current = false;
      return;
    }

    setDeletingId(menu.id);
    const result = await deleteMenu(menu.id);
    setDeletingId(null);
    isDeletingRef.current = false;

    if (result.status === "error") {
      toast({ title: "Silinemedi", description: result.message, variant: "destructive" });
      return;
    }

    setMenus((current) => current.filter((item) => item.id !== menu.id));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={() => {
            setEditingMenu(undefined);
            setIsDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Yeni Menü
        </Button>
      </div>

      {menus.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="Henüz menü yok"
          description="İlk menünüzü oluşturarak başlayın."
          action={
            <Button type="button" onClick={() => setIsDialogOpen(true)}>
              Yeni Menü
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {menus.map((menu) => (
              <TableRow key={menu.id}>
                <TableCell className="font-medium text-foreground">{menu.name}</TableCell>
                <TableCell>
                  <Badge variant={menu.status === "PUBLISHED" ? "success" : "secondary"}>
                    {menu.status === "PUBLISHED" ? "Yayında" : "Taslak"}
                  </Badge>
                </TableCell>
                <TableCell className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`${ROUTES.businessCategories}?menuId=${menu.id}`}>
                      <ListTree className="h-4 w-4" aria-hidden="true" />
                      Kategoriler
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Düzenle"
                    onClick={() => {
                      setEditingMenu(menu);
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
                    disabled={deletingId === menu.id}
                    onClick={() => void handleDelete(menu)}
                  >
                    {deletingId === menu.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <MenuFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        menu={editingMenu}
        onSaved={handleSaved}
      />
    </div>
  );
}

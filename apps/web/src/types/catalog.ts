// Mirrors apps/api's Sprint 3A Prisma models 1:1. Decimal fields (price)
// serialize as strings over JSON - never coerced to `number` here, callers
// parse explicitly (e.g. `Number(product.price)`) only where arithmetic is
// actually needed, to avoid silent float-precision surprises with money.

import type { ProductTag } from "@qr-platform/shared";

export type MediaType = "IMAGE" | "LOGO" | "COVER" | "PRODUCT" | "CATEGORY" | "QR";

export interface Media {
  id: string;
  tenantId: string;
  type: MediaType;
  key: string;
  thumbnailKey: string | null;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  originalFilename: string;
  uploadedByUserId: string | null;
  createdAt: string;
}

export interface BusinessProfile {
  id: string;
  name: string;
  slug: string;
  status: string;
  logoImageId: string | null;
  coverImageId: string | null;
  about: string | null;
  tagline: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  googleMapsLink: string | null;
  workingHours: Record<string, unknown> | null;
  instagram: string | null;
  facebook: string | null;
  website: string | null;
  currency: string;
  language: string;
}

export type MenuStatus = "DRAFT" | "PUBLISHED";

export interface Menu {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  status: MenuStatus;
  sortOrder: number;
  activeFrom: string | null;
  activeUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  tenantId: string;
  menuId: string;
  name: string;
  slug: string;
  description: string | null;
  imageId: string | null;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Variant {
  id: string;
  tenantId: string;
  productId: string;
  name: string;
  price: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductOption {
  id: string;
  tenantId: string;
  optionGroupId: string;
  name: string;
  price: string;
  sortOrder: number;
  available: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OptionGroup {
  id: string;
  tenantId: string;
  productId: string;
  name: string;
  required: boolean;
  multiple: boolean;
  minimum: number;
  maximum: number | null;
  sortOrder: number;
  options?: ProductOption[];
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  tenantId: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  price: string;
  imageId: string | null;
  preparationTime: number | null;
  calories: number | null;
  allergens: string | null;
  tags: ProductTag[];
  isAvailable: boolean;
  isFeatured: boolean;
  sortOrder: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  variants?: Variant[];
  optionGroups?: OptionGroup[];
}

export interface ReorderItem {
  id: string;
  sortOrder: number;
}

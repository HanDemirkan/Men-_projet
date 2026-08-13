// Real, structured dietary/style tags a business can attach to a product -
// added specifically so the storefront's badge system (Vegan/Vejetaryen/
// Glutensiz/Acılı/Yeni/Şef Önerisi) shows genuine, business-set data instead
// of hardcoded or invented UI. "Popüler" is deliberately NOT a tag here - it
// maps to the existing `Product.isFeatured` field, so there's exactly one
// place a business marks a product as popular, not two overlapping ones.
export type ProductTag = "vegan" | "vegetarian" | "gluten-free" | "spicy" | "new" | "chefs-pick";

export const PRODUCT_TAGS: ProductTag[] = ["vegan", "vegetarian", "gluten-free", "spicy", "new", "chefs-pick"];

export const PRODUCT_TAG_LABELS: Record<ProductTag, string> = {
  vegan: "Vegan",
  vegetarian: "Vejetaryen",
  "gluten-free": "Glutensiz",
  spicy: "Acılı",
  new: "Yeni",
  "chefs-pick": "Şef Önerisi",
};

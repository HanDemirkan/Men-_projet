import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PERMISSIONS } from "@qr-platform/permissions";

import { ReorderDto } from "../../common/dto/reorder.dto";
import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";

import { BulkUpdateProductsDto } from "./dto/bulk-update-products.dto";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ProductService } from "./product.service";
import type { ProductListStatus } from "./product.service";

@ApiTags("products")
@Controller()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post("categories/:categoryId/products")
  @RequirePermissions(PERMISSIONS.PRODUCT_WRITE)
  @ApiOperation({ summary: "Kategoriye yeni ürün ekler" })
  create(@Param("categoryId") categoryId: string, @Body() dto: CreateProductDto) {
    return this.productService.create(categoryId, dto);
  }

  @Get("categories/:categoryId/products")
  @RequirePermissions(PERMISSIONS.PRODUCT_READ)
  @ApiOperation({ summary: "Bir kategorinin ürünlerini listeler (status: active|archived|all)" })
  listByCategory(@Param("categoryId") categoryId: string, @Query("status") status?: ProductListStatus) {
    return this.productService.listByCategory(categoryId, status);
  }

  // Must be registered before `GET/PATCH /products/:id` - see CategoryController.
  @Patch("products/reorder")
  @RequirePermissions(PERMISSIONS.PRODUCT_WRITE)
  @ApiOperation({ summary: "Ürün sıralamasını günceller" })
  async reorder(@Body() dto: ReorderDto): Promise<{ reordered: true }> {
    await this.productService.reorder(dto);
    return { reordered: true };
  }

  @Patch("products/bulk")
  @RequirePermissions(PERMISSIONS.PRODUCT_WRITE)
  @ApiOperation({ summary: "Birden çok ürünü tek seferde günceller (aktif/pasif, öne çıkar, arşivle)" })
  bulkUpdate(@Body() dto: BulkUpdateProductsDto) {
    return this.productService.bulkUpdate(dto);
  }

  @Get("products/:id")
  @RequirePermissions(PERMISSIONS.PRODUCT_READ)
  @ApiOperation({ summary: "Tek bir ürünü döner" })
  get(@Param("id") id: string) {
    return this.productService.get(id);
  }

  @Patch("products/:id")
  @RequirePermissions(PERMISSIONS.PRODUCT_WRITE)
  @ApiOperation({ summary: "Ürünü günceller" })
  update(@Param("id") id: string, @Body() dto: UpdateProductDto) {
    return this.productService.update(id, dto);
  }

  @Delete("products/:id")
  @RequirePermissions(PERMISSIONS.PRODUCT_WRITE)
  @ApiOperation({ summary: "Ürünü arşivler (soft delete)" })
  async remove(@Param("id") id: string): Promise<{ deleted: true }> {
    await this.productService.remove(id);
    return { deleted: true };
  }

  @Patch("products/:id/restore")
  @RequirePermissions(PERMISSIONS.PRODUCT_WRITE)
  @ApiOperation({ summary: "Arşivlenmiş bir ürünü geri getirir" })
  restore(@Param("id") id: string) {
    return this.productService.restore(id);
  }

  @Post("products/:id/duplicate")
  @RequirePermissions(PERMISSIONS.PRODUCT_WRITE)
  @ApiOperation({ summary: "Ürünü variant/seçenek grupları dahil kopyalar" })
  duplicate(@Param("id") id: string) {
    return this.productService.duplicate(id);
  }
}

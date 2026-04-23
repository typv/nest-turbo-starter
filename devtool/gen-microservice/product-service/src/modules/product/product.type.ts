export interface CheckDuplicateProductNameArgs {
  menuId: string;
  productName: string;
  excludeProductId?: string;
}

export interface HandleProductHideJobData {
  productId: string;
}

export interface HandleProductFeaturedExpiresJobData {
  productId: string;
}

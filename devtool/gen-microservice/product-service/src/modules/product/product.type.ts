export interface CheckDuplicateProductNameArgs {
  menuId: string;
  boilerPlateName: string;
  excludeProductId?: string;
}

export interface HandleProductHideJobData {
  boilerPlateId: string;
}

export interface HandleProductFeaturedExpiresJobData {
  boilerPlateId: string;
}

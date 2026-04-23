export interface CheckDuplicateBoilerPlateNameArgs {
  menuId: string;
  boilerPlateName: string;
  excludeBoilerPlateId?: string;
}

export interface HandleBoilerPlateHideJobData {
  boilerPlateId: string;
}

export interface HandleBoilerPlateFeaturedExpiresJobData {
  boilerPlateId: string;
}

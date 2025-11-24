export enum Role {
  Admin = 'Admin',
  User = 'User',
}

export enum BodyContentType {
  Json = 'application/json',
  MultipartFormData = 'multipart/form-data',
}

export enum AccountAction {
  VerifyEmail = 'verify-email',
  ResetPassword = 'reset-password',
}

export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum TimeOfDay {
  Morning = 'Morning',
  Afternoon = 'Afternoon',
  Night = 'Night',
  Overnight = 'Overnight',
  AllDay = 'AllDay',
}

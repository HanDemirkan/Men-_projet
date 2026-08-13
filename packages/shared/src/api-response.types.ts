export interface ApiSuccessResponse<TData> {
  success: true;
  data: TData;
  meta: Record<string, unknown> | null;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details: ApiErrorDetail[];
    // Only ever set by PublicStorefrontContextMiddleware's 404 body, when the
    // requested tenant slug is stale but resolves to a live alias (see
    // TenantSlugAlias) - the current active slug to 308-redirect the browser
    // to, so a printed QR code keeps working after the business renames.
    redirectSlug?: string | null;
  };
  requestId: string;
}

export type ApiResponse<TData> = ApiSuccessResponse<TData> | ApiErrorResponse;

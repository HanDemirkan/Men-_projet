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
  };
  requestId: string;
}

export type ApiResponse<TData> = ApiSuccessResponse<TData> | ApiErrorResponse;

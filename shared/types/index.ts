export type Role = "admin" | "editor" | "user";

export interface ApiErrorResponse {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

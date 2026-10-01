export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  createdAt: string;
  updatedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  isDeleted: boolean;
}

export interface CategoryRequest {
  name: string;
  slug: string;
  description?: string | null;
  iconUrl?: string | null;
}

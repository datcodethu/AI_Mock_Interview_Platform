import { apiClient } from '../lib/axios';
import type { ApiResponse } from '../types/auth.types';
import type { CategoryRequest, CategoryResponse } from '../types/category.types';

export const categoryService = {
  async getActiveCategories(): Promise<CategoryResponse[]> {
    const response = await apiClient.get<ApiResponse<CategoryResponse[]>>('/categories');
    return response.data.data;
  },

  async getActiveCategoryBySlug(slug: string): Promise<CategoryResponse> {
    const response = await apiClient.get<ApiResponse<CategoryResponse>>(
      `/categories/${encodeURIComponent(slug)}`,
    );
    return response.data.data;
  },

  async getAdminCategories(): Promise<CategoryResponse[]> {
    const response = await apiClient.get<ApiResponse<CategoryResponse[]>>('/admin/categories');
    return response.data.data;
  },

  async createCategory(payload: CategoryRequest): Promise<CategoryResponse> {
    const response = await apiClient.post<ApiResponse<CategoryResponse>>('/admin/categories', payload);
    return response.data.data;
  },

  async updateCategory(id: string, payload: CategoryRequest): Promise<CategoryResponse> {
    const response = await apiClient.put<ApiResponse<CategoryResponse>>(
      `/admin/categories/${encodeURIComponent(id)}`,
      payload,
    );
    return response.data.data;
  },

  async deleteCategory(id: string): Promise<void> {
    await apiClient.delete(`/admin/categories/${encodeURIComponent(id)}`);
  },
};

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '../services/categoryService';
import type { CategoryRequest } from '../types/category.types';

export const categoryQueryKeys = {
  all: ['categories'] as const,
  publicList: () => [...categoryQueryKeys.all, 'public'] as const,
  publicDetail: (slug: string) => [...categoryQueryKeys.all, 'public', slug] as const,
  adminList: () => [...categoryQueryKeys.all, 'admin'] as const,
};

export function useActiveCategories() {
  return useQuery({
    queryKey: categoryQueryKeys.publicList(),
    queryFn: categoryService.getActiveCategories,
  });
}

export function useActiveCategoryBySlug(slug: string) {
  return useQuery({
    queryKey: categoryQueryKeys.publicDetail(slug),
    queryFn: () => categoryService.getActiveCategoryBySlug(slug),
    enabled: slug.length > 0,
  });
}

export function useAdminCategories() {
  return useQuery({
    queryKey: categoryQueryKeys.adminList(),
    queryFn: categoryService.getAdminCategories,
  });
}

function useInvalidateCategories() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: categoryQueryKeys.all });
}

export function useCreateCategory() {
  const invalidateCategories = useInvalidateCategories();
  return useMutation({
    mutationFn: (payload: CategoryRequest) => categoryService.createCategory(payload),
    onSuccess: invalidateCategories,
  });
}

export function useUpdateCategory() {
  const invalidateCategories = useInvalidateCategories();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CategoryRequest }) =>
      categoryService.updateCategory(id, payload),
    onSuccess: invalidateCategories,
  });
}

export function useDeleteCategory() {
  const invalidateCategories = useInvalidateCategories();
  return useMutation({
    mutationFn: categoryService.deleteCategory,
    onSuccess: invalidateCategories,
  });
}

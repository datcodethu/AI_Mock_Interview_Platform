import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { CategoryResponse } from '../../types/category.types';

const categorySchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên danh mục').max(120, 'Tên tối đa 120 ký tự'),
  slug: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập slug')
    .max(160, 'Slug tối đa 160 ký tự')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug chỉ gồm chữ thường, số và dấu gạch ngang'),
  description: z.string().max(2000, 'Mô tả tối đa 2000 ký tự'),
  iconUrl: z.string().max(500, 'URL biểu tượng tối đa 500 ký tự'),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  category?: CategoryResponse | null;
  isSubmitting: boolean;
  onSubmit: (values: CategoryFormValues) => Promise<void>;
  onCancel?: () => void;
}

export function CategoryForm({ category, isSubmitting, onSubmit, onCancel }: CategoryFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? '',
      slug: category?.slug ?? '',
      description: category?.description ?? '',
      iconUrl: category?.iconUrl ?? '',
    },
  });

  return (
    <form className="category-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="form-field">
        <label htmlFor="category-name">Tên danh mục</label>
        <input id="category-name" {...register('name')} aria-invalid={!!errors.name} />
        {errors.name && <span className="field-error">{errors.name.message}</span>}
      </div>
      <div className="form-field">
        <label htmlFor="category-slug">Slug</label>
        <input
          id="category-slug"
          {...register('slug')}
          aria-invalid={!!errors.slug}
          placeholder="vi-du-do-noi-that"
        />
        {errors.slug && <span className="field-error">{errors.slug.message}</span>}
      </div>
      <div className="form-field">
        <label htmlFor="category-description">Mô tả</label>
        <textarea
          id="category-description"
          rows={3}
          {...register('description')}
          aria-invalid={!!errors.description}
        />
        {errors.description && <span className="field-error">{errors.description.message}</span>}
      </div>
      <div className="form-field">
        <label htmlFor="category-icon">URL biểu tượng</label>
        <input
          id="category-icon"
          type="url"
          {...register('iconUrl')}
          aria-invalid={!!errors.iconUrl}
        />
        {errors.iconUrl && <span className="field-error">{errors.iconUrl.message}</span>}
      </div>
      <div className="category-form__actions">
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Đang lưu...' : category ? 'Cập nhật danh mục' : 'Tạo danh mục'}
        </button>
        {onCancel && (
          <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={isSubmitting}>
            Hủy
          </button>
        )}
      </div>
    </form>
  );
}

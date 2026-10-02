import { useEffect, useState } from 'react';
import { categoryService } from '../../services/categoryService';
import type { CategoryResponse } from '../../types/category.types';
import type { CreateProductRequest, ProductDetailResponse, UpdateProductRequest } from '../../types/product.types';

interface ProductFormProps {
  initialProduct?: ProductDetailResponse | null;
  isSubmitting: boolean;
  onSubmit: (data: CreateProductRequest | UpdateProductRequest) => Promise<void>;
  onCancel: () => void;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export function ProductForm({
  initialProduct,
  isSubmitting,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [name, setName] = useState(initialProduct?.name ?? '');
  const [slug, setSlug] = useState(initialProduct?.slug ?? '');
  const [categoryId, setCategoryId] = useState(initialProduct?.categoryId ?? '');
  const [sku, setSku] = useState(initialProduct?.sku ?? '');
  const [price, setPrice] = useState<string>(
    initialProduct?.price != null ? String(initialProduct.price) : ''
  );
  const [inStock, setInStock] = useState<boolean>(initialProduct?.inStock ?? true);
  const [shortDescription, setShortDescription] = useState(
    initialProduct?.shortDescription ?? ''
  );
  const [description, setDescription] = useState(initialProduct?.description ?? '');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    categoryService
      .getActiveCategories()
      .then((cats) => {
        setCategories(cats);
        if (!categoryId && cats.length > 0) {
          setCategoryId(cats[0].id);
        }
      })
      .catch(() => {});
  }, [categoryId]);

  function handleNameChange(newName: string) {
    setName(newName);
    // Tự động gợi ý slug nếu chưa có slug hoặc đang tạo mới
    if (!initialProduct) {
      setSlug(slugify(newName));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Tên sản phẩm không được để trống.');
      return;
    }
    if (!slug.trim()) {
      setFormError('Slug không được để trống.');
      return;
    }
    if (!categoryId) {
      setFormError('Vui lòng chọn danh mục.');
      return;
    }
    if (!sku.trim()) {
      setFormError('Mã SKU không được để trống.');
      return;
    }

    const payload: CreateProductRequest = {
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      categoryId,
      sku: sku.trim().toUpperCase(),
      price: price.trim() !== '' ? Number(price) : null,
      inStock,
      shortDescription: shortDescription.trim() || undefined,
      description: description.trim() || undefined,
    };

    try {
      await onSubmit(payload);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('Có lỗi xảy ra khi lưu sản phẩm.');
      }
    }
  }

  return (
    <form className="admin-product-form" onSubmit={handleSubmit}>
      {formError && <div className="form-error-banner" role="alert">{formError}</div>}

      <div className="form-row form-row--2cols">
        <div className="form-field">
          <label htmlFor="prod-name">Tên sản phẩm *</label>
          <input
            id="prod-name"
            type="text"
            className="form-input"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="VD: Laptop Asus ROG Strix G16"
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="prod-slug">
            Slug (URL) *
            <button
              type="button"
              className="btn-link"
              onClick={() => setSlug(slugify(name))}
              style={{ marginLeft: '8px', fontSize: '0.8rem', color: 'var(--clay)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Sinh tự động
            </button>
          </label>
          <input
            id="prod-slug"
            type="text"
            className="form-input"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="asus-rog-strix-g16"
            required
          />
        </div>
      </div>

      <div className="form-row form-row--3cols">
        <div className="form-field">
          <label htmlFor="prod-category">Danh mục *</label>
          <select
            id="prod-category"
            className="form-select"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          >
            <option value="">-- Chọn danh mục --</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="prod-sku">Mã SKU *</label>
          <input
            id="prod-sku"
            type="text"
            className="form-input"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="ROG-G16-001"
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="prod-price">Giá bán (VND) - Để trống = Báo giá</label>
          <input
            id="prod-price"
            type="number"
            min="0"
            step="1000"
            className="form-input"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Để trống nếu cần liên hệ"
          />
        </div>
      </div>

      <div className="form-field">
        <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => setInStock(e.target.checked)}
          />
          <span>Còn hàng trong kho (In Stock)</span>
        </label>
      </div>

      <div className="form-field">
        <label htmlFor="prod-short-desc">Mô tả ngắn gọn</label>
        <textarea
          id="prod-short-desc"
          rows={2}
          className="form-input"
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          placeholder="Tóm tắt điểm nổi bật nhất của sản phẩm..."
        />
      </div>

      <div className="form-field">
        <label htmlFor="prod-desc">
          Mô tả chi tiết (HTML)
          <span style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', marginLeft: '8px' }}>
            (Hệ thống tự động sanitize Jsoup Safelist.relaxed chống XSS)
          </span>
        </label>
        <textarea
          id="prod-desc"
          rows={6}
          className="form-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="<p>Mô tả chi tiết kỹ thuật, bảo hành...</p>"
        />
      </div>

      <div className="form-actions" style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
        <button type="submit" disabled={isSubmitting} className="btn btn--primary">
          {isSubmitting ? 'Đang lưu...' : initialProduct ? 'Cập nhật sản phẩm' : 'Tạo mới sản phẩm'}
        </button>
        <button type="button" onClick={onCancel} className="btn btn--ghost">
          Hủy bỏ
        </button>
      </div>
    </form>
  );
}

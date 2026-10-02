import { useState } from 'react';
import type { ProductListItemResponse } from '../../types/product.types';

interface ProductImageUploadModalProps {
  product: ProductListItemResponse;
  isUploading: boolean;
  onUpload: (productId: string, files: File[]) => Promise<void>;
  onClose: () => void;
}

export function ProductImageUploadModal({
  product,
  isUploading,
  onUpload,
  onClose,
}: ProductImageUploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setErrorMessage(null);
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    // Kiểm tra sơ bộ phía client: dung lượng <= 5MB
    const oversizedFiles = files.filter((f) => f.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setErrorMessage('Mỗi file ảnh không được vượt quá 5MB.');
      return;
    }

    setSelectedFiles(files);
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất 1 ảnh.');
      return;
    }

    try {
      await onUpload(product.id, selectedFiles);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Tải ảnh lên thất bại. Vui lòng kiểm tra lại định dạng ảnh.');
      }
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Tải ảnh cho sản phẩm: {product.name}</h2>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {errorMessage && <div className="form-error-banner" role="alert">{errorMessage}</div>}

          <div className="upload-note" style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', marginBottom: '16px' }}>
            ℹ️ <strong>Bảo mật:</strong> Hệ thống kiểm tra magic bytes nhị phân thực tế của file ảnh (PNG, JPEG, WebP, GIF),
            tối đa 5MB/ảnh và tự động đổi tên file bằng UUID để đảm bảo an toàn tuyệt đối.
          </div>

          <div className="form-field">
            <label htmlFor="image-input" className="file-drop-area">
              <span>Chọn một hoặc nhiều tệp ảnh (JPG, PNG, WebP, GIF)</span>
              <input
                id="image-input"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                style={{ display: 'block', marginTop: '8px' }}
              />
            </label>
          </div>

          {previewUrls.length > 0 && (
            <div className="image-previews-grid" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
              {previewUrls.map((url, index) => (
                <div key={index} style={{ width: '80px', height: '80px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                  <img src={url} alt={`Xem trước ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}

          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" onClick={onClose} className="btn btn--ghost">
              Hủy
            </button>
            <button
              type="submit"
              disabled={isUploading || selectedFiles.length === 0}
              className="btn btn--primary"
            >
              {isUploading ? 'Đang tải lên...' : `Tải lên ${selectedFiles.length} ảnh`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

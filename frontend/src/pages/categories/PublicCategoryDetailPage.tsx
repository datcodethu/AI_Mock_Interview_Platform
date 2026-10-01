import axios from 'axios';
import { Link, useParams } from 'react-router-dom';
import { CategoryQueryError } from '../../components/categories/CategoryQueryError';
import { useActiveCategoryBySlug } from '../../hooks/useCategories';

export function PublicCategoryDetailPage() {
  const { slug = '' } = useParams();
  const categoryQuery = useActiveCategoryBySlug(slug);
  const isNotFound =
    categoryQuery.isError &&
    axios.isAxiosError(categoryQuery.error) &&
    categoryQuery.error.response?.status === 404;

  return (
    <article className="public-category-detail page-container">
      <nav aria-label="Breadcrumb" className="public-category-detail__breadcrumb">
        <Link to="/">Trang chủ</Link>
        <span aria-hidden="true">/</span>
        <Link to="/categories">Danh mục</Link>
        {categoryQuery.data && (
          <>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{categoryQuery.data.name}</span>
          </>
        )}
      </nav>

      {categoryQuery.isPending && <p role="status">Đang tải danh mục...</p>}

      {isNotFound ? (
        <div className="public-category-detail__not-found">
          <h1>Không tìm thấy danh mục</h1>
          <p>Danh mục có thể không tồn tại hoặc đã ngừng hoạt động.</p>
          <Link className="btn btn--primary" to="/categories">Xem danh mục khác</Link>
        </div>
      ) : categoryQuery.isError ? (
        <CategoryQueryError
          error={categoryQuery.error}
          onRetry={() => void categoryQuery.refetch()}
        />
      ) : null}

      {categoryQuery.isSuccess && (
        <header className="public-category-detail__header">
          {categoryQuery.data.iconUrl && (
            <img src={categoryQuery.data.iconUrl} alt="" className="public-category-detail__icon" />
          )}
          <p className="eyebrow">DANH MỤC SẢN PHẨM</p>
          <h1>{categoryQuery.data.name}</h1>
          {categoryQuery.data.description && <p>{categoryQuery.data.description}</p>}
          <p className="public-category-detail__empty">
            Sản phẩm thuộc danh mục này sẽ được cập nhật sớm.
          </p>
          <Link className="btn btn--ghost" to="/categories">← Quay lại danh mục</Link>
        </header>
      )}
    </article>
  );
}

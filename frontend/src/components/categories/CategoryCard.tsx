import { Link } from 'react-router-dom';
import type { CategoryResponse } from '../../types/category.types';

export function CategoryCard({ category }: { category: CategoryResponse }) {
  return (
    <Link className="public-category-card" to={`/categories/${encodeURIComponent(category.slug)}`}>
      {category.iconUrl ? (
        <img className="public-category-card__icon" src={category.iconUrl} alt="" loading="lazy" />
      ) : (
        <span className="public-category-card__placeholder" aria-hidden="true">
          {category.name.slice(0, 1).toLocaleUpperCase()}
        </span>
      )}
      <span className="public-category-card__content">
        <strong>{category.name}</strong>
        {category.description && <span>{category.description}</span>}
        <span className="public-category-card__link">Khám phá danh mục →</span>
      </span>
    </Link>
  );
}

import { Link } from 'react-router-dom';

interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
}

const ARTICLES: Article[] = [
  {
    id: '1',
    title: 'Cách lựa chọn chất liệu gỗ tự nhiên phù hợp với khí hậu nhiệt đới',
    excerpt:
      'Độ ẩm và nhiệt độ cao là thách thức lớn đối với đồ nội thất gỗ. Bài viết này hướng dẫn bạn cách chọn loại gỗ bền đẹp theo thời gian.',
    category: 'Cẩm nang nội thất',
    date: '15/09/2026',
    readTime: '5 phút đọc',
  },
  {
    id: '2',
    title: 'Nghệ thuật tối giản: Giải phóng không gian sống trong căn hộ đô thị',
    excerpt:
      'Lối bài trí gọn gàng không chỉ mang lại cảm giác rộng rãi mà còn giúp tâm trí thư thái sau những giờ làm việc căng thẳng.',
    category: 'Phong cách sống',
    date: '02/09/2026',
    readTime: '4 phút đọc',
  },
  {
    id: '3',
    title: 'Bảo dưỡng sofa da và bàn trà đúng cách để giữ được độ bóng đẹp như mới',
    excerpt:
      'Những mẹo nhỏ nhưng cực kỳ hiệu quả giúp bề mặt da và sơn phủ gỗ không bị ố vàng hay bong tróc qua năm tháng sử dụng.',
    category: 'Mẹo gia đình',
    date: '20/08/2026',
    readTime: '6 phút đọc',
  },
];

export function BlogPage() {
  return (
    <div className="blog-page page-container" style={{ paddingBlock: '48px 72px' }}>
      <header style={{ maxWidth: '680px', marginBottom: '40px' }}>
        <span className="eyebrow">CHUYỆN NHÀ & CẢM HỨNG</span>
        <h1>Góc chia sẻ Gia Lê</h1>
        <p style={{ color: 'var(--ink-soft)', lineHeight: 1.7 }}>
          Nơi cập nhật xu hướng thiết kế nội thất, mẹo chăm sóc không gian sống và những câu chuyện kiến tạo tổ ấm.
        </p>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '32px',
        }}
      >
        {ARTICLES.map((article) => (
          <article
            key={article.id}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              padding: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.8rem',
                color: 'var(--ink-muted)',
                marginBottom: '12px',
              }}
            >
              <span className="badge badge--info">{article.category}</span>
              <span>{article.date} · {article.readTime}</span>
            </div>

            <h2 style={{ fontSize: '1.25rem', marginBottom: '12px', lineHeight: 1.35 }}>
              <Link to={`/blog/${article.id}`} style={{ color: 'var(--ink)' }}>
                {article.title}
              </Link>
            </h2>

            <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', lineHeight: 1.6, flex: 1 }}>
              {article.excerpt}
            </p>

            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--cream-2)' }}>
              <Link
                to={`/blog/${article.id}`}
                style={{ color: 'var(--clay)', fontWeight: 500, fontSize: '0.9rem' }}
              >
                Đọc toàn bộ bài viết
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

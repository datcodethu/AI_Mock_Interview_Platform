import { useState } from 'react';

export function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    // Giả lập gửi thông tin liên hệ
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSent(true);
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
    }, 600);
  }

  return (
    <div className="contact-page page-container" style={{ paddingBlock: '48px 72px' }}>
      <header style={{ maxWidth: '680px', marginBottom: '40px' }}>
        <span className="eyebrow">KẾT NỐI VỚI GIA LÊ</span>
        <h1>Liên hệ & Hỗ trợ</h1>
        <p style={{ color: 'var(--ink-soft)', lineHeight: 1.7 }}>
          Chúng tôi luôn sẵn sàng lắng nghe mọi câu hỏi, ý kiến đóng góp hoặc yêu cầu tư vấn thiết kế từ bạn.
        </p>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '48px',
        }}
      >
        {/* Thông tin trực tiếp */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Showroom Trưng Bày</h3>
            <p style={{ color: 'var(--ink-soft)', margin: 0, lineHeight: 1.6 }}>
              Số 128 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Thời Gian Làm Việc</h3>
            <p style={{ color: 'var(--ink-soft)', margin: 0, lineHeight: 1.6 }}>
              Thứ Hai – Thứ Bảy: 08:30 – 20:30<br />
              Chủ Nhật & Ngày lễ: 09:00 – 18:00
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Đường Dây Nóng & Email</h3>
            <p style={{ color: 'var(--ink-soft)', margin: 0, lineHeight: 1.6 }}>
              Hotline tư vấn: <strong>1900 8888</strong> (Miễn phí cước gọi)<br />
              Email hỗ trợ: <strong>cskh@gialegroup.vn</strong>
            </p>
          </div>

          <div
            style={{
              padding: '20px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem' }}>Tư vấn thiết kế riêng?</h4>
            <p style={{ color: 'var(--ink-soft)', margin: 0, fontSize: '0.88rem', lineHeight: 1.5 }}>
              Nếu bạn đang cần đặt đóng nội thất theo kích thước và mặt bằng cụ thể của ngôi nhà,
              vui lòng để lại số điện thoại bên cạnh. Chuyên viên thiết kế sẽ liên hệ trong 24 giờ.
            </p>
          </div>
        </div>

        {/* Form gửi yêu cầu */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            padding: '32px',
          }}
        >
          <h2 style={{ fontSize: '1.35rem', marginBottom: '20px' }}>Gửi tin nhắn cho chúng tôi</h2>

          {isSent && (
            <div className="badge badge--success" style={{ padding: '12px 16px', display: 'block', marginBottom: '20px' }}>
              ✓ Cảm ơn bạn! Yêu cầu của bạn đã được gửi thành công. Đội ngũ Gia Lê sẽ phản hồi sớm nhất.
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="contact-name">Họ và tên của bạn *</label>
              <input
                id="contact-name"
                type="text"
                required
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nguyễn Văn A"
              />
            </div>

            <div className="form-field">
              <label htmlFor="contact-email">Địa chỉ Email *</label>
              <input
                id="contact-email"
                type="email"
                required
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>

            <div className="form-field">
              <label htmlFor="contact-phone">Số điện thoại *</label>
              <input
                id="contact-phone"
                type="tel"
                required
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912 345 678"
              />
            </div>

            <div className="form-field">
              <label htmlFor="contact-message">Nội dung cần tư vấn hoặc góp ý *</label>
              <textarea
                id="contact-message"
                rows={4}
                required
                className="form-input"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Chia sẻ về nhu cầu hoặc câu hỏi của bạn..."
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn--accent"
              style={{ width: '100%', marginTop: '8px' }}
            >
              {isSubmitting ? 'Đang gửi thông tin...' : 'Gửi yêu cầu tư vấn'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

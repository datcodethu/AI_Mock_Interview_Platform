import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { categoryService } from '../services/categoryService';
import { productService } from '../services/productService';
import { adminService } from '../services/AdminService';
import { useAuth } from '../hooks/useAuth';
import { AdminCard } from '../components/admin/AdminCard';

export function AdminDashboardPage() {
  const { user } = useAuth();
  const [totalCategories, setTotalCategories] = useState<number>(0);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [inStockCount, setInStockCount] = useState<number>(0);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      categoryService.getActiveCategories().catch(() => []),
      productService.listProducts({ size: 100 }).catch(() => ({ totalElements: 0, content: [] })),
      adminService.listUsers({ size: 1 }).catch(() => ({ totalElements: 0, content: [] })),
    ])
      .then(([cats, prods, usersResp]) => {
        if (!isMounted) return;
        setTotalCategories(cats.length);
        setTotalProducts(prods.totalElements);
        const inStock = prods.content.filter((p) => p.inStock).length;
        setInStockCount(inStock);
        setTotalUsers(usersResp.totalElements);
      })
      .finally(() => {
        if (isMounted) setIsLoadingStats(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AdminCard
      title="Bảng điều khiển tổng quan"
      subtitle={`Xin chào ${user?.fullName || user?.email || 'Quản trị viên'}, chào mừng trở lại Sellzy Admin Dashboard.`}
      primaryAction={{
        label: 'Xuất dữ liệu tổng hợp',
        icon: (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        ),
        onClick: () => alert('Báo cáo thống kê đang được tải xuống...'),
      }}
    >
      {/* 4 THẺ CHỈ SỐ KPI SELLZY */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          marginBottom: '32px',
        }}
      >
        <div
          style={{
            background: 'var(--admin-page-bg)',
            borderRadius: '12px',
            padding: '22px 24px',
            border: '1px solid var(--admin-border)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--admin-text-soft)',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              Tổng số sản phẩm
            </span>
            <div
              style={{
                fontSize: '2.2rem',
                fontWeight: 800,
                color: 'var(--admin-sidebar)',
                lineHeight: 1,
                marginBottom: '8px',
              }}
            >
              {isLoadingStats ? '...' : totalProducts}
            </div>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
            Đang hoạt động trên sàn
          </span>
        </div>

        <div
          style={{
            background: 'var(--admin-page-bg)',
            borderRadius: '12px',
            padding: '22px 24px',
            border: '1px solid var(--admin-border)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--admin-text-soft)',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              Danh mục sản phẩm
            </span>
            <div
              style={{
                fontSize: '2.2rem',
                fontWeight: 800,
                color: 'var(--admin-sidebar)',
                lineHeight: 1,
                marginBottom: '8px',
              }}
            >
              {isLoadingStats ? '...' : totalCategories}
            </div>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
            Nhóm phân loại hàng hóa
          </span>
        </div>

        <div
          style={{
            background: 'var(--admin-page-bg)',
            borderRadius: '12px',
            padding: '22px 24px',
            border: '1px solid var(--admin-border)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--admin-text-soft)',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              Sẵn sàng giao hàng
            </span>
            <div
              style={{
                fontSize: '2.2rem',
                fontWeight: 800,
                color: '#1E6B38',
                lineHeight: 1,
                marginBottom: '8px',
              }}
            >
              {isLoadingStats ? '...' : inStockCount}
            </div>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
            Sản phẩm đang có sẵn kho
          </span>
        </div>

        <div
          style={{
            background: 'var(--admin-page-bg)',
            borderRadius: '12px',
            padding: '22px 24px',
            border: '1px solid var(--admin-border)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--admin-text-soft)',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              Tổng người dùng
            </span>
            <div
              style={{
                fontSize: '2.2rem',
                fontWeight: 800,
                color: 'var(--admin-sidebar)',
                lineHeight: 1,
                marginBottom: '8px',
              }}
            >
              {isLoadingStats ? '...' : totalUsers}
            </div>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>
            Tài khoản đã đăng ký
          </span>
        </div>
      </div>

      {/* LỐI TẮT NHANH */}
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '1.15rem', color: 'var(--admin-sidebar)', marginBottom: '14px', fontWeight: 700 }}>
          Điều hướng nhanh
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <Link
            to="/admin/products"
            style={{
              padding: '16px 20px',
              background: '#FFFFFF',
              border: '1.5px solid var(--admin-border)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textDecoration: 'none',
              color: 'var(--admin-text-main)',
              transition: 'all 0.15s ease',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'var(--admin-active-bg)',
                color: 'var(--admin-sidebar)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
              }}
            >
              📦
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '0.9rem' }}>Quản lý Sản phẩm</strong>
              <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-soft)' }}>Xem & cập nhật</span>
            </div>
          </Link>

          <Link
            to="/admin/categories"
            style={{
              padding: '16px 20px',
              background: '#FFFFFF',
              border: '1.5px solid var(--admin-border)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textDecoration: 'none',
              color: 'var(--admin-text-main)',
              transition: 'all 0.15s ease',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'var(--admin-active-bg)',
                color: 'var(--admin-sidebar)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
              }}
            >
              📁
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '0.9rem' }}>Quản lý Danh mục</strong>
              <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-soft)' }}>Nhóm mặt hàng</span>
            </div>
          </Link>

          <Link
            to="/admin/users"
            style={{
              padding: '16px 20px',
              background: '#FFFFFF',
              border: '1.5px solid var(--admin-border)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textDecoration: 'none',
              color: 'var(--admin-text-main)',
              transition: 'all 0.15s ease',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'var(--admin-active-bg)',
                color: 'var(--admin-sidebar)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
              }}
            >
              👥
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '0.9rem' }}>Quản lý Người dùng</strong>
              <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-soft)' }}>Khóa & phân quyền</span>
            </div>
          </Link>
        </div>
      </div>
    </AdminCard>
  );
}
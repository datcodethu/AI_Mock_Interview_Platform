import { useAdminUsers } from '../hooks/Useadminusers';

// Trang mẫu để thấy hook useAdminUsers chạy trong AdminLayout — bạn thay bằng bảng đẹp sau.
export function AdminUsersPage() {
  const { users, isLoading, error } = useAdminUsers();

  if (isLoading) return <p>Đang tải...</p>;
  if (error) return <p role="alert">{error}</p>;

  return (
    <>
      <h1>Người dùng</h1>
      <ul>
        {users.map((u) => (
          <li key={u.id}>{u.email} — {u.status}</li>
        ))}
      </ul>
    </>
  );
}
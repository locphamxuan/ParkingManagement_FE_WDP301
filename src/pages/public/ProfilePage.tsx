import { useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { clearSession, loadSession } from '@/services/storage';
import { ArrowLeft, LogOut, User } from 'lucide-react';

export default function ProfilePage() {
  const navigate = useNavigate();
  const session = loadSession();
  const user = session.user as { fullName?: string; email?: string; phone?: string; role?: string } | null;

  if (!session.token || !user) {
    return <Navigate to="/auth/login" replace />;
  }

  const handleLogout = () => {
    clearSession();
    navigate('/', { replace: true });
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white/90 px-4 py-5 shadow-sm sm:px-6">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            onClick={() => navigate('/', { replace: true })}
          >
            <ArrowLeft size={16} />
            Về trang chủ
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.28em] text-sky-600">Hồ sơ người dùng</p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Thông tin tài khoản cá nhân</h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-600">
                Đây là trang hồ sơ dành cho tài khoản người dùng đã đăng nhập. Từ đây bạn có thể xem đầy đủ thông tin cá nhân, vai trò và quản lý phiên đăng nhập.
              </p>
            </div>

            <div className="grid gap-4 rounded-3xl bg-slate-50 p-6">
              <div className="grid gap-2 rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Tên</p>
                <p className="text-lg font-medium text-slate-900">{user.fullName || 'Chưa cập nhật'}</p>
              </div>

              <div className="grid gap-2 rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Email</p>
                <p className="text-lg font-medium text-slate-900">{user.email || 'Chưa cập nhật'}</p>
              </div>

              <div className="grid gap-2 rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Số điện thoại</p>
                <p className="text-lg font-medium text-slate-900">{user.phone || 'Chưa cập nhật'}</p>
              </div>

              <div className="grid gap-2 rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Vai trò</p>
                <p className="text-lg font-medium text-slate-900">{user.role || 'user'}</p>
              </div>
            </div>
          </section>

          <aside className="rounded-3xl border border-slate-200 bg-sky-600/5 p-8 shadow-sm">
            <div className="flex h-full flex-col items-start justify-between gap-6">
              <div className="flex items-center gap-4 rounded-3xl bg-white/85 p-4 shadow-sm">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-sky-600 text-white">
                  <User size={24} />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-sky-700">Tài khoản</p>
                  <p className="text-xl font-semibold text-slate-950">{user.fullName || 'Người dùng mới'}</p>
                </div>
              </div>

              <div className="space-y-4 rounded-3xl bg-white/90 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Chi tiết nhanh</h2>
                <div className="grid gap-3 text-sm text-slate-600">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="font-medium text-slate-800">Email</p>
                    <p>{user.email || 'Chưa cập nhật'}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="font-medium text-slate-800">Vai trò</p>
                    <p>{user.role || 'user'}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-slate-900/95 p-6 text-white shadow-xl">
                <p className="text-sm uppercase tracking-[0.24em] text-sky-300">Lưu ý</p>
                <p className="mt-3 text-sm leading-6 text-slate-100">
                  Thông tin này được lấy từ phiên đăng nhập hiện tại. Nếu bạn muốn cập nhật dữ liệu, hãy sử dụng trang quản lý tài khoản hoặc liên hệ bộ phận hỗ trợ.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

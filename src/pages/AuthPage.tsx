import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';

const initialForm = {
  fullName: '',
  phone: '',
  email: '',
  password: '',
};

type AuthMode = 'login' | 'register';

interface AuthPageProps {
  mode: AuthMode;
  notice: { message?: string; type?: string };
  onModeChange: (mode: AuthMode) => void;
  onBackHome: () => void;
  onSubmit: (input: { mode: AuthMode; payload: Record<string, string> }) => Promise<unknown>;
  isLoading: boolean;
}

const promoPoints = [
  {
    title: 'Dễ sử dụng',
    text: 'Biểu mẫu sáng rõ, thao tác nhanh và đồng bộ màu sắc với landing page trang chủ.',
  },
  {
    title: 'Đúng bối cảnh',
    text: 'Hình nền bãi đỗ xe và tông màu cam kem giúp nhận diện rõ đây là hệ thống parking.',
  },
  {
    title: 'An tâm truy cập',
    text: 'Thông tin tài khoản và các luồng đăng nhập, đăng ký được trình bày ngắn gọn, dễ theo dõi.',
  },
];

export default function AuthPage({ mode, notice, onModeChange, onBackHome, onSubmit, isLoading }: AuthPageProps) {
  const [form, setForm] = useState(initialForm);

  const title = useMemo(() => (mode === 'login' ? 'Đăng nhập vào PBMS' : 'Tạo tài khoản PBMS'), [mode]);
  const description = useMemo(
    () =>
      mode === 'login'
        ? 'Đăng nhập để tiếp tục sử dụng hệ thống quản lý bãi đỗ xe, theo dõi thông tin và truy cập các chức năng cần thiết.'
        : 'Tạo tài khoản mới để bắt đầu sử dụng nền tảng quản lý bãi đỗ xe với giao diện đồng nhất cùng trang chủ.',
    [mode]
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const payload: Record<string, string> = {
      email: form.email.trim(),
      password: form.password,
      ...(mode === 'register' ? { fullName: form.fullName.trim(), phone: form.phone.trim() } : {}),
    };
    await onSubmit({ mode, payload });
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50 py-12">
      <div className="w-full max-w-4xl bg-white shadow-lg rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        <div className="p-8 bg-gradient-to-br from-orange-600 to-orange-400 text-white">
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="mt-3 text-sm opacity-90">{description}</p>
          <div className="mt-6 space-y-4">
            {promoPoints.map((p) => (
              <div key={p.title} className="bg-white/10 p-3 rounded-lg">
                <h4 className="font-semibold">{p.title}</h4>
                <p className="text-sm mt-1 opacity-90">{p.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8">
          {notice?.message ? <div className="mb-4 text-sm text-red-600">{notice.message}</div> : null}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Họ và tên</label>
                  <input name="fullName" value={form.fullName} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-200" placeholder="Nguyễn Văn A" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                  <input name="phone" value={form.phone} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-200" placeholder="0901234567" />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input name="email" value={form.email} onChange={handleChange} type="email" required className="mt-1 block w-full rounded-md border-gray-200" placeholder="user@pbms.vn" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
              <input name="password" value={form.password} onChange={handleChange} type="password" required className="mt-1 block w-full rounded-md border-gray-200" placeholder="Ít nhất 6 ký tự" />
            </div>

            <div className="flex items-center justify-between">
              <button type="submit" disabled={isLoading} className="px-4 py-2 bg-orange-600 text-white rounded-md font-semibold">
                {isLoading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
              </button>
              <div className="text-sm text-gray-500">
                <button type="button" onClick={() => onModeChange(mode === 'login' ? 'register' : 'login')} className="underline">
                  {mode === 'login' ? 'Tạo tài khoản mới' : 'Đã có tài khoản? Đăng nhập'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

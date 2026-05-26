import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, LogOut, Save, User, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ManagerProfilePage() {
  const { session, logout, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!session?.token || session?.role !== 'manager') {
    return <Navigate to="/manager/login" replace />;
  }

  const displayName = session.displayName || 'Manager';
  const avatarText = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  const startEdit = () => {
    setFullName(session.displayName || '');
    setPhone(session.phone || '');
    setNameError(null);
    setPhoneError(null);
    setSuccess(null);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setNameError(null);
    setPhoneError(null);
    setSuccess(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);
    setPhoneError(null);
    setSuccess(null);

    const trimmedName = fullName.trim();
    const newPhone = phone.trim();
    const oldPhone = (session.phone || '').trim();

    if (!trimmedName) {
      setNameError('Vui lòng nhập họ tên!');
      return;
    }

    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(newPhone)) {
      setPhoneError('Số điện thoại phải bắt đầu bằng số 0 và có đúng 10 chữ số!');
      return;
    }

    const allRegisteredPhonesRaw = localStorage.getItem('pbms.allRegisteredPhones');
    let allRegisteredPhones: string[] = allRegisteredPhonesRaw
      ? JSON.parse(allRegisteredPhonesRaw)
      : ['0911111111', '0922222222'];

    if (newPhone !== oldPhone && allRegisteredPhones.includes(newPhone)) {
      setPhoneError('Số điện thoại này đã được đăng ký bởi một tài khoản khác!');
      return;
    }

    if (oldPhone) {
      allRegisteredPhones = allRegisteredPhones.filter((value) => value !== oldPhone);
    }
    allRegisteredPhones.push(newPhone);
    localStorage.setItem('pbms.allRegisteredPhones', JSON.stringify(allRegisteredPhones));

    updateProfile({
      fullName: trimmedName,
      phone: newPhone,
      licensePlates: session.licensePlates || [],
    });

    setIsEditing(false);
    setSuccess('Cập nhật thông tin thành công!');
    setTimeout(() => setSuccess(null), 4000);
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {success ? (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-100 shadow-sm">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span>{success}</span>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <Card className="overflow-hidden border-slate-700 bg-slate-900/95 shadow-[0_16px_36px_rgba(0,0,0,0.35)]">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="grid h-24 w-24 place-items-center rounded-full border border-slate-700 bg-slate-950 text-white shadow-sm">
                  <span className="text-2xl font-semibold uppercase tracking-wider">{avatarText || 'M'}</span>
                </div>

                <div className="mt-5 space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Hồ sơ Manager</p>
                  <h1 className="text-2xl font-semibold text-white">{displayName}</h1>
                  <p className="text-sm uppercase tracking-[0.16em] text-slate-300">{session.role}</p>
                </div>

                <div className="mt-6 w-full space-y-3 text-left">
                  <div className="rounded-lg border border-slate-700 bg-slate-950/60 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Email</p>
                    <p className="mt-1 break-all text-sm font-medium text-white">{session.email}</p>
                  </div>

                  <div className="grid gap-2 pt-2">
                    <Button type="button" onClick={startEdit} className="w-full justify-center gap-2">
                      <Edit size={15} /> Chỉnh sửa hồ sơ
                    </Button>
                    <Button type="button" variant="secondary" className="w-full justify-center gap-2" onClick={() => navigate('/manager/dashboard')}>
                      <ArrowLeft size={15} /> Dashboard
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full justify-center gap-2 text-rose-300 hover:bg-rose-500/10 hover:text-rose-100"
                      onClick={() => {
                        logout();
                        navigate('/manager/login', { replace: true });
                      }}
                    >
                      <LogOut size={15} /> Đăng xuất
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <Card className="border-slate-700 bg-slate-900/95 shadow-[0_16px_36px_rgba(0,0,0,0.35)]">
              <CardHeader>
                <CardTitle>Chi tiết hồ sơ</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                {isEditing ? (
                  <form onSubmit={handleSave} className="grid gap-4">
                    <div className="grid gap-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Tên</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          setNameError(null);
                        }}
                        className="h-11 rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/10"
                        placeholder="Nguyễn Văn A"
                      />
                      {nameError ? (
                        <p className="flex items-center gap-1.5 text-xs font-medium text-rose-300">
                          <AlertCircle size={13} /> {nameError}
                        </p>
                      ) : null}
                    </div>

                    <div className="grid gap-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Email</label>
                      <input
                        type="email"
                        value={session.email}
                        disabled
                        className="h-11 cursor-not-allowed rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm text-slate-200 outline-none"
                      />
                    </div>

                    <div className="grid gap-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Vai trò</label>
                      <input
                        type="text"
                        value={session.role}
                        disabled
                        className="h-11 cursor-not-allowed rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm font-mono uppercase text-slate-200 outline-none"
                      />
                    </div>

                    <div className="grid gap-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Số điện thoại</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setPhone(val);
                          setPhoneError(null);
                        }}
                        maxLength={10}
                        className="h-11 rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/10"
                        placeholder="Ví dụ: 0901234567"
                      />
                      {phoneError ? (
                        <p className="flex items-center gap-1.5 text-xs font-medium text-rose-300">
                          <AlertCircle size={13} /> {phoneError}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2">
                      <Button type="submit" className="gap-2">
                        <Save size={15} /> Lưu thay đổi
                      </Button>
                      <Button type="button" variant="secondary" className="gap-2" onClick={cancelEdit}>
                        <X size={15} /> Hủy
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-4 sm:col-span-2">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Tên</p>
                      <p className="mt-1 text-base font-medium text-white">{displayName || 'Chưa cập nhật'}</p>
                    </div>

                    <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Email</p>
                      <p className="mt-1 break-all text-sm font-medium text-slate-100">{session.email}</p>
                    </div>

                    <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Vai trò</p>
                      <p className="mt-1 text-sm font-semibold uppercase tracking-[0.16em] text-slate-100">{session.role}</p>
                    </div>

                    <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-4 sm:col-span-2">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Số điện thoại</p>
                      <p className="mt-1 text-base font-medium text-white">{session.phone || 'Chưa cập nhật'}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-slate-900/95 shadow-[0_16px_36px_rgba(0,0,0,0.35)]">
              <CardHeader>
                <CardTitle>Cài đặt tài khoản</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-4">
                    <p className="text-sm font-semibold text-white">Thông báo vận hành</p>
                    <p className="mt-1 text-sm text-slate-300">Nhận cảnh báo hoạt động ca trực</p>
                    <div className="mt-4 inline-flex rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-medium text-slate-300">
                      Sẵn sàng
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-4">
                    <p className="text-sm font-semibold text-white">Xác thực 2 lớp</p>
                    <p className="mt-1 text-sm text-slate-300">Tăng cường bảo mật tài khoản</p>
                    <div className="mt-4 inline-flex rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-medium text-slate-300">
                      Chưa bật
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-700 bg-slate-950/60 p-4 md:col-span-2">
                    <p className="text-sm font-semibold text-white">Ngôn ngữ giao diện</p>
                    <p className="mt-1 text-sm text-slate-300">Tiếng Việt</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}

export default ManagerProfilePage;

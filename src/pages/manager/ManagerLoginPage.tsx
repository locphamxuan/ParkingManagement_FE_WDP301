import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';

export function ManagerLoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticating, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await login(email, password, 'manager');
      navigate('/manager/dashboard', { replace: true });
    } catch {
      return;
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_24%),linear-gradient(180deg,#eff6ff_0%,#f8fafc_44%,#f1f5f9_100%)]" />
      <div className="absolute -left-24 top-1/3 h-[300px] w-[300px] rounded-full bg-sky-500/16 blur-3xl" />
      <div className="absolute -right-24 top-12 h-[320px] w-[320px] rounded-full bg-cyan-400/14 blur-3xl" />
      <Card className="relative w-full max-w-md border-border/80 bg-white/94">
        <CardHeader>
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-md bg-sky-100 text-sky-700">
            <LockKeyhole size={18} />
          </div>
          <CardTitle className="text-2xl">Đăng nhập Manager</CardTitle>
          <p className="text-sm text-muted-foreground">Đăng nhập bằng tài khoản quản lý đã được phân quyền trên hệ thống PBMS.</p>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={onSubmit}>
            <div className="grid gap-2">
              <label className="text-sm text-muted-foreground">Email</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm text-muted-foreground">Mật khẩu</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button disabled={isAuthenticating}>
              {isAuthenticating ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
            <p className="text-xs text-muted-foreground">Sử dụng tài khoản manager đã tạo trên MongoDB.</p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

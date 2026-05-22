import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticating, error, session } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const sessionData = await login(email, password);
      const role = sessionData.role;
      if (role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (role === 'manager') {
        navigate('/manager/dashboard', { replace: true });
      } else if (role === 'staff') {
        navigate('/staff', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch {
      return;
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.16),transparent_24%),linear-gradient(180deg,#fffaf4_0%,#f8f2e8_44%,#fffdf9_100%)]" />
      <div className="absolute -left-24 top-1/3 h-[300px] w-[300px] rounded-full bg-orange-500/16 blur-3xl" />
      <div className="absolute -right-24 top-12 h-[320px] w-[320px] rounded-full bg-amber-400/14 blur-3xl" />
      <Card className="relative w-full max-w-md border-border/80 bg-white/94">
        <CardHeader>
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary/20 text-primary">
            <LockKeyhole size={18} />
          </div>
          <CardTitle className="text-2xl">Đăng nhập Admin</CardTitle>
          <p className="text-sm text-muted-foreground">Đăng nhập bằng tài khoản quản trị đã có trên hệ thống PBMS.</p>
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
            <p className="text-xs text-muted-foreground">Thông tin: admin</p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

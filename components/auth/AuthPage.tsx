
import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { APP_NAME, SparklesIcon } from '../../constants';
import { LoadingSpinner } from '../shared/LoadingSpinner';

interface AuthPageProps {
  onLoginSuccess: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true); // true for login, false for signup
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password }); // V2 style
        // const { error: signInError } = await supabase.auth.signIn({ email, password }); // V1 style
        if (signInError) throw signInError;
        setMessage('Đăng nhập thành công! Đang chuyển hướng...');
        onLoginSuccess();
      } else {
        const { data: { user }, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        if (user && !user.email_confirmed_at) {
            setMessage('Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.');
        } else {
            setMessage('Đăng ký thành công! Bạn có thể đăng nhập ngay.');
            setIsLogin(true); // Switch to login form
        }
      }
    } catch (authError: any) {
      setError(authError.message || 'Đã xảy ra lỗi.');
      console.error("Lỗi xác thực:", authError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl">
        <div>
          <div className="flex justify-center text-blue-600">
            <SparklesIcon />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isLogin ? 'Đăng nhập vào' : 'Tạo tài khoản cho'} {APP_NAME}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleAuth}>
          <Input
            id="email"
            name="email"
            type="email"
            label="Địa chỉ Email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
          />
          <Input
            id="password"
            name="password"
            type="password"
            label="Mật khẩu"
            autoComplete={isLogin ? "current-password" : "new-password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            containerClassName="mb-6"
          />

          {error && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md text-center">{error}</p>}
          {message && <p className="text-sm text-green-600 bg-green-100 p-3 rounded-md text-center">{message}</p>}

          <div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <LoadingSpinner size="sm" /> : (isLogin ? 'Đăng nhập' : 'Đăng ký')}
            </Button>
          </div>
        </form>
        <div className="text-sm text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setMessage(null);
            }}
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            {isLogin ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
          </button>
        </div>
      </div>
    </div>
  );
};

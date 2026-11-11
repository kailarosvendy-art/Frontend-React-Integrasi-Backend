import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import { ApiError } from '../services/api';
import type { LoginInput, RegisterInput } from '../types/auth';
import { ErrorNotice } from './Feedback';

export function AuthDialog({
  onClose,
  onLogin,
  onRegister,
}: {
  onClose: () => void;
  onLogin: (input: LoginInput) => Promise<void>;
  onRegister: (input: RegisterInput) => Promise<unknown>;
}) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [success, setSuccess] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSuccess('');

    try {
      if (mode === 'register') {
        await onRegister({ name: name.trim(), email: email.trim(), password });
        setMode('login');
        setShowPassword(false);
        setSuccess('Akun berhasil dibuat. Silakan login dengan akun barumu.');
      } else {
        await onLogin({ email: email.trim(), password });
        onClose();
      }
    } catch (requestError) {
      setError(requestError instanceof ApiError
        ? requestError
        : new ApiError(0, 'Terjadi kesalahan. Silakan coba lagi.'));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        className="dialog auth-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-dialog-title"
      >
        <button className="icon-button dialog-close" type="button" onClick={onClose} aria-label="Tutup">
          <X size={20} />
        </button>
        <div className="dialog-kicker">Rasa Kantin</div>
        <h2 id="auth-dialog-title">{mode === 'login' ? 'Selamat datang kembali' : 'Buat akun baru'}</h2>
        <p className="dialog-intro">
          {mode === 'login'
            ? 'Login untuk mengelola warung atau berbagi ulasan.'
            : 'Daftar sebagai customer untuk mulai berbagi ulasan.'}
        </p>
        <div className="auth-tabs" role="tablist" aria-label="Jenis autentikasi">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={mode === 'login' ? 'auth-tab active' : 'auth-tab'}
            onClick={() => { setMode('login'); setShowPassword(false); setError(null); setSuccess(''); }}
          >
            Login
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={mode === 'register' ? 'auth-tab active' : 'auth-tab'}
            onClick={() => { setMode('register'); setShowPassword(false); setError(null); setSuccess(''); }}
          >
            Registrasi
          </button>
        </div>
        {error && <ErrorNotice message={error.message} errors={error.errors} />}
        {success && <p className="success-message" role="status">{success}</p>}
        <form className="form-stack" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <label>
              Nama
              <input
                autoComplete="name"
                required
                minLength={3}
                maxLength={100}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nama lengkap"
              />
            </label>
          )}
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              required
              maxLength={150}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nama@email.com"
            />
          </label>
          <label>
            Password
            <span className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                minLength={mode === 'register' ? 8 : undefined}
                maxLength={72}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={mode === 'register' ? 'Minimal 8 karakter' : 'Masukkan password'}
              />
              <button
                className="password-toggle"
                type="button"
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>
          <button className="button button-primary button-wide" type="submit" disabled={pending}>
            {pending ? 'Memproses...' : mode === 'login' ? 'Login' : 'Buat akun'}
          </button>
        </form>
      </section>
    </div>
  );
}

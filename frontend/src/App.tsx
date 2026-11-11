import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, ChefHat, ChevronLeft, ChevronRight, LogIn, LogOut, Plus, Search, ShieldCheck, Sparkles, Trash2 } from 'lucide-react';
import { AuthDialog } from './components/AuthDialog';
import { ErrorNotice, LoadingState } from './components/Feedback';
import { StallCard } from './components/StallCard';
import { StallForm } from './components/StallForm';
import { useAuth } from './context/AuthContext';
import { StallDetail } from './pages/StallDetail';
import { ApiError } from './services/api';
import { deleteStall, getStalls, createStall, updateStall } from './services/stallService';
import type { Stall, StallInput, StallListResponse } from './types/stall';

const PAGE_SIZE = 9;

function roleLabel(role: string): string {
  if (role === 'admin') return 'Admin';
  if (role === 'owner') return 'Pemilik warung';
  return 'Customer';
}

export default function App() {
  const { user, isLoading: authLoading, sessionError, login, register, logout } = useAuth();
  const [stallsResult, setStallsResult] = useState<StallListResponse | null>(null);
  const [stallsLoading, setStallsLoading] = useState(true);
  const [stallsError, setStallsError] = useState<ApiError | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedStallId, setSelectedStallId] = useState<number | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [formStall, setFormStall] = useState<Stall | null | undefined>(undefined);
  const [formPending, setFormPending] = useState(false);
  const [formError, setFormError] = useState<ApiError | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [stallToDelete, setStallToDelete] = useState<Stall | null>(null);

  const canCreate = user?.role === 'admin' || user?.role === 'owner';
  const canDelete = user?.role === 'admin';
  const totalPages = Math.max(1, Math.ceil((stallsResult?.meta.total ?? 0) / PAGE_SIZE));

  const canEditStall = useCallback((stall: Stall) => (
    user?.role === 'admin' || (user?.role === 'owner' && user.id === stall.ownerId)
  ), [user]);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setStallsLoading(true);
      setStallsError(null);
      getStalls({ search, category, page, limit: PAGE_SIZE }, controller.signal)
        .then((result) => {
          setStallsResult(result);
          const lastPage = Math.max(1, Math.ceil(result.meta.total / PAGE_SIZE));
          if (result.meta.page > lastPage) setPage(lastPage);
        })
        .catch((requestError: unknown) => {
          if (!controller.signal.aborted) {
            setStallsError(requestError instanceof ApiError
              ? requestError
              : new ApiError(0, 'Daftar warung gagal dimuat.'));
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setStallsLoading(false);
        });
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [search, category, page, refreshKey]);

  const roleDescription = useMemo(() => {
    if (user?.role === 'admin') return 'Kamu bisa mengelola seluruh warung.';
    if (user?.role === 'owner') return 'Kamu bisa membuat warung dan mengubah warung milikmu.';
    if (user?.role === 'customer') return 'Jelajahi warung dan bagikan ulasanmu.';
    return 'Jelajahi pilihan warung favorit di kantin kampus.';
  }, [user]);

  async function handleSaveStall(input: StallInput) {
    setFormPending(true);
    setFormError(null);
    try {
      if (formStall) {
        await updateStall(formStall.id, input);
      } else {
        await createStall(input);
        setPage(1);
      }
      setFormStall(undefined);
      setRefreshKey((current) => current + 1);
    } catch (requestError) {
      setFormError(requestError instanceof ApiError
        ? requestError
        : new ApiError(0, 'Warung gagal disimpan.'));
    } finally {
      setFormPending(false);
    }
  }

  function handleDeleteStall(stall: Stall) {
    setStallToDelete(stall);
  }

  async function confirmDeleteStall() {
    if (!stallToDelete || deletingId !== null) return;
    const stall = stallToDelete;
    setDeletingId(stall.id);
    setStallsError(null);
    try {
      await deleteStall(stall.id);
      setStallToDelete(null);
      if (selectedStallId === stall.id) setSelectedStallId(null);
      setRefreshKey((current) => current + 1);
    } catch (requestError) {
      setStallToDelete(null);
      setStallsError(requestError instanceof ApiError
        ? requestError
        : new ApiError(0, 'Warung gagal dihapus.'));
    } finally {
      setDeletingId(null);
    }
  }

  function openForm(stall: Stall | null) {
    setFormError(null);
    setFormStall(stall);
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#" onClick={(event) => {
          event.preventDefault();
          setSelectedStallId(null);
        }}>
          <span className="brand-mark"><ChefHat size={20} aria-hidden="true" /></span>
          <span>rasa<span className="brand-light">kantin</span></span>
        </a>
        <nav className="header-actions" aria-label="Menu pengguna">
          {authLoading ? (
            <span className="header-loading">Memeriksa sesi...</span>
          ) : user ? (
            <>
              <div className="user-chip">
                <span className="user-avatar">{user.name.trim().charAt(0).toUpperCase()}</span>
                <span className="user-chip-copy">
                  <strong>{user.name}</strong>
                  <small>{roleLabel(user.role)}</small>
                </span>
              </div>
              <button className="button button-quiet header-auth-button" type="button" onClick={logout}>
                <LogOut size={16} aria-hidden="true" />
                Keluar
              </button>
            </>
          ) : (
            <button className="button button-outline header-auth-button" type="button" onClick={() => setShowAuth(true)}>
              <LogIn size={16} aria-hidden="true" />
              Login
            </button>
          )}
        </nav>
      </header>

      <div className="page-wrap">
        {sessionError && (
          <div className="session-notice">
            <ErrorNotice message={sessionError} />
          </div>
        )}
        {stallsError && (
          <ErrorNotice
            message={stallsError.message}
            errors={stallsError.errors}
            onRetry={() => setRefreshKey((current) => current + 1)}
          />
        )}
        {selectedStallId !== null ? (
          <StallDetail
            stallId={selectedStallId}
            refreshKey={refreshKey}
            user={user}
            canEdit={!!stallsResult?.data.find((stall) => stall.id === selectedStallId && canEditStall(stall))}
            canDelete={canDelete}
            onBack={() => setSelectedStallId(null)}
            onLogin={() => setShowAuth(true)}
            onEdit={openForm}
            onDelete={handleDeleteStall}
          />
        ) : (
          <main>
            <section className="hero">
              <div className="hero-copy">
                <div className="hero-eyebrow"><Sparkles size={14} /> CERITA RASA DI KAMPUS</div>
                <h1>Temukan rasa,<br /><span>temukan cerita.</span></h1>
                <p>Jelajahi warung kantin, temukan menu favorit, dan bagikan pengalamanmu bersama teman-teman kampus.</p>
                <div className="hero-user-note">
                  <span className="hero-note-icon"><ShieldCheck size={16} /></span>
                  {roleDescription}
                </div>
              </div>
              <div className="hero-illustration" aria-hidden="true">
                <div className="hero-orbit orbit-one" />
                <div className="hero-orbit orbit-two" />
                <div className="hero-plate">
                  <div className="plate-center"><ChefHat size={57} strokeWidth={1.2} /></div>
                  <span className="food-dot dot-one" />
                  <span className="food-dot dot-two" />
                  <span className="food-dot dot-three" />
                </div>
                <span className="hero-sparkle sparkle-one">✳</span>
                <span className="hero-sparkle sparkle-two">✦</span>
                <span className="hero-sticker">ENAK<br />& DEKAT</span>
              </div>
            </section>

            <section className="catalog-section" aria-labelledby="catalog-heading">
              <div className="catalog-heading-row">
                <div>
                  <div className="section-eyebrow">JELAJAHI KANTIN</div>
                  <h2 id="catalog-heading">Warung pilihan</h2>
                  <p className="catalog-subtitle">Sudah kenal tempat makan favoritmu hari ini?</p>
                </div>
                {canCreate && (
                  <button className="button button-primary create-button" type="button" onClick={() => openForm(null)}>
                    <Plus size={18} aria-hidden="true" />
                    Tambah warung
                  </button>
                )}
              </div>

              <form className="filter-bar" onSubmit={(event) => event.preventDefault()}>
                <label className="search-field">
                  <Search size={18} aria-hidden="true" />
                  <span className="sr-only">Cari nama warung</span>
                  <input
                    type="search"
                    value={search}
                    maxLength={100}
                    onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                    placeholder="Cari nama warung..."
                  />
                </label>
                <label className="category-field">
                  <span className="sr-only">Filter kategori</span>
                  <input
                    value={category}
                    maxLength={50}
                    onChange={(event) => { setCategory(event.target.value); setPage(1); }}
                    placeholder="Kategori"
                  />
                </label>
                <span className="filter-hint">Cari berdasarkan nama atau kategori</span>
              </form>

              {stallsLoading ? (
                <LoadingState label="Mencari warung untukmu..." />
              ) : stallsError ? null : stallsResult?.data.length ? (
                <>
                  <div className="results-caption">
                    Menampilkan {stallsResult.data.length} dari {stallsResult.meta.total} warung
                  </div>
                  <div className="stall-grid">
                    {stallsResult.data.map((stall) => (
                      <StallCard
                        key={stall.id}
                        stall={stall}
                        canEdit={canEditStall(stall)}
                        canDelete={!!canDelete}
                        onOpen={() => setSelectedStallId(stall.id)}
                        onEdit={() => openForm(stall)}
                        onDelete={() => handleDeleteStall(stall)}
                      />
                    ))}
                  </div>
                  {totalPages > 1 && (
                    <nav className="pagination" aria-label="Navigasi halaman daftar warung">
                      <button
                        className="button button-outline button-small"
                        type="button"
                        disabled={page <= 1}
                        onClick={() => setPage((current) => current - 1)}
                      >
                        <ChevronLeft size={16} aria-hidden="true" />
                        Sebelumnya
                      </button>
                      <span>Halaman <strong>{page}</strong> dari <strong>{totalPages}</strong></span>
                      <button
                        className="button button-outline button-small"
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() => setPage((current) => current + 1)}
                      >
                        Berikutnya
                        <ChevronRight size={16} aria-hidden="true" />
                      </button>
                    </nav>
                  )}
                </>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon"><Search size={22} aria-hidden="true" /></div>
                  <h2>{search || category ? 'Belum ada yang cocok' : 'Warung belum tersedia'}</h2>
                  <p>
                    {search || category
                      ? 'Coba kata kunci atau kategori lain, siapa tahu ada yang pas.'
                      : 'Warung kantin akan tampil di sini setelah tersedia.'}
                  </p>
                  {(search || category) && (
                    <button
                      className="button button-quiet"
                      type="button"
                      onClick={() => { setSearch(''); setCategory(''); setPage(1); }}
                    >
                      Hapus pencarian
                      <ArrowRight size={15} aria-hidden="true" />
                    </button>
                  )}
                </div>
              )}
            </section>
          </main>
        )}
      </div>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#" onClick={(event) => {
          event.preventDefault();
          setSelectedStallId(null);
        }}>
          <span className="brand-mark"><ChefHat size={17} aria-hidden="true" /></span>
          <span>rasa<span className="brand-light">kantin</span></span>
        </a>
        <span>Ruang temu rasa dan cerita di kantin kampus.</span>
      </footer>

      {showAuth && (
        <AuthDialog
          onClose={() => setShowAuth(false)}
          onLogin={login}
          onRegister={register}
        />
      )}
      {formStall !== undefined && (
        <StallForm
          key={formStall?.id ?? 'new'}
          stall={formStall}
          pending={formPending}
          error={formError}
          onCancel={() => { if (!formPending) setFormStall(undefined); }}
          onSave={handleSaveStall}
        />
      )}
      {stallToDelete && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && deletingId === null) setStallToDelete(null);
          }}
        >
          <section
            className="dialog delete-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-description"
          >
            <div className="delete-dialog-icon"><Trash2 size={22} aria-hidden="true" /></div>
            <h2 id="delete-dialog-title">Hapus warung?</h2>
            <p id="delete-dialog-description">
              Warung <strong>{stallToDelete.name}</strong> akan dihapus. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="dialog-actions">
              <button
                className="button button-quiet"
                type="button"
                disabled={deletingId !== null}
                onClick={() => setStallToDelete(null)}
              >
                Batal
              </button>
              <button
                className="button button-danger"
                type="button"
                disabled={deletingId !== null}
                onClick={confirmDeleteStall}
              >
                {deletingId === stallToDelete.id ? 'Menghapus...' : 'Ya, hapus warung'}
              </button>
            </div>
          </section>
        </div>
      )}
      {deletingId !== null && <div className="toast" role="status">Menghapus warung...</div>}
    </div>
  );
}

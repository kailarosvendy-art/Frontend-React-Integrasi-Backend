import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, MapPin, MessageSquare, Star } from 'lucide-react';
import type { User } from '../types/auth';
import type { Review, Stall } from '../types/stall';
import { ApiError } from '../services/api';
import { createReview, getReviews, getStall } from '../services/stallService';
import { ErrorNotice, LoadingState } from '../components/Feedback';

export function StallDetail({
  stallId,
  refreshKey,
  user,
  canEdit,
  canDelete,
  onBack,
  onLogin,
  onEdit,
  onDelete,
}: {
  stallId: number;
  refreshKey: number;
  user: User | null;
  canEdit: boolean;
  canDelete: boolean;
  onBack: () => void;
  onLogin: () => void;
  onEdit: (stall: Stall) => void;
  onDelete: (stall: Stall) => void;
}) {
  const [stall, setStall] = useState<Stall | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsError, setReviewsError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewPending, setReviewPending] = useState(false);
  const [reviewError, setReviewError] = useState<ApiError | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    Promise.all([getStall(stallId, controller.signal), getReviews()])
      .then(([loadedStall, loadedReviews]) => {
        setStall(loadedStall);
        setReviews(loadedReviews.filter((review) => review.stallId === stallId));
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setError(requestError instanceof ApiError
            ? requestError
            : new ApiError(0, 'Detail warung gagal dimuat.'));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [stallId, refreshKey]);

  async function handleReviewSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReviewPending(true);
    setReviewError(null);
    setReviewSuccess('');
    try {
      await createReview(stallId, { rating, comment: comment.trim() || null });
      setComment('');
      setReviewSuccess('Terima kasih, ulasanmu berhasil dikirim.');
      const [updatedStall, updatedReviews] = await Promise.all([getStall(stallId), getReviews()]);
      setStall(updatedStall);
      setReviews(updatedReviews.filter((review) => review.stallId === stallId));
    } catch (requestError) {
      setReviewError(requestError instanceof ApiError
        ? requestError
        : new ApiError(0, 'Ulasan gagal dikirim.'));
    } finally {
      setReviewPending(false);
    }
  }

  return (
    <main className="detail-page">
      <button className="back-link" type="button" onClick={onBack}>
        <ArrowLeft size={17} aria-hidden="true" />
        Kembali ke daftar
      </button>
      {loading ? (
        <LoadingState label="Memuat detail warung..." />
      ) : error ? (
        <ErrorNotice message={error.message} errors={error.errors} onRetry={() => {
          setError(null);
          setLoading(true);
          getStall(stallId).then(setStall).catch((requestError: unknown) => {
            setError(requestError instanceof ApiError
              ? requestError
              : new ApiError(0, 'Detail warung gagal dimuat.'));
          }).finally(() => setLoading(false));
        }} />
      ) : stall ? (
        <>
          <section className="detail-hero">
            <div className="detail-art" aria-hidden="true">
              <span>{stall.name.trim().charAt(0).toUpperCase() || 'W'}</span>
              {stall.isPopular && <span className="popular-tag">Favorit kampus</span>}
            </div>
            <div className="detail-heading">
              <span className="category-label">{stall.category || 'Warung kantin'}</span>
              <h1>{stall.name}</h1>
              <p className="stall-location">
                <MapPin size={16} aria-hidden="true" />
                {stall.location || 'Lokasi belum dicantumkan'}
              </p>
              <p className="detail-rating">
                <Star size={19} fill="currentColor" aria-hidden="true" />
                <strong>{stall.avgRating.toFixed(1)}</strong>
                <span> dari {stall.reviewCount} ulasan</span>
              </p>
              {(canEdit || canDelete) && (
                <div className="detail-actions">
                  {canEdit && (
                    <button className="button button-outline" type="button" onClick={() => onEdit(stall)}>
                      Ubah warung
                    </button>
                  )}
                  {canDelete && (
                    <button className="button button-danger-outline" type="button" onClick={() => onDelete(stall)}>
                      Hapus warung
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>
          <section className="detail-content-grid">
            <div className="detail-description">
              <div className="section-eyebrow">Kenali warungnya</div>
              <h2>Cita rasa kantin, cerita kampus.</h2>
              <p>{stall.description || 'Belum ada deskripsi untuk warung ini.'}</p>
              <div className="reviews-list">
                <div className="section-eyebrow">CERITA PENGUNJUNG</div>
                <h2>Ulasan warung</h2>
                {reviewsError ? (
                  <ErrorNotice message={reviewsError.message} errors={reviewsError.errors} onRetry={() => {
                    getReviews().then((items) => {
                      setReviews(items.filter((review) => review.stallId === stallId));
                      setReviewsError(null);
                    }).catch((requestError: unknown) => {
                      setReviewsError(requestError instanceof ApiError
                        ? requestError
                        : new ApiError(0, 'Ulasan gagal dimuat.'));
                    });
                  }} />
                ) : reviews.length ? (
                  reviews.map((review) => (
                    <article className="review-card" key={review.id}>
                      <div className="review-card-heading">
                        <strong>{review.user.name}</strong>
                        <span><Star size={13} fill="currentColor" /> {review.rating}</span>
                      </div>
                      <p>{review.comment || 'Pengunjung memberi rating tanpa komentar.'}</p>
                    </article>
                  ))
                ) : (
                  <p className="reviews-empty">Belum ada ulasan. Jadilah yang pertama berbagi cerita.</p>
                )}
              </div>
            </div>
            <aside className="review-panel">
              <div className="review-panel-title">
                <div className="review-icon"><MessageSquare size={19} /></div>
                <div>
                  <div className="section-eyebrow">Bagikan pengalaman</div>
                  <h2>Tulis ulasan</h2>
                </div>
              </div>
              {user ? (
                <form className="form-stack review-form" onSubmit={handleReviewSubmit}>
                  <label>
                    Rating
                    <select value={rating} onChange={(event) => setRating(Number(event.target.value))}>
                      {[5, 4, 3, 2, 1].map((value) => (
                        <option value={value} key={value}>{value} bintang</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Komentar <span className="optional-label">Opsional</span>
                    <textarea
                      rows={3}
                      maxLength={1000}
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      placeholder="Apa yang paling kamu suka?"
                    />
                  </label>
                  {reviewError && <ErrorNotice message={reviewError.message} errors={reviewError.errors} />}
                  {reviewSuccess && <p className="success-message" role="status">{reviewSuccess}</p>}
                  <button className="button button-primary button-wide" type="submit" disabled={reviewPending}>
                    {reviewPending ? 'Mengirim ulasan...' : 'Kirim ulasan'}
                  </button>
                </form>
              ) : (
                <div className="review-login-prompt">
                  <p>Login untuk memberi rating dan berbagi cerita tentang warung ini.</p>
                  <button className="button button-primary button-wide" type="button" onClick={onLogin}>
                    Login untuk menulis ulasan
                  </button>
                </div>
              )}
            </aside>
          </section>
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon"><MapPin size={22} /></div>
          <h2>Warung tidak ditemukan</h2>
          <p>Warung ini mungkin sudah tidak tersedia.</p>
        </div>
      )}
    </main>
  );
}

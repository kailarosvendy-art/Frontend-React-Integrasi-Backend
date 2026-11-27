import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { ErrorNotice } from '../components/Feedback';
import { ApiError } from '../services/api';
import { getAuditLog, getAuditLogs, type AuditLog, type AuditLogFilters } from '../services/auditService';

const PAGE_SIZE = 20;

function formatDate(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('id-ID');
}

function metadataValue(metadata: unknown, key: string): string {
  if (typeof metadata !== 'object' || metadata === null || !(key in metadata)) return '—';
  const value = (metadata as Record<string, unknown>)[key];
  if (value === null || value === undefined || value === '') return '—';
  return typeof value === 'string' ? value : JSON.stringify(value) ?? String(value);
}

function formatMetadata(metadata: unknown): string {
  if (metadata === null || metadata === undefined) return '—';
  if (typeof metadata === 'string') return metadata;
  return JSON.stringify(metadata, null, 2) ?? String(metadata);
}

function AuditDetailDialog({ auditId, onClose }: { auditId: number; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [audit, setAudit] = useState<AuditLog | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    dialog.showModal();
    titleRef.current?.focus();
    setStatus('Memuat detail audit.');

    const controller = new AbortController();
    getAuditLog(auditId, controller.signal)
      .then((result) => {
        setAudit(result);
        setStatus('Detail audit berhasil dimuat.');
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setError(requestError instanceof ApiError
            ? requestError
            : new ApiError(0, 'Detail audit gagal dimuat.'));
          setStatus('');
        }
      });

    return () => {
      controller.abort();
      if (dialog.open) dialog.close();
    };
  }, [auditId]);

  function closeDialog() {
    if (dialogRef.current?.open) dialogRef.current.close();
    onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      className="dialog audit-detail-dialog"
      aria-labelledby="audit-detail-title"
      onCancel={(event) => {
        event.preventDefault();
        closeDialog();
      }}
    >
      <button className="icon-button dialog-close" type="button" onClick={closeDialog} aria-label="Tutup detail audit">
        <X size={20} aria-hidden="true" />
      </button>
      <div className="dialog-kicker">AUDIT LOG #{auditId}</div>
      <h2 id="audit-detail-title" ref={titleRef} tabIndex={-1}>Detail aktivitas</h2>
      <p className="sr-only" role="status" aria-live="polite">{status}</p>
      {error ? (
        <ErrorNotice message={error.message} errors={error.errors} />
      ) : audit ? (
        <dl className="audit-detail-list">
          <div><dt>Aksi</dt><dd>{audit.action}</dd></div>
          <div><dt>Pengguna</dt><dd>{audit.userName} ({audit.userEmail})</dd></div>
          <div><dt>User ID</dt><dd>{audit.userId}</dd></div>
          <div><dt>Target</dt><dd>{audit.targetTable} #{audit.targetId}</dd></div>
          <div><dt>Waktu</dt><dd>{formatDate(audit.createdAt)}</dd></div>
          <div><dt>IP address</dt><dd>{metadataValue(audit.metadata, 'ip_address')}</dd></div>
          <div><dt>User agent</dt><dd className="audit-user-agent">{metadataValue(audit.metadata, 'user_agent')}</dd></div>
          <div>
            <dt>Metadata</dt>
            <dd><pre tabIndex={0} aria-label={`Metadata lengkap audit ${auditId}`}>{formatMetadata(audit.metadata)}</pre></dd>
          </div>
        </dl>
      ) : (
        <div className="loading-state" aria-hidden="true">
          <span className="spinner" />
          <span>Memuat detail audit...</span>
        </div>
      )}
      <div className="dialog-actions">
        <button className="button button-outline" type="button" onClick={closeDialog}>Tutup</button>
      </div>
    </dialog>
  );
}

export function AuditLogs({ onBack }: { onBack: () => void }) {
  const pageHeadingRef = useRef<HTMLHeadingElement>(null);
  const fromDateRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState({
    action: '',
    targetTable: '',
    targetId: '',
    userId: '',
    from: '',
    to: '',
  });
  const [filterError, setFilterError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Omit<AuditLogFilters, 'page' | 'pageSize'>>({});
  const [page, setPage] = useState(1);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState<Awaited<ReturnType<typeof getAuditLogs>> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [status, setStatus] = useState('');
  const [selectedAuditId, setSelectedAuditId] = useState<number | null>(null);

  useEffect(() => {
    pageHeadingRef.current?.focus();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);
    setStatus('Memuat catatan audit.');
    getAuditLogs({ ...filters, page, pageSize: PAGE_SIZE }, controller.signal)
      .then((data) => {
        setResult(data);
        const totalPages = Math.max(data.pagination.totalPages, 1);
        setStatus(
          `Menampilkan ${data.items.length} dari ${data.pagination.total} catatan audit. Halaman ${page} dari ${totalPages}.`,
        );
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          const apiError = requestError instanceof ApiError
            ? requestError
            : new ApiError(0, 'Catatan audit gagal dimuat.');
          setError(apiError);
          setStatus('');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [filters, page, reloadKey]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const targetId = String(formData.get('targetId') ?? '').trim();
    const userId = String(formData.get('userId') ?? '').trim();
    const from = String(formData.get('from') ?? '').trim();
    const to = String(formData.get('to') ?? '').trim();
    if (from && to && from > to) {
      setFilterError('Tanggal awal harus sama dengan atau sebelum tanggal akhir.');
      fromDateRef.current?.focus();
      return;
    }
    setFilterError(null);
    const nextFilters: Omit<AuditLogFilters, 'page' | 'pageSize'> = {};

    for (const field of ['action', 'targetTable', 'from', 'to'] as const) {
      const value = String(formData.get(field) ?? '').trim();
      if (value) nextFilters[field] = value;
    }
    if (targetId) nextFilters.targetId = Number(targetId);
    if (userId) nextFilters.userId = Number(userId);

    setPage(1);
    setFilters(nextFilters);
  }

  function clearFilters() {
    setDraft({ action: '', targetTable: '', targetId: '', userId: '', from: '', to: '' });
    setFilterError(null);
    setFilters({});
    setPage(1);
  }

  const totalPages = Math.max(result?.pagination.totalPages ?? 1, 1);

  return (
    <main className="audit-page">
      <button className="back-link" type="button" onClick={onBack}>
        <ArrowLeft size={17} aria-hidden="true" />
        Kembali ke katalog
      </button>
      <header className="audit-heading">
        <div className="section-eyebrow">ADMINISTRASI</div>
        <h1 id="audit-page-title" ref={pageHeadingRef} tabIndex={-1}>Audit log</h1>
        <p>Riwayat autentikasi, warung, menu, review, dan pesanan yang tercatat di server.</p>
      </header>

      <form className="audit-filter-form" onSubmit={applyFilters}>
        <fieldset>
          <legend>Filter catatan audit</legend>
          <div className="audit-filter-grid">
            <label>
              Aksi
              <input
                name="action"
                value={draft.action}
                maxLength={50}
                onChange={(event) => setDraft({ ...draft, action: event.target.value })}
              />
            </label>
            <label>
              Tabel target
              <input
                name="targetTable"
                value={draft.targetTable}
                maxLength={50}
                onChange={(event) => setDraft({ ...draft, targetTable: event.target.value })}
              />
            </label>
            <label>
              Target ID
              <input
                name="targetId"
                type="number"
                min="1"
                step="1"
                value={draft.targetId}
                onChange={(event) => setDraft({ ...draft, targetId: event.target.value })}
              />
            </label>
            <label>
              User ID
              <input
                name="userId"
                type="number"
                min="1"
                step="1"
                value={draft.userId}
                onChange={(event) => setDraft({ ...draft, userId: event.target.value })}
              />
            </label>
            <label>
              Dari tanggal
              <input
                ref={fromDateRef}
                name="from"
                type="date"
                max={draft.to || undefined}
                value={draft.from}
                aria-invalid={filterError ? true : undefined}
                aria-describedby={filterError ? 'audit-date-range-error' : undefined}
                onChange={(event) => {
                  setDraft({ ...draft, from: event.target.value });
                  setFilterError(null);
                }}
              />
            </label>
            <label>
              Sampai tanggal
              <input
                name="to"
                type="date"
                min={draft.from || undefined}
                value={draft.to}
                aria-invalid={filterError ? true : undefined}
                aria-describedby={filterError ? 'audit-date-range-error' : undefined}
                onChange={(event) => {
                  setDraft({ ...draft, to: event.target.value });
                  setFilterError(null);
                }}
              />
            </label>
          </div>
        </fieldset>
        {filterError && <p className="audit-filter-error" id="audit-date-range-error" role="alert">{filterError}</p>}
        <div className="audit-filter-actions">
          <button className="button button-primary" type="submit">Terapkan filter</button>
          <button className="button button-outline" type="button" onClick={clearFilters}>Hapus filter</button>
        </div>
      </form>

      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{status}</p>
      {error && (
        <ErrorNotice
          message={error.message}
          errors={error.errors}
          onRetry={() => setReloadKey((current) => current + 1)}
        />
      )}

      <section className="audit-results" aria-labelledby="audit-results-heading" aria-busy={isLoading}>
        <div className="audit-results-heading">
          <h2 id="audit-results-heading" ref={resultsHeadingRef} tabIndex={-1}>Catatan aktivitas</h2>
          {result && <p>{result.pagination.total} catatan</p>}
        </div>
        {isLoading && !result ? (
          <div className="loading-state" aria-hidden="true">
            <span className="spinner" />
            <span>Memuat catatan audit...</span>
          </div>
        ) : result?.items.length ? (
          <>
            <p className="audit-scroll-hint">Pada layar kecil, geser tabel ke samping untuk melihat semua kolom.</p>
            <div className="audit-table-scroll" role="region" aria-label="Tabel audit log, geser horizontal untuk melihat semua kolom" tabIndex={0}>
              <table className="audit-table">
                <caption className="sr-only">Riwayat aktivitas dan pengguna terkait</caption>
                <thead>
                  <tr>
                    <th scope="col">Waktu</th>
                    <th scope="col">Pengguna</th>
                    <th scope="col">Aksi</th>
                    <th scope="col">Target</th>
                    <th scope="col">Target ID</th>
                    <th scope="col">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {result.items.map((item) => (
                    <tr key={item.id}>
                      <td>{formatDate(item.createdAt)}</td>
                      <td>
                        <strong>{item.userName}</strong>
                        <span className="audit-user-email">{item.userEmail}</span>
                      </td>
                      <td>{item.action}</td>
                      <td>{item.targetTable}</td>
                      <td>{item.targetId}</td>
                      <td>
                        <button
                          className="button button-outline button-small"
                          type="button"
                          aria-label={`Lihat detail audit nomor ${item.id}`}
                          onClick={() => setSelectedAuditId(item.id)}
                        >
                          Lihat detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <nav className="pagination" aria-label="Navigasi halaman audit log">
              <button
                className="button button-outline button-small"
                type="button"
                disabled={isLoading || page <= 1}
                onClick={() => {
                  if (isLoading) return;
                  resultsHeadingRef.current?.focus();
                  setPage((current) => current - 1);
                }}
              >
                Sebelumnya
              </button>
              <span>Halaman <strong>{page}</strong> dari <strong>{totalPages}</strong></span>
              <button
                className="button button-outline button-small"
                type="button"
                disabled={isLoading || page >= totalPages}
                onClick={() => {
                  if (isLoading) return;
                  resultsHeadingRef.current?.focus();
                  setPage((current) => current + 1);
                }}
              >
                Berikutnya
              </button>
            </nav>
          </>
        ) : isLoading ? (
          <div className="loading-state" aria-hidden="true">
            <span className="spinner" />
            <span>Memuat catatan audit...</span>
          </div>
        ) : (
          <div className="empty-state audit-empty-state">
            <h3>Tidak ada catatan audit</h3>
            <p>Ubah filter atau lakukan login/logout untuk membuat aktivitas audit.</p>
          </div>
        )}
      </section>

      {selectedAuditId !== null && (
        <AuditDetailDialog auditId={selectedAuditId} onClose={() => setSelectedAuditId(null)} />
      )}
    </main>
  );
}

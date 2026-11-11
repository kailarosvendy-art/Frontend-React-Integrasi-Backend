import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { ApiError } from '../services/api';
import type { Stall, StallInput } from '../types/stall';
import { ErrorNotice } from './Feedback';

export function StallForm({
  stall,
  pending,
  error,
  onCancel,
  onSave,
}: {
  stall: Stall | null;
  pending: boolean;
  error: ApiError | null;
  onCancel: () => void;
  onSave: (input: StallInput) => Promise<void>;
}) {
  const [name, setName] = useState(stall?.name ?? '');
  const [category, setCategory] = useState(stall?.category ?? '');
  const [location, setLocation] = useState(stall?.location ?? '');
  const [description, setDescription] = useState(stall?.description ?? '');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSave({
      name: name.trim(),
      category: category.trim() || null,
      location: location.trim() || null,
      description: description.trim() || null,
    });
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !pending) onCancel();
    }}>
      <section
        className="dialog stall-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="stall-form-title"
      >
        <button
          className="icon-button dialog-close"
          type="button"
          onClick={onCancel}
          aria-label="Tutup"
          disabled={pending}
        >
          <X size={20} />
        </button>
        <div className="dialog-kicker">{stall ? 'Perbarui informasi' : 'Warung baru'}</div>
        <h2 id="stall-form-title">{stall ? 'Ubah warung' : 'Tambah warung'}</h2>
        <p className="dialog-intro">Lengkapi informasi warung kantinmu.</p>
        {error && <ErrorNotice message={error.message} errors={error.errors} />}
        <form className="form-stack" onSubmit={handleSubmit}>
          <label>
            Nama warung
            <input
              required
              minLength={3}
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Contoh: Soto Bu Sari"
            />
          </label>
          <label>
            Kategori <span className="optional-label">Opsional</span>
            <input
              maxLength={50}
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="Contoh: Soto, Minuman"
            />
          </label>
          <label>
            Lokasi <span className="optional-label">Opsional</span>
            <input
              maxLength={100}
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Contoh: Kantin Gedung A"
            />
          </label>
          <label>
            Deskripsi <span className="optional-label">Opsional</span>
            <textarea
              maxLength={1000}
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Ceritakan menu andalan atau keunikan warung ini."
            />
          </label>
          <div className="dialog-actions">
            <button className="button button-outline" type="button" onClick={onCancel} disabled={pending}>
              Batal
            </button>
            <button className="button button-primary" type="submit" disabled={pending}>
              {pending ? 'Menyimpan...' : stall ? 'Simpan perubahan' : 'Tambah warung'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

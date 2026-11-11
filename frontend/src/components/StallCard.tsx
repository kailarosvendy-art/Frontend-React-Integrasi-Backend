import { ArrowUpRight, MapPin, Pencil, Star, Trash2 } from 'lucide-react';
import type { Stall } from '../types/stall';

export function StallCard({
  stall,
  canEdit,
  canDelete,
  onOpen,
  onEdit,
  onDelete,
}: {
  stall: Stall;
  canEdit: boolean;
  canDelete: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="stall-card">
      <button className="stall-card-main" type="button" onClick={onOpen}>
        <div className="stall-card-art" aria-hidden="true">
          <span>{stall.name.trim().charAt(0).toUpperCase() || 'W'}</span>
          {stall.isPopular && <span className="popular-tag">Favorit</span>}
        </div>
        <div className="stall-card-body">
          <div className="stall-card-topline">
            <span className="category-label">{stall.category || 'Warung kantin'}</span>
            <span className="rating"><Star size={15} fill="currentColor" /> {stall.avgRating.toFixed(1)}</span>
          </div>
          <h2>{stall.name}</h2>
          <p className="stall-location">
            <MapPin size={15} aria-hidden="true" />
            {stall.location || 'Lokasi belum dicantumkan'}
          </p>
          <p className="stall-description">
            {stall.description || 'Temukan menu andalan warung ini di kantin kampus.'}
          </p>
          <span className="review-count">{stall.reviewCount} ulasan</span>
        </div>
        <span className="card-open-icon"><ArrowUpRight size={19} aria-hidden="true" /></span>
      </button>
      {(canEdit || canDelete) && (
        <div className="stall-card-actions">
          {canEdit && (
            <button className="button button-small button-outline" type="button" onClick={onEdit}>
              <Pencil size={14} aria-hidden="true" />
              Ubah
            </button>
          )}
          {canDelete && (
            <button className="button button-small button-danger-outline" type="button" onClick={onDelete}>
              <Trash2 size={14} aria-hidden="true" />
              Hapus
            </button>
          )}
        </div>
      )}
    </article>
  );
}

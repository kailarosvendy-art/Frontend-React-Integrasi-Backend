import { AlertCircle, RefreshCw } from 'lucide-react';

function getValidationMessages(errors: unknown): string[] {
  if (typeof errors === 'string') return [errors];
  if (!Array.isArray(errors)) return [];

  return errors.flatMap((item: unknown) => {
    if (typeof item === 'string') return [item];
    if (typeof item !== 'object' || item === null || !('message' in item)) return [];

    const issue = item as { message?: unknown; path?: unknown };
    if (typeof issue.message !== 'string') return [];
    const path = Array.isArray(issue.path)
      ? issue.path.join('.')
      : typeof issue.path === 'string'
        ? issue.path
        : '';
    return [path ? `${path}: ${issue.message}` : issue.message];
  });
}

export function ErrorNotice({
  message,
  errors,
  onRetry,
}: {
  message: string;
  errors?: unknown;
  onRetry?: () => void;
}) {
  const details = getValidationMessages(errors);

  return (
    <div className="notice notice-error" role="alert">
      <AlertCircle size={19} aria-hidden="true" />
      <div className="notice-copy">
        <p>{message}</p>
        {details.length > 0 && (
          <ul>
            {details.map((detail, index) => <li key={`${detail}-${index}`}>{detail}</li>)}
          </ul>
        )}
      </div>
      {onRetry && (
        <button className="button button-quiet notice-retry" type="button" onClick={onRetry}>
          <RefreshCw size={15} aria-hidden="true" />
          Coba lagi
        </button>
      )}
    </div>
  );
}

export function LoadingState({ label = 'Memuat data...' }: { label?: string }) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

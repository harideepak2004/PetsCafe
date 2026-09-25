import { MessageSquareHeart, Star } from "lucide-react";
import { api } from "../../lib/api";
import { dateTime } from "../../lib/format";
import { usePolling } from "../../lib/usePolling";
import { EmptyState, ErrorBanner, Spinner } from "../../components/ui";

export default function StaffFeedback() {
  const q = usePolling(() => api.staffFeedback(), []);
  if (q.loading && !q.data) return <Spinner />;
  return (
    <>
      <ErrorBanner error={q.error} onRetry={q.reload} />
      {q.data?.length === 0 ? <EmptyState icon={MessageSquareHeart} title="No feedback yet" /> : (
        <div className="feedback-grid">
          {q.data?.map((f) => (
            <article key={f.id} className="card feedback">
              <div className="feedback-head">
                <div className="rating" aria-label={`${f.rating} stars`}>
                  {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={16} className={n <= f.rating ? "on" : ""} />)}
                </div>
                <span className="muted small">{dateTime(f.submitted_at)}</span>
              </div>
              <p>{f.message}</p>
              <div className="muted small">
                <b>{f.name}</b> · <a href={`mailto:${f.email}`}>{f.email}</a>{f.phone && ` · ${f.phone}`}
                {f.pet_type && ` · loves ${f.pet_type.replace("-", " ")}`}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

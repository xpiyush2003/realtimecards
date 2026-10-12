import { useEffect, useState } from "react";
import { formatDateTime } from "../utils/dates.js";
import ErrorMessage from "./ErrorMessage.jsx";
import Spinner from "./Spinner.jsx";

// loadPage(offset) should return { items, has_more }
export default function ActivityFeed({ loadPage }) {
  const [items, setItems] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // loads the next page every time the offset changes
  useEffect(() => {
    let cancelled = false;
    loadPage(offset)
      .then((page) => {
        if (cancelled) return;
        setItems((old) =>
          offset === 0 ? page.items : [...old, ...page.items],
        );
        setHasMore(page.has_more);
        setError("");
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadPage, offset]);

  function loadMore() {
    setLoading(true);
    setOffset(items.length);
  }

  return (
    <div>
      <ErrorMessage message={error} />
      {items.length > 0 && (
        <ul className="divide-y divide-slate-100">
          {items.map((item) => (
            <li key={item.id} className="py-3">
              <p className="text-sm text-slate-800">{item.message}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {formatDateTime(item.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
      {!loading && !error && items.length === 0 && (
        <p className="py-6 text-center text-sm text-slate-500">
          Nothing has happened yet.
        </p>
      )}
      {loading && <Spinner />}
      {!loading && hasMore && (
        <div className="pt-3 text-center">
          <button className="btn btn-secondary" onClick={loadMore}>
            Load more
          </button>
        </div>
      )}
    </div>
  );
}

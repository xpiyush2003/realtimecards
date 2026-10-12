import { useCallback, useEffect, useState } from "react";

// loads data when the page opens and gives back a reload function
export function useApi(loader) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const reload = useCallback(
    () =>
      loader()
        .then((result) => {
          setData(result);
          setError("");
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false)),
    [loader],
  );

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, error, loading, reload };
}

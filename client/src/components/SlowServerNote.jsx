import { useEffect, useState } from "react";

// the free server sleeps when unused, so the first request can be slow
export default function SlowServerNote({ waiting }) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!waiting) return;
    const timer = setTimeout(() => setSlow(true), 4000);
    return () => {
      clearTimeout(timer);
      setSlow(false);
    };
  }, [waiting]);

  if (!slow) return null;
  return (
    <p className="text-center text-sm text-slate-500">
      Waking up the server, this can take up to a minute...
    </p>
  );
}

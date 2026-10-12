import { useEffect } from "react";

export default function Modal({ title, onClose, wide = false, children }) {
  // close on the Escape key
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-10 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:items-center"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full rounded-xl bg-white p-5 shadow-xl ${wide ? "max-w-2xl" : "max-w-md"}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="min-w-0 truncate text-lg font-semibold">{title}</h2>
          <button
            className="cursor-pointer rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

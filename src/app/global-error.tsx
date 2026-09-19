"use client";

import { useEffect } from "react";
import { AlertOctagonIcon, RotateCcwIcon } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Critical error (root layout failed):", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div
          style={{
            display: "flex",
            minHeight: "100svh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1.5rem",
            padding: "1.5rem",
            textAlign: "center",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <AlertOctagonIcon size={48} color="#dc2626" />
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 600, margin: 0 }}>
              A critical error occurred
            </h1>
            <p style={{ color: "#6b7280", maxWidth: "24rem", marginTop: "0.5rem" }}>
              GitHub Monitor hit an unrecoverable error. Please try reloading
              the page.
            </p>
            {error.digest && (
              <p style={{ color: "#9ca3af", fontSize: "0.75rem", fontFamily: "monospace" }}>
                Error ID: {error.digest}
              </p>
            )}
          </div>
          <button
            onClick={reset}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 1rem",
              borderRadius: "0.375rem",
              border: "1px solid #d1d5db",
              background: "white",
              color: "#111827",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            <RotateCcwIcon size={16} />
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}

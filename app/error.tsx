"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      title="Hata"
      description="Sayfa şu anda yüklenemedi. Yeniden deneyebilir veya ana sayfaya dönebilirsiniz."
      action={
        <Button type="button" onClick={() => unstable_retry()}>
          Yeniden Dene
        </Button>
      }
    />
  );
}

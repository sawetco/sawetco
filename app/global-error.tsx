"use client";

import { GeistSans } from "geist/font/sans";
import { useEffect } from "react";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import "./globals.css";

export default function GlobalError({
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
    <html lang="tr" className={`dark ${GeistSans.variable}`}>
      <body>
        <main>
          <ErrorState
            title="Hata"
            description="Beklenmedik bir sorun oluştu. Lütfen yeniden deneyin."
            action={
              <Button type="button" onClick={() => unstable_retry()}>
                Yeniden Dene
              </Button>
            }
          />
        </main>
      </body>
    </html>
  );
}

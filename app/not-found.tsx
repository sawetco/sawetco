import type { Metadata } from "next";
import { ErrorState } from "@/components/error-state";

export const metadata: Metadata = {
  title: "404",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <ErrorState
      title="404"
      description="Aradığınız bağlantı taşınmış, silinmiş veya hiç var olmamış olabilir."
    />
  );
}

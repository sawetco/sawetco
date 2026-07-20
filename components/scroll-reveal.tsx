"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
};

export function ScrollReveal({ children, className }: ScrollRevealProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;

    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "0px 0px -10%",
        threshold: 0.15,
      },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={elementRef}
      data-visible={isVisible ? "" : undefined}
      className={cn(
        "translate-y-3 opacity-0 blur-md transition-[opacity,filter,transform] duration-1000 ease-out data-[visible]:translate-y-0 data-[visible]:opacity-100 data-[visible]:blur-none motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:blur-none motion-reduce:transition-none",
        className,
      )}
    >
      {children}
    </div>
  );
}

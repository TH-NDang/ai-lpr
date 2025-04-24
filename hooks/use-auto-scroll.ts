"use client";

import { useEffect, useRef } from "react";

export const useAutoScroll = <T extends unknown>(dependency: T[]) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  }, [dependency]);

  return scrollRef;
};

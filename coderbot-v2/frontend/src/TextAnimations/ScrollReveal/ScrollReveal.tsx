/*
	Installed from https://reactbits.dev/ts/tailwind/
*/

import React, { useEffect, useRef, useMemo, ReactNode, RefObject } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  scrollContainerRef?: RefObject<HTMLElement>;
  enableBlur?: boolean;
  baseOpacity?: number;
  baseRotation?: number;
  blurStrength?: number;
  containerClassName?: string;
  textClassName?: string;
  rotationEnd?: string;
  wordAnimationEnd?: string;
}

const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  scrollContainerRef,
  enableBlur = true,
  baseOpacity = 0.1,
  baseRotation = 3,
  blurStrength = 4,
  containerClassName = "",
  textClassName = "",
  rotationEnd = "bottom bottom",
  wordAnimationEnd = "bottom bottom",
}) => {
  const containerRef = useRef<HTMLHeadingElement>(null);
  const reducedMotion = useRef(false);
  const staggerMs = 28; // leve e fluido

  const splitText = useMemo(() => {
    const text = typeof children === "string" ? children : "";
    return text.split(/(\s+)/).map((word, index) => {
      if (word.match(/^\s+$/)) return word;
      return (
        <span
          className="inline-block word opacity-0 translate-y-2 will-change-[opacity,transform,filter]"
          key={index}
          style={{
            transition: "opacity 420ms ease, transform 420ms ease, filter 520ms ease",
            transitionDelay: `${index * staggerMs}ms`,
            opacity: baseOpacity,
            filter: enableBlur ? `blur(${blurStrength}px)` : undefined,
          }}
        >
          {word}
        </span>
      );
    });
  }, [children]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    try {
      reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {}

    const words = el.querySelectorAll<HTMLElement>(".word");

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          words.forEach((w) => {
            w.style.opacity = "1";
            w.style.transform = "translateY(0)";
            if (enableBlur) w.style.filter = "blur(0px)";
            if (reducedMotion.current) {
              w.style.transitionDuration = "0ms";
            }
          });
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [scrollContainerRef, enableBlur, blurStrength]);

  return (
    <h2 ref={containerRef} className={`my-5 ${containerClassName}`}>
      <p className={`mx-auto text-center text-[clamp(1.4rem,3.6vw,2.6rem)] leading-[1.5] font-semibold ${textClassName}`}>
        {splitText}
      </p>
    </h2>
  );
};

export default ScrollReveal;

'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { MotionValue, motion, useSpring, useTransform } from 'motion/react';
import useMeasure from 'react-use-measure';

interface SlidingNumberProps {
  value: number;
  padStart?: number;
  decimalSeparator?: string;
  className?: string;
}

interface DigitProps {
  value: number;
  place: number;
}

function Digit({ value, place }: DigitProps) {
  const id = useId();
  const [ref, bounds] = useMeasure();
  const spring = useSpring(value, {
    stiffness: 280,
    damping: 18,
    mass: 0.3,
  });
  const height = bounds.height;

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return (
    <div
      style={{ height }}
      className="relative inline-flex w-[1ch] items-center justify-center overflow-y-clip tabular-nums"
    >
      {Array.from({ length: 10 }, (_, i) => (
        <NumberSpan key={`${id}-${i}`} mv={spring} number={i} height={height} />
      ))}
      <span ref={ref} className="invisible">
        0
      </span>
    </div>
  );
}

interface NumberSpanProps {
  mv: MotionValue;
  number: number;
  height: number;
}

function NumberSpan({ mv, number, height }: NumberSpanProps) {
  const y = useTransform(mv, (latest) => {
    if (!height) return 0;
    const currentDigit = latest % 10;
    let offset = (number - currentDigit) % 10;
    if (offset > 5) offset -= 10;
    else if (offset < -5) offset += 10;
    return offset * height;
  });

  return (
    <motion.span
      style={{ y }}
      className="absolute inset-0 flex items-center justify-center"
    >
      {number}
    </motion.span>
  );
}

export function SlidingNumber({
  value,
  padStart = 0,
  decimalSeparator = '.',
  className,
}: SlidingNumberProps) {
  const numericValue = typeof value === 'number' ? value : parseFloat(value);
  const [currentDigits, setCurrentDigits] = useState<
    { key: string; value: number | string }[]
  >([]);
  const prevDigitsRef = useRef<{ key: string; value: number | string }[]>([]);

  const digits = useMemo(() => {
    const result: { key: string; value: number | string }[] = [];
    const [intPart, decPart] = Math.abs(numericValue).toString().split('.');

    const paddedInt = intPart.padStart(padStart, '0');

    // Format with commas
    const formatted = Number(paddedInt).toLocaleString();

    for (let i = 0; i < formatted.length; i++) {
      const ch = formatted[i];
      if (ch === ',') {
        result.push({ key: `comma-${i}`, value: ',' });
      } else {
        result.push({ key: `int-${i}`, value: parseInt(ch) });
      }
    }

    if (decPart !== undefined) {
      result.push({
        key: 'decimal',
        value: decimalSeparator,
      });
      for (let i = 0; i < decPart.length; i++) {
        result.push({ key: `dec-${i}`, value: parseInt(decPart[i]) });
      }
    }

    return result;
  }, [numericValue, padStart, decimalSeparator]);

  useEffect(() => {
    const prev = prevDigitsRef.current;

    if (
      prev.length !== digits.length ||
      prev.some((d, i) => d.key !== digits[i].key || d.value !== digits[i].value)
    ) {
      setCurrentDigits(digits);
      prevDigitsRef.current = digits;
    }
  }, [digits]);

  return (
    <span className={`inline-flex items-center ${className || ''}`}>
      {numericValue < 0 && <span>-</span>}
      {currentDigits.map((digit) =>
        typeof digit.value === 'number' ? (
          <Digit key={digit.key} value={digit.value} place={0} />
        ) : (
          <span key={digit.key}>{digit.value}</span>
        )
      )}
    </span>
  );
}

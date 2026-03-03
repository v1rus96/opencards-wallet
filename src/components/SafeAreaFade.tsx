'use client';

/**
 * A gradient overlay that sits at the top of the viewport,
 * covering the safe area. Content scrolling behind it
 * smoothly fades into the background color.
 */
export function SafeAreaFade({ height }: { height: number }) {
  if (height <= 0) return null;

  return (
    <div
      className="pointer-events-none fixed top-0 left-0 right-0 z-40"
      style={{ height: height + 40 }}
    >
      <div
        className="h-full w-full"
        style={{
          background: `linear-gradient(to bottom, 
            rgb(9 9 11) 0%, 
            rgb(9 9 11) ${Math.max(0, height - 12)}px, 
            rgba(9, 9, 11, 0.55) ${height + 4}px, 
            rgba(9, 9, 11, 0.2) ${height + 20}px, 
            transparent ${height + 40}px
          )`,
        }}
      />
    </div>
  );
}

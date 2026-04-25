/**
 * Satori / ImageResponse-friendly icon markup (no className — inline styles only).
 * Used for favicon, Apple touch, and PWA manifest icons.
 */
export function BeaconPwaIconImage({ size }: { size: number }) {
  const t = (px: number) => Math.max(1, Math.round((px * size) / 64));
  // Dark mode tokens: bg #141a14, primary #4da882 (hsl 158 30% 50%), secondary #3a4a3c (hsl 135 12% 26%)
  const bg = "hsl(130, 8%, 8%)";
  const ringOuter = "rgba(58, 74, 60, 0.5)";   // secondary, low opacity (outermost)
  const ringMid = "rgba(58, 74, 60, 0.75)";    // secondary, mid opacity
  const ringInner = "rgba(77, 168, 130, 0.9)"; // primary
  const center = "rgb(77, 168, 130)";           // primary solid
  const corner = Math.round(size * 0.22);

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: bg,
        borderRadius: corner,
      }}
    >
      <div
        style={{
          width: t(52),
          height: t(52),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 9999,
          border: `${t(2)}px solid ${ringOuter}`,
        }}
      >
        <div
          style={{
            width: t(36),
            height: t(36),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 9999,
            border: `${t(1.5)}px solid ${ringMid}`,
          }}
        >
          <div
            style={{
              width: t(22),
              height: t(22),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 9999,
              border: `${t(1.5)}px solid ${ringInner}`,
            }}
          >
            <div
              style={{
                width: t(10),
                height: t(10),
                borderRadius: 9999,
                background: center,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

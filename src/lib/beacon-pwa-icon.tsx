/**
 * Satori / ImageResponse-friendly icon markup (no className — inline styles only).
 * Used for favicon, Apple touch, and PWA manifest icons.
 */
export function BeaconPwaIconImage({ size }: { size: number }) {
  const t = (px: number) => Math.max(1, Math.round((px * size) / 64));
  const bg = "hsl(130, 8%, 7%)";
  const ring = "rgba(255, 166, 0, 0.4)";
  const ringMid = "rgba(122, 143, 204, 0.5)";
  const center = "hsl(158, 30%, 50%)";
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
          border: `${t(2)}px solid ${ring}`,
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
              border: `${t(1)}px solid rgba(255, 140, 40, 0.55)`,
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

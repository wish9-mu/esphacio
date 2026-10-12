export default function Architecture({ hero, tone }: { hero?: boolean; tone?: string }) {
  if (hero) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 12, padding: 16 }}>
        {[
          { bg: '#e8e0d0', borderRadius: 16 },
          { bg: '#343B2B', borderRadius: 16, opacity: 0.85 },
          { bg: '#f2ece0', borderRadius: 16 },
          { bg: '#c8bba6', borderRadius: 16 },
        ].map((s, i) => (
          <div key={i} style={{ background: s.bg, borderRadius: s.borderRadius, opacity: (s as Record<string, unknown>).opacity as number | undefined }} />
        ))}
      </div>
    );
  }
  return (
    <div className="architecture" style={{ background: tone ? `${tone}30` : undefined }}>
      <div className="arch-wall" />
      <div className="arch-window" style={tone ? { background: tone, opacity: 0.7 } : undefined} />
      <div className="arch-accent" />
    </div>
  );
}

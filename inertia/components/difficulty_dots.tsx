export function DifficultyDots({ level }: { level: number }) {
  return (
    <div className="diff-dots">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`diff-dot ${i < level ? "on" : ""}`} />
      ))}
    </div>
  );
}

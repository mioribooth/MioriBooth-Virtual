export default function Spinner({ dark = false, size }: { dark?: boolean; size?: number }) {
  return (
    <span
      className={`spinner${dark ? " spinner-dark" : ""}`}
      style={size ? { width: size, height: size, borderWidth: Math.max(3, size / 10) } : undefined}
    />
  );
}

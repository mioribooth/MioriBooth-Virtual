export default function Spinner({ dark = false }: { dark?: boolean }) {
  return <span className={`spinner${dark ? " spinner-dark" : ""}`} />;
}

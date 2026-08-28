import Link from "next/link";

export default function BackButton({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="back-button">
      <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 5L7 10L12 15"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </Link>
  );
}

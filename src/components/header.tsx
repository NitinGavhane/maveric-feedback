import Link from "next/link";

export default function Header() {
  return (
    <Link href="/" className="flex items-center space-x-2">
      <img
        src="/Maveric.jpg"
        alt="Maveric Logo"
        width={200}
        height={66.47}
        className="object-contain"
      />
    </Link>
  );
} 
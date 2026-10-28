import Link from "next/link";
import "./site.css";

export default function NotFound() {
  return (
    <div className="site unavailable">
      <div className="unavailable-card">
        <div className="window-mini" aria-hidden="true" />
        <h1>Page not found</h1>
        <p>The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/" className="btn btn-outline">
          Back to the homepage
        </Link>
      </div>
    </div>
  );
}

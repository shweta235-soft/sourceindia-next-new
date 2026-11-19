import Link from "next/link";

export default function ReportsBreadcrumb({ page, title }: { page: string; title: string }) {
  return <nav className="mb-3" aria-label="Breadcrumb">
    <ol className="breadcrumb mb-0">
      <li className="breadcrumb-item"><Link href="/admin">Home</Link></li>
      <li className="breadcrumb-item">{page}</li>
      <li className="breadcrumb-item active" aria-current="page">{title}</li>
    </ol>
  </nav>;
}

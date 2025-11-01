import JobDetailClient from './JobDetailClient';

export function generateStaticParams() {
  // Return empty array - pages will be client-side rendered
  return [];
}

export default function JobDetailPage() {
  return <JobDetailClient />;
}

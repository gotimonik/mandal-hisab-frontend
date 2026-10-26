import { PageHeader } from "@/components/app/page-header";
import { SchemeForm } from "@/features/schemes/scheme-form";

export const metadata = { title: "New hapta scheme" };

export default async function NewSchemePage({ params }: PageProps<"/org/[orgId]/schemes/new">) {
  const { orgId } = await params;
  return (
    <div className="max-w-3xl">
      <PageHeader title="New hapta scheme" description="Define how much members contribute and how often. You can change future amounts and individual due dates later." />
      <SchemeForm orgId={orgId} />
    </div>
  );
}

import { PageHeader } from "@/components/app/page-header";
import { SchemeForm } from "@/features/schemes/scheme-form";
import { getT } from "@/i18n/server";

export const metadata = { title: "New hapta scheme" };

export default async function NewSchemePage({ params }: PageProps<"/org/[orgId]/schemes/new">) {
  const { orgId } = await params;
  const { t } = await getT();
  return (
    <div className="max-w-3xl">
      <PageHeader title={t("schg.newTitle")} description={t("schg.newDesc")} />
      <SchemeForm orgId={orgId} />
    </div>
  );
}

import { api } from "@/lib/server/api";
import { getT } from "@/i18n/server";
import { PageHeader } from "@/components/app/page-header";
import { BooksManager, type BookList } from "@/features/personal/books";

export const metadata = { title: "Personal Hisab · Books" };

/** Separate hisabs under one login: open, add, rename or delete books. */
export default async function BooksPage() {
  const [list, { t }] = await Promise.all([api<BookList>("/me/personal/books"), getT()]);
  return (
    <>
      <PageHeader title={t("ph.books.title")} description={t("ph.books.desc")} />
      <BooksManager list={list} />
    </>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { BookOpen, Check, CheckCircle2, ChevronDown, Loader2, Plus, Settings2, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormError } from "@/components/app/field";
import { SubmitButton } from "@/components/app/form-bits";
import { IconChip } from "@/components/app/bits";
import { apiMutate } from "@/lib/api-client";
import { selectBook } from "@/app/actions/api";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";

/** Personal Hisab books: separate hisabs under one login ("Personal", "Office" …). */
export interface PBook {
  _id: string;
  name: string;
  isMain: boolean;
}
export interface BookList {
  activeId: string;
  max: number;
  books: PBook[];
}

/** The main book is called "Personal" until renamed — shown in the person's language. */
export const bookName = (t: ReturnType<typeof useT>, b: Pick<PBook, "name" | "isMain">) => (b.isMain && b.name === "Personal" ? t("ph.books.defaultMain") : b.name);

/** Switch this device to another book and show the same section of it. */
function useSwitchBook(list: BookList) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const main = list.books.find((b) => b.isMain)?._id;
  const go = (book: PBook, message?: string) =>
    start(async () => {
      await selectBook(book._id, main);
      // a wallet / category page belongs to the old book: go to its section's list instead
      const section = pathname.split("/").slice(0, 3).join("/") || "/personal";
      toast.success(message ?? t("ph.books.switched", { name: bookName(t, book) }));
      router.push(section === "/personal/books" ? "/personal" : section);
      router.refresh();
    });
  return { go, pending };
}

/** The current book, at the top of every Personal Hisab page: switch, add or manage books. */
export function BookSwitcher({ list }: { list: BookList }) {
  const t = useT();
  const [creating, setCreating] = useState(false);
  const { go, pending } = useSwitchBook(list);
  const active = list.books.find((b) => b._id === list.activeId) ?? list.books[0];
  return (
    <>
      <div className="no-print mb-3 flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" className="h-10 max-w-full gap-2 rounded-full pr-3 pl-1.5 shadow-sm" aria-label={t("ph.books.switch")} />}>
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
              {pending ? <Loader2 className="size-4 animate-spin" /> : <BookOpen className="size-4" />}
            </span>
            <span className="truncate font-semibold">{bookName(t, active)}</span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{t("ph.books.title")}</DropdownMenuLabel>
              {list.books.map((b) => (
                <DropdownMenuItem key={b._id} onClick={() => b._id !== active._id && go(b)}>
                  <BookOpen />
                  <span className="min-w-0 flex-1 truncate">{bookName(t, b)}</span>
                  {b.isMain && <span className="text-[10px] font-semibold text-muted-foreground uppercase">{t("ph.books.main")}</span>}
                  {b._id === active._id && <Check />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {list.books.length < list.max && (
              <DropdownMenuItem onClick={() => setCreating(true)}>
                <Plus /> {t("ph.books.new")}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem render={<Link href="/personal/books" />}>
              <Settings2 /> {t("ph.books.manage")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {list.books.length === 1 && (
          // nudge: most people don't know a second book is possible
          <button type="button" onClick={() => setCreating(true)} className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10">
            <Plus className="size-3.5" /> {t("ph.books.addAnother")}
          </button>
        )}
      </div>
      <NewBookDialog open={creating} onOpenChange={setCreating} onCreated={(b) => go(b, t("ph.books.created", { name: b.name }))} />
    </>
  );
}

function NewBookDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated: (b: PBook) => void }) {
  const t = useT();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          setName("");
          setError(null);
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex-row items-start gap-3">
          <IconChip tone="emerald" className="mt-0.5">
            <BookOpen />
          </IconChip>
          <div className="flex min-w-0 flex-col gap-1">
            <DialogTitle>{t("ph.books.new")}</DialogTitle>
            <DialogDescription>{t("ph.books.newDesc")}</DialogDescription>
          </div>
        </DialogHeader>
        <form
          noValidate
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return setError(t("ph.books.vName"));
            start(async () => {
              const res = await apiMutate<{ book: PBook }>({ path: "/me/personal/books", body: { name: name.trim() } });
              if (!res.ok) return setError(res.error);
              onOpenChange(false);
              setName("");
              onCreated(res.data.book);
            });
          }}
        >
          <FormError message={error} />
          <Field label={t("ph.books.name")} htmlFor="pb-name">
            <Input id="pb-name" autoFocus maxLength={40} value={name} onChange={(e) => setName(e.target.value)} placeholder={t("ph.books.namePh")} />
          </Field>
          <SubmitButton pending={pending} icon={<CheckCircle2 />}>
            {t("ph.books.create")}
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ the Books page */

/** Every book: open, rename, delete (extra books only, after typing the name). */
export function BooksManager({ list }: { list: BookList }) {
  const t = useT();
  const [creating, setCreating] = useState(false);
  const { go, pending } = useSwitchBook(list);
  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {list.books.map((b) => (
          <li key={b._id} className={cn("rounded-2xl bg-card p-3.5 shadow-card ring-1 ring-foreground/[0.06]", b._id === list.activeId && "ring-2 ring-emerald-500/40")}>
            <div className="flex items-center gap-3">
              <IconChip tone={b.isMain ? "emerald" : "sky"}>
                <BookOpen />
              </IconChip>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{bookName(t, b)}</p>
                <p className="text-xs text-muted-foreground">{b.isMain ? t("ph.books.mainNote") : t("ph.books.extraNote")}</p>
              </div>
              {b._id === list.activeId ? (
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">{t("ph.books.current")}</span>
              ) : (
                <Button variant="outline" size="sm" disabled={pending} onClick={() => go(b)}>
                  {t("ph.books.open")}
                </Button>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5 pl-[3.25rem]">
              <RenameBook book={b} />
              {!b.isMain && <DeleteBook book={b} />}
            </div>
          </li>
        ))}
      </ul>
      {list.books.length < list.max ? (
        <Button variant="outline" className="h-11 rounded-2xl border-dashed" onClick={() => setCreating(true)}>
          <Plus /> {t("ph.books.new")}
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">{t("ph.books.limit", { n: list.max })}</p>
      )}
      <NewBookDialog open={creating} onOpenChange={setCreating} onCreated={(b) => go(b, t("ph.books.created", { name: b.name }))} />
    </div>
  );
}

function RenameBook({ book }: { book: PBook }) {
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(bookName(t, book));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <>
      <Button variant="ghost" size="xs" onClick={() => setOpen(true)}>
        {t("ph.books.rename")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("ph.books.rename")}</DialogTitle>
          </DialogHeader>
          <form
            noValidate
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return setError(t("ph.books.vName"));
              start(async () => {
                const res = await apiMutate({ path: `/me/personal/books/${book._id}`, method: "PATCH", body: { name: name.trim() } });
                if (!res.ok) return setError(res.error);
                toast.success(t("ph.books.renamed"));
                setOpen(false);
                router.refresh();
              });
            }}
          >
            <FormError message={error} />
            <Field label={t("ph.books.name")} htmlFor={`pb-rn-${book._id}`}>
              <Input id={`pb-rn-${book._id}`} maxLength={40} value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <SubmitButton pending={pending} icon={<CheckCircle2 />}>
              {t("common.save")}
            </SubmitButton>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DeleteBook({ book }: { book: PBook }) {
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const matches = typed.trim().toLocaleLowerCase() === book.name.trim().toLocaleLowerCase();
  return (
    <>
      <Button variant="ghost" size="xs" className="text-destructive" onClick={() => setOpen(true)}>
        <Trash2 /> {t("ph.books.delete")}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) {
            setTyped("");
            setError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="flex-row items-start gap-3">
            <IconChip tone="rose" className="mt-0.5">
              <Trash2 />
            </IconChip>
            <div className="flex min-w-0 flex-col gap-1">
              <DialogTitle>{t("ph.books.deleteTitle", { name: book.name })}</DialogTitle>
              <DialogDescription>{t("ph.books.deleteDesc")}</DialogDescription>
            </div>
          </DialogHeader>
          <form
            noValidate
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!matches) return;
              start(async () => {
                const res = await apiMutate({ path: `/me/personal/books/${book._id}`, method: "DELETE", body: { confirmName: typed.trim() } });
                if (!res.ok) return setError(res.error);
                toast.success(t("ph.books.deleted", { name: book.name }));
                setOpen(false);
                router.refresh();
              });
            }}
          >
            <FormError message={error} />
            <Field label={t("ph.books.typeName", { name: book.name })} htmlFor={`pb-del-${book._id}`}>
              <Input id={`pb-del-${book._id}`} value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
            </Field>
            <Button type="submit" variant="destructive" size="lg" className="w-full" disabled={!matches || pending}>
              {pending ? <Loader2 className="animate-spin" /> : <Trash2 />} {t("ph.books.deleteForever")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

import "server-only";
import { cache } from "react";
import { api } from "./api";
import { moneyFmt } from "@/lib/currency";
import type { Account, Me, Member, Org, Scheme } from "@/lib/types";

/** Request-scoped, de-duplicated loaders shared by layouts and pages. */
export const getMe = cache(() => api<Me>("/auth/me"));
export const getOrg = cache((orgId: string) => api<Org>(`/orgs/${orgId}`));
export const getAccounts = cache((orgId: string) => api<Account[]>(`/orgs/${orgId}/accounts`));
export const getSchemes = cache((orgId: string) => api<Scheme[]>(`/orgs/${orgId}/schemes`));
export const getActiveMembers = cache(async (orgId: string) => {
  const r = await api<{ items: Member[] }>(`/orgs/${orgId}/members?status=active&pageSize=200`);
  return r.items;
});

export function can(org: Org, permission: string) {
  return org.myPermissions.includes(permission);
}

/** The Mandal's money formatter for server components: (await getMoney(orgId)).fmt(paise) */
export const getMoney = cache(async (orgId: string) => moneyFmt((await getOrg(orgId)).settings.currency));

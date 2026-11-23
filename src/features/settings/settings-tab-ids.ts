/** Mandal settings tabs — plain data, usable on the server (the page reads ?tab=) and the client. */
export const SETTINGS_TAB_IDS = ["hapta", "money", "mandal", "team", "notifications", "more", "data"] as const;
export type SettingsTab = (typeof SETTINGS_TAB_IDS)[number];
/** Tabs that hold parts of the settings form (they show the Save button). */
export const FORM_TABS: SettingsTab[] = ["money", "mandal", "team", "more"];

export const isSettingsTab = (v: unknown): v is SettingsTab => SETTINGS_TAB_IDS.includes(v as SettingsTab);

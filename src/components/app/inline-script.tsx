"use client";

import { useState, useSyncExternalStore } from "react";

const noop = () => () => {};

/**
 * An inline <script> that only exists when it came with the server-rendered HTML.
 * React never runs scripts it creates on the client (in-app navigation) and warns about them,
 * so on a client-side render this renders nothing — use an effect for that case instead.
 */
export function InlineScript({ html, type }: { html: string; type?: string }) {
  // true while hydrating server HTML, false when the component is first created in the browser
  const hydrating = useSyncExternalStore(noop, () => false, () => true);
  const [fromServer] = useState(hydrating);
  if (!fromServer) return null;
  return <script type={type} dangerouslySetInnerHTML={{ __html: html }} suppressHydrationWarning />;
}

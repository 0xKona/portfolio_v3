import { useEffect, useState } from "react";

/**
 * useUrlId — reads a dynamic route segment directly from window.location.
 *
 * Next.js's `useParams()` resolves from the RSC/Flight payload baked in at
 * build time. In a static export served behind a CloudFront Function that
 * rewrites unknown dynamic paths to a pre-rendered fallback shell (e.g.
 * /projects/<uuid> -> /projects/__placeholder__.html), the client router's
 * params stay pinned to the build-time value ("__placeholder__") even
 * though the browser's address bar shows the real id. `useParams()` cannot
 * be used to recover the real id in this setup.
 *
 * This hook parses the real id straight from `window.location.pathname`,
 * which always reflects the actual URL the user is on.
 *
 * @param prefix - the static path segment before the dynamic id, e.g. "projects"
 */
export function useUrlId(prefix: string): string | null {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    const pattern = new RegExp(`^/${prefix}/([^/]+)/?$`);
    const match = window.location.pathname.match(pattern);
    setId(match ? decodeURIComponent(match[1]) : null);
  }, [prefix]);

  return id;
}

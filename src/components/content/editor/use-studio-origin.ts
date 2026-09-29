"use client";

import { useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useHeader, type StudioOriginSurface } from "@/components/layout/header-context";

interface UseStudioOriginParams {
  client: { id?: string; name?: string } | null | undefined;
  isNew: boolean;
  currentPostId: string | null;
  derivedTitle: string;
  initialClientId?: string;
  initialMeetingId?: string;
  initialFrom?: string;
}

export function useStudioOrigin({
  client,
  isNew,
  currentPostId,
  derivedTitle,
  initialClientId,
  initialMeetingId,
  initialFrom,
}: UseStudioOriginParams) {
  const searchParams = useSearchParams();
  const { setCustomBreadcrumbs, setActiveNavSection, lastOriginSurface, lastClientId } = useHeader();

  const rawFrom = (searchParams?.get("from") || initialFrom || "") as StudioOriginSurface | "";

  // Resolve origin key
  const originKey: StudioOriginSurface = useMemo(() => {
    if (rawFrom === "client-meetings") return "client-meetings";
    if (rawFrom === "client") return "client";
    if (rawFrom === "command-center") return "command-center";
    if (rawFrom === "calendar") return "calendar";
    if (rawFrom === "content") return "content";

    // Fallbacks when navigating without explicit from parameter:
    if (initialMeetingId) return "client-meetings";
    if (isNew && initialClientId) return "client";
    if (lastOriginSurface === "client" && (!lastClientId || lastClientId === client?.id)) {
      return "client";
    }
    if (lastOriginSurface === "command-center") return "command-center";
    if (lastOriginSurface === "calendar") return "calendar";

    return "content";
  }, [rawFrom, initialMeetingId, isNew, initialClientId, lastOriginSurface, lastClientId, client?.id]);

  // Compute origin navigation meta
  const originMeta = useMemo(() => {
    const isNewDraft = isNew && !currentPostId;
    const itemLabel = isNewDraft ? "New Perspective" : derivedTitle;

    switch (originKey) {
      case "client-meetings":
        return {
          backHref: client?.id ? `/clients/${client.id}?tab=meetings` : "/clients",
          backLabel: client?.name ? `${client.name} · Meetings` : "Client Meetings",
          activeSection: "/clients",
          breadcrumbs: [
            { label: "Client Roster", href: "/clients" },
            ...(client?.id
              ? [
                  { label: client.name || "Client", href: `/clients/${client.id}` },
                  { label: "Meetings", href: `/clients/${client.id}?tab=meetings` },
                ]
              : []),
            { label: itemLabel },
          ],
        };

      case "client":
        return {
          backHref: client?.id ? `/clients/${client.id}` : "/clients",
          backLabel: client?.name ? client.name : "Client Dossier",
          activeSection: "/clients",
          breadcrumbs: [
            { label: "Client Roster", href: "/clients" },
            ...(client?.id
              ? [{ label: client.name || "Client", href: `/clients/${client.id}` }]
              : []),
            { label: itemLabel },
          ],
        };

      case "command-center":
        return {
          backHref: "/command-center",
          backLabel: "Editorial Desk",
          activeSection: "/command-center",
          breadcrumbs: [
            { label: "Editorial Desk", href: "/command-center" },
            ...(client?.name
              ? [{ label: client.name, href: client.id ? `/clients/${client.id}` : undefined }]
              : []),
            { label: itemLabel },
          ],
        };

      case "calendar":
        return {
          backHref: "/calendar",
          backLabel: "Publishing Schedule",
          activeSection: "/calendar",
          breadcrumbs: [
            { label: "Publishing Schedule", href: "/calendar" },
            ...(client?.name
              ? [{ label: client.name, href: client.id ? `/clients/${client.id}` : undefined }]
              : []),
            { label: itemLabel },
          ],
        };

      case "content":
      default:
        return {
          backHref: "/content",
          backLabel: "Content Studio",
          activeSection: "/content",
          breadcrumbs: [
            { label: "Content Studio", href: "/content" },
            ...(client?.name
              ? [{ label: client.name, href: client.id ? `/clients/${client.id}` : undefined }]
              : []),
            { label: itemLabel },
          ],
        };
    }
  }, [originKey, client?.id, client?.name, isNew, currentPostId, derivedTitle]);

  const breadcrumbSignature = useMemo(
    () => JSON.stringify(originMeta.breadcrumbs),
    [originMeta.breadcrumbs]
  );

  useEffect(() => {
    setActiveNavSection(originMeta.activeSection);
    setCustomBreadcrumbs(originMeta.breadcrumbs);
    return () => {
      setActiveNavSection(null);
      setCustomBreadcrumbs(null);
    };
  }, [originMeta.activeSection, breadcrumbSignature, setActiveNavSection, setCustomBreadcrumbs]);

  return { originKey, originMeta };
}

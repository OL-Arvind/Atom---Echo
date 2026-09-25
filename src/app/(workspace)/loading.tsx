export default function WorkspaceLoading() {
  return (
    <div className="space-y-6 animate-pulse select-none">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)] pb-5">
        <div className="space-y-2">
          <div className="h-3 w-28 rounded bg-[var(--color-base-subtle)]" />
          <div className="h-6 w-56 rounded bg-[var(--color-base-subtle)]" />
        </div>
        <div className="h-8 w-32 rounded-[var(--radius-sm)] bg-[var(--color-base-subtle)]" />
      </div>

      {/* Metrics Row Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 rounded-[var(--radius-md)] border border-[var(--color-line-subtle)] bg-[var(--color-base-raised)] p-4 space-y-3"
          >
            <div className="h-2.5 w-24 rounded bg-[var(--color-base-subtle)]" />
            <div className="h-6 w-20 rounded bg-[var(--color-base-subtle)]" />
          </div>
        ))}
      </div>

      {/* Primary Attention Surface Skeleton */}
      <div className="rounded-[var(--radius-md)] border border-[var(--color-line-subtle)] bg-[var(--color-base-raised)] divide-y divide-[var(--color-line-subtle)]">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="p-4 flex items-center justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="h-3.5 w-64 rounded bg-[var(--color-base-subtle)]" />
              <div className="h-2.5 w-96 max-w-full rounded bg-[var(--color-base-subtle)]" />
            </div>
            <div className="h-7 w-24 rounded-[var(--radius-xs)] bg-[var(--color-base-subtle)] shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

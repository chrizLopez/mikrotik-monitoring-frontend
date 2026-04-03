import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  helper?: string;
  icon?: ReactNode;
}

export function StatCard({ label, value, helper, icon }: StatCardProps) {
  return (
    <article className="panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-text-soft">{label}</p>
          <p className="mt-3 text-3xl font-semibold">{value}</p>
          {helper ? <p className="mt-2 text-sm text-text-soft">{helper}</p> : null}
        </div>
        {icon ? <div className="rounded-2xl bg-accent/10 p-3 text-accent">{icon}</div> : null}
      </div>
    </article>
  );
}

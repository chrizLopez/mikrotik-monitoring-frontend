import { PropsWithChildren, ReactNode } from "react";

interface ChartCardProps extends PropsWithChildren {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function ChartCard({ title, description, action, children }: ChartCardProps) {
  return (
    <section className="panel p-5">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {description ? <p className="mt-1 text-sm text-text-soft">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

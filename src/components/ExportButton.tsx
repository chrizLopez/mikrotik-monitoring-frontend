import { Download } from "lucide-react";
import { downloadFile } from "@/lib/axios";
import { RangeOption } from "@/types/api";

interface ExportButtonProps {
  range: RangeOption;
  endpoint?: string;
  filename?: string;
  label?: string;
}

export function ExportButton({
  range,
  endpoint = "/api/dashboard/export/users.csv",
  filename = `mikrotik-users-${range}.csv`,
  label = "Export CSV",
}: ExportButtonProps) {
  const handleClick = async () => {
    const blob = await downloadFile(endpoint, { range });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      className="inline-flex items-center gap-2 rounded-xl border border-line/80 bg-surface-soft px-4 py-2 text-sm font-medium text-text transition hover:bg-surface"
    >
      <Download className="h-4 w-4" />
      {label}
    </button>
  );
}

import { FileText, Image as ImageIcon } from "lucide-react";
import type { DownloadKind } from "../../lib/download";

type DownloadToolbarProps = {
  onDownload: (kind: DownloadKind) => void;
  pending: DownloadKind | null;
};

const BUTTONS: {
  kind: DownloadKind;
  label: string;
  Icon: typeof FileText;
}[] = [
  { kind: "png", label: "PNG", Icon: ImageIcon },
  { kind: "pdf", label: "PDF", Icon: FileText },
];

export function DownloadToolbar({ onDownload, pending }: DownloadToolbarProps) {
  return (
    <div className="max-w-4xl mx-auto px-2 flex justify-end gap-3 mt-6">
      {BUTTONS.map(({ kind, label, Icon }) => (
        <button
          key={kind}
          type="button"
          onClick={() => onDownload(kind)}
          disabled={pending !== null}
          className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 hover:bg-[var(--hover)] disabled:opacity-60"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface)",
            color: "var(--foreground)",
          }}
        >
          <Icon className="w-4 h-4" aria-hidden />
          {pending === kind ? "Rendering…" : label}
        </button>
      ))}
    </div>
  );
}

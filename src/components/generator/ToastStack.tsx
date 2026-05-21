import { AlertCircle, Check, Info } from "lucide-react";
import type { Toast } from "../../types/infographic";

type ToastStackProps = {
  toasts: Toast[];
  onDismiss: (id: string) => void;
};

const ICON: Record<Toast["type"], typeof Check> = {
  success: Check,
  error: AlertCircle,
  info: Info,
};

const PANEL_CLASS: Record<Toast["type"], string> = {
  success: "toast-panel--success",
  error: "toast-panel--error",
  info: "toast-panel--info",
};

export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none">
      {toasts.map((toast) => {
        const Icon = ICON[toast.type];
        return (
          <div
            key={toast.id}
            className={`toast-panel animate-slide-down rounded-xl px-5 py-3 text-sm font-medium shadow-lg pointer-events-auto cursor-pointer border ${PANEL_CLASS[toast.type]}`}
            onClick={() => onDismiss(toast.id)}
          >
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 shrink-0" aria-hidden />
              {toast.message}
            </div>
          </div>
        );
      })}
    </div>
  );
}

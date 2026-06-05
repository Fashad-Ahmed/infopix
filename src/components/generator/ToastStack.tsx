import { AlertCircle, Check, Info, X } from "lucide-react";
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
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none"
    >
      {toasts.map((toast) => {
        const Icon = ICON[toast.type];
        return (
          <div
            key={toast.id}
            role="alert"
            aria-atomic="true"
            className={`toast-panel animate-slide-down rounded-xl px-4 py-3 text-sm font-medium shadow-lg pointer-events-auto border ${PANEL_CLASS[toast.type]} relative overflow-hidden`}
            style={{ minWidth: 260, maxWidth: 380 }}
          >
            <div className="flex items-center gap-2 pr-6">
              <Icon className="w-4 h-4 shrink-0" aria-hidden />
              <span>{toast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity rounded-md p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" aria-hidden />
            </button>
            {/* Auto-dismiss countdown bar */}
            <div
              className="absolute bottom-0 left-0 h-0.5 rounded-full"
              style={{
                width: "100%",
                animation: "toast-shrink 5s linear forwards",
                backgroundColor: "currentColor",
                opacity: 0.35,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

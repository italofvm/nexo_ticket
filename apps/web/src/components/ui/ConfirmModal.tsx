"use client";

import { AlertTriangle, Info, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "info";
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  type = "danger",
  isLoading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0a0a0a] border border-glass-border w-full max-w-md rounded-2xl p-6 shadow-2xl scale-100 animate-scale-in">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-xl ${
                type === "danger"
                  ? "bg-red-500/10 text-red-500"
                  : "bg-blue-500/10 text-blue-500"
              }`}
            >
              {type === "danger" ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <Info className="w-6 h-6" />
              )}
            </div>
            <h3 className="text-xl font-bold">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-gray-400 mb-8 leading-relaxed">{description}</p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 hover:bg-white/5 rounded-xl transition-colors font-medium text-gray-300"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-6 py-2 rounded-xl font-medium transition-all shadow-lg flex items-center gap-2 ${
              type === "danger"
                ? "bg-red-500 hover:bg-red-600 shadow-red-500/20 text-white"
                : "bg-primary hover:bg-primary/90 shadow-primary/20 text-white"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isLoading ? "Processando..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Trash2, CheckCircle2, AlertTriangle } from "lucide-react";
import { clearTickets } from "@/app/actions/clear-history";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function DashboardActions({ guildId }: { guildId: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleClearHistory = async () => {
    setShowClearModal(false);
    setIsSubmitting(true);
    const result = await clearTickets(guildId);

    if (result.success) {
      setMessage({ type: 'success', text: 'Histórico de tickets limpo com sucesso!' });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao limpar histórico.' });
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Visão Geral</h2>
            <p className="text-gray-400">Métricas de performance do seu atendimento.</p>
          </div>
          <button
            onClick={() => setShowClearModal(true)}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold transition-all border border-red-500/20 text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Limpar Histórico
          </button>
        </div>

        {message && (
          <div className={`flex items-center gap-2 p-3 rounded-xl border animate-fade-in ${
            message.type === 'success' 
              ? 'bg-green-500/10 border-green-500/20 text-green-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleClearHistory}
        title="Limpar Histórico de Tickets"
        description="Esta ação apagará TODO o histórico de tickets, registros de chat (transcrições) e logs de ações permanentemente. Esta operação é irreversível."
        confirmText="Sim, Apagar Tudo"
        cancelText="Cancelar"
        type="danger"
        isLoading={isSubmitting}
      />
    </>
  );
}

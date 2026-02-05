"use client";

import { useState } from "react";
import { Save, CheckCircle2, AlertTriangle, MessageSquare, Trash2 } from "lucide-react";
import { updateSettings } from "@/app/actions/settings";
import { clearFeedbacks } from "@/app/actions/clear-history";
import { PartialChannel } from "@/lib/discord";
import ConfirmModal from "@/components/ui/ConfirmModal";

interface FeedbackSettings {
  rating_enabled: boolean;
  rating_channel_id: string | null;
  rating_embed_title: string | null;
  rating_embed_description: string | null;
  rating_embed_color: string | null;
  rating_embed_footer: string | null;
  rating_highlight_feedback: boolean;
}

export default function FeedbackForm({ 
  guildId, 
  initialSettings, 
  channels 
}: { 
  guildId: string; 
  initialSettings: FeedbackSettings;
  channels: PartialChannel[];
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const result = await updateSettings(guildId, settings);

    if (result.success) {
      setMessage({ type: 'success', text: 'Configurações de feedback salvas com sucesso!' });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao salvar configurações.' });
    }
    setIsSubmitting(false);
  };

  const handleClearHistory = async () => {
    setShowClearModal(false);
    setIsSubmitting(true);
    const result = await clearFeedbacks(guildId);

    if (result.success) {
      setMessage({ type: 'success', text: 'Histórico de feedbacks limpo com sucesso!' });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao limpar histórico.' });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-4xl space-y-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="glass-card p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-white/5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Configuração de Feedback</h3>
              <p className="text-sm text-gray-400">Configure como os usuários avaliam o atendimento.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <div>
                  <p className="font-medium text-white">Habilitar Avaliações</p>
                  <p className="text-xs text-gray-500">Enviar solicitação de feedback ao fechar ticket.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, rating_enabled: !settings.rating_enabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    settings.rating_enabled ? 'bg-primary' : 'bg-white/10'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.rating_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <div>
                  <p className="font-medium text-white">Destacar Feedback</p>
                  <p className="text-xs text-gray-500">Exibir o texto do feedback com destaque (blockquote) no Discord.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, rating_highlight_feedback: !settings.rating_highlight_feedback })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    settings.rating_highlight_feedback ? 'bg-primary' : 'bg-white/10'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.rating_highlight_feedback ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Canal de Feedback</label>
                <select
                  value={settings.rating_channel_id || ''}
                  onChange={(e) => setSettings({ ...settings, rating_channel_id: e.target.value || null })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:border-primary focus:outline-none text-white [&>option]:bg-[#1a1a1a]"
                >
                  <option value="">Nenhum (Desabilitado)</option>
                  {channels.map(c => (
                    <option key={c.id} value={c.id}>#{c.name}</option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-500 mt-1">Canal onde as notas e feedbacks serão enviados.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Título do Embed</label>
                <input
                  type="text"
                  value={settings.rating_embed_title || ''}
                  onChange={(e) => setSettings({ ...settings, rating_embed_title: e.target.value })}
                  placeholder="Avalie seu atendimento"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:border-primary focus:outline-none text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Cor do Embed</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.rating_embed_color || '#f1c40f'}
                    onChange={(e) => setSettings({ ...settings, rating_embed_color: e.target.value })}
                    className="h-10 w-20 bg-transparent border-none cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.rating_embed_color || '#f1c40f'}
                    onChange={(e) => setSettings({ ...settings, rating_embed_color: e.target.value })}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 uppercase font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Descrição</label>
                <textarea
                  value={settings.rating_embed_description || ''}
                  onChange={(e) => setSettings({ ...settings, rating_embed_description: e.target.value })}
                  placeholder="Como você avalia o suporte recebido?"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:border-primary focus:outline-none text-white h-32 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Rodapé (Footer)</label>
                <input
                  type="text"
                  value={settings.rating_embed_footer || ''}
                  onChange={(e) => setSettings({ ...settings, rating_embed_footer: e.target.value })}
                  placeholder="Sua opinião nos ajuda a melhorar!"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:border-primary focus:outline-none text-white"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between bg-[#111] border border-white/5 p-4 rounded-2xl sticky bottom-8 shadow-2xl z-10">
          <div className="flex-1">
            {message && (
              <div className={`flex items-center gap-2 animate-fade-in ${
                message.type === 'success' ? 'text-green-400' : 'text-red-400'
              }`}>
                {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span className="text-sm font-medium">{message.text}</span>
              </div>
            )}
            {!message && (
              <p className="text-sm text-gray-500">Alterações são aplicadas instantaneamente ao salvar.</p>
            )}
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setShowClearModal(true)}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold transition-all border border-red-500/20"
            >
              <Trash2 className="w-5 h-5" />
              Limpar Tudo
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-white transition-all shadow-lg shadow-primary/20"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Salvando...
                </span>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      <ConfirmModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleClearHistory}
        title="Limpar Histórico de Feedbacks"
        description="Esta ação apagará todo o histórico de avaliações e comentários dos usuários permanentemente. Esta operação não pode ser desfeita."
        confirmText="Sim, Limpar Tudo"
        cancelText="Cancelar"
        type="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
}

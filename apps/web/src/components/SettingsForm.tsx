"use client";

import { useState } from "react";
import { Save, CheckCircle2, AlertTriangle, Settings as SettingsIcon, ScrollText } from "lucide-react";
import { updateSettings } from "@/app/actions/settings";
import { PartialChannel } from "@/lib/discord";

interface GeneralSettings {
  bot_prefix: string;
  language: string;
  timezone: string;
  log_channel_id: string | null;
  log_channel_members: string | null;
  log_channel_tickets: string | null;
  log_channel_moderation: string | null;
  log_channel_sales: string | null;
  log_channel_general: string | null;
  visitor_role_id: string | null;
  client_role_id: string | null;
  active_client_role_id: string | null;
}

interface ChannelSelectProps {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  channels: PartialChannel[];
  description?: string;
}

function ChannelSelect({ label, value, onChange, channels, description }: ChannelSelectProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:border-primary focus:outline-none text-white [&>option]:bg-[#1a1a1a]"
      >
        <option value="">Nenhum</option>
        {channels.map(c => (
          <option key={c.id} value={c.id}>#{c.name}</option>
        ))}
      </select>
      {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
    </div>
  );
}

export default function SettingsForm({ 
  guildId, 
  initialSettings, 
  channels 
}: { 
  guildId: string; 
  initialSettings: GeneralSettings;
  channels: PartialChannel[];
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const result = await updateSettings(guildId, settings);

    if (result.success) {
      setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: result.error || 'Erro ao salvar configurações.' });
    }
    setIsSubmitting(false);
  };

  const updateSetting = (key: keyof GeneralSettings, value: string | null) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-4xl space-y-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Configurações Gerais */}
        <div className="glass-card p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-white/5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Configurações Gerais</h3>
              <p className="text-sm text-gray-400">Ajustes globais do bot no servidor.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Prefixo do Bot</label>
                <input
                  type="text"
                  value={settings.bot_prefix || '!'}
                  onChange={(e) => updateSetting('bot_prefix', e.target.value)}
                  placeholder="!"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:border-primary focus:outline-none text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Idioma</label>
                <select
                  value={settings.language || 'pt-BR'}
                  onChange={(e) => updateSetting('language', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:border-primary focus:outline-none text-white [&>option]:bg-[#1a1a1a]"
                >
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="en-US">English (US)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Fuso Horário</label>
                <select
                  value={settings.timezone || 'America/Sao_Paulo'}
                  onChange={(e) => updateSetting('timezone', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:border-primary focus:outline-none text-white [&>option]:bg-[#1a1a1a]"
                >
                  <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
                  <option value="UTC">UTC</option>
                  <option value="Europe/Lisbon">Lisboa (GMT+0)</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <ChannelSelect
                label="Canal de Logs (Fallback Global)"
                value={settings.log_channel_id}
                onChange={(v) => updateSetting('log_channel_id', v)}
                channels={channels}
                description="Usado quando um canal específico não está configurado."
              />
              <p className="text-xs text-gray-500 italic mt-4">
                Configurações de cargos e permissões avançadas estão em desenvolvimento.
              </p>
            </div>
          </div>
        </div>

        {/* Configuração de Logs */}
        <div className="glass-card p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-white/5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ScrollText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Configuração de Logs</h3>
              <p className="text-sm text-gray-400">Escolha onde cada tipo de log será enviado.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ChannelSelect
              label="📥 Membros (Entrada/Saída)"
              value={settings.log_channel_members}
              onChange={(v) => updateSetting('log_channel_members', v)}
              channels={channels}
              description="Logs de quem entra e sai do servidor."
            />
            
            <ChannelSelect
              label="🎫 Tickets"
              value={settings.log_channel_tickets}
              onChange={(v) => updateSetting('log_channel_tickets', v)}
              channels={channels}
              description="Abertura, fechamento e ações em tickets."
            />
            
            <ChannelSelect
              label="⚙️ Moderação"
              value={settings.log_channel_moderation}
              onChange={(v) => updateSetting('log_channel_moderation', v)}
              channels={channels}
              description="Alterações de painéis, categorias e config."
            />
            
            <ChannelSelect
              label="💰 Vendas"
              value={settings.log_channel_sales}
              onChange={(v) => updateSetting('log_channel_sales', v)}
              channels={channels}
              description="Vendas concluídas e pagamentos."
            />
            
            <ChannelSelect
              label="📋 Geral"
              value={settings.log_channel_general}
              onChange={(v) => updateSetting('log_channel_general', v)}
              channels={channels}
              description="Outros logs não categorizados."
            />
          </div>
        </div>

        {/* Floating Save Button / Message */}
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
      </form>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Panel, createPanel, deletePanel, updatePanel } from "@/app/actions/panels";
import { PartialChannel } from "@/lib/discord";
import { Plus, Trash2, LayoutTemplate, X, Save, AlertCircle, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function PanelList({ 
  initialPanels, 
  channels,
  guildId 
}: { 
  initialPanels: Panel[], 
  channels: PartialChannel[],
  guildId: string 
}) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [panels, setPanels] = useState(initialPanels);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Custom Modal States
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; panelId: number; channelId: string; messageId: string } | null>(null);
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; title: string; message: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingPanel, setEditingPanel] = useState<Panel | null>(null);

  const router = useRouter();

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    color: "#5865F2",
    image_url: "",
    channel_id: ""
  });

  const handleOpenCreate = () => {
    setEditingPanel(null);
    setFormData({
      title: "Atendimento",
      description: "Selecione uma categoria abaixo para iniciar o atendimento.",
      color: "#5865F2",
      image_url: "",
      channel_id: channels[0]?.id || ""
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (panel: Panel) => {
    setEditingPanel(panel);
    setFormData({
      title: panel.title,
      description: panel.description,
      color: panel.color,
      image_url: panel.image_url || "",
      channel_id: panel.channel_id
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    let result;
    if (editingPanel) {
      result = await updatePanel(editingPanel.id, guildId, {
        ...formData,
        message_id: editingPanel.message_id
      });
    } else {
      result = await createPanel(guildId, formData);
    }
    
    if (result.success) {
      setIsModalOpen(false);
      router.refresh();
    } else {
      setErrorModal({
        isOpen: true,
        title: editingPanel ? "Erro ao editar painel" : "Erro ao criar painel",
        message: result.error || "Ocorreu um erro desconhecido."
      });
    }
    
    setIsSubmitting(false);
  };

  const confirmDelete = (id: number, channelId: string, messageId: string) => {
    setDeleteModal({
      isOpen: true,
      panelId: id,
      channelId,
      messageId
    });
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    
    setIsDeleting(true);
    try {
      await deletePanel(deleteModal.panelId, deleteModal.channelId, deleteModal.messageId, guildId);
      router.refresh();
      setDeleteModal(null);
    } catch (error) {
      setErrorModal({
        isOpen: true,
        title: "Erro ao excluir",
        message: "Não foi possível excluir o painel. Tente novamente."
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Painéis de Instalação</h2>
          <p className="text-sm text-gray-400">Gerencie as mensagens de criação de ticket enviadas para o Discord.</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/80 rounded-xl font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Painel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {initialPanels.map((panel) => (
          <div key={panel.id} className="glass-card p-6 border-l-4 hover:border-r-4 transition-all" style={{ borderLeftColor: panel.color || "#5865F2" }}>
            <div className="flex justify-between items-start mb-4">
               <div className="flex items-center gap-2 text-gray-400">
                  <LayoutTemplate className="w-5 h-5" />
                  <span className="text-xs font-mono">#{panel.channel_id}</span>
               </div>
                <div className="flex gap-2">
                   <button 
                      onClick={() => handleOpenEdit(panel)}
                      className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-primary transition-colors"
                   >
                      <Pencil className="w-4 h-4" />
                   </button>
                   <button 
                      onClick={() => confirmDelete(panel.id, panel.channel_id, panel.message_id)}
                      className="p-2 hover:bg-white/10 rounded-lg text-red-400 transition-colors"
                   >
                      <Trash2 className="w-4 h-4" />
                   </button>
                </div>
            </div>
            
            {panel.image_url && (
              <img src={panel.image_url} alt="Banner" className="w-full h-32 object-cover rounded-lg mb-4 opacity-80" />
            )}

            <h3 className="font-bold text-xl mb-2">{panel.title}</h3>
            <p className="text-sm text-gray-400 line-clamp-3 mb-4">
              {panel.description}
            </p>
            
            <div className="flex items-center justify-between text-xs text-gray-500 mt-auto pt-4 border-t border-white/5">
                <span>ID: {panel.message_id}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Ativo</span>
            </div>
          </div>
        ))}

        {initialPanels.length === 0 && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-gray-500 border border-dashed border-white/10 rounded-2xl bg-white/5">
                <LayoutTemplate className="w-12 h-12 mb-4 opacity-50" />
                <p>Nenhum painel criado ainda.</p>
                <button onClick={handleOpenCreate} className="mt-4 text-primary hover:underline">Criar o primeiro painel</button>
            </div>
        )}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0a0a0a] border border-glass-border w-full max-w-2xl rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                {editingPanel ? (
                  <>
                    <Pencil className="w-5 h-5 text-primary" />
                    Editar Painel
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 text-primary" />
                    Criar Novo Painel
                  </>
                )}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl mb-6 flex gap-3 text-blue-200">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm">Ao salvar, o bot enviará uma mensagemEmbed para o canal selecionado com o menu de categorias atual.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Título do Embed</label>
                        <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:border-primary focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Canal de Envio</label>
                        <select
                            required
                            disabled={!!editingPanel}
                            value={formData.channel_id}
                            onChange={(e) => setFormData({...formData, channel_id: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:border-primary focus:outline-none text-white [&>option]:bg-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <option value="" disabled>Selecione um canal...</option>
                            {channels.map(c => (
                                <option key={c.id} value={c.id}>#{c.name}</option>
                            ))}
                        </select>
                        {editingPanel && <p className="text-[10px] text-gray-500 mt-1">O canal não pode ser alterado após a criação.</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Cor do Embed</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={formData.color}
                                onChange={(e) => setFormData({...formData, color: e.target.value})}
                                className="h-10 w-20 bg-transparent border-none cursor-pointer"
                            />
                            <input
                                type="text"
                                value={formData.color}
                                onChange={(e) => setFormData({...formData, color: e.target.value})}
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 uppercase font-mono text-sm"
                            />
                        </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">URL da Imagem/Banner (Opcional)</label>
                        <input
                        type="url"
                        value={formData.image_url}
                        onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:border-primary focus:outline-none"
                        placeholder="https://imgur.com/..."
                        />
                    </div>
                    {formData.image_url && (
                        <div className="mt-2 rounded-xl overflow-hidden border border-white/10 h-32 bg-black/40">
                            <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                    )}
                  </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Descrição</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:border-primary focus:outline-none h-24 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 hover:bg-white/5 rounded-xl transition-colors"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary/80 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                      <>Salvando...</>
                  ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {editingPanel ? "Salvar Alterações" : "Criar Painel"}
                      </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        onConfirm={handleDelete}
        title="Excluir Painel?"
        description="Tem certeza que deseja excluir este painel? A mensagem no Discord também será apagada. Esta ação não pode ser desfeita."
        confirmText="Excluir Painel"
        isLoading={isDeleting}
        type="danger"
      />

      <ConfirmModal
        isOpen={!!errorModal}
        onClose={() => setErrorModal(null)}
        onConfirm={() => setErrorModal(null)}
        title={errorModal?.title || "Erro"}
        description={errorModal?.message || "Ocorreu um erro."}
        confirmText="Entendido"
        cancelText="Fechar"
        type="info"
      />
    </div>
  );
}

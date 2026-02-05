"use client";

import { useState } from "react";
import { TicketCategory, createCategory, updateCategory, deleteCategory } from "@/app/actions/categories";
import { Plus, Edit2, Trash2, X, Save } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CategoryList({ 
  initialCategories, 
  guildId 
}: { 
  initialCategories: TicketCategory[], 
  guildId: string 
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TicketCategory | null>(null);
  const router = useRouter();

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    label: "",
    description: "",
    emoji: ""
  });

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({ name: "", label: "", description: "", emoji: "" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: TicketCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      label: category.label,
      description: category.description || "",
      emoji: category.emoji || ""
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCategory) {
      await updateCategory(editingCategory.id, guildId, formData);
    } else {
      await createCategory(guildId, formData);
    }

    setIsModalOpen(false);
    router.refresh(); // Refresh server data
  };

  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta categoria?")) {
      await deleteCategory(id, guildId);
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Categorias de Tickets</h2>
        <button 
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/80 rounded-xl font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Categoria
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {initialCategories.map((category) => (
          <div key={category.id} className="glass-card p-6 group relative hover:border-primary/50 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="text-3xl">{category.emoji || "📂"}</div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleOpenEdit(category)}
                  className="p-2 hover:bg-white/10 rounded-lg text-blue-400"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(category.id)}
                  className="p-2 hover:bg-white/10 rounded-lg text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <h3 className="font-bold text-lg mb-1">{category.label}</h3>
            <p className="text-sm text-gray-500 mb-2 font-mono">{category.name}</p>
            <p className="text-sm text-gray-400 line-clamp-2">
              {category.description || "Sem descrição"}
            </p>
          </div>
        ))}

        {initialCategories.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500 border border-dashed border-white/10 rounded-2xl">
                Nenhuma categoria criada ainda.
            </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0a0a0a] border border-glass-border w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">
                {editingCategory ? "Editar Categoria" : "Nova Categoria"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nome Interno (ID)</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:border-primary focus:outline-none"
                  placeholder="ex: suporte-geral"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Rótulo (Label)</label>
                <input
                  type="text"
                  required
                  value={formData.label}
                  onChange={(e) => setFormData({...formData, label: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:border-primary focus:outline-none"
                  placeholder="ex: Suporte Técnico"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Emoji</label>
                <input
                  type="text"
                  value={formData.emoji}
                  onChange={(e) => setFormData({...formData, emoji: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:border-primary focus:outline-none"
                  placeholder="ex: 🔧"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:border-primary focus:outline-none h-24 resize-none"
                  placeholder="Breve descrição da categoria..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 hover:bg-white/5 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary/80 rounded-xl font-medium transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

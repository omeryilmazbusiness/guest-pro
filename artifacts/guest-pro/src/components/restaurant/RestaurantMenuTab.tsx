/**
 * RestaurantMenuTab
 * Manage DAILY and ROOM_SERVICE menus — add, toggle, delete items.
 */
import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus, Trash2, Eye, EyeOff, CalendarDays, UtensilsCrossed, X, Loader2,
} from "lucide-react";
import {
  listMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  MENU_CATEGORIES,
  MENU_CATEGORY_LABELS,
  type RestaurantMenuItem,
  type MenuType,
  type MenuCategory,
  type CreateMenuItemInput,
} from "@/lib/restaurant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ── Today helper ──────────────────────────────────────────────────────────────
function today() { return new Date().toISOString().split("T")[0]; }

// ── Add item form ─────────────────────────────────────────────────────────────
function AddMenuItemForm({
  menuType,
  onClose,
  onCreated,
}: {
  menuType: MenuType;
  onClose: () => void;
  onCreated: (item: RestaurantMenuItem) => void;
}) {
  const [form, setForm] = useState<CreateMenuItemInput>({
    name: "",
    category: "OTHER",
    menuType,
    availableDate: menuType === "DAILY" ? today() : null,
    priceAmount: "",
    allergenNotes: "",
    portionInfo: "",
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  const set = (key: keyof CreateMenuItemInput, val: unknown) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("İsim zorunludur"); return; }
    setSaving(true);
    try {
      const payload: CreateMenuItemInput = {
        ...form,
        name: form.name.trim(),
        priceAmount: form.priceAmount?.trim() || null,
        allergenNotes: form.allergenNotes?.trim() || null,
        portionInfo: form.portionInfo?.trim() || null,
      };
      const item = await createMenuItem(payload);
      onCreated(item);
      toast.success("Menü öğesi eklendi");
      onClose();
    } catch {
      toast.error("Eklenemedi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[14px] font-semibold text-zinc-800">
          {menuType === "DAILY" ? "Günlük Menüye Ekle" : "Oda Servisi Menüsüne Ekle"}
        </p>
        <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700">
          <X className="w-4 h-4" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          placeholder="Yemek adı *"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          className="rounded-xl text-sm"
        />
        <Input
          placeholder="Açıklama (opsiyonel)"
          value={form.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
          className="rounded-xl text-sm"
        />
        <div className="grid grid-cols-2 gap-2">
          <select
            value={form.category}
            onChange={(e) => set("category", e.target.value as MenuCategory)}
            className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900"
          >
            {MENU_CATEGORIES.map((c) => (
              <option key={c} value={c}>{MENU_CATEGORY_LABELS[c]}</option>
            ))}
          </select>
          <Input
            placeholder="Fiyat (örn: 85.00)"
            value={form.priceAmount ?? ""}
            onChange={(e) => set("priceAmount", e.target.value)}
            className="rounded-xl text-sm"
          />
        </div>
        {menuType === "DAILY" && (
          <Input
            type="date"
            value={form.availableDate ?? today()}
            onChange={(e) => set("availableDate", e.target.value)}
            className="rounded-xl text-sm"
          />
        )}
        <Input
          placeholder="Alerjen bilgisi (opsiyonel)"
          value={form.allergenNotes ?? ""}
          onChange={(e) => set("allergenNotes", e.target.value)}
          className="rounded-xl text-sm"
        />
        <Input
          placeholder="Porsiyon / kalori bilgisi (opsiyonel)"
          value={form.portionInfo ?? ""}
          onChange={(e) => set("portionInfo", e.target.value)}
          className="rounded-xl text-sm"
        />
        <Button type="submit" disabled={saving} className="w-full rounded-xl h-10 text-[13px]">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ekle"}
        </Button>
      </form>
    </div>
  );
}

// ── Menu item card ────────────────────────────────────────────────────────────
function MenuItemCard({
  item,
  onToggle,
  onDelete,
}: {
  item: RestaurantMenuItem;
  onToggle: (item: RestaurantMenuItem) => void;
  onDelete: (id: number) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`"${item.name}" silinsin mi?`)) return;
    setDeleting(true);
    try {
      await deleteMenuItem(item.id);
      onDelete(item.id);
      toast.success("Silindi");
    } catch {
      toast.error("Silinemedi");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-3.5 flex items-center gap-3 transition-opacity ${!item.isActive ? "opacity-50" : "border-zinc-100"}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-[13px] font-semibold text-zinc-800 truncate">{item.name}</p>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-500 shrink-0">
            {MENU_CATEGORY_LABELS[item.category]}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-zinc-400">
          {item.priceAmount && <span>₺{item.priceAmount}</span>}
          {item.allergenNotes && <span className="truncate text-amber-600">{item.allergenNotes}</span>}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onToggle(item)}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-all"
          title={item.isActive ? "Pasif yap" : "Aktif yap"}
        >
          {item.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Menu section (DAILY or ROOM_SERVICE) ─────────────────────────────────────
function MenuSection({
  menuType,
  label,
  icon: Icon,
}: {
  menuType: MenuType;
  label: string;
  icon: React.FC<{ className?: string }>;
}) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [dateFilter, setDateFilter] = useState(today());

  const queryKey = ["restaurant-menu", menuType, menuType === "DAILY" ? dateFilter : "all"];

  const { data: items = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => listMenuItems({ menuType, date: menuType === "DAILY" ? dateFilter : undefined }),
    staleTime: 30_000,
  });

  const handleCreated = (item: RestaurantMenuItem) => {
    queryClient.setQueryData<RestaurantMenuItem[]>(queryKey, (prev = []) => [item, ...prev]);
  };

  const handleToggle = async (item: RestaurantMenuItem) => {
    try {
      const updated = await updateMenuItem(item.id, { isActive: !item.isActive });
      queryClient.setQueryData<RestaurantMenuItem[]>(queryKey, (prev = []) =>
        prev.map((i) => (i.id === updated.id ? updated : i))
      );
    } catch {
      toast.error("Güncellenemedi");
    }
  };

  const handleDelete = (id: number) => {
    queryClient.setQueryData<RestaurantMenuItem[]>(queryKey, (prev = []) =>
      prev.filter((i) => i.id !== id)
    );
  };

  // Group by category
  const grouped = MENU_CATEGORIES.reduce<Record<string, RestaurantMenuItem[]>>((acc, cat) => {
    const catItems = items.filter((i) => i.category === cat);
    if (catItems.length > 0) acc[cat] = catItems;
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-zinc-500" />
          <h3 className="text-[13px] font-semibold text-zinc-700">{label}</h3>
          <span className="text-[11px] text-zinc-400 font-mono">({items.length})</span>
        </div>
        <div className="flex items-center gap-2">
          {menuType === "DAILY" && (
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-8 text-[11px] rounded-xl border border-zinc-200 px-2 text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
          )}
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1 h-8 px-3 rounded-xl bg-zinc-900 text-white text-[12px] font-medium hover:bg-zinc-800 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Ekle
          </button>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <AddMenuItemForm
          menuType={menuType}
          onClose={() => setShowForm(false)}
          onCreated={handleCreated}
        />
      )}

      {/* Items */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="bg-zinc-100 rounded-2xl h-14 animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center py-8 bg-white rounded-2xl border border-zinc-100 gap-2">
          <UtensilsCrossed className="w-6 h-6 text-zinc-200" />
          <p className="text-[12px] text-zinc-400">
            {menuType === "DAILY" ? "Bu tarih için menü eklenmemiş" : "Oda servisi menüsü boş"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([cat, catItems]) => (
            <div key={cat} className="space-y-2">
              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-1">
                {MENU_CATEGORY_LABELS[cat as MenuCategory]}
              </p>
              <div className="space-y-2">
                {catItems.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function RestaurantMenuTab() {
  const [activeMenu, setActiveMenu] = useState<MenuType>("DAILY");

  return (
    <div className="space-y-5">
      {/* Menu type switcher */}
      <div className="flex bg-zinc-100 rounded-2xl p-1 gap-1">
        {(["DAILY", "ROOM_SERVICE"] as MenuType[]).map((t) => (
          <button
            key={t}
            onClick={() => setActiveMenu(t)}
            className={`flex-1 h-9 rounded-xl text-[13px] font-semibold transition-all ${
              activeMenu === t
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {t === "DAILY" ? "📅 Günlük Menü" : "🛎 Oda Servisi"}
          </button>
        ))}
      </div>

      {activeMenu === "DAILY" && (
        <MenuSection menuType="DAILY" label="Günlük Menü" icon={CalendarDays} />
      )}
      {activeMenu === "ROOM_SERVICE" && (
        <MenuSection menuType="ROOM_SERVICE" label="Oda Servisi Menüsü" icon={UtensilsCrossed} />
      )}
    </div>
  );
}

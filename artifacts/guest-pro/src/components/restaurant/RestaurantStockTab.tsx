/**
 * RestaurantStockTab
 * Simple stock ledger — add items, adjust quantities, track low stock.
 */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Minus, Trash2, PackageSearch, X, Loader2, AlertTriangle } from "lucide-react";
import {
  listStockItems,
  createStockItem,
  adjustStock,
  deleteStockItem,
  type RestaurantStockItem,
  type CreateStockItemInput,
} from "@/lib/restaurant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ── Add form ──────────────────────────────────────────────────────────────────

function AddStockForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (item: RestaurantStockItem) => void;
}) {
  const [form, setForm] = useState<CreateStockItemInput>({
    name: "",
    unit: "adet",
    quantityOnHand: "0",
    lowStockThreshold: "5",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const set = (key: keyof CreateStockItemInput, val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("İsim zorunludur"); return; }
    setSaving(true);
    try {
      const item = await createStockItem({
        ...form,
        name: form.name.trim(),
        notes: form.notes?.trim() || null,
      });
      onCreated(item);
      toast.success("Stok kalemi eklendi");
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
        <p className="text-[14px] font-semibold text-zinc-800">Yeni Stok Kalemi</p>
        <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700">
          <X className="w-4 h-4" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          placeholder="Ürün adı *"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          className="rounded-xl text-sm"
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="Birim (adet, kg, litre…)"
            value={form.unit ?? "adet"}
            onChange={(e) => set("unit", e.target.value)}
            className="rounded-xl text-sm"
          />
          <Input
            type="number"
            min="0"
            placeholder="Mevcut miktar"
            value={form.quantityOnHand ?? "0"}
            onChange={(e) => set("quantityOnHand", e.target.value)}
            className="rounded-xl text-sm"
          />
        </div>
        <Input
          type="number"
          min="0"
          placeholder="Düşük stok uyarı eşiği"
          value={form.lowStockThreshold ?? "5"}
          onChange={(e) => set("lowStockThreshold", e.target.value)}
          className="rounded-xl text-sm"
        />
        <Input
          placeholder="Notlar (opsiyonel)"
          value={form.notes ?? ""}
          onChange={(e) => set("notes", e.target.value)}
          className="rounded-xl text-sm"
        />
        <Button type="submit" disabled={saving} className="w-full rounded-xl h-10 text-[13px]">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ekle"}
        </Button>
      </form>
    </div>
  );
}

// ── Stock item card ───────────────────────────────────────────────────────────

function StockItemCard({
  item,
  onAdjusted,
  onDeleted,
}: {
  item: RestaurantStockItem;
  onAdjusted: (updated: RestaurantStockItem) => void;
  onDeleted: (id: number) => void;
}) {
  const [adjusting, setAdjusting] = useState(false);

  const qty = parseFloat(item.quantityOnHand ?? "0");
  const threshold = parseFloat(item.lowStockThreshold ?? "5");
  const isLow = qty <= threshold;
  const isEmpty = qty === 0;

  const handleAdjust = async (delta: number) => {
    setAdjusting(true);
    try {
      const updated = await adjustStock(item.id, delta);
      onAdjusted(updated);
    } catch {
      toast.error("Miktar güncellenemedi");
    } finally {
      setAdjusting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`"${item.name}" stoktan çıkarılsın mı?`)) return;
    try {
      await deleteStockItem(item.id);
      onDeleted(item.id);
      toast.success("Silindi");
    } catch {
      toast.error("Silinemedi");
    }
  };

  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-4 ${isEmpty ? "border-red-100" : isLow ? "border-amber-100" : "border-zinc-100"}`}>
      <div className="flex items-center gap-3">
        {/* Low-stock indicator */}
        <div className={`w-2 h-2 rounded-full shrink-0 ${isEmpty ? "bg-red-400" : isLow ? "bg-amber-400" : "bg-emerald-400"}`} />

        {/* Name + badge */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-semibold text-zinc-800 truncate">{item.name}</p>
            {isEmpty && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-100 shrink-0">Tükendi</span>
            )}
            {!isEmpty && isLow && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 flex items-center gap-0.5 shrink-0">
                <AlertTriangle className="w-2.5 h-2.5" />Düşük
              </span>
            )}
          </div>
          <p className="text-[12px] text-zinc-500">
            <span className="font-mono font-semibold text-zinc-700">{qty % 1 === 0 ? qty.toFixed(0) : qty.toFixed(2)}</span>
            {" "}{item.unit}
            {item.lowStockThreshold && <span className="text-zinc-400"> · eşik: {parseFloat(item.lowStockThreshold).toFixed(0)}</span>}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => handleAdjust(-1)}
            disabled={adjusting || qty <= 0}
            className="w-8 h-8 rounded-xl border border-zinc-200 flex items-center justify-center text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 transition-all"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleAdjust(1)}
            disabled={adjusting}
            className="w-8 h-8 rounded-xl border border-zinc-200 flex items-center justify-center text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDelete}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-all ml-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function RestaurantStockTab() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["restaurant-stock"],
    queryFn: listStockItems,
    staleTime: 30_000,
  });

  const handleCreated = (item: RestaurantStockItem) => {
    queryClient.setQueryData<RestaurantStockItem[]>(["restaurant-stock"], (prev = []) => [...prev, item]);
  };

  const handleAdjusted = (updated: RestaurantStockItem) => {
    queryClient.setQueryData<RestaurantStockItem[]>(["restaurant-stock"], (prev = []) =>
      prev.map((i) => (i.id === updated.id ? updated : i))
    );
  };

  const handleDeleted = (id: number) => {
    queryClient.setQueryData<RestaurantStockItem[]>(["restaurant-stock"], (prev = []) =>
      prev.filter((i) => i.id !== id)
    );
  };

  const lowCount = items.filter((i) => {
    const qty = parseFloat(i.quantityOnHand ?? "0");
    const threshold = parseFloat(i.lowStockThreshold ?? "5");
    return qty <= threshold;
  }).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PackageSearch className="w-4 h-4 text-zinc-500" />
          <h2 className="text-[14px] font-semibold text-zinc-700">Stok Takibi</h2>
          {lowCount > 0 && (
            <span className="text-[11px] font-bold text-white bg-amber-400 rounded-full min-w-[18px] h-[18px] px-1.5 flex items-center justify-center leading-none">
              {lowCount}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1 h-8 px-3 rounded-xl bg-zinc-900 text-white text-[12px] font-medium hover:bg-zinc-800 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Ekle
        </button>
      </div>

      {showForm && (
        <AddStockForm onClose={() => setShowForm(false)} onCreated={handleCreated} />
      )}

      {/* Low stock summary */}
      {lowCount > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-[12px] text-amber-700 font-medium">
            {lowCount} üründe düşük/tükenmiş stok uyarısı var
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-zinc-100 rounded-2xl h-16 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center py-10 bg-white rounded-2xl border border-zinc-100 gap-2">
          <PackageSearch className="w-7 h-7 text-zinc-200" />
          <p className="text-[13px] font-medium text-zinc-600">Stok kalemi yok</p>
          <p className="text-[11px] text-zinc-400">Ekle butonuna basarak stok takibine başlayın.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Sorted: empty first, then low, then ok */}
          {[...items]
            .sort((a, b) => {
              const score = (i: RestaurantStockItem) => {
                const qty = parseFloat(i.quantityOnHand ?? "0");
                const thr = parseFloat(i.lowStockThreshold ?? "5");
                if (qty === 0) return 0;
                if (qty <= thr) return 1;
                return 2;
              };
              return score(a) - score(b);
            })
            .map((item) => (
              <StockItemCard
                key={item.id}
                item={item}
                onAdjusted={handleAdjusted}
                onDeleted={handleDeleted}
              />
            ))}
        </div>
      )}
    </div>
  );
}

/**
 * RestaurantMenuTab — soft modern menu management with Excel import & item photos.
 */

import { useRef, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Loader2,
  FileSpreadsheet,
  Download,
  ImagePlus,
  MoreHorizontal,
  CalendarDays,
  UtensilsCrossed,
} from "lucide-react";
import {
  listMenuItems,
  updateMenuItem,
  deleteMenuItem,
  bulkCreateMenuItems,
  uploadMenuItemImage,
  deleteMenuItemImage,
  MENU_CATEGORIES,
  type RestaurantMenuItem,
  type MenuType,
  type MenuCategory,
} from "@/lib/restaurant";
import {
  parseMenuExcelFile,
  downloadMenuImportTemplate,
  type MenuImportPreview,
} from "@/lib/menu-import";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStaffLocale } from "@/hooks/use-staff-locale";
import { getMenuCategoryLabels, tStaff, type StaffTranslations } from "@/lib/staff-i18n";
import { MenuItemEditorDialog } from "@/components/restaurant/MenuItemEditorDialog";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function today() {
  return new Date().toISOString().split("T")[0];
}

function MenuTypeToggle({
  value,
  onChange,
  t,
}: {
  value: MenuType;
  onChange: (v: MenuType) => void;
  t: StaffTranslations;
}) {
  return (
    <div className="flex rounded-2xl bg-stone-100/90 p-1 gap-1">
      {(["DAILY", "ROOM_SERVICE"] as MenuType[]).map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          className={cn(
            "flex-1 h-9 rounded-xl text-[12px] font-semibold transition-all",
            value === type
              ? "bg-white text-stone-900 shadow-sm"
              : "text-stone-500 hover:text-stone-700",
          )}
        >
          {type === "DAILY" ? t.dailyMenuTab : t.roomServiceTab}
        </button>
      ))}
    </div>
  );
}

function MenuItemRow({
  item,
  t,
  catLabels,
  onEdit,
  onToggle,
  onDelete,
  onImageUpdated,
}: {
  item: RestaurantMenuItem;
  t: StaffTranslations;
  catLabels: Record<string, string>;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onImageUpdated: (item: RestaurantMenuItem) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleImagePick = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const { imageUrl } = await uploadMenuItemImage(item.id, file);
      onImageUpdated({ ...item, imageUrl });
      toast.success(t.menuPhotoSaved);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.addFailed);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    try {
      await deleteMenuItemImage(item.id);
      onImageUpdated({ ...item, imageUrl: null });
      toast.success(t.menuPhotoRemoved);
    } catch {
      toast.error(t.deleteFailed);
    }
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-2xl border border-stone-100 bg-white p-3 shadow-sm shadow-stone-100/50 transition-opacity",
        !item.isActive && "opacity-50",
      )}
    >
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-stone-100 ring-1 ring-stone-100"
        title={t.menuUploadPhoto}
      >
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-stone-300">
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="h-4 w-4" />
            )}
          </span>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            void handleImagePick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[13px] font-semibold text-stone-900">{item.name}</p>
          <span className="shrink-0 rounded-md bg-stone-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-stone-500">
            {catLabels[item.category]}
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0 text-[11px] text-stone-400">
          {item.priceAmount && <span className="font-medium text-stone-600">₺{item.priceAmount}</span>}
          {item.description && <span className="truncate max-w-[140px]">{item.description}</span>}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-50 hover:text-stone-700"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44 rounded-xl">
          <DropdownMenuItem onClick={onEdit}>{t.editMenuItem}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => fileRef.current?.click()}>{t.menuUploadPhoto}</DropdownMenuItem>
          {item.imageUrl && (
            <DropdownMenuItem onClick={() => void handleRemoveImage()}>{t.menuRemovePhoto}</DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={onToggle}>
            {item.isActive ? t.makeInactive : t.makeActive}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-rose-600 focus:text-rose-700">
            {t.deleteItem}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function MenuImportSheet({
  open,
  onClose,
  preview,
  importing,
  onConfirm,
  t,
}: {
  open: boolean;
  onClose: () => void;
  preview: MenuImportPreview | null;
  importing: boolean;
  onConfirm: () => void;
  t: StaffTranslations;
}) {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85dvh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left font-serif text-lg">{t.menuImportExcel}</SheetTitle>
        </SheetHeader>
        {preview && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-stone-600">
              {tStaff(t.menuImportPreview, {
                count: preview.items.length,
                skipped: preview.skipped,
              })}
            </p>
            <div className="max-h-48 overflow-y-auto rounded-xl border border-stone-100 bg-stone-50/50 p-3 space-y-1">
              {preview.items.slice(0, 8).map((row, i) => (
                <p key={i} className="text-xs text-stone-600 truncate">
                  {row.name}
                  {row.priceAmount ? ` · ₺${row.priceAmount}` : ""}
                  {row.category ? ` · ${row.category}` : ""}
                </p>
              ))}
              {preview.items.length > 8 && (
                <p className="text-[11px] text-stone-400">+{preview.items.length - 8} more…</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose} disabled={importing}>
                {t.cancel}
              </Button>
              <Button className="flex-1 rounded-xl bg-stone-900" onClick={onConfirm} disabled={importing}>
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : t.menuImportConfirm}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function MenuSection({ menuType, t }: { menuType: MenuType; t: StaffTranslations }) {
  const catLabels = getMenuCategoryLabels(t);
  const queryClient = useQueryClient();
  const importRef = useRef<HTMLInputElement>(null);
  const [dateFilter, setDateFilter] = useState(today());
  const [editorItem, setEditorItem] = useState<RestaurantMenuItem | null | "new">(null);
  const [importPreview, setImportPreview] = useState<MenuImportPreview | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const queryKey = ["restaurant-menu", menuType, menuType === "DAILY" ? dateFilter : "all"];

  const { data: items = [], isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      listMenuItems({ menuType, date: menuType === "DAILY" ? dateFilter : undefined }),
    staleTime: 30_000,
  });

  const importMutation = useMutation({
    mutationFn: bulkCreateMenuItems,
    onSuccess: (res) => {
      toast.success(tStaff(t.menuImportDone, { count: res.imported }));
      setImportOpen(false);
      setImportPreview(null);
      queryClient.invalidateQueries({ queryKey: ["restaurant-menu"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const patchCache = (updater: (list: RestaurantMenuItem[]) => RestaurantMenuItem[]) => {
    queryClient.setQueryData<RestaurantMenuItem[]>(queryKey, (prev = []) => updater(prev));
  };

  const grouped = MENU_CATEGORIES.reduce<Record<string, RestaurantMenuItem[]>>((acc, cat) => {
    const catItems = items.filter((i) => i.category === cat);
    if (catItems.length > 0) acc[cat] = catItems;
    return acc;
  }, {});

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const preview = await parseMenuExcelFile(file);
      if (preview.items.length === 0) {
        toast.error(t.menuImportEmpty);
        return;
      }
      setImportPreview(preview);
      setImportOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.addFailed);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-stone-600">
          {menuType === "DAILY" ? (
            <CalendarDays className="h-4 w-4" />
          ) : (
            <UtensilsCrossed className="h-4 w-4" />
          )}
          <span className="text-[13px] font-semibold">
            {menuType === "DAILY" ? t.dailyMenuTab : t.roomServiceTab}
          </span>
          <span className="text-[11px] font-mono text-stone-400">({items.length})</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {menuType === "DAILY" && (
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-9 rounded-xl border border-stone-200 bg-white px-2 text-[11px] text-stone-600"
            />
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-xl border-stone-200 text-[11px]"
            onClick={() => downloadMenuImportTemplate()}
          >
            <Download className="mr-1 h-3.5 w-3.5" />
            {t.menuDownloadTemplate}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-xl border-stone-200 text-[11px]"
            onClick={() => importRef.current?.click()}
          >
            <FileSpreadsheet className="mr-1 h-3.5 w-3.5" />
            {t.menuImportExcel}
          </Button>
          <input
            ref={importRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              void handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <Button
            size="sm"
            className="h-9 rounded-xl bg-stone-900 text-[11px] hover:bg-stone-800"
            onClick={() => setEditorItem("new")}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            {t.add}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-stone-200 bg-white/60 py-12">
          <UtensilsCrossed className="h-7 w-7 text-stone-200" />
          <p className="text-[13px] text-stone-500">
            {menuType === "DAILY" ? t.noMenuForDate : t.roomServiceMenuEmpty}
          </p>
          <Button variant="outline" size="sm" className="mt-1 rounded-xl" onClick={() => setEditorItem("new")}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            {t.add}
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([cat, catItems]) => (
            <div key={cat} className="space-y-2">
              <p className="px-1 text-[10px] font-semibold uppercase tracking-widest text-stone-400">
                {catLabels[cat as MenuCategory]}
              </p>
              <div className="space-y-2">
                {catItems.map((item) => (
                  <MenuItemRow
                    key={item.id}
                    item={item}
                    t={t}
                    catLabels={catLabels}
                    onEdit={() => setEditorItem(item)}
                    onToggle={async () => {
                      try {
                        const updated = await updateMenuItem(item.id, { isActive: !item.isActive });
                        patchCache((list) => list.map((i) => (i.id === updated.id ? updated : i)));
                      } catch {
                        toast.error(t.updateFailed);
                      }
                    }}
                    onDelete={async () => {
                      if (!window.confirm(tStaff(t.confirmDelete, { name: item.name }))) return;
                      try {
                        await deleteMenuItem(item.id);
                        patchCache((list) => list.filter((i) => i.id !== item.id));
                        toast.success(t.deleted);
                      } catch {
                        toast.error(t.deleteFailed);
                      }
                    }}
                    onImageUpdated={(updated) => {
                      patchCache((list) => list.map((i) => (i.id === updated.id ? updated : i)));
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <MenuItemEditorDialog
        open={editorItem !== null}
        onClose={() => setEditorItem(null)}
        menuType={menuType}
        dateFilter={dateFilter}
        item={editorItem === "new" ? null : editorItem}
        t={t}
        onSaved={(saved) => patchCache((list) => [saved, ...list.filter((i) => i.id !== saved.id)])}
      />

      <MenuImportSheet
        open={importOpen}
        onClose={() => {
          setImportOpen(false);
          setImportPreview(null);
        }}
        preview={importPreview}
        importing={importMutation.isPending}
        onConfirm={() => {
          if (importPreview?.items.length) {
            importMutation.mutate(importPreview.items);
          }
        }}
        t={t}
      />
    </div>
  );
}

export function RestaurantMenuTab() {
  const { t } = useStaffLocale();
  const [activeMenu, setActiveMenu] = useState<MenuType>("DAILY");

  return (
    <div className="space-y-4">
      <MenuTypeToggle value={activeMenu} onChange={setActiveMenu} t={t} />
      <MenuSection key={activeMenu} menuType={activeMenu} t={t} />
    </div>
  );
}

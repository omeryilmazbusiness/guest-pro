/**
 * RestaurantMenuTab — iconic minimalist menu management (daily + room service).
 */

import { useRef, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Plus,
  Loader2,
  FileSpreadsheet,
  Download,
  ImagePlus,
  MoreVertical,
  CalendarDays,
  UtensilsCrossed,
  ChevronDown,
  Coffee,
  Soup,
  Leaf,
  Sparkles,
  ChefHat,
  Cake,
  CupSoda,
  Cookie,
  LayoutGrid,
  BedDouble,
  type LucideIcon,
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
import { useStaffLocale } from "@/hooks/use-staff-locale";
import { getMenuCategoryLabels, tStaff, type StaffTranslations } from "@/lib/staff-i18n";
import { MenuItemEditorDialog } from "@/components/restaurant/MenuItemEditorDialog";
import { cn } from "@/lib/utils";
import { PILL_SPRING } from "@/lib/manager-motion";
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

const ACCORDION_CARD =
  "overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-150";

const ITEM_CARD =
  "rounded-lg border border-zinc-200/80 bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]";

const CATEGORY_ICONS: Record<MenuCategory, { icon: LucideIcon; iconClassName: string }> = {
  BREAKFAST: { icon: Coffee, iconClassName: "text-amber-600" },
  SOUP: { icon: Soup, iconClassName: "text-orange-500" },
  SALAD: { icon: Leaf, iconClassName: "text-emerald-600" },
  APPETIZER: { icon: Sparkles, iconClassName: "text-violet-500" },
  MAIN_COURSE: { icon: ChefHat, iconClassName: "text-zinc-700" },
  DESSERT: { icon: Cake, iconClassName: "text-rose-500" },
  BEVERAGE: { icon: CupSoda, iconClassName: "text-sky-600" },
  SNACK: { icon: Cookie, iconClassName: "text-amber-700" },
  OTHER: { icon: LayoutGrid, iconClassName: "text-zinc-500" },
};

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
  const tabs: { key: MenuType; label: string; icon: LucideIcon; iconClassName: string }[] = [
    { key: "DAILY", label: t.dailyMenuTab, icon: CalendarDays, iconClassName: "text-sky-600" },
    { key: "ROOM_SERVICE", label: t.roomServiceTab, icon: BedDouble, iconClassName: "text-violet-600" },
  ];

  return (
    <div className="flex gap-1.5" role="tablist">
      {tabs.map((tab) => {
        const isActive = value === tab.key;
        const Icon = tab.icon;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={tab.label}
            title={tab.label}
            onClick={() => onChange(tab.key)}
            className={cn(
              "relative flex min-w-0 flex-1 items-center justify-center gap-2 px-4 py-2.5 rounded-md",
              "transition-opacity duration-150 hover:opacity-90 active:opacity-80 touch-manipulation",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/15",
            )}
          >
            {isActive && (
              <motion.span
                layoutId="menu-type-frame"
                className="absolute inset-0 rounded-md bg-zinc-900 shadow-sm shadow-zinc-900/20"
                transition={PILL_SPRING}
              />
            )}
            <Icon
              className={cn(
                "relative z-10 h-4 w-4 shrink-0",
                isActive ? "text-white" : tab.iconClassName,
                !isActive && "opacity-50",
              )}
              strokeWidth={1.5}
            />
            <span
              className={cn(
                "relative z-10 truncate text-[11px] font-semibold",
                isActive ? "text-white" : "text-zinc-500",
              )}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function IconActionButton({
  label,
  onClick,
  children,
  disabled,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 active:scale-95 disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function MenuItemRow({
  item,
  t,
  onEdit,
  onToggle,
  onDelete,
  onImageUpdated,
}: {
  item: RestaurantMenuItem;
  t: StaffTranslations;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onImageUpdated: (item: RestaurantMenuItem) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const catIcon = CATEGORY_ICONS[item.category];
  const CatIcon = catIcon.icon;

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
    <article className={cn(ITEM_CARD, !item.isActive && "opacity-55")}>
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-zinc-200/80 bg-zinc-50"
          title={t.menuUploadPhoto}
        >
          {item.imageUrl ? (
            <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center">
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />
              ) : (
                <ImagePlus className="h-4 w-4 text-zinc-300" strokeWidth={1.5} />
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
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-zinc-900">{item.name}</p>
              {item.description && (
                <p className="mt-0.5 truncate text-[11px] text-zinc-400">{item.description}</p>
              )}
            </div>
            {item.priceAmount && (
              <span className="shrink-0 font-mono text-[12px] font-semibold tabular-nums text-zinc-700">
                ₺{item.priceAmount}
              </span>
            )}
          </div>

          <div className="mt-1.5 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-400">
              <CatIcon className={cn("h-3 w-3", catIcon.iconClassName)} strokeWidth={1.75} />
              {!item.isActive && <span className="text-zinc-300">· {t.makeInactive}</span>}
            </span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-zinc-700"
                  aria-label={t.editMenuItem}
                >
                  <MoreVertical className="h-3.5 w-3.5" strokeWidth={1.75} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 rounded-xl">
                <DropdownMenuItem onClick={onEdit}>{t.editMenuItem}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => fileRef.current?.click()}>
                  {t.menuUploadPhoto}
                </DropdownMenuItem>
                {item.imageUrl && (
                  <DropdownMenuItem onClick={() => void handleRemoveImage()}>
                    {t.menuRemovePhoto}
                  </DropdownMenuItem>
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
        </div>
      </div>
    </article>
  );
}

function CategoryAccordion({
  category,
  items,
  label,
  isExpanded,
  onToggle,
  t,
  onEdit,
  onToggleItem,
  onDeleteItem,
  onImageUpdated,
}: {
  category: MenuCategory;
  items: RestaurantMenuItem[];
  label: string;
  isExpanded: boolean;
  onToggle: () => void;
  t: StaffTranslations;
  onEdit: (item: RestaurantMenuItem) => void;
  onToggleItem: (item: RestaurantMenuItem) => void;
  onDeleteItem: (item: RestaurantMenuItem) => void;
  onImageUpdated: (item: RestaurantMenuItem) => void;
}) {
  const { icon: Icon, iconClassName } = CATEGORY_ICONS[category];
  const activeCount = items.filter((i) => i.isActive).length;

  return (
    <div className={cn(ACCORDION_CARD, isExpanded && "border-zinc-300 shadow-[0_2px_8px_rgba(0,0,0,0.05)]")}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="flex w-full items-center gap-3 px-3.5 py-3 text-left touch-manipulation transition-colors hover:bg-zinc-50/80 active:scale-[0.995]"
      >
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center" aria-hidden>
          <Icon className={cn("guest-chat-entry-icon h-8 w-8", iconClassName)} strokeWidth={1.5} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-900">{label}</p>
          <p className="mt-0.5 text-[11px] text-zinc-400">
            {items.length === 0 ? "—" : `${activeCount} / ${items.length}`}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {items.length > 0 && (
            <span className="min-w-[1.25rem] rounded-md bg-zinc-100 px-1.5 py-0.5 text-center font-mono text-[10px] font-bold tabular-nums text-zinc-600">
              {items.length}
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-zinc-400 transition-transform duration-200",
              isExpanded && "rotate-180",
            )}
            strokeWidth={1.75}
          />
        </div>
      </button>

      {isExpanded && items.length > 0 && (
        <div className="space-y-2 border-t border-zinc-100 px-3.5 pb-3.5 pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
          {items.map((item) => (
            <MenuItemRow
              key={item.id}
              item={item}
              t={t}
              onEdit={() => onEdit(item)}
              onToggle={() => onToggleItem(item)}
              onDelete={() => onDeleteItem(item)}
              onImageUpdated={onImageUpdated}
            />
          ))}
        </div>
      )}
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
      <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-3xl">
        <SheetHeader>
          <SheetTitle className="text-left font-serif text-lg">{t.menuImportExcel}</SheetTitle>
        </SheetHeader>
        {preview && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-zinc-600">
              {tStaff(t.menuImportPreview, {
                count: preview.items.length,
                skipped: preview.skipped,
              })}
            </p>
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-zinc-100 bg-zinc-50/50 p-3">
              {preview.items.slice(0, 8).map((row, i) => (
                <p key={i} className="truncate text-xs text-zinc-600">
                  {row.name}
                  {row.priceAmount ? ` · ₺${row.priceAmount}` : ""}
                  {row.category ? ` · ${row.category}` : ""}
                </p>
              ))}
              {preview.items.length > 8 && (
                <p className="text-[11px] text-zinc-400">+{preview.items.length - 8} more…</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose} disabled={importing}>
                {t.cancel}
              </Button>
              <Button className="flex-1 rounded-xl bg-zinc-900" onClick={onConfirm} disabled={importing}>
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
  const [expandedCategory, setExpandedCategory] = useState<MenuCategory | null>(null);

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

  const handleToggleItem = async (item: RestaurantMenuItem) => {
    try {
      const updated = await updateMenuItem(item.id, { isActive: !item.isActive });
      patchCache((list) => list.map((i) => (i.id === updated.id ? updated : i)));
    } catch {
      toast.error(t.updateFailed);
    }
  };

  const handleDeleteItem = async (item: RestaurantMenuItem) => {
    if (!window.confirm(tStaff(t.confirmDelete, { name: item.name }))) return;
    try {
      await deleteMenuItem(item.id);
      patchCache((list) => list.filter((i) => i.id !== item.id));
      toast.success(t.deleted);
    } catch {
      toast.error(t.deleteFailed);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {menuType === "DAILY" ? t.dailyMenuTab : t.roomServiceTab}
          </h2>
          {items.length > 0 && (
            <span className="min-w-[1.125rem] rounded-md bg-zinc-900 px-1.5 py-0.5 text-center font-mono text-[10px] font-bold tabular-nums text-white">
              {items.length}
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {menuType === "DAILY" && (
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="mr-1 h-8 max-w-[7.5rem] rounded-lg border border-zinc-200 bg-white px-2 text-[10px] text-zinc-600"
              aria-label={t.dailyMenuTab}
            />
          )}
          <IconActionButton label={t.menuDownloadTemplate} onClick={() => downloadMenuImportTemplate()}>
            <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
          </IconActionButton>
          <IconActionButton label={t.menuImportExcel} onClick={() => importRef.current?.click()}>
            <FileSpreadsheet className="h-3.5 w-3.5" strokeWidth={1.75} />
          </IconActionButton>
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
          <IconActionButton label={t.add} onClick={() => setEditorItem("new")}>
            <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
          </IconActionButton>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[4.25rem] animate-pulse rounded-xl bg-zinc-100" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-zinc-200 bg-white py-12">
          <span className="inline-flex h-12 w-12 items-center justify-center" aria-hidden>
            <UtensilsCrossed className="guest-chat-entry-icon h-9 w-9 text-zinc-200" strokeWidth={1.5} />
          </span>
          <p className="text-[12px] text-zinc-500">
            {menuType === "DAILY" ? t.noMenuForDate : t.roomServiceMenuEmpty}
          </p>
          <button
            type="button"
            onClick={() => setEditorItem("new")}
            className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-zinc-800"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
            {t.add}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {Object.entries(grouped).map(([cat, catItems]) => (
            <CategoryAccordion
              key={cat}
              category={cat as MenuCategory}
              items={catItems}
              label={catLabels[cat as MenuCategory]}
              isExpanded={expandedCategory === cat}
              onToggle={() =>
                setExpandedCategory((prev) => (prev === cat ? null : (cat as MenuCategory)))
              }
              t={t}
              onEdit={setEditorItem}
              onToggleItem={handleToggleItem}
              onDeleteItem={handleDeleteItem}
              onImageUpdated={(updated) => {
                patchCache((list) => list.map((i) => (i.id === updated.id ? updated : i)));
              }}
            />
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

/**
 * MenuItemEditorDialog — centered add/edit popup for restaurant menu items.
 * Mobile + desktop: full field set, photo upload, guest visibility toggle.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, ImagePlus, Trash2, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { ManagerCenterSheet } from "@/components/manager/ManagerCenterSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  createMenuItem,
  updateMenuItem,
  uploadMenuItemImage,
  deleteMenuItemImage,
  MENU_CATEGORIES,
  type RestaurantMenuItem,
  type MenuType,
  type MenuCategory,
  type CreateMenuItemInput,
} from "@/lib/restaurant";
import { getMenuCategoryLabels, type StaffTranslations } from "@/lib/staff-i18n";

const CURRENCIES = ["TRY", "USD", "EUR"] as const;

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-semibold uppercase tracking-wide text-stone-500 mb-1.5">
      {children}
    </label>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 pt-1">
      {children}
    </p>
  );
}

function buildFormState(
  item: RestaurantMenuItem | null,
  menuType: MenuType,
  dateFilter: string,
): CreateMenuItemInput & { currency: string } {
  if (item) {
    return {
      name: item.name,
      description: item.description ?? "",
      category: item.category,
      menuType: item.menuType,
      availableDate: item.availableDate,
      priceAmount: item.priceAmount ?? "",
      currency: item.currency ?? "TRY",
      allergenNotes: item.allergenNotes ?? "",
      portionInfo: item.portionInfo ?? "",
      isActive: item.isActive,
      sortOrder: item.sortOrder,
    };
  }
  return {
    name: "",
    description: "",
    category: "OTHER",
    menuType,
    availableDate: menuType === "DAILY" ? dateFilter : null,
    priceAmount: "",
    currency: "TRY",
    allergenNotes: "",
    portionInfo: "",
    isActive: true,
    sortOrder: 0,
  };
}

export interface MenuItemEditorDialogProps {
  open: boolean;
  onClose: () => void;
  menuType: MenuType;
  dateFilter: string;
  item: RestaurantMenuItem | null;
  t: StaffTranslations;
  onSaved: (item: RestaurantMenuItem) => void;
}

export function MenuItemEditorDialog({
  open,
  onClose,
  menuType,
  dateFilter,
  item,
  t,
  onSaved,
}: MenuItemEditorDialogProps) {
  const catLabels = getMenuCategoryLabels(t);
  const isEdit = !!item;
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState(() => buildFormState(item, menuType, dateFilter));
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = useCallback(
    <K extends keyof (CreateMenuItemInput & { currency: string })>(
      key: K,
      val: (CreateMenuItemInput & { currency: string })[K],
    ) => setForm((f) => ({ ...f, [key]: val })),
    [],
  );

  useEffect(() => {
    if (!open) return;
    setForm(buildFormState(item, menuType, dateFilter));
    setPendingFile(null);
    setPreviewUrl(null);
    setRemoveExistingImage(false);
  }, [open, item, menuType, dateFilter]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const displayImage =
    previewUrl ?? (!removeExistingImage && item?.imageUrl ? item.imageUrl : null);

  const handlePickFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast.error(t.menuPhotoTooLarge);
      return;
    }
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setRemoveExistingImage(false);
  };

  const clearPhoto = () => {
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPendingFile(null);
    setPreviewUrl(null);
    if (item?.imageUrl) setRemoveExistingImage(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error(t.nameRequired);
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<CreateMenuItemInput> & { currency?: string } = {
        name: form.name.trim(),
        description: form.description?.trim() || undefined,
        category: form.category,
        menuType: form.menuType ?? menuType,
        availableDate: menuType === "DAILY" ? (form.availableDate ?? dateFilter) : null,
        priceAmount: form.priceAmount?.toString().trim() || null,
        currency: form.currency ?? "TRY",
        allergenNotes: form.allergenNotes?.toString().trim() || null,
        portionInfo: form.portionInfo?.toString().trim() || null,
        isActive: form.isActive ?? true,
        sortOrder: Number(form.sortOrder) || 0,
      };

      let saved = isEdit
        ? await updateMenuItem(item!.id, payload)
        : await createMenuItem(payload as CreateMenuItemInput);

      if (removeExistingImage && isEdit && item?.imageUrl) {
        await deleteMenuItemImage(saved.id);
        saved = { ...saved, imageUrl: null };
      }

      let imageError: string | null = null;
      if (pendingFile) {
        try {
          const { imageUrl } = await uploadMenuItemImage(saved.id, pendingFile);
          saved = { ...saved, imageUrl };
        } catch (err) {
          imageError = err instanceof Error ? err.message : t.addFailed;
        }
      }

      onSaved(saved);
      toast.success(isEdit ? t.menuUpdated : t.menuItemAdded);
      if (imageError) toast.error(imageError);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.addFailed);
    } finally {
      setSaving(false);
    }
  };

  const title = isEdit
    ? t.editMenuItem
    : menuType === "DAILY"
      ? t.addToDailyMenu
      : t.addToRoomServiceMenu;

  return (
    <ManagerCenterSheet
      open={open}
      onClose={onClose}
      ariaLabel={title}
      closeLabel={t.cancel}
      className="max-w-lg max-h-[min(92dvh,720px)] sm:max-w-[480px]"
    >
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 border-b border-stone-100 px-5 pb-4 pt-10">
          <h2 className="font-serif text-lg font-medium text-stone-900 pr-8">{title}</h2>
          <p className="mt-1 text-xs text-stone-500">{t.menuEditorSubtitle}</p>
          <span className="mt-2 inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 ring-1 ring-amber-100">
            <UtensilsCrossed className="h-3 w-3" />
            {menuType === "DAILY" ? t.dailyMenuTab : t.roomServiceTab}
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-5">
          {/* Photo */}
          <div>
            <FieldLabel>{t.menuUploadPhoto}</FieldLabel>
            <div
              className={cn(
                "relative overflow-hidden rounded-2xl border-2 border-dashed transition-colors",
                displayImage ? "border-stone-200 bg-stone-50" : "border-stone-200 bg-stone-50/80",
              )}
            >
              {displayImage ? (
                <div className="relative aspect-[16/10] w-full">
                  <img src={displayImage} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 flex gap-2 bg-gradient-to-t from-black/50 to-transparent p-3 pt-8">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="h-8 rounded-lg text-[11px] bg-white/95"
                      onClick={() => fileRef.current?.click()}
                    >
                      {t.menuChangePhoto}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="h-8 rounded-lg text-[11px] bg-white/95 text-rose-600"
                      onClick={clearPhoto}
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      {t.menuRemovePhoto}
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 text-stone-400 hover:bg-stone-100/80 hover:text-stone-600 transition-colors"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-stone-100">
                    <ImagePlus className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-medium text-stone-600">{t.menuUploadPhoto}</span>
                  <span className="text-[11px] text-stone-400 px-6 text-center">{t.menuFieldPhotoHint}</span>
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  handlePickFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          <SectionTitle>{t.menuSectionBasics}</SectionTitle>

          <div>
            <FieldLabel>{t.menuFieldName}</FieldLabel>
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder={t.placeholderFoodName}
              className="h-11 rounded-xl border-stone-200 bg-white"
              autoFocus
            />
          </div>

          <div>
            <FieldLabel>{t.menuFieldDescription}</FieldLabel>
            <Textarea
              value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
              placeholder={t.placeholderDescription}
              rows={3}
              className="rounded-xl border-stone-200 bg-white resize-none text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>{t.menuFieldCategory}</FieldLabel>
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value as MenuCategory)}
                className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-800"
              >
                {MENU_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {catLabels[c]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>{t.menuFieldSortOrder}</FieldLabel>
              <Input
                type="number"
                min={0}
                value={form.sortOrder ?? 0}
                onChange={(e) => set("sortOrder", parseInt(e.target.value, 10) || 0)}
                className="h-11 rounded-xl border-stone-200 bg-white"
              />
            </div>
          </div>

          <SectionTitle>{t.menuSectionPricing}</SectionTitle>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <FieldLabel>{t.menuFieldPrice}</FieldLabel>
              <Input
                inputMode="decimal"
                value={form.priceAmount ?? ""}
                onChange={(e) => set("priceAmount", e.target.value)}
                placeholder={t.placeholderPrice}
                className="h-11 rounded-xl border-stone-200 bg-white"
              />
            </div>
            <div>
              <FieldLabel>{t.menuFieldCurrency}</FieldLabel>
              <select
                value={form.currency ?? "TRY"}
                onChange={(e) => set("currency", e.target.value)}
                className="h-11 w-full rounded-xl border border-stone-200 bg-white px-2 text-sm text-stone-800"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {menuType === "DAILY" && (
            <div>
              <FieldLabel>{t.menuFieldDate}</FieldLabel>
              <Input
                type="date"
                value={form.availableDate ?? dateFilter}
                onChange={(e) => set("availableDate", e.target.value)}
                className="h-11 rounded-xl border-stone-200 bg-white"
              />
            </div>
          )}

          <SectionTitle>{t.menuSectionGuestInfo}</SectionTitle>

          <div>
            <FieldLabel>{t.menuFieldPortion}</FieldLabel>
            <Input
              value={form.portionInfo ?? ""}
              onChange={(e) => set("portionInfo", e.target.value)}
              placeholder={t.placeholderPortion}
              className="h-11 rounded-xl border-stone-200 bg-white"
            />
          </div>

          <div>
            <FieldLabel>{t.menuFieldAllergens}</FieldLabel>
            <Textarea
              value={form.allergenNotes ?? ""}
              onChange={(e) => set("allergenNotes", e.target.value)}
              placeholder={t.placeholderAllergen}
              rows={2}
              className="rounded-xl border-stone-200 bg-white resize-none text-sm"
            />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-stone-100 bg-stone-50/60 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-stone-800">{t.menuFieldVisible}</p>
              <p className="text-[11px] text-stone-500 mt-0.5">{t.menuFieldVisibleHint}</p>
            </div>
            <Switch
              checked={form.isActive ?? true}
              onCheckedChange={(v) => set("isActive", v)}
              className="data-[state=checked]:bg-emerald-600"
            />
          </div>
        </div>

        <div className="shrink-0 flex gap-2 border-t border-stone-100 bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            type="button"
            variant="outline"
            className="h-11 flex-1 rounded-xl border-stone-200"
            onClick={onClose}
            disabled={saving}
          >
            {t.cancel}
          </Button>
          <Button
            type="submit"
            className="h-11 flex-1 rounded-xl bg-stone-900 hover:bg-stone-800"
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t.save}
          </Button>
        </div>
      </form>
    </ManagerCenterSheet>
  );
}

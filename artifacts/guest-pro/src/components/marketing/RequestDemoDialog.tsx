import { useState, type ReactNode } from "react";
import { CalendarClock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useMarketingLocale } from "@/hooks/use-marketing-locale";
import { buildDemoMailto, type DemoRequestPayload } from "@/lib/marketing/demo-request";

interface RequestDemoDialogProps {
  trigger: ReactNode;
}

export function RequestDemoDialog({ trigger }: RequestDemoDialogProps) {
  const { t, dir } = useMarketingLocale();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<DemoRequestPayload>({
    name: "",
    email: "",
    property: "",
    message: "",
  });

  const update = (field: keyof DemoRequestPayload, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.property.trim()) {
      toast.error(t.demo.formError);
      return;
    }

    setSubmitting(true);
    try {
      window.location.href = buildDemoMailto(form);
      toast.success(t.demo.formSuccess);
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className="marketing-demo-dialog max-w-md border-white/10 bg-neutral-950 text-white sm:rounded-2xl"
        dir={dir}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-medium text-white">
            <CalendarClock className="h-5 w-5 text-white/70" aria-hidden="true" />
            {t.demo.dialogTitle}
          </DialogTitle>
          <DialogDescription className="text-sm text-white/55">{t.demo.dialogDesc}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="demo-name" className="text-white/70">
              {t.demo.formName}
            </Label>
            <Input
              id="demo-name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder={t.demo.formNamePh}
              className="border-white/15 bg-white/5 text-white placeholder:text-white/35"
              autoComplete="name"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="demo-email" className="text-white/70">
              {t.demo.formEmail}
            </Label>
            <Input
              id="demo-email"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder={t.demo.formEmailPh}
              className="border-white/15 bg-white/5 text-white placeholder:text-white/35"
              autoComplete="email"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="demo-property" className="text-white/70">
              {t.demo.formProperty}
            </Label>
            <Input
              id="demo-property"
              value={form.property}
              onChange={(e) => update("property", e.target.value)}
              placeholder={t.demo.formPropertyPh}
              className="border-white/15 bg-white/5 text-white placeholder:text-white/35"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="demo-message" className="text-white/70">
              {t.demo.formMessage}
            </Label>
            <Textarea
              id="demo-message"
              value={form.message}
              onChange={(e) => update("message", e.target.value)}
              placeholder={t.demo.formMessagePh}
              rows={3}
              className="border-white/15 bg-white/5 text-white placeholder:text-white/35"
            />
          </div>
          <Button
            type="submit"
            disabled={submitting}
            className="marketing-landing__btn-primary w-full rounded-full"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                {t.demo.formSending}
              </>
            ) : (
              t.demo.formSubmit
            )}
          </Button>
          <p className="text-center text-xs text-white/40">{t.demo.formNote}</p>
        </form>
      </DialogContent>
    </Dialog>
  );
}

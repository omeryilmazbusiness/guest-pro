/**
 * ResetPasswordDialog — GM-only password reset for staff and department managers.
 */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, KeyRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { StaffTranslations } from "@/lib/staff-i18n";
import { tStaff } from "@/lib/staff-i18n";

const schema = (t: StaffTranslations) =>
  z
    .object({
      password: z.string().min(8, t.staffPasswordMin),
      confirmPassword: z.string().min(1, t.confirmPasswordRequired),
    })
    .refine((d) => d.password === d.confirmPassword, {
      message: t.passwordsMismatch,
      path: ["confirmPassword"],
    });

type FormValues = z.infer<ReturnType<typeof schema>>;

export interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectName: string;
  onSubmit: (password: string) => void;
  isPending?: boolean;
  t: StaffTranslations;
}

export function ResetPasswordDialog({
  open,
  onOpenChange,
  subjectName,
  onSubmit,
  isPending = false,
  t,
}: ResetPasswordDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema(t)),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (!open) {
      form.reset({ password: "", confirmPassword: "" });
    }
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-zinc-500" />
            {tStaff(t.resetPasswordFor, { name: subjectName })}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => onSubmit(values.password))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.staffTempPassword}</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.confirmPassword}</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                className="rounded-xl"
              >
                {t.cancel}
              </Button>
              <Button type="submit" disabled={isPending} className="rounded-xl">
                {isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                {t.resetPassword}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

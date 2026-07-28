import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useCreateUser } from "@/hooks/users/use-create-user";
import { Button } from "~orbit/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~orbit/components/ui/Dialog";
import { Loader2, UserPlus } from "~orbit/components/ui/icons";
import { Input } from "~orbit/components/ui/Input";
import { Label } from "~orbit/components/ui/Label";
import { CreateUserSchema } from "~shared/schemas/api/users.schemas";

const defaultValues = { firstName: "", lastName: "", email: "", password: "" };

/**
 * Admin-only dialog to create a user by hand. Unlike invitations, the admin
 * sets the password directly — with no complexity rules enforced.
 */
export function CreateUserDialog() {
  const { t } = useTranslation("web");
  const [open, setOpen] = useState(false);
  const mutation = useCreateUser();

  const form = useForm({
    validators: { onChange: CreateUserSchema },
    defaultValues,
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value);
      form.reset();
      setOpen(false);
    },
  });

  function handleOpenChange(next: boolean) {
    if (!next) form.reset();
    setOpen(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="size-4" />
          {t("users.create.button")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("users.create.title")}</DialogTitle>
          <DialogDescription>{t("users.create.description")}</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="flex flex-col gap-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <form.Field
              name="firstName"
              children={field => (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={field.name}>
                    {t("users.create.firstNameLabel")}
                  </Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={e => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    invalid={
                      field.state.meta.isTouched && !field.state.meta.isValid
                    }
                    autoFocus
                  />
                </div>
              )}
            />
            <form.Field
              name="lastName"
              children={field => (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={field.name}>
                    {t("users.create.lastNameLabel")}
                  </Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onChange={e => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    invalid={
                      field.state.meta.isTouched && !field.state.meta.isValid
                    }
                  />
                </div>
              )}
            />
          </div>

          <form.Field
            name="email"
            children={field => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={field.name}>
                  {t("users.create.emailLabel")}
                </Label>
                <Input
                  id={field.name}
                  type="email"
                  value={field.state.value}
                  onChange={e => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  invalid={
                    field.state.meta.isTouched && !field.state.meta.isValid
                  }
                />
              </div>
            )}
          />

          <form.Field
            name="password"
            children={field => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={field.name}>
                  {t("users.create.passwordLabel")}
                </Label>
                <Input
                  id={field.name}
                  type="password"
                  value={field.state.value}
                  onChange={e => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  invalid={
                    field.state.meta.isTouched && !field.state.meta.isValid
                  }
                />
                <p className="text-[11px] text-muted">
                  {t("users.create.passwordHint")}
                </p>
              </div>
            )}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              {t("actions.cancel")}
            </Button>
            <form.Subscribe
              selector={state => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  disabled={!canSubmit || isSubmitting || mutation.isPending}
                >
                  {(isSubmitting || mutation.isPending) && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  {t("users.create.submit")}
                </Button>
              )}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

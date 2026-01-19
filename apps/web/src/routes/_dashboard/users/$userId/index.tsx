import type { z } from "zod";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeftIcon, CalendarIcon, CheckIcon, CopyIcon, KeyIcon, MailIcon, ShieldIcon, UserIcon } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { AvatarUser } from "@/components/avatar-user";
import { getUserQueryOptions } from "@/queries/users";
import { Badge } from "~react/components/badge";
import { Button } from "~react/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~react/components/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "~react/components/dialog";
import { Field, FieldContent, FieldError, FieldLabel } from "~react/components/field";
import { Input } from "~react/components/input";
import { Separator } from "~react/components/separator";
import { Spinner } from "~react/components/spinner";
import { useAuth } from "~react/hooks/use-auth";
import { api } from "~react/lib/http";
import sayno from "~react/lib/sayno";
import { authQueryOptions, authorizeQueryOptions } from "~react/queries/auth";
import { UpdateAccountSchema } from "~shared/schemas/api/auth.schemas";

export const Route = createFileRoute("/_dashboard/users/$userId/")({
  component: User,
  loader: async ({ params: { userId }, context: { queryClient } }) => {
    const { user } = await queryClient.ensureQueryData(getUserQueryOptions(userId, ["roles"]));
    return { user, crumb: user.name };
  },
});

type UpdateUserData = z.infer<typeof UpdateAccountSchema>;

function User() {
  const { t } = useTranslation(["common", "web"]);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { userId } = Route.useParams();
  const { user } = Route.useLoaderData();
  const { user: currentUser } = useAuth();

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: canUpdate } = useQuery(authorizeQueryOptions("user:update", { id: userId }));
  const { data: canImpersonate } = useQuery(authorizeQueryOptions("user:impersonate", { id: userId }));

  const isSelf = currentUser.id === userId;

  const formRef = useRef<{ reset: (values: UpdateUserData) => void } | null>(null);

  const mutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserData }) => {
      const res = await api.users[":id"].$put({
        param: { id },
        json: data,
      });

      if (!res.ok) {
        throw new Error("Failed to update user");
      }

      return res.json();
    },
    onSuccess: (response) => {
      toast.success("User updated successfully");
      queryClient.invalidateQueries({ queryKey: ["get-user", userId] });
      queryClient.invalidateQueries({ queryKey: ["get-users"] });
      formRef.current?.reset({ name: response.user.name, email: response.user.email });
    },
    onError: () => {
      toast.error("Failed to update user");
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.users[":id"]["reset-password"].$post({
        param: { id },
      });

      if (!res.ok) {
        throw new Error("Failed to reset password");
      }

      return res.json();
    },
    onSuccess: (response) => {
      setGeneratedPassword(response.password);
      setPasswordDialogOpen(true);
      setCopied(false);
    },
    onError: () => {
      toast.error("Failed to reset password");
    },
  });

  const impersonateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.auth.impersonate[":id"].$post({
        param: { id },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error("error" in data ? data.error : "Failed to impersonate user");
      }

      return res.json();
    },
    onSuccess: () => {
      toast.success(t("web:pages.users.detail.impersonate.success", { name: user.name }));
      queryClient.invalidateQueries();
      navigate({ to: "/" });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to impersonate user");
    },
  });

  const form = useForm({
    validators: { onChange: UpdateAccountSchema },
    defaultValues: {
      name: user.name || "",
      email: user.email || "",
    },
    onSubmit: async ({ value }) => {
      mutation.mutate({ id: userId, data: value });
    },
  });

  formRef.current = form;

  const joinedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const handleResetPassword = async () => {
    const confirmation = await sayno.confirm({
      title: t("web:pages.users.detail.resetPassword.confirmTitle"),
      description: t("web:pages.users.detail.resetPassword.confirmDescription"),
      variant: "destructive",
    });

    if (confirmation) {
      resetPasswordMutation.mutate(userId);
    }
  };

  const handleCopyPassword = async () => {
    if (generatedPassword) {
      await navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      toast.success(t("web:pages.users.detail.resetPassword.copied"));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleImpersonate = async () => {
    const confirmation = await sayno.confirm({
      title: t("web:pages.users.detail.impersonate.confirmTitle"),
      description: t("web:pages.users.detail.impersonate.confirmDescription", { name: user.name }),
    });

    if (confirmation) {
      impersonateMutation.mutate(userId);
    }
  };

  return (
    <div className="w-full p-10">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/users">
              <ArrowLeftIcon className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{t("web:pages.users.detail.title")}</h1>
            <p className="text-muted-foreground">{t("web:pages.users.detail.subtitle")}</p>
          </div>
        </div>

        <Card>
          <CardHeader className="flex-row items-center gap-4">
            <AvatarUser avatar={user.avatar} name={user.name} size="lg" />
            <div className="flex-1">
              <CardTitle>{user.name}</CardTitle>
              <CardDescription className="flex items-center gap-1">
                <MailIcon className="size-3" />
                {user.email}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="size-4" />
                <span>Joined {joinedDate}</span>
              </div>
              {user.verifiedAt && (
                <Badge variant="secondary">Verified</Badge>
              )}
            </div>

            {user.roles && user.roles.length > 0 && (
              <div className="flex items-center gap-2">
                <ShieldIcon className="size-4 text-muted-foreground" />
                <div className="flex flex-wrap gap-1">
                  {user.roles.map(role => (
                    <Badge key={role.id} variant={role.isDefault ? "outline" : "secondary"}>
                      {role.label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {canUpdate && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>{t("web:pages.users.detail.sections.edit.title")}</CardTitle>
                <CardDescription>{t("web:pages.users.detail.sections.edit.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit(e);
                  }}
                >
                  <div className="grid gap-4">
                    <form.Field
                      name="name"
                      children={field => (
                        <Field data-invalid={field.state.meta.isTouched && !field.state.meta.isValid}>
                          <FieldLabel htmlFor={field.name}>
                            {t("web:pages.users.detail.fields.name")}
                          </FieldLabel>
                          <FieldContent>
                            <Input
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={e => field.handleChange(e.target.value)}
                              type="text"
                              placeholder="User name"
                              required
                            />
                            <FieldError errors={field.state.meta.errors} />
                          </FieldContent>
                        </Field>
                      )}
                    />
                    <form.Field
                      name="email"
                      children={field => (
                        <Field data-invalid={field.state.meta.isTouched && !field.state.meta.isValid}>
                          <FieldLabel htmlFor={field.name}>
                            {t("web:pages.users.detail.fields.email")}
                          </FieldLabel>
                          <FieldContent>
                            <Input
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={e => field.handleChange(e.target.value)}
                              type="email"
                              placeholder="user@email.com"
                              required
                            />
                            <FieldError errors={field.state.meta.errors} />
                          </FieldContent>
                        </Field>
                      )}
                    />

                    <Separator />

                    <form.Subscribe
                      selector={state => [state.canSubmit, state.isSubmitting, state.isDefaultValue]}
                      children={([canSubmit, isSubmitting, isDefaultValue]) => (
                        <Button type="submit" disabled={!canSubmit || isDefaultValue} className="w-fit">
                          {isSubmitting
                            ? (
                                <span className="flex items-center space-x-2">
                                  <Spinner />
                                  {t("common:form.saving")}
                                </span>
                              )
                            : isDefaultValue
                              ? t("common:form.noChanges")
                              : t("common:form.save")}
                        </Button>
                      )}
                    />
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("web:pages.users.detail.sections.security.title")}</CardTitle>
                <CardDescription>{t("web:pages.users.detail.sections.security.description")}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={handleResetPassword}
                  disabled={resetPasswordMutation.isPending}
                >
                  {resetPasswordMutation.isPending
                    ? <Spinner className="mr-2" />
                    : <KeyIcon className="mr-2 size-4" />}
                  {t("web:pages.users.detail.resetPassword.button")}
                </Button>

                {canImpersonate && !isSelf && (
                  <Button
                    variant="outline"
                    onClick={handleImpersonate}
                    disabled={impersonateMutation.isPending}
                  >
                    {impersonateMutation.isPending
                      ? <Spinner className="mr-2" />
                      : <UserIcon className="mr-2 size-4" />}
                    {t("web:pages.users.detail.impersonate.button")}
                  </Button>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("web:pages.users.detail.resetPassword.successTitle")}</DialogTitle>
            <DialogDescription>
              {t("web:pages.users.detail.resetPassword.successDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={generatedPassword || ""}
              className="font-mono"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyPassword}
            >
              {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setPasswordDialogOpen(false)}>
              {t("common:form.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

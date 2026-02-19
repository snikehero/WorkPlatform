import { useMemo, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n/i18n";
import { useAuthStore } from "@/stores/auth-store";
import { moduleAccessStore } from "@/stores/module-access-store";
import { getDefaultLandingPath } from "@/lib/module-access";

export const ActivateAccountPage = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!token) {
      setError(t("activate.missingToken"));
      return;
    }
    if (password.length < 8) {
      setError(t("activate.passwordTooShort"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("activate.passwordMismatch"));
      return;
    }
    setBusy(true);
    try {
      await useAuthStore.activate(token, password);
      const auth = useAuthStore.getState();
      navigate(getDefaultLandingPath(auth.role, moduleAccessStore.getState().modules));
    } catch (err) {
      const message = err instanceof Error ? err.message : t("activate.failed");
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("activate.title")}</CardTitle>
          <CardDescription>{t("activate.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="activate-password">{t("activate.newPassword")}</Label>
              <Input
                id="activate-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="activate-confirm-password">{t("activate.confirmPassword")}</Label>
              <Input
                id="activate-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </div>
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            <Button className="w-full" type="submit" disabled={busy}>
              {busy ? t("activate.submitting") : t("activate.submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

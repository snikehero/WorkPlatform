import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/auth-store";
import { useI18n } from "@/i18n/i18n";
import { moduleAccessStore } from "@/stores/module-access-store";
import { getDefaultLandingPath } from "@/lib/module-access";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [email, setEmail] = useState("admin@workplatform.local");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    try {
      await useAuthStore.login(email.trim(), password.trim());
      const auth = useAuthStore.getState();
      const destination = getDefaultLandingPath(auth.role, moduleAccessStore.getState().modules);
      navigate(destination);
    } catch (err) {
      const message = err instanceof Error ? err.message : t("login.invalidCredentials");
      setError(message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("login.title")}</CardTitle>
          <CardDescription>{t("login.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">{t("login.emailOrUsername")}</Label>
              <Input
                id="email"
                type="text"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("login.password")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            <Button className="w-full" type="submit">
              {t("login.submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

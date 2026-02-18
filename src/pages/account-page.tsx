import { useState, type FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { useAuthStore } from "@/stores/auth-store";
import { useI18n } from "@/i18n/i18n";

export const AccountPage = () => {
  const authState = useAuthStore.getState();
  const { locale, setLocale, t } = useI18n();
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [language, setLanguage] = useState<"en" | "es">(authState.preferredLanguage);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    try {
      await useAuthStore.changePassword(currentPassword.trim(), newPassword.trim());
      setCurrentPassword("");
      setNewPassword("");
      const successMessage = t("account.passwordSaved");
      setMessage(successMessage);
      showToast(successMessage, "success");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t("account.passwordFailed");
      setMessage(errorMessage);
      showToast(errorMessage, "error");
    }
  };

  const handleSaveLanguage = async () => {
    setMessage(null);
    try {
      await useAuthStore.updateLanguage(language);
      setLocale(language);
      const successMessage = t("account.languageSaved");
      setMessage(successMessage);
      showToast(successMessage, "success");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t("account.languageFailed");
      setMessage(errorMessage);
      showToast(errorMessage, "error");
    }
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("account.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("account.subtitle")}</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{t("account.changePassword")}</CardTitle>
          <CardDescription>{t("account.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="current-password">{t("account.currentPassword")}</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">{t("account.newPassword")}</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
            </div>
            <Button type="submit">{t("account.savePassword")}</Button>
          </form>
          {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("account.language")}</CardTitle>
          <CardDescription>{t("account.languageDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Select value={language} onChange={(event) => setLanguage(event.target.value as "en" | "es") }>
              <option value="en">{t("account.language.english")}</option>
              <option value="es">{t("account.language.spanish")}</option>
            </Select>
            <Button onClick={handleSaveLanguage}>{t("account.saveLanguage")}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

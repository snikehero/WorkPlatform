import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { knowledgeStore } from "@/stores/knowledge-store";
import type { KnowledgeArticle } from "@/types/knowledge-article";
import { useI18n } from "@/i18n/i18n";

export const KnowledgeBasePage = () => {
  const { t } = useI18n();
  const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const loadArticles = async () => {
    const data = await knowledgeStore.all();
    setArticles(data);
  };

  useEffect(() => {
    loadArticles().catch(() => setArticles([]));
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return articles;
    return articles.filter(
      (article) =>
        article.title.toLowerCase().includes(term) ||
        article.summary.toLowerCase().includes(term) ||
        article.content.toLowerCase().includes(term) ||
        article.tags.some((tag) => tag.toLowerCase().includes(term))
    );
  }, [articles, search]);

  const resetForm = () => {
    setActiveId(null);
    setTitle("");
    setSummary("");
    setContent("");
    setTagsText("");
  };

  const handleEdit = (article: KnowledgeArticle) => {
    setActiveId(article.id);
    setTitle(article.title);
    setSummary(article.summary);
    setContent(article.content);
    setTagsText(article.tags.join(", "));
    setMessage(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    if (!title.trim()) {
      setMessage(t("knowledge.titleRequired"));
      return;
    }

    const tags = tagsText
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const payload = { title: title.trim(), summary: summary.trim(), content: content.trim(), tags };
    try {
      if (activeId) {
        await knowledgeStore.update(activeId, payload);
        setMessage(t("knowledge.updated"));
      } else {
        await knowledgeStore.add(payload);
        setMessage(t("knowledge.created"));
      }
      resetForm();
      await loadArticles();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("knowledge.saveFailed"));
    }
  };

  const handleDelete = async (articleId: string) => {
    await knowledgeStore.remove(articleId);
    if (activeId === articleId) {
      resetForm();
    }
    await loadArticles();
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("knowledge.pageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("knowledge.pageSubtitle")}</p>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{activeId ? t("knowledge.editTitle") : t("knowledge.createTitle")}</CardTitle>
            <CardDescription>{t("knowledge.formSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="kb-title">{t("common.title")}</Label>
                <Input
                  id="kb-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder={t("knowledge.titlePlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kb-summary">{t("knowledge.summary")}</Label>
                <Textarea
                  id="kb-summary"
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  placeholder={t("knowledge.summaryPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kb-content">{t("knowledge.content")}</Label>
                <Textarea
                  id="kb-content"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder={t("knowledge.contentPlaceholder")}
                  className="min-h-[180px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kb-tags">{t("knowledge.tags")}</Label>
                <Input
                  id="kb-tags"
                  value={tagsText}
                  onChange={(event) => setTagsText(event.target.value)}
                  placeholder={t("knowledge.tagsPlaceholder")}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit">{activeId ? t("common.save") : t("knowledge.create")}</Button>
                {activeId ? (
                  <Button type="button" variant="secondary" onClick={resetForm}>
                    {t("knowledge.cancelEdit")}
                  </Button>
                ) : null}
              </div>
            </form>
            {message ? <p className="mt-3 text-sm text-muted-foreground">{message}</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("knowledge.libraryTitle")}</CardTitle>
            <CardDescription>{t("knowledge.librarySubtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-3">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("knowledge.searchPlaceholder")}
              />
            </div>
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("knowledge.empty")}</p>
            ) : (
              <ul className="space-y-3">
                {filtered.map((article) => (
                  <li key={article.id} className="rounded-md border border-border bg-card p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{article.title}</p>
                        {article.summary ? <p className="text-xs text-muted-foreground">{article.summary}</p> : null}
                        {article.tags.length ? (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {article.tags.map((tag) => (
                              <Badge key={`${article.id}-${tag}`} variant="neutral">{tag}</Badge>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={() => handleEdit(article)}>
                          {t("knowledge.edit")}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(article.id)}>
                          {t("common.delete")}
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

import { apiRequest } from "@/lib/api";
import type { KnowledgeArticle } from "@/types/knowledge-article";

type KnowledgeArticlePayload = {
  title: string;
  summary: string;
  content: string;
  tags: string[];
};

export const knowledgeStore = {
  all: () => apiRequest<KnowledgeArticle[]>("/api/knowledge-base"),
  add: (payload: KnowledgeArticlePayload) =>
    apiRequest<KnowledgeArticle>("/api/knowledge-base", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (articleId: string, payload: KnowledgeArticlePayload) =>
    apiRequest<KnowledgeArticle>(`/api/knowledge-base/${articleId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  remove: (articleId: string) =>
    apiRequest<{ ok: boolean }>(`/api/knowledge-base/${articleId}`, {
      method: "DELETE",
    }),
};

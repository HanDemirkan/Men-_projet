"use client";

import { EmptyState, SearchInput } from "@qr-platform/ui";
import { Layers, ListTree, Search, Tag, Ticket } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { ComponentType } from "react";

import { ROUTES } from "@/config/routes";
import { search } from "@/services/search.service";
import type { SearchResult, SearchResultType } from "@/services/search.service";

const TYPE_LABELS: Record<SearchResultType, string> = {
  product: "Ürün",
  category: "Kategori",
  variant: "Variant",
  option: "Seçenek",
};

const TYPE_ICONS: Record<SearchResultType, ComponentType<{ className?: string }>> = {
  product: Tag,
  category: ListTree,
  variant: Layers,
  option: Ticket,
};

// Real backend query (see apps/api's SearchModule) debounced by 300ms - a
// genuine "anlık arama" against Postgres, not a static/mocked list.
export function SearchPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(() => {
      void search(query).then((result) => {
        setIsSearching(false);
        setHasSearched(true);
        if (result.status === "success") {
          setResults(result.data);
        }
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="flex flex-col gap-4">
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Ürün, kategori, variant veya seçenek ara..."
        autoFocus
      />

      {!hasSearched && !isSearching ? (
        <EmptyState icon={Search} title="Aramaya başlayın" description="Ürün, kategori, variant veya seçenek adı yazın." />
      ) : null}

      {hasSearched && !isSearching && results.length === 0 ? (
        <EmptyState icon={Search} title="Sonuç bulunamadı" description={`"${query}" ile eşleşen bir şey yok.`} />
      ) : null}

      {results.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {results.map((result) => {
            const Icon = TYPE_ICONS[result.type];
            return (
              <li key={`${result.type}-${result.id}`}>
                <Link
                  href={`${ROUTES.businessProducts}?categoryId=${result.categoryId}`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 transition-colors hover:border-primary"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <div className="flex flex-1 flex-col">
                    <span className="font-medium text-foreground">{result.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {TYPE_LABELS[result.type]} · {result.breadcrumb}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

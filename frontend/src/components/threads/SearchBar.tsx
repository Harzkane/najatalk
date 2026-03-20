// components/threads/SearchBar.tsx
import { useState, useEffect, useCallback, useRef } from "react";
// import { useRouter } from "next/navigation";

interface SearchBarProps {
  onSearch: (
    query: string,
    options?: {
      origin?: "submit" | "suggestion";
      suggestionKind?: "category" | "tag" | "trending" | "recent";
    },
  ) => void;
  recentSearches?: string[];
  trendingTopics?: string[];
  suggestedCategories?: string[];
  suggestedTags?: Array<{ label: string; query: string }>;
  selectedCategoryLabel?: string | null;
  helperText?: string;
}

const SearchBar = ({
  onSearch,
  recentSearches = [],
  trendingTopics = [],
  suggestedCategories = [],
  suggestedTags = [],
  selectedCategoryLabel = null,
  helperText = "Smart search understands Nigerian topics, slang, and category focus.",
}: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current?.contains(event.target as Node)) {
        return;
      }
      setShowSuggestions(false);
      setIsFocused(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const handleSearch = useCallback(() => {
    if (query.trim()) {
      onSearch(query, { origin: "submit" });
      setShowSuggestions(false);
    }
  }, [query, onSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleSuggestionClick = (
    suggestion: string,
    suggestionKind: "category" | "tag" | "trending" | "recent",
  ) => {
    setQuery(suggestion);
    onSearch(suggestion, { origin: "suggestion", suggestionKind });
    setShowSuggestions(false);
  };

  const handleFocus = (e: React.FocusEvent) => {
    e.stopPropagation();
    setIsFocused(true);
    setShowSuggestions(true);
  };

  return (
    <div ref={containerRef} className="relative z-30 mb-6 w-full md:mx-auto md:w-3/4">
      <div className="relative">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-white/80 bg-white/75 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 shadow-sm backdrop-blur-sm">
            Search Brain
          </span>
          {selectedCategoryLabel && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 shadow-sm">
              Focused on {selectedCategoryLabel}
            </span>
          )}
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search Abuja rent, NYSC, jobs, japa, football, local life..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            className={`w-full rounded-xl border border-white/80 bg-white/92 p-3 pl-10 pr-28 text-gray-800 shadow-sm transition-shadow focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-600 focus:shadow-[0_0_0_4px_rgba(34,197,94,0.12)] ${
              isFocused ? "rounded-b-none" : ""
            }`}
          />
          <span
            className="absolute left-3 top-3 text-gray-400 material-icons-outlined"
            style={{ fontSize: "20px" }}
          >
            search
          </span>
          <button
            onClick={handleSearch}
            className="absolute right-2 top-2 rounded-lg bg-green-600 p-1 text-white shadow-sm hover:bg-green-700"
            style={{ fontSize: "14px", padding: "6px 10px" }}
          >
            Search am!
          </button>
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-500">{helperText}</p>

      {showSuggestions && (isFocused || query) && (
        <div
          className="absolute z-50 w-full rounded-b-lg border border-t-0 border-gray-300 bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {selectedCategoryLabel && (
            <div className="border-b border-gray-100 p-2">
              <p className="mb-1 text-xs font-medium text-slate-700">Current Search Scope</p>
              <div className="flex flex-wrap gap-1">
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                  {selectedCategoryLabel}
                </span>
              </div>
            </div>
          )}
          {suggestedCategories.length > 0 && (
            <div className="border-b border-gray-100 p-2">
              <p className="mb-1 text-xs font-medium text-slate-700">Browse Categories</p>
              <div className="flex flex-wrap gap-1">
                {suggestedCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleSuggestionClick(category, "category")}
                    className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}
          {suggestedTags.length > 0 && (
            <div className="border-b border-gray-100 p-2">
              <p className="mb-1 text-xs font-medium text-slate-700">Suggested Tags</p>
              <div className="flex flex-wrap gap-1">
                {suggestedTags.map((tag) => (
                  <button
                    key={tag.label}
                    onClick={() => handleSuggestionClick(tag.query, "tag")}
                    className="rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-xs text-sky-700 hover:bg-sky-100"
                  >
                    #{tag.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {trendingTopics.length > 0 && (
            <div className="p-2 border-b border-gray-100">
              <p className="mb-1 text-xs font-medium text-slate-700">Hot In Nigeria</p>
              <div className="flex flex-wrap gap-1">
                {trendingTopics.map((topic, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(topic, "trending")}
                    className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-800 hover:bg-slate-200"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          )}

          {recentSearches.length > 0 && (
            <div className="p-2">
              <p className="mb-1 text-xs font-medium text-slate-700">Recent Searches</p>
              {recentSearches.map((search, index) => (
                <div
                  key={index}
                  onClick={() => handleSuggestionClick(search, "recent")}
                  className="flex cursor-pointer items-center px-2 py-1 text-sm text-slate-800 hover:bg-gray-100"
                >
                  <span
                    className="material-icons-outlined mr-2 text-slate-500"
                    style={{ fontSize: "14px" }}
                  >
                    history
                  </span>
                  {search}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;

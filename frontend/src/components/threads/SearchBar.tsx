// components/threads/SearchBar.tsx
import { useState, useEffect, useCallback } from "react";
// import { useRouter } from "next/navigation";

interface SearchBarProps {
  onSearch: (query: string) => void;
  recentSearches?: string[];
  trendingTopics?: string[];
}

const SearchBar = ({
  onSearch,
  recentSearches = [],
  trendingTopics = [],
}: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  //   const router = useRouter();

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSuggestions(false);
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleSearch = useCallback(() => {
    if (query.trim()) {
      onSearch(query);
      setShowSuggestions(false);
    }
  }, [query, onSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
  };

  const handleFocus = (e: React.FocusEvent) => {
    e.stopPropagation();
    setIsFocused(true);
    setShowSuggestions(true);
  };

  return (
    <div className="relative max-w-2xl mx-auto mb-6">
      <div className="relative">
        <input
          type="text"
          placeholder="Search gist (e.g., best suya joint)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          className={`w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-800 ${
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
          className="absolute right-3 top-2 bg-green-600 text-white p-1 rounded-lg hover:bg-green-700"
          style={{ fontSize: "14px", padding: "6px 10px" }}
        >
          Search am!
        </button>
      </div>

      {showSuggestions && (isFocused || query) && (
        <div
          className="absolute z-10 w-full bg-white border border-t-0 border-gray-300 rounded-b-lg shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {trendingTopics.length > 0 && (
            <div className="p-2 border-b border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Hot Topics</p>
              <div className="flex flex-wrap gap-1">
                {trendingTopics.map((topic, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(topic)}
                    className="bg-gray-100 text-xs px-2 py-1 rounded-full hover:bg-gray-200"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          )}

          {recentSearches.length > 0 && (
            <div className="p-2">
              <p className="text-xs text-gray-500 mb-1">Recent Searches</p>
              {recentSearches.map((search, index) => (
                <div
                  key={index}
                  onClick={() => handleSuggestionClick(search)}
                  className="px-2 py-1 hover:bg-gray-100 cursor-pointer text-sm flex items-center"
                >
                  <span
                    className="material-icons-outlined text-gray-400 mr-2"
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

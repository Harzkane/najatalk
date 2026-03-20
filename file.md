 <div className="relative mt-2 overflow-visible rounded-[1.35rem] border border-emerald-200/80 bg-[linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.96))] p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[1.35rem]">
            <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:26px_26px]" />
            <div className="absolute -left-6 top-8 h-28 w-28 rounded-full bg-emerald-300/30 blur-2xl" />
            <div className="absolute right-6 top-10 h-20 w-20 rounded-full bg-sky-300/30 blur-2xl" />
            <div className="absolute bottom-8 left-10 h-16 w-36 rounded-full border border-emerald-300/60 bg-white/55" />
            <div className="absolute bottom-16 right-10 h-16 w-32 rounded-full border border-sky-300/60 bg-white/55" />
            <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-300/60 bg-white/60 shadow-sm" />
            <div className="absolute left-[28%] top-[42%] h-3 w-3 rounded-full bg-emerald-500/80" />
            <div className="absolute left-[48%] top-[34%] h-3 w-3 rounded-full bg-sky-500/80" />
            <div className="absolute left-[62%] top-[48%] h-3 w-3 rounded-full bg-amber-500/80" />
            <div className="absolute left-[40%] top-[58%] h-3 w-3 rounded-full bg-teal-500/80" />
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 900 520"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M220 252C304 186 396 186 482 252C560 310 642 314 716 258"
                stroke="rgba(15,118,110,0.38)"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M198 336C288 274 390 274 486 338C548 380 618 388 688 356"
                stroke="rgba(37,99,235,0.28)"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="relative mb-4 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_320px] lg:items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-800">
                Discovery Engine
              </p>
              <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
                Search the gist, catch the signal, and move straight into the conversation.
              </h3>
              <p className="mt-2 max-w-2xl text-sm text-slate-600">
                Built for Nigerian browsing habits, the Search Brain connects trending talk,
                practical advice, local questions, and category signals in one place.
              </p>
            </div>
            <div
              aria-hidden="true"
              className="min-h-[220px] overflow-hidden rounded-2xl border border-white/80 bg-white/35 shadow-sm backdrop-blur-[2px]"
            >
              <div className="flex h-full min-h-[220px] items-end p-5">
                <div className="rounded-2xl border border-white/80 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-800">
                    Search Signals
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    Categories, live queries, and local intent all meet here.
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Designed to feel like discovery is happening before you even type.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
          <SearchBar
            onSearch={handleSearch}
            recentSearches={recentSearches}
            trendingTopics={effectiveTrendingTopics}
            suggestedCategories={featuredCategories.map((category) => category.label)}
            suggestedTags={SEARCH_TAG_DEFINITIONS}
            selectedCategoryLabel={selectedCategory}
            helperText={
              selectedCategory
                ? `Search is currently focused on ${selectedCategory}. Reset the category to search everything.`
                : "Search understands topics like Abuja rent, jobs, japa, football, gist, campus life, and local Nigerian conversations."
            }
          />
          <div className="mt-2 border-t border-slate-100 pt-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Explore categories
              </span>
              {featuredCategories.map((category) => {
                const isActive = selectedCategory === category.label;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleCategoryFilter(category.label)}
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                      isActive
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-300 hover:bg-emerald-100"
                    }`}
                  >
                    {category.label}
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-white text-emerald-700"
                      }`}
                    >
                      {categoryCounts[category.label] || 0}
                    </span>
                  </button>
                );
              })}
              {selectedCategory && (
                <button
                  type="button"
                  onClick={() => handleCategoryFilter(null)}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Reset
                </button>
              )}
            </div>
            {selectedCategoryMeta && (
              <p className="mt-2 text-sm text-slate-600">
                <span className="font-semibold text-slate-900">
                  {selectedCategoryMeta.label}
                </span>{" "}
                : {selectedCategoryMeta.description}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Try tags
              </span>
              {SEARCH_TAG_DEFINITIONS.slice(0, 6).map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleSearch(tag.query)}
                  className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100"
                >
                  #{tag.label}
                </button>
              ))}
            </div>
          </div>
          </div>
        </div>
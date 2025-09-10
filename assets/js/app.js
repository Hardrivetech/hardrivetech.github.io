/*
  GitHub Dashboard (client)
  - Loads pre-fetched cached data from /data/data.json (populated via GitHub Actions)
  - Provides client-side search/sort and lightweight Pages checks
*/

const state = {
  data: null,
  filtered: [],
  sort: "updated",
  search: "",
};

const els = {
  grid: document.getElementById("repo-grid"),
  empty: document.getElementById("empty-state"),
  totalRepos: document.getElementById("total-repos"),
  totalStars: document.getElementById("total-stars"),
  openIssues: document.getElementById("open-issues"),
  openPRs: document.getElementById("open-prs"),
  pagesUp: document.getElementById("pages-up"),
  lastUpdated: document.getElementById("last-updated"),
  search: document.getElementById("search"),
  sort: document.getElementById("sort"),
};

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString();
}

function computeSummary(repos) {
  const totals = repos.reduce(
    (acc, r) => {
      acc.stars += r.stargazers_count || 0;
      acc.issues += r.open_issues_count || 0;
      acc.prs += r.prs_open || 0;
      acc.pagesUp += r.pages_status === "up" ? 1 : 0;
      return acc;
    },
    { stars: 0, issues: 0, prs: 0, pagesUp: 0 }
  );

  els.totalRepos.textContent = repos.length;
  els.totalStars.textContent = totals.stars;
  els.openIssues.textContent = totals.issues;
  els.openPRs.textContent = totals.prs;
  els.pagesUp.textContent = totals.pagesUp;
}

function render(repos) {
  computeSummary(repos);

  if (!repos.length) {
    els.grid.innerHTML = "";
    els.empty.classList.remove("hidden");
    return;
  }
  els.empty.classList.add("hidden");

  const html = repos
    .map((repo) => {
      const name = repo.full_name || repo.name;
      const url = repo.html_url;
      const desc = repo.description || "";
      const stars = repo.stargazers_count || 0;
      const forks = repo.forks_count || 0;
      const issues = repo.open_issues_count || 0;
      const prs = repo.prs_open || 0;
      const lastCommit =
        repo.last_commit?.date || repo.pushed_at || repo.updated_at;
      const release = repo.latest_release || repo.default_branch;
      const pagesStatus = repo.pages_status || "unknown";

      const pagesLabel =
        pagesStatus === "up" ? "ok" : pagesStatus === "down" ? "bad" : "warn";

      return `
      <article class="card">
        <div class="title">
          <a href="${url}" target="_blank" rel="noopener">${name}</a>
        </div>
        <div class="meta">${desc}</div>
        <div class="stats">
          <span class="badge">★ ${stars}</span>
          <span class="badge">⑂ ${forks}</span>
          <span class="badge">Issues: ${issues}</span>
          <span class="badge">PRs: ${prs}</span>
          <span class="badge">Release: ${release || "—"}</span>
        </div>
        <div class="status">
          <div>Last activity: ${fmtDate(lastCommit)}</div>
          <div>Pages: <span class="${pagesLabel}">${pagesStatus}</span></div>
        </div>
      </article>
    `;
    })
    .join("");

  els.grid.innerHTML = html;
}

function sortRepos(repos, sort) {
  const copy = [...repos];
  if (sort === "stars")
    copy.sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0));
  else if (sort === "name")
    copy.sort((a, b) =>
      (a.full_name || a.name).localeCompare(b.full_name || b.name)
    );
  else
    copy.sort(
      (a, b) =>
        new Date(b.pushed_at || b.updated_at || 0) -
        new Date(a.pushed_at || a.updated_at || 0)
    );
  return copy;
}

function applyFilters() {
  const q = state.search.trim().toLowerCase();
  const repos = state.data?.repos || [];
  const filtered = !q
    ? repos
    : repos.filter((r) =>
        (r.full_name || r.name || "").toLowerCase().includes(q)
      );
  state.filtered = sortRepos(filtered, state.sort);
  render(state.filtered);
}

async function loadData() {
  try {
    const res = await fetch("./data/data.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load data.json");
    const data = await res.json();
    state.data = data;
    els.lastUpdated.textContent = fmtDate(data.generated_at);
    applyFilters();
  } catch (e) {
    els.grid.innerHTML = "";
    els.empty.classList.remove("hidden");
    els.empty.textContent =
      "No cached data yet. Push the repo with Actions configured or run fetch script locally.";
  }
}

function initControls() {
  els.search.addEventListener("input", (e) => {
    state.search = e.target.value;
    applyFilters();
  });
  els.sort.addEventListener("change", (e) => {
    state.sort = e.target.value;
    applyFilters();
  });
}

// Optionally: lightweight client-side Pages check to confirm availability
async function verifyPagesAvailability() {
  const repos = state.data?.repos || [];
  const checks = repos.map(async (r) => {
    if (!r.pages_url) return "unknown";
    try {
      const res = await fetch(r.pages_url, { method: "HEAD", mode: "no-cors" });
      // mode no-cors won't expose status; treat as tentative success
      return "up";
    } catch {
      return "down";
    }
  });
  const statuses = await Promise.all(checks);
  // Merge results and re-render summary
  statuses.forEach((s, i) => {
    if (s !== "unknown") state.data.repos[i].pages_status = s;
  });
  applyFilters();
}

initControls();
loadData().then(() => verifyPagesAvailability());

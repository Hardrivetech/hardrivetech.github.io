#!/usr/bin/env node
/**
 * GitHub Data Fetcher
 * - Fetches repos for a username
 * - For each repo, gathers: stars, forks, open issues, recent commits, open PR count, latest release/tag, GitHub Pages status
 * - Writes a compact cache file at ./data/data.json for the dashboard
 *
 * Usage:
 *   GITHUB_TOKEN=ghp_xxx node scripts/fetch_github_data.js <username>
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

const TOKEN = process.env.GITHUB_TOKEN || "";
const USERNAME = process.argv[2] || process.env.GH_USERNAME || "";
if (!USERNAME) {
  console.error("Missing username. Provide as arg or GH_USERNAME env.");
  process.exit(1);
}

function gh(pathname) {
  const opts = {
    hostname: "api.github.com",
    path: pathname,
    method: "GET",
    headers: {
      "User-Agent": "gh-dashboard",
      Accept: "application/vnd.github+json",
    },
  };
  if (TOKEN) opts.headers["Authorization"] = `Bearer ${TOKEN}`;

  return new Promise((resolve, reject) => {
    const req = https.request(opts, (res) => {
      let data = "";
      res.on("data", (d) => (data += d));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve({});
          }
        } else {
          // Allow 404s for endpoints (e.g., releases) without hard fail
          if (res.statusCode === 404) return resolve(null);
          reject(new Error(`GitHub API ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

async function paged(path) {
  // Minimal paging (up to 200 items)
  const p1 = await gh(`${path}?per_page=100&page=1`);
  const p2 = await gh(`${path}?per_page=100&page=2`);
  return [...(Array.isArray(p1) ? p1 : []), ...(Array.isArray(p2) ? p2 : [])];
}

async function fetchPRCount(owner, repo) {
  const prs = await gh(`/repos/${owner}/${repo}/pulls?state=open&per_page=1`);
  if (!Array.isArray(prs)) return 0;
  // GitHub sends pagination in Link header, but we did per_page=1; fallback count in later enhancement
  // For now, query list and count small sets using paged if necessary.
  const allPRs = await paged(`/repos/${owner}/${repo}/pulls`);
  return allPRs.length;
}

async function fetchLastCommit(owner, repo, branch) {
  const commits = await gh(
    `/repos/${owner}/${repo}/commits?sha=${encodeURIComponent(
      branch
    )}&per_page=1`
  );
  if (!Array.isArray(commits) || !commits[0]) return null;
  const c = commits[0];
  return {
    sha: c.sha,
    author: c.commit?.author?.name,
    date: c.commit?.author?.date,
    message: c.commit?.message,
    url: c.html_url,
  };
}

async function fetchLatestRelease(owner, repo) {
  const rel = await gh(`/repos/${owner}/${repo}/releases/latest`);
  if (!rel || rel.message === "Not Found") return null;
  return rel.tag_name || rel.name || null;
}

async function fetchPagesStatus(owner, repo) {
  const pages = await gh(`/repos/${owner}/${repo}/pages`);
  if (!pages) return "unknown";
  // If repo has Pages configured, construct URL
  if (pages && pages.source) {
    const url = `https://${owner}.github.io/${repo}/`;
    return { status: "configured", url };
  }
  return "unknown";
}

async function main() {
  const isOrg = await gh(`/orgs/${USERNAME}`);
  const isUser = !isOrg ? await gh(`/users/${USERNAME}`) : null;
  let repos = [];
  if (isOrg && !isOrg.message) {
    repos = await paged(`/orgs/${USERNAME}/repos`);
  } else if (isUser && !isUser.message) {
    repos = await paged(`/users/${USERNAME}/repos`);
  } else {
    console.error("Could not resolve user/org.");
    process.exit(1);
  }
  // Filter out forks/archived by default (customize as needed)
  repos = repos.filter((r) => !r.archived);

  const enriched = [];
  for (const r of repos) {
    const [owner, repo] = r.full_name.split("/");
    const branch = r.default_branch || "main";

    const [prsCount, lastCommit, latestRelease, pagesInfo] = await Promise.all([
      fetchPRCount(owner, repo).catch(() => 0),
      fetchLastCommit(owner, repo, branch).catch(() => null),
      fetchLatestRelease(owner, repo).catch(() => null),
      fetchPagesStatus(owner, repo).catch(() => "unknown"),
    ]);

    enriched.push({
      id: r.id,
      name: r.name,
      full_name: r.full_name,
      description: r.description,
      html_url: r.html_url,
      stargazers_count: r.stargazers_count,
      forks_count: r.forks_count,
      open_issues_count: r.open_issues_count,
      default_branch: r.default_branch,
      pushed_at: r.pushed_at,
      updated_at: r.updated_at,
      prs_open: prsCount,
      last_commit: lastCommit,
      latest_release: latestRelease,
      pages_status: typeof pagesInfo === "string" ? pagesInfo : "up",
      pages_url: typeof pagesInfo === "object" ? pagesInfo.url : null,
    });
  }

  const payload = {
    username: USERNAME,
    generated_at: new Date().toISOString(),
    repos: enriched,
  };

  const outPath = path.join(__dirname, "..", "data", "data.json");
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
  console.log(`Wrote ${enriched.length} repos to ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

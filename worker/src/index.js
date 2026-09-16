const FOLDERS = ["Books", "Papers", "Articles"];
const MIME = {
  epub: "application/epub+zip",
  pdf: "application/pdf",
  txt: "text/plain",
  html: "text/html",
};

function unauthorized() {
  return new Response("auth required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="x4-inbox"',
      "Cache-Control": "no-store",
    },
  });
}

function checkBasic(req, env) {
  const wantUser = env.OPDS_USER || "x4";
  const wantPass = env.OPDS_PASS;
  if (!wantPass) return new Response("set OPDS_PASS secret", { status: 500 });
  const hdr = req.headers.get("Authorization") || "";
  if (!hdr.startsWith("Basic ")) return unauthorized();
  let decoded = "";
  try {
    decoded = atob(hdr.slice(6));
  } catch {
    return unauthorized();
  }
  const i = decoded.indexOf(":");
  const user = decoded.slice(0, i);
  const pass = decoded.slice(i + 1);
  if (user !== wantUser || pass !== wantPass) return unauthorized();
  return null;
}

async function gh(env, path) {
  const url = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${path}?ref=${env.GITHUB_BRANCH}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "x4-inbox-worker",
    },
  });
  if (!res.ok) throw new Error(`github ${res.status} ${path}`);
  return res.json();
}

function escapeXml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c]));
}

export default {
  async fetch(req, env) {
    const blocked = checkBasic(req, env);
    if (blocked) return blocked;

    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/+/g, "");

    if (path === "" || path === "opds.xml") {
      const now = new Date().toISOString();
      const entries = [];
      for (const folder of FOLDERS) {
        let listing;
        try {
          listing = await gh(env, folder);
        } catch {
          continue;
        }
        if (!Array.isArray(listing)) continue;
        for (const item of listing) {
          if (item.type !== "file") continue;
          const ext = (item.name.split(".").pop() || "").toLowerCase();
          if (!MIME[ext]) continue;
          const title = item.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " ");
          entries.push(`  <entry>
    <title>${escapeXml(title)}</title>
    <id>${escapeXml(item.sha)}</id>
    <updated>${now}</updated>
    <content type="text">${escapeXml(folder)}</content>
    <link rel="http://opds-spec.org/acquisition" href="${escapeXml(url.origin + "/file/" + folder + "/" + item.name)}" type="${MIME[ext]}"/>
  </entry>`);
        }
      }
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xmlns:opds="http://opds-spec.org/2010/catalog">
  <id>${url.origin}/opds.xml</id>
  <title>x4-inbox</title>
  <updated>${now}</updated>
  <link rel="self" type="application/atom+xml;profile=opds-catalog;kind=acquisition" href="${url.origin}/opds.xml"/>
${entries.join("\n")}
</feed>
`;
      return new Response(xml, {
        headers: { "Content-Type": "application/atom+xml; charset=utf-8" },
      });
    }

    if (path.startsWith("file/")) {
      const rel = path.slice(5);
      const data = await gh(env, rel);
      if (!data.download_url) return new Response("not found", { status: 404 });
      const file = await fetch(data.download_url, {
        headers: {
          Authorization: `Bearer ${env.GITHUB_TOKEN}`,
          "User-Agent": "x4-inbox-worker",
        },
      });
      const ext = (rel.split(".").pop() || "").toLowerCase();
      return new Response(file.body, {
        headers: {
          "Content-Type": MIME[ext] || "application/octet-stream",
          "Content-Disposition": `attachment; filename="${rel.split("/").pop()}"`,
        },
      });
    }

    return new Response("not found", { status: 404 });
  },
};

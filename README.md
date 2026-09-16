# x4-inbox

Park files on GitHub. Pull them on an Xteink X4 Pro running CrossPlay via **Get Books**.

This repo is a folder + an OPDS catalog. The reader never runs Git.

## On the X4 Pro

1. Wi-Fi on.
2. Open **Get Books**.
3. Add OPDS catalog:

```
https://raw.githubusercontent.com/robinpm/x4-inbox/main/opds.xml
```

4. Browse → download → read.

After you add files, wait for the **Rebuild OPDS** Action to finish (or run `python3 scripts/build_opds.py`) so `opds.xml` lists them.

## Drop files

| Folder | Use |
|---|---|
| `Books/` | novels, EPUBs |
| `Papers/` | papers you converted |
| `Articles/` | short reads, HTML/EPUB |

Prefer **EPUB**. PDFs are a poor fit on the 4.3" screen.

Only put files you have the right to store and share. A public repo is public.

## iPhone → this repo

Share Sheet shortcut outline:

1. Receive File / URL.
2. Save as `Books/Name.epub` (or Papers/Articles).
3. GitHub API `PUT /repos/robinpm/x4-inbox/contents/<path>` with a PAT limited to this repo.
4. The Action rewrites `opds.xml`.

Working Copy works too: commit the file into the right folder and push.

## Local rebuild

```bash
python3 scripts/build_opds.py
```

## Make it private later

Get Books cannot read a private `raw.githubusercontent.com` URL without a token. Keep this public for a dumb pull, or host the feed elsewhere and only store files privately.

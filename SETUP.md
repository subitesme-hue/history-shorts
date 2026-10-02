# History Shorts — setup from zero

How it works:
**n8n** (picks innovator → Wikipedia facts → Brain writes script) → **GitHub Actions** (Kokoro voice → Remotion render → PostEverywhere post).

---

## Part A — Put the project on GitHub (15 min)

1. Create a free account at github.com (skip if you have one).
2. Click **+ → New repository**. Name: `history-shorts`. Choose **Public** (Actions minutes are free for public repos) or Private (check your plan's included minutes). Do **not** add a README. Click **Create repository**.
3. Unzip `history-shorts.zip` on your computer.
4. On the new repo page click **uploading an existing file**. Drag in everything inside the `history-shorts` folder **except** the `.github` folder (hidden folders are often skipped by drag-and-drop). Click **Commit changes**.
5. Create the workflow file by hand: **Add file → Create new file**. In the name box type exactly `.github/workflows/render.yml`. Open `render.yml` from the zip in a text editor, copy all of it, paste it in. Click **Commit changes**.
6. Check: the repo now shows `src`, `scripts`, `public`, `n8n`, `package.json`, `package-lock.json`, `props.json`, `requirements-voice.txt` and a `.github` folder.

## Part B — First test render (no posting, no keys needed)

7. Open the **Actions** tab. If asked, click **I understand my workflows, go ahead and enable them**.
8. Click **Render and post short** on the left → **Run workflow**. Leave `props` blank, `post` = `false`, `voice` = `am_michael`. Click the green **Run workflow**.
9. Wait for the green tick (first run ~6–10 min because it downloads Kokoro and Chrome; later runs are faster thanks to caching).
10. Click the finished run → scroll to **Artifacts** → download **short** → unzip → watch `video.mp4`. You should hear the Kokoro voice and see captions in sync.
11. If a step is red, open it, copy the error lines, and send them to me. Don't change anything blindly.

## Part C — Pick your voice

12. Run the workflow again with different `voice` values and compare: `am_michael`, `am_fenrir`, `am_puck` (best American male), `af_heart` (best overall, female), `bm_george` (British male).
13. When you've chosen, open `n8n/history-shorts-n8n.json` later (Part F) and the **Build Props** node, and change `voice: 'am_michael'` to your pick.

## Part D — Connect PostEverywhere

14. Repo → **Settings → Secrets and variables → Actions**.
15. **Secrets** tab → **New repository secret**: Name `PE_API_KEY`, value your `pe_live_...` key.
16. (Nothing else needed — the PostEverywhere address `https://app.posteverywhere.ai/api/v1` is built in.)
17. Test posting: run the workflow with `post` = `true` (sample Al-Jazari video). Check Facebook, Instagram and TikTok. If the post step fails, send me the red step's log.

## Part E — GitHub token for n8n

18. GitHub → your avatar → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
19. Name `n8n-history-shorts`, expiry 1 year, **Repository access: Only select repositories → history-shorts**.
20. **Permissions → Repository permissions → Actions: Read and write**. Generate and copy the token (shown once).

## Part F — Google Sheet + n8n

21. Create a Google Sheet `Innovators` with headers in row 1: `name | country | era | invention | wiki_title | status`.
22. Add rows. `wiki_title` is the end of the Wikipedia URL (e.g. `https://en.wikipedia.org/wiki/Ismail_al-Jazari` → `Ismail_al-Jazari`). Set `status` = `pending`. Suggestions: Ismail_al-Jazari, Ibn_al-Haytham, Bi_Sheng, Zhang_Heng, Jagadish_Chandra_Bose, Garrett_Morgan, Hedy_Lamarr, Grace_Hopper, Akira_Yoshino.
23. In n8n: **Workflows → Import from file** → `n8n/history-shorts-n8n.json`.
24. **Brain (OpenRouter)** node → header Authorization → replace `PASTE_YOUR_OPENROUTER_KEY` with your OpenRouter key (keep `Bearer ` in front).
25. **Render on GitHub** node → in the URL replace `PASTE_YOUR_GITHUB_USERNAME`; in the Authorization header replace `PASTE_YOUR_GITHUB_TOKEN` with the token from step 20.
26. Test without the Sheet first: click **Test run** → Execute workflow. It uses a built-in Al-Jazari test row. Expected: all nodes green, **Render on GitHub** returns an empty response (GitHub answers 204 = accepted). Then check the repo's **Actions** tab — a new run should be going.
27. Add the Sheet: delete the line between **Daily 9am** and **Pick Innovator**. Add a **Google Sheets → Get row(s) in sheet** node between them, pick your `Innovators` sheet.
28. After **Render on GitHub**, add **Google Sheets → Update row in sheet**: match on `row_number` = `{{ $('Pick Innovator').first().json.row_number }}`, set `status` = `sent`.
29. Set the **Daily 9am** schedule to the time you want, then **Activate** the workflow.

## Part G — Daily check (2 min)

30. GitHub **Actions** tab: green tick = rendered and posted. Red = open the red step and send me the log.
31. Each run keeps the MP4 for 7 days under Artifacts, in case you want to repost manually.

---

### What each piece costs
- Kokoro voice: free (Apache-2.0, commercial use allowed).
- Remotion: free while your company has 3 people or fewer.
- GitHub Actions: free on a public repo.
- OpenRouter Brain: a few cents per script.
- PostEverywhere: your existing plan.

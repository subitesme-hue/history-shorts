# YouTube compliance for T&I News Shorts

Every Short (Forgotten Innovators and Future Shift) now passes three extra steps on GitHub Actions before it posts.
If any of them fails, **nothing is posted**: the job turns red, GitHub emails you, and the video and the reports
stay in the run's Artifacts.

| Step | Script | What it does |
| --- | --- | --- |
| Variety | `scripts/vary.mjs` | Picks a Kokoro voice, music bed and end-card line that the last few Shorts of the series didn't use. |
| Compliance gate | `scripts/compliance.mjs` | Adds the AI-disclosure line to the YouTube description when the video has AI footage. Blocks the post on: a missing or too-long title, "made for kids" not false, AI footage without disclosure, a title or topic already posted, fewer than 2 differences (voice, music, end card, scene order, hook) from any of the last 3 Shorts, or a video under 8 s or over 180 s. |
| Independent review | `scripts/review.mjs` | A separate Claude call that didn't write the script looks at 8 frames plus the narration, title and description. It blocks on close-up faces of real historical people, misleading "real footage" framing, false claims, gore or shock content, garbled on-screen text, clickbait, or missing disclosure. |
| History | `scripts/record.mjs` | After a successful post, appends the Short to `compliance/history.json` so the next run can compare against it. |

## One-time settings (GitHub → Settings → Secrets and variables → Actions)

1. **Secret `ANTHROPIC_API_KEY`**: your Claude API key from console.anthropic.com. Until it's added, the review step is
   skipped with a warning and posting carries on.
2. Nothing else is needed for the AI label: the gate sends PostEverywhere's `platform_content.youtube.settings.containsSyntheticMedia`
   (true when the Short has AI footage), the field documented in `@posteverywhere/sdk` 1.6.1 and the MCP 1.14.0 changelog.
   It also moves title, description, tags, privacy and made-for-kids into `settings`, the only place PostEverywhere reads them.
3. Optional: `YT_CATEGORY_ID` (default `28` Science & Technology; `27` = Education), `REVIEW_MODEL` (default `claude-sonnet-5-5`), and `VARIETY=off` to stop the rotation. The gate still
   checks variety.

## Reading a blocked run

Actions → the red run → Artifacts → `compliance-report` holds `compliance.json` (gate) and `review.json` (reviewer).
The error lines are also shown in the run summary. To post anyway after fixing the cause, re-run the workflow.

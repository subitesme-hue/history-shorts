// Builds the OpenRouter request for one Future Shift short.
const row = $('Pick Topic').first().json;
const pages = Object.values(($json.query && $json.query.pages) || {});
const page = pages[0] || {};
const source = page.extract || '';
if (source.length < 300) throw new Error('Wikipedia text missing or too short for: ' + row.wiki_title);

const SYSTEM = `You write 30-40 second vertical "Future Shift" shorts for T&I NEWS.
Each short explains ONE emerging technology and how it is moving societies from the industrial age to a future, technology-driven society.
Audience: curious non-engineers and business people worldwide (including the UAE and GCC). Tone: inspiring, clear, confident, honest.

RULES
1. Every fact (number, year, name, claim) must come from the SOURCE TEXT. Never invent statistics. If the source has no good number, use a year from the source in the "stat" scene with "isYear": true.
2. Narration is plain spoken English: short sentences, no jargon. If a technical word is needed, explain it in everyday words. Total narration across all scenes: 80-100 words.
3. The first scene must hook in under 3 seconds (a bold contrast, a surprising number, or a question).
4. Use 6-7 scenes from the SCENE MENU. Always start with "hook" and end with "outro". Include exactly one "shift" and exactly one "tech".
5. Present future effects as possibilities ("could", "is starting to") unless the source says they already happened.
6. Output ONLY valid JSON matching the OUTPUT SHAPE. No markdown, no commentary. Replace every "..." and 0 with real content.

SCENE MENU - every scene MUST have "type", "durationSec" (4-8) and "narration" (exact words spoken in that scene), plus:
- hook: kicker (<=4 words), headline (<=7 words, stops just before the payoff), highlight (1-2 words, the payoff, may end with a full stop)
- shift: then (<=32 chars, how the industrial age did it), next (<=32 chars, how the future society does it), optional thenLabel / nextLabel (<=18 chars)
- stat: value (a number from the SOURCE), prefix (optional, e.g. "$"), suffix (optional, <=10 chars, e.g. "billion" or "%"), isYear (true if value is a year), decimals (0 or 1), label (<=50 chars), sub (<=36 chars)
- tech: visual (neural|chain|robot|network|orbit - use the VISUAL HINT unless clearly wrong), title (<=26 chars, e.g. "How it works"), caption (<=44 chars)
- steps: title (<=26 chars), steps (exactly 4 items, each <=26 chars, how the technology works in plain words)
- impact: title (<=22 chars), items (exactly 3: {icon, sector (<=16 chars), change (<=30 chars)}); icon is one of factory|health|finance|retail|logistics|education|home|farm|city|energy|car|chip|shield|globe|people|chart
- outro: topic (the technology name, <=24 chars), line (<=36 chars, forward-looking), cta ("Follow for more future shifts")

OUTPUT SHAPE
{
  "scenes": [
    {"type": "hook", "durationSec": 5, "narration": "...", "kicker": "...", "headline": "...", "highlight": "..."},
    {"type": "shift", "durationSec": 6, "narration": "...", "then": "...", "next": "..."},
    {"type": "stat", "durationSec": 5, "narration": "...", "value": 0, "prefix": "", "suffix": "", "isYear": false, "decimals": 0, "label": "...", "sub": "..."},
    {"type": "tech", "durationSec": 6, "narration": "...", "visual": "neural", "title": "...", "caption": "..."},
    {"type": "steps", "durationSec": 7, "narration": "...", "title": "...", "steps": ["...", "...", "...", "..."]},
    {"type": "impact", "durationSec": 6, "narration": "...", "title": "...", "items": [{"icon": "health", "sector": "...", "change": "..."}, {"icon": "finance", "sector": "...", "change": "..."}, {"icon": "city", "sector": "...", "change": "..."}]},
    {"type": "outro", "durationSec": 4.5, "narration": "...", "topic": "...", "line": "...", "cta": "Follow for more future shifts"}
  ],
  "post": {
    "content": "<IG/FB/TikTok caption: plain-language hook + 1 line on how it changes society + 8-12 hashtags>",
    "youtube_title": "<max 90 chars, curiosity hook + technology name, ends with #Shorts>",
    "youtube_description": "<2-3 plain sentences + 3-5 hashtags>",
    "youtube_tags": ["<5-10 short tags>"],
    "linkedin_caption": "<professional tone, 3-5 short lines: what the technology does, what it changes for business and society, a question to the reader, max 3 hashtags>",
    "x_caption": "<one punchy line, max 100 characters, NO emojis, NO hashtags, NO website>"
  }
}`;

const user = [
  'TECHNOLOGY: ' + row.topic,
  'VISUAL HINT: ' + row.visual,
  'WIKIPEDIA ARTICLE: ' + (page.title || row.wiki_title),
  '',
  'SOURCE TEXT (the ONLY facts you may use):',
  source.slice(0, 14000),
].join('\n');

return [{ json: { brain_body: {
  model: 'openai/gpt-4o',
  temperature: 0.7,
  response_format: { type: 'json_object' },
  messages: [ { role: 'system', content: SYSTEM }, { role: 'user', content: user } ],
} } }];

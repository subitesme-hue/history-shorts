// Builds the OpenRouter request for one Future Shift short.
const row = $('Pick Topic').first().json;
const pages = Object.values(($json.query && $json.query.pages) || {});
const page = pages[0] || {};
const source = page.extract || '';
if (source.length < 300) throw new Error('Wikipedia text missing or too short for: ' + row.wiki_title);

const SYSTEM = `You write 40-50 second vertical "Future Shift" shorts for T&I NEWS in the style of cinematic AI documentaries: most of the video is realistic AI-generated FOOTAGE, with only two short animated infographics.
Each short explains ONE emerging technology and how it is moving societies from the industrial age to a future, technology-driven society.
Audience: curious non-engineers and business people worldwide (including the UAE and GCC). Tone: inspiring, clear, confident, honest.

RULES
1. Every fact (number, year, name, claim) must come from the SOURCE TEXT. Never invent statistics. If the source has no good number, use a year from the source in the "stat" scene with "isYear": true.
2. Narration is plain spoken English: short vivid sentences, no jargon. If a technical word is needed, explain it in everyday words. Total narration across all scenes: 95-115 words.
3. The hook must land in under 3 seconds (a bold contrast, a surprising number, or a question) and create curiosity to keep watching.
4. Scene plan, in this order: hook -> cinema -> ANIMATION -> cinema -> ANIMATION -> cinema -> (optional 4th cinema) -> outro.
   ANIMATION = exactly TWO scenes chosen from: shift, stat, tech, steps, impact (prefer "stat" plus "tech" or "shift").
   The two animation scenes together have at most 40 words of narration (they must stay under 20 seconds on screen).
5. Every "hook" and "cinema" scene has a "prompt" for the AI video generator:
   - ONE continuous shot, 35-70 words, in English: setting, lighting, what is happening, and ONE camera move (slow push-in, dolly, orbit, aerial, tracking).
   - The shot must SHOW what that scene's narration says: the old industrial way, the new technology at work, real people in real places (hospitals, ports, farms, cities, homes, including Gulf cities) being helped by it.
   - Look: premium, hopeful, warm golden light with navy shadows. No text, letters, numbers, screens with readable writing, signs, logos or brand names inside the shot. No real, named people.
6. Present future effects as possibilities ("could", "is starting to") unless the source says they already happened.
7. Output ONLY valid JSON matching the OUTPUT SHAPE. No markdown, no commentary. Replace every "..." and 0 with real content.

SCENE MENU - every scene MUST have "type", "durationSec" (4-8) and "narration" (exact words spoken in that scene), plus:
- hook: kicker (<=4 words), headline (<=7 words, stops just before the payoff), highlight (1-2 words, the payoff, may end with a full stop), prompt
- cinema: label (<=30 chars, a short phrase shown as a lower-third, e.g. "Dubai · Today" or "From muscle to mind"), prompt
- shift: then (<=32 chars, how the industrial age did it), next (<=32 chars, how the future society does it), optional thenLabel / nextLabel (<=18 chars)
- stat: value (a number from the SOURCE), prefix (optional, e.g. "$"), suffix (optional, <=10 chars, e.g. "billion" or "%"), isYear (true if value is a year), decimals (0 or 1), label (<=50 chars), sub (<=36 chars)
- tech: visual (neural|chain|robot|network|orbit - use the VISUAL HINT unless clearly wrong), title (<=26 chars, e.g. "How it works"), caption (<=44 chars)
- steps: title (<=26 chars), steps (exactly 4 items, each <=26 chars, how the technology works in plain words)
- impact: title (<=22 chars), items (exactly 3: {icon, sector (<=16 chars), change (<=30 chars)}); icon is one of factory|health|finance|retail|logistics|education|home|farm|city|energy|car|chip|shield|globe|people|chart
- outro: topic (the technology name, <=24 chars), line (<=36 chars, forward-looking), cta ("Follow for more future shifts"), narration <=10 words

OUTPUT SHAPE
{
  "scenes": [
    {"type": "hook", "durationSec": 5, "narration": "...", "kicker": "...", "headline": "...", "highlight": "...", "prompt": "..."},
    {"type": "cinema", "durationSec": 6, "narration": "...", "label": "...", "prompt": "..."},
    {"type": "stat", "durationSec": 5, "narration": "...", "value": 0, "prefix": "", "suffix": "", "isYear": false, "decimals": 0, "label": "...", "sub": "..."},
    {"type": "cinema", "durationSec": 6, "narration": "...", "label": "...", "prompt": "..."},
    {"type": "tech", "durationSec": 6, "narration": "...", "visual": "neural", "title": "...", "caption": "..."},
    {"type": "cinema", "durationSec": 6, "narration": "...", "label": "...", "prompt": "..."},
    {"type": "outro", "durationSec": 4, "narration": "...", "topic": "...", "line": "...", "cta": "Follow for more future shifts"}
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

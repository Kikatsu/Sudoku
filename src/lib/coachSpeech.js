/**
 * Picks the most natural-sounding voice for the coach from the browser's list.
 * Prefers enhanced / premium / neural labels when the OS exposes them.
 */
export function pickBestCoachVoice(voices, speechLang, preferredURI = "auto") {
  if (!voices?.length || !speechLang) return null;

  const target = speechLang.toLowerCase().replace("_", "-");
  const [primary] = target.split("-");

  const candidates = voices.filter((v) => {
    const lang = v.lang.toLowerCase().replace("_", "-");
    return lang === target || lang.startsWith(`${primary}-`) || lang === primary;
  });

  if (!candidates.length) return null;
  const preferred = candidates.find((voice) => voice.voiceURI === preferredURI);
  if (preferred) return preferred;

  const scoreVoice = (v) => {
    const n = (v.name || "").toLowerCase();
    let s = 0;
    if (n.includes("enhanced")) s += 120;
    if (n.includes("premium")) s += 100;
    if (n.includes("neural")) s += 110;
    if (n.includes("natural")) s += 60;
    if (n.includes("google")) s += 55;
    if (n.includes("wavenet")) s += 90;
    if (n.includes("compact")) s -= 80;
    if (n.includes("robot")) s -= 50;
    if (v.default) s += 15;
    return s;
  };

  return [...candidates].sort((a, b) => scoreVoice(b) - scoreVoice(a))[0] ?? null;
}

export function getCoachVoiceOptions(voices, speechLang) {
  if (!voices?.length || !speechLang) return [];
  const target = speechLang.toLowerCase().replace("_", "-");
  const [primary] = target.split("-");
  const seen = new Set();

  return voices
    .filter((voice) => {
      const lang = voice.lang.toLowerCase().replace("_", "-");
      return lang === target || lang.startsWith(`${primary}-`) || lang === primary;
    })
    .filter((voice) => {
      if (seen.has(voice.voiceURI)) return false;
      seen.add(voice.voiceURI);
      return true;
    })
    .map((voice) => ({
      label: `${voice.name}${voice.localService ? "" : " · online"}`,
      value: voice.voiceURI,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

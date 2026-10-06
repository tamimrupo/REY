/**
 * Bengali script helpers.
 *
 * Two callers need these: the book search, which transliterates a Bangla query
 * so outside catalogues can answer it, and `slugify`, which would otherwise
 * reduce a Bangla title to an empty slug (`book-<timestamp>` URLs).
 *
 * It is a search and URL aid, never a display: the shop keeps the Bangla.
 */

/** True when the text contains Bengali script. */
export function hasBengaliScript(query: string): boolean {
  return /[\u0980-\u09ff]/.test(query);
}

/* Consonants, in the order the script teaches them. */
const CONSONANTS: Record<string, string> = {
  \u0995: "k",
  \u0996: "kh",
  \u0997: "g",
  \u0998: "gh",
  \u0999: "ng",
  \u099a: "ch",
  \u099b: "chh",
  \u099c: "j",
  \u099d: "jh",
  \u099e: "n",
  \u099f: "t",
  \u09a0: "th",
  \u09a1: "d",
  \u09a2: "dh",
  \u09a3: "n",
  \u09a4: "t",
  \u09a5: "th",
  \u09a6: "d",
  \u09a7: "dh",
  \u09a8: "n",
  \u09aa: "p",
  \u09ab: "ph",
  \u09ac: "b",
  \u09ad: "bh",
  \u09ae: "m",
  \u09af: "j",
  \u09b0: "r",
  \u09b2: "l",
  \u09b6: "sh",
  \u09b7: "sh",
  \u09b8: "s",
  \u09b9: "h",
  \u09dc: "r",
  \u09dd: "rh",
  \u09df: "y",
  \u09ce: "t",
};

/** Independent vowels and the vowel signs that follow a consonant. */
const VOWELS: Record<string, string> = {
  অ: "a", আ: "a", ই: "i", ঈ: "i", উ: "u", ঊ: "u", ঋ: "ri",
  এ: "e", ঐ: "oi", ও: "o", ঔ: "ou",
};

const VOWEL_SIGNS: Record<string, string> = {
  "া": "a", "ি": "i", "ী": "i", "ু": "u", "ূ": "u", "ৃ": "ri",
  "ে": "e", "ৈ": "oi", "ো": "o", "ৌ": "ou",
};

const SIGNS: Record<string, string> = {
  "ং": "ng", "ঁ": "n", "ঃ": "h",
};

const VIRAMA = "\u09cd";

/**
 * The three consonants with a nukta. NFC refuses to fold ড + ় back into a
 * single code point — they are composition exclusions — so the loop matches
 * the pair explicitly rather than looking it up as one character.
 */
const NUKTA_CONSONANTS: Record<string, string> = {
  "\u09a1": "r",
  "\u09a2": "rh",
  "\u09af": "y",
};

/**
 * Renders Bengali script as Latin letters, so it can be searched and slugged.
 *
 * It follows the writing system rather than a pronunciation dictionary: a
 * consonant takes its inherent vowel only when nothing follows to silence it
 * (a vowel sign, a virama, or the end of the word). That is enough to turn
 * পথের পাঁচালী into "pather panchali" and হুমায়ূন আহমেদ into "humayun ahmed" —
 * the spellings the outside catalogues actually index.
 */
export function transliterateBengali(input: string): string {
  let out = "";
  // য়, ড় and ঢ় are composition exclusions, so NFC will not join the letter and
  // its nukta — some keyboards send them as two code points. Join them here, or
  // হুমায়ূন comes out as "humaja una".
  const composed = input.normalize("NFC");
  const chars = Array.from(composed);
  // য is "j" at the start of a word and "y" after a vowel — সুয → suj, মায়া → maya.
  let afterVowel = false;

  for (let i = 0; i < chars.length; i += 1) {
    const char = chars[i];
    const next = chars[i + 1];

    if (char in CONSONANTS) {
      if (next === "\u09bc" && char in NUKTA_CONSONANTS) {
        out += NUKTA_CONSONANTS[char];
        i += 1;
        afterVowel = false;
        continue;
      }
      out += char === "য" && afterVowel ? "y" : CONSONANTS[char];
      // Inherent vowel: only when the consonant is not silenced by what follows
      // — a vowel sign, a virama, the end of the word, or a space.
      const silenced =
        next === VIRAMA || next === " " || next === "\u09bc" || (next ? next in VOWEL_SIGNS : true);
      if (!silenced) out += "a";
      afterVowel = false;
      continue;
    }

    if (char in VOWEL_SIGNS) {
      out += VOWEL_SIGNS[char];
      afterVowel = true;
      continue;
    }

    if (char in VOWELS) {
      out += VOWELS[char];
      afterVowel = true;
      continue;
    }

    if (char in SIGNS) {
      out += SIGNS[char];
      afterVowel = false;
      continue;
    }

    if (char === VIRAMA) {
      afterVowel = false;
      continue;
    }

    // Bengali digits first — they live inside the Bengali block, so the
    // catch-all below would swallow them before this branch is reached.
    if (char >= "০" && char <= "৯") {
      out += String(char.codePointAt(0)! - 0x09e6);
      afterVowel = false;
      continue;
    }

    // Any other Bengali mark (nukta and friends) is a join, not a separator:
    // ignoring it is what keeps হুমায়ূন as "humayun" rather than "humaya una".
    if (char >= "\u0980" && char <= "\u09ff") continue;

    out += /[a-zA-Z0-9\s'&.-]/.test(char) ? char : " ";
    afterVowel = false;
  }

  return out.replace(/\s+/g, " ").trim();
}

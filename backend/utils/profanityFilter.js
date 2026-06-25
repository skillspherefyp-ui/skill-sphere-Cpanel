// Profanity filter for discussion posts
// If a match is found, the post is rejected and the user is blocked.
// Three lists: English/Roman-Urdu (word-boundary regex), Urdu script (substring match)

// ── English & Roman Urdu (Latin script — word-boundary safe) ─────────────────
const LATIN_BANNED = [
  // English — core profanity
  'fuck', 'fucker', 'fuckers', 'fucking', 'fucked', 'fucks', 'fuckoff', 'wtf',
  'shit', 'shitting', 'shitted', 'shitty', 'bullshit', 'horseshit',
  'bitch', 'bitches', 'bitching', 'bitchy',
  'bastard', 'bastards',
  'asshole', 'assholes', 'jackass', 'dumbass', 'smartass',
  'dick', 'dicks', 'dickhead', 'dickface',
  'cock', 'cocks', 'cocksucker',
  'pussy', 'pussies',
  'cunt', 'cunts',
  'whore', 'whores',
  'slut', 'sluts',
  'nigger', 'nigga', 'niggah',
  'faggot', 'fag', 'fags',
  'retard', 'retarded', 'retards',
  'motherfucker', 'motherfucking', 'mf',
  'prick', 'pricks',
  'twat', 'twats',
  'wanker', 'wankers',
  'dipshit', 'douchebag', 'douchebags',
  'scumbag', 'scumbags',
  'porn', 'porno', 'pornography', 'xxx',
  'nude', 'naked', 'boobs', 'tits', 'penis', 'vagina', 'anus',
  'rape', 'raping', 'rapist', 'rapists',
  'kill', 'killing', 'murder', 'murderer',
  'damn', 'crap', 'piss', 'pissed', 'pissing',
  'jerk', 'idiot', 'moron', 'imbecile', 'loser',
  'pervert', 'perverts', 'creep',
  'sex', 'sexy', 'sexting',

  // Roman Urdu — common profanity & slurs
  'gandu', 'gandoo', 'gaandu', 'gaandoo',
  'gaand', 'gand',
  'chutiya', 'chutiye', 'chutiyon', 'chutiyapa',
  'chut', 'choot',
  'madarchod', 'madarchod', 'madar chod', 'maadarchod',
  'behenchod', 'behanchod', 'behen chod', 'bc',
  'lund', 'lauda', 'louda', 'lora',
  'randi', 'rand', 'raand',
  'maa ki', 'maa ko', 'teri maa', 'apni maa',
  'baap ka', 'tera baap',
  'harami', 'haramzada', 'haramzadi', 'haramkhor', 'haram',
  'kutta', 'kutti', 'kutiya', 'kutton',
  'suar', 'suwar', 'sowar',
  'kamina', 'kamine', 'kameena', 'kameeni',
  'sala', 'sali', 'saala', 'saali',
  'ullu', 'ullu ka pattha',
  'besharam', 'be sharam', 'beshara',
  'bewaqoof', 'bewakoof', 'bawaqoof',
  'jhatu', 'jhaatu',
  'lawde', 'lawda',
  'bhosda', 'bhosdi',
  'maderchod', 'mc',
  'zina', 'zani',
  'sharabi', 'nashe mein',
  'pagal', 'paagal',
  'gadha', 'gadhe', 'gadhon',
  'sali ki',
];

// ── Urdu script (substring match — no word boundaries needed) ────────────────
const URDU_BANNED = [
  // Explicit profanity
  'گانڈو', 'گاند', 'گانڈ',
  'چوتیا', 'چوت', 'چوتیے',
  'لنڈ', 'لوڑا', 'لوڈا',
  'رنڈی', 'رانڈ',
  'ماں کی', 'ماں کو', 'تیری ماں', 'اپنی ماں',
  'باپ کا', 'تیرا باپ',
  'بہن کی', 'بہن کو',
  'مادرچود', 'بہن چود', 'بہنچود',
  'حرامی', 'حرامزادہ', 'حرامزادی', 'حرامخور',
  'کتیا', 'کتا', 'کتے',
  'سور', 'سوئر',
  'کمینہ', 'کمینی', 'کمینے',
  'بے شرم', 'بیشرم', 'بے شرمی',
  'بے وقوف', 'بیوقوف',
  'زنا', 'زانی',
  'گدھا', 'گدھے',
  'بے ہودہ', 'بیہودہ',
  'فحش', 'فاحشہ',
  'جھاٹو', 'جھانٹ',
  'سالی', 'سالا', 'ساری',
  'اُلو', 'الو کا پٹھہ',
  'نشے میں', 'شرابی',
  'غلیظ', 'گندا', 'گندی',
  'کمینہ', 'بدمعاش', 'بدتمیز',
];

// ── Build Latin regex (word-boundary) ────────────────────────────────────────
const LATIN_REGEX = new RegExp(
  `\\b(${LATIN_BANNED.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
  'i'
);

/**
 * Returns the matched banned word/phrase if found, otherwise null.
 * Checks Latin script with word boundaries, Urdu script with substring match.
 */
const detectProfanity = (text) => {
  // Latin / Roman Urdu check
  const latinMatch = text.match(LATIN_REGEX);
  if (latinMatch) return latinMatch[0];

  // Urdu script check (substring)
  for (const word of URDU_BANNED) {
    if (text.includes(word)) return word;
  }

  return null;
};

module.exports = { detectProfanity };

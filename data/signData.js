var SIGN_DATA = {
  alphabet: {
    A: {
      desc: "Fist with thumb across fingers",
      category: "Letters",
      fingers: { thumb: { cx: 45, mx: 0, ix: 0 }, index: { mx: 0, px: 90, dx: 90 }, middle: { mx: 0, px: 90, dx: 90 }, ring: { mx: 0, px: 90, dx: 90 }, pinky: { mx: 0, px: 90, dx: 90 } }
    },
    B: {
      desc: "Flat hand, palm forward, thumb to side",
      category: "Letters",
      fingers: { thumb: { cx: 90, mx: 0, ix: 0 }, index: { mx: 0, px: 0, dx: 0 }, middle: { mx: 0, px: 0, dx: 0 }, ring: { mx: 0, px: 0, dx: 0 }, pinky: { mx: 0, px: 0, dx: 0 } }
    },
    C: {
      desc: "Hook hand, fingers curled except index edge",
      category: "Letters",
      fingers: { thumb: { cx: 90, mx: 0, ix: 0 }, index: { mx: 0, px: 30, dx: 60 }, middle: { mx: 0, px: 30, dx: 60 }, ring: { mx: 0, px: 30, dx: 60 }, pinky: { mx: 0, px: 30, dx: 60 } }
    },
    D: {
      desc: "Only index finger extended, palm forward",
      category: "Letters",
      fingers: { thumb: { cx: 30, mx: 45, ix: 0 }, index: { mx: 0, px: 0, dx: 0 }, middle: { mx: 90, px: 90, dx: 90 }, ring: { mx: 90, px: 90, dx: 90 }, pinky: { mx: 90, px: 90, dx: 90 } }
    },
    E: {
      desc: "Index and middle folded into palm, thumb across",
      category: "Letters",
      fingers: { thumb: { cx: 45, mx: 0, ix: 0 }, index: { mx: 90, px: 90, dx: 90 }, middle: { mx: 90, px: 90, dx: 90 }, ring: { mx: 0, px: 0, dx: 0 }, pinky: { mx: 0, px: 0, dx: 0 } }
    },
    F: {
      desc: "Index and thumb form circle, other fingers extended",
      category: "Letters",
      fingers: { thumb: { cx: 0, mx: 0, ix: 0 }, index: { mx: 0, px: 0, dx: 0 }, middle: { mx: 90, px: 90, dx: 90 }, ring: { mx: 90, px: 90, dx: 90 }, pinky: { mx: 90, px: 90, dx: 90 } }
    },
    G: {
      desc: "Index and thumb extended, other fingers curled",
      category: "Letters",
      fingers: { thumb: { cx: 0, mx: 0, ix: 0 }, index: { mx: 0, px: 0, dx: 0 }, middle: { mx: 90, px: 90, dx: 90 }, ring: { mx: 90, px: 90, dx: 90 }, pinky: { mx: 0, px: 0, dx: 0 } }
    },
    H: {
      desc: "Index and middle extended, thumb between them",
      category: "Letters",
      fingers: { thumb: { cx: 90, mx: 90, ix: 0 }, index: { mx: 0, px: 0, dx: 0 }, middle: { mx: 0, px: 0, dx: 0 }, ring: { mx: 90, px: 90, dx: 90 }, pinky: { mx: 90, px: 90, dx: 90 } }
    },
    I: {
      desc: "Index finger straight up, palm facing outward",
      category: "Letters",
      fingers: { thumb: { cx: 0, mx: 0, ix: 0 }, index: { mx: 0, px: 0, dx: 0 }, middle: { mx: 90, px: 90, dx: 90 }, ring: { mx: 90, px: 90, dx: 90 }, pinky: { mx: 90, px: 90, dx: 90 } }
    },
    J: {
      desc: "Index finger extended, curl as you trace",
      category: "Letters",
      fingers: { thumb: { cx: 0, mx: 0, ix: 0 }, index: { mx: 0, px: 0, dx: 0 }, middle: { mx: 90, px: 90, dx: 90 }, ring: { mx: 90, px: 90, dx: 90 }, pinky: { mx: 90, px: 90, dx: 90 } }
    },
    K: {
      desc: "Index and middle up, thumb between them",
      category: "Letters",
      fingers: { thumb: { cx: 0, mx: 90, ix: 0 }, index: { mx: 0, px: 0, dx: 0 }, middle: { mx: 0, px: 0, dx: 0 }, ring: { mx: 90, px: 90, dx: 90 }, pinky: { mx: 90, px: 90, dx: 90 } }
    },
    L: {
      desc: "Index up, thumb to the side (L shape)",
      category: "Letters",
      fingers: { thumb: { cx: 90, mx: 0, ix: 0 }, index: { mx: 0, px: 0, dx: 0 }, middle: { mx: 90, px: 90, dx: 90 }, ring: { mx: 90, px: 90, dx: 90 }, pinky: { mx: 90, px: 90, dx: 90 } }
    },
    M: {
      desc: "Thumb over index, other fingers curled into palm",
      category: "Letters",
      fingers: { thumb: { cx: 0, mx: 90, ix: 90 }, index: { mx: 90, px: 90, dx: 90 }, middle: { mx: 90, px: 90, dx: 90 }, ring: { mx: 0, px: 0, dx: 0 }, pinky: { mx: 0, px: 0, dx: 0 } }
    },
    N: {
      desc: "Thumb over index and middle",
      category: "Letters",
      fingers: { thumb: { cx: 0, mx: 90, ix: 90 }, index: { mx: 90, px: 90, dx: 90 }, middle: { mx: 90, px: 90, dx: 90 }, ring: { mx: 90, px: 90, dx: 90 }, pinky: { mx: 0, px: 0, dx: 0 } }
    },
    O: {
      desc: "All fingers curled touching thumb",
      category: "Letters",
      fingers: { thumb: { cx: 0, mx: 0, ix: 0 }, index: { mx: 0, px: 0, dx: 0 }, middle: { mx: 0, px: 0, dx: 0 }, ring: { mx: 0, px: 0, dx: 0 }, pinky: { mx: 0, px: 0, dx: 0 } }
    },
    P: {
      desc: "Middle finger up, thumb between (like K with middle)",
      category: "Letters",
      fingers: { thumb: { cx: 0, mx: 90, ix: 0 }, index: { mx: 90, px: 90, dx: 90 }, middle: { mx: 0, px: 0, dx: 0 }, ring: { mx: 90, px: 90, dx: 90 }, pinky: { mx: 90, px: 90, dx: 90 } }
    },
    Q: {
      desc: "Index and middle extended, ring and pinky curled",
      category: "Letters",
      fingers: { thumb: { cx: 0, mx: 0, ix: 0 }, index: { mx: 0, px: 0, dx: 0 }, middle: { mx: 0, px: 0, dx: 0 }, ring: { mx: 90, px: 90, dx: 90 }, pinky: { mx: 90, px: 90, dx: 90 } }
    },
    R: {
      desc: "Index and middle extended, thumb between",
      category: "Letters",
      fingers: { thumb: { cx: 0, mx: 90, ix: 0 }, index: { mx: 0, px: 0, dx: 0 }, middle: { mx: 0, px: 0, dx: 0 }, ring: { mx: 90, px: 90, dx: 90 }, pinky: { mx: 90, px: 90, dx: 90 } }
    },
    S: {
      desc: "Fist (same as A)",
      category: "Letters",
      fingers: { thumb: { cx: 45, mx: 0, ix: 0 }, index: { mx: 0, px: 90, dx: 90 }, middle: { mx: 0, px: 90, dx: 90 }, ring: { mx: 0, px: 90, dx: 90 }, pinky: { mx: 0, px: 90, dx: 90 } }
    },
    T: {
      desc: "Thumb between index and middle, other fingers curled",
      category: "Letters",
      fingers: { thumb: { cx: 0, mx: 90, ix: 0 }, index: { mx: 90, px: 90, dx: 90 }, middle: { mx: 90, px: 90, dx: 90 }, ring: { mx: 0, px: 0, dx: 0 }, pinky: { mx: 0, px: 0, dx: 0 } }
    },
    U: {
      desc: "Index and middle extended, other fingers curled",
      category: "Letters",
      fingers: { thumb: { cx: 0, mx: 0, ix: 0 }, index: { mx: 0, px: 0, dx: 0 }, middle: { mx: 0, px: 0, dx: 0 }, ring: { mx: 90, px: 90, dx: 90 }, pinky: { mx: 90, px: 90, dx: 90 } }
    },
    V: {
      desc: "Index and middle extended (peace sign)",
      category: "Letters",
      fingers: { thumb: { cx: 0, mx: 0, ix: 0 }, index: { mx: 0, px: 0, dx: 0 }, middle: { mx: 0, px: 0, dx: 0 }, ring: { mx: 90, px: 90, dx: 90 }, pinky: { mx: 90, px: 90, dx: 90 } }
    },
    W: {
      desc: "Index, middle, and ring extended, pinky curled",
      category: "Letters",
      fingers: { thumb: { cx: 0, mx: 0, ix: 0 }, index: { mx: 0, px: 0, dx: 0 }, middle: { mx: 0, px: 0, dx: 0 }, ring: { mx: 0, px: 0, dx: 0 }, pinky: { mx: 90, px: 90, dx: 90 } }
    },
    X: {
      desc: "Index finger curled (hook), other fingers extended",
      category: "Letters",
      fingers: { thumb: { cx: 0, mx: 0, ix: 0 }, index: { mx: 0, px: 0, dx: 0 }, middle: { mx: 0, px: 0, dx: 0 }, ring: { mx: 0, px: 0, dx: 0 }, pinky: { mx: 0, px: 0, dx: 0 } }
    },
    Y: {
      desc: "Pinky and thumb extended, other fingers curled",
      category: "Letters",
      fingers: { thumb: { cx: 0, mx: 0, ix: 0 }, index: { mx: 90, px: 90, dx: 90 }, middle: { mx: 90, px: 90, dx: 90 }, ring: { mx: 90, px: 90, dx: 90 }, pinky: { mx: 0, px: 0, dx: 0 } }
    },
    Z: {
      desc: "Index and middle extended, index curls like Z",
      category: "Letters",
      fingers: { thumb: { cx: 0, mx: 0, ix: 0 }, index: { mx: 0, px: 0, dx: 0 }, middle: { mx: 0, px: 0, dx: 0 }, ring: { mx: 90, px: 90, dx: 90 }, pinky: { mx: 90, px: 90, dx: 90 } }
    }
  },

  words: {
    hello: {
      desc: "Greeting - open hand moving outward",
      category: "Greetings",
      fingers: { thumb: { cx: 0, mx: 0, ix: 0 }, index: { mx: 0, px: 0, dx: 0 }, middle: { mx: 0, px: 0, dx: 0 }, ring: { mx: 0, px: 0, dx: 0 }, pinky: { mx: 0, px: 0, dx: 0 } }
    },
    thank: {
      desc: "Bow gesture - flat hand from chin forward",
      category: "Greetings",
      fingers: { thumb: { cx: 0, mx: 0, ix: 0 }, index: { mx: 0, px: 0, dx: 0 }, middle: { mx: 0, px: 0, dx: 0 }, ring: { mx: 0, px: 0, dx: 0 }, pinky: { mx: 0, px: 0, dx: 0 } }
    },
    please: {
      desc: "Flat hand circles on chest",
      category: "Greetings",
      fingers: { thumb: { cx: 0, mx: 0, ix: 0 }, index: { mx: 0, px: 0, dx: 0 }, middle: { mx: 0, px: 0, dx: 0 }, ring: { mx: 0, px: 0, dx: 0 }, pinky: { mx: 0, px: 0, dx: 0 } }
    },
    sorry: {
      desc: "Fist circles on chest",
      category: "Greetings",
      fingers: { thumb: { cx: 0, mx: 0, ix: 0 }, index: { mx: 0, px: 90, dx: 90 }, middle: { mx: 0, px: 90, dx: 90 }, ring: { mx: 0, px: 90, dx: 90 }, pinky: { mx: 0, px: 90, dx: 90 } }
    },
    love: {
      desc: "Flat hand crosses heart",
      category: "Greetings",
      fingers: { thumb: { cx: 0, mx: 0, ix: 0 }, index: { mx: 0, px: 0, dx: 0 }, middle: { mx: 0, px: 0, dx: 0 }, ring: { mx: 0, px: 0, dx: 0 }, pinky: { mx: 0, px: 0, dx: 0 } }
    },
    help: {
      desc: "Open hand touches shoulder",
      category: "Greetings",
      fingers: { thumb: { cx: 0, mx: 0, ix: 0 }, index: { mx: 0, px: 0, dx: 0 }, middle: { mx: 0, px: 0, dx: 0 }, ring: { mx: 0, px: 0, dx: 0 }, pinky: { mx: 0, px: 0, dx: 0 } }
    },
    friend: {
      desc: "Index and middle finger wiggle",
      category: "Greetings",
      fingers: { thumb: { cx: 0, mx: 0, ix: 0 }, index: { mx: 0, px: 0, dx: 0 }, middle: { mx: 0, px: 0, dx: 0 }, ring: { mx: 90, px: 90, dx: 90 }, pinky: { mx: 90, px: 90, dx: 90 } }
    },
    water: {
      desc: "W hand taps chin",
      category: "Essential",
      fingers: { thumb: { cx: 0, mx: 0, ix: 0 }, index: { mx: 0, px: 0, dx: 0 }, middle: { mx: 0, px: 0, dx: 0 }, ring: { mx: 0, px: 0, dx: 0 }, pinky: { mx: 0, px: 0, dx: 0 } }
    },
    eat: {
      desc: "Flat hand taps mouth",
      category: "Essential",
      fingers: { thumb: { cx: 0, mx: 0, ix: 0 }, index: { mx: 0, px: 0, dx: 0 }, middle: { mx: 0, px: 0, dx: 0 }, ring: { mx: 0, px: 0, dx: 0 }, pinky: { mx: 0, px: 0, dx: 0 } }
    },
    drink: {
      desc: "C hand mimics cup to mouth",
      category: "Essential",
      fingers: { thumb: { cx: 0, mx: 0, ix: 0 }, index: { mx: 0, px: 0, dx: 0 }, middle: { mx: 0, px: 0, dx: 0 }, ring: { mx: 0, px: 0, dx: 0 }, pinky: { mx: 0, px: 0, dx: 0 } }
    },
    sleep: {
      desc: "Flat hand rests on cheek",
      category: "Essential",
      fingers: { thumb: { cx: 0, mx: 0, ix: 0 }, index: { mx: 0, px: 0, dx: 0 }, middle: { mx: 0, px: 0, dx: 0 }, ring: { mx: 0, px: 0, dx: 0 }, pinky: { mx: 0, px: 0, dx: 0 } }
    },
    school: {
      desc: "Flat hand taps shoulder twice",
      category: "Essential",
      fingers: { thumb: { cx: 0, mx: 0, ix: 0 }, index: { mx: 0, px: 0, dx: 0 }, middle: { mx: 0, px: 0, dx: 0 }, ring: { mx: 0, px: 0, dx: 0 }, pinky: { mx: 0, px: 0, dx: 0 } }
    },
    book: {
      desc: "Flat hands open like a book",
      category: "Essential",
      fingers: { thumb: { cx: 0, mx: 0, ix: 0 }, index: { mx: 0, px: 0, dx: 0 }, middle: { mx: 0, px: 0, dx: 0 }, ring: { mx: 0, px: 0, dx: 0 }, pinky: { mx: 0, px: 0, dx: 0 } }
    },
    learn: {
      desc: "Index finger taps temple then forward",
      category: "Essential",
      fingers: { thumb: { cx: 0, mx: 0, ix: 0 }, index: { mx: 0, px: 0, dx: 0 }, middle: { mx: 0, px: 0, dx: 0 }, ring: { mx: 0, px: 0, dx: 0 }, pinky: { mx: 0, px: 0, dx: 0 } }
    },
    mother: {
      desc: "Flat hand taps chin",
      category: "Family",
      fingers: { thumb: { cx: 0, mx: 0, ix: 0 }, index: { mx: 0, px: 0, dx: 0 }, middle: { mx: 0, px: 0, dx: 0 }, ring: { mx: 0, px: 0, dx: 0 }, pinky: { mx: 0, px: 0, dx: 0 } }
    },
    father: {
      desc: "Flat hand taps forehead",
      category: "Family",
      fingers: { thumb: { cx: 0, mx: 0, ix: 0 }, index: { mx: 0, px: 0, dx: 0 }, middle: { mx: 0, px: 0, dx: 0 }, ring: { mx: 0, px: 0, dx: 0 }, pinky: { mx: 0, px: 0, dx: 0 } }
    },
    baby: {
      desc: "Flat hand taps cheek twice",
      category: "Family",
      fingers: { thumb: { cx: 0, mx: 0, ix: 0 }, index: { mx: 0, px: 0, dx: 0 }, middle: { mx: 0, px: 0, dx: 0 }, ring: { mx: 0, px: 0, dx: 0 }, pinky: { mx: 0, px: 0, dx: 0 } }
    },
    family: {
      desc: "Flat hand forms H over heart",
      category: "Family",
      fingers: { thumb: { cx: 0, mx: 0, ix: 0 }, index: { mx: 0, px: 0, dx: 0 }, middle: { mx: 0, px: 0, dx: 0 }, ring: { mx: 0, px: 0, dx: 0 }, pinky: { mx: 0, px: 0, dx: 0 } }
    },
    more: {
      desc: "Flat hands open and close repeatedly",
      category: "Essential",
      fingers: { thumb: { cx: 0, mx: 0, ix: 0 }, index: { mx: 0, px: 0, dx: 0 }, middle: { mx: 0, px: 0, dx: 0 }, ring: { mx: 0, px: 0, dx: 0 }, pinky: { mx: 0, px: 0, dx: 0 } }
    },
    yes: {
      desc: "Signed nod - closed hand nods",
      category: "Greetings",
      fingers: { thumb: { cx: 0, mx: 0, ix: 0 }, index: { mx: 0, px: 90, dx: 90 }, middle: { mx: 0, px: 90, dx: 90 }, ring: { mx: 0, px: 90, dx: 90 }, pinky: { mx: 0, px: 90, dx: 90 } }
    },
    no: {
      desc: "Index finger forward, then wave",
      category: "Greetings",
      fingers: { thumb: { cx: 0, mx: 0, ix: 0 }, index: { mx: 0, px: 0, dx: 0 }, middle: { mx: 90, px: 90, dx: 90 }, ring: { mx: 90, px: 90, dx: 90 }, pinky: { mx: 90, px: 90, dx: 90 } }
    },
    thanks: {
      desc: "Flat hand from chin forward",
      category: "Greetings",
      fingers: { thumb: { cx: 0, mx: 0, ix: 0 }, index: { mx: 0, px: 0, dx: 0 }, middle: { mx: 0, px: 0, dx: 0 }, ring: { mx: 0, px: 0, dx: 0 }, pinky: { mx: 0, px: 0, dx: 0 } }
    },
    music: {
      desc: "Fist taps chest twice",
      category: "Fun",
      fingers: { thumb: { cx: 0, mx: 0, ix: 0 }, index: { mx: 0, px: 90, dx: 90 }, middle: { mx: 0, px: 90, dx: 90 }, ring: { mx: 0, px: 0, dx: 0 }, pinky: { mx: 0, px: 0, dx: 0 } }
    },
    dance: {
      desc: "Alternate waving hands",
      category: "Fun",
      fingers: { thumb: { cx: 0, mx: 0, ix: 0 }, index: { mx: 0, px: 0, dx: 0 }, middle: { mx: 0, px: 0, dx: 0 }, ring: { mx: 0, px: 0, dx: 0 }, pinky: { mx: 0, px: 0, dx: 0 } }
    },
    happy: {
      desc: "Open hand touches cheek and smiles",
      category: "Feelings",
      fingers: { thumb: { cx: 0, mx: 0, ix: 0 }, index: { mx: 0, px: 0, dx: 0 }, middle: { mx: 0, px: 0, dx: 0 }, ring: { mx: 0, px: 0, dx: 0 }, pinky: { mx: 0, px: 0, dx: 0 } }
    },
    sad: {
      desc: "Flat hand wipes down face",
      category: "Feelings",
      fingers: { thumb: { cx: 0, mx: 0, ix: 0 }, index: { mx: 0, px: 0, dx: 0 }, middle: { mx: 0, px: 0, dx: 0 }, ring: { mx: 0, px: 0, dx: 0 }, pinky: { mx: 0, px: 0, dx: 0 } }
    },
    smile: {
      desc: "Middle finger pops up from closed hand",
      category: "Feelings",
      fingers: { thumb: { cx: 0, mx: 0, ix: 0 }, index: { mx: 90, px: 90, dx: 90 }, middle: { mx: 0, px: 0, dx: 0 }, ring: { mx: 90, px: 90, dx: 90 }, pinky: { mx: 90, px: 90, dx: 90 } }
    },
    rainbow: {
      desc: "Wiggle fingers upward in colors",
      category: "Fun",
      fingers: { thumb: { cx: 0, mx: 0, ix: 0 }, index: { mx: 0, px: 0, dx: 0 }, middle: { mx: 0, px: 0, dx: 0 }, ring: { mx: 0, px: 0, dx: 0 }, pinky: { mx: 0, px: 0, dx: 0 } }
    },
    heart: {
      desc: "Both hands form heart shape",
      category: "Feelings",
      fingers: { thumb: { cx: 0, mx: 0, ix: 0 }, index: { mx: 0, px: 0, dx: 0 }, middle: { mx: 0, px: 0, dx: 0 }, ring: { mx: 0, px: 0, dx: 0 }, pinky: { mx: 0, px: 0, dx: 0 } }
    },
    computer: {
      desc: "F-formation: both hands touch thumbs",
      category: "Tech",
      fingers: { thumb: { cx: 0, mx: 0, ix: 0 }, index: { mx: 0, px: 0, dx: 0 }, middle: { mx: 0, px: 0, dx: 0 }, ring: { mx: 0, px: 0, dx: 0 }, pinky: { mx: 0, px: 0, dx: 0 } }
    },
    phone: {
      desc: "Index finger taps ear then mouth",
      category: "Tech",
      fingers: { thumb: { cx: 0, mx: 0, ix: 0 }, index: { mx: 0, px: 0, dx: 0 }, middle: { mx: 0, px: 0, dx: 0 }, ring: { mx: 0, px: 0, dx: 0 }, pinky: { mx: 0, px: 0, dx: 0 } }
    },
    learn: {
      desc: "Index finger taps temple then forward",
      category: "Essential",
      fingers: { thumb: { cx: 0, mx: 0, ix: 0 }, index: { mx: 0, px: 0, dx: 0 }, middle: { mx: 0, px: 0, dx: 0 }, ring: { mx: 0, px: 0, dx: 0 }, pinky: { mx: 0, px: 0, dx: 0 } }
    }
  },

  categories: [
    { id: "greetings", name: "Greetings", icon: "fa-handshake", signs: ["hello", "thank", "please", "sorry", "love", "help", "friend", "yes", "no", "thanks"] },
    { id: "essential", name: "Essential Words", icon: "fa-star", signs: ["water", "eat", "drink", "sleep", "school", "book", "more", "learn"] },
    { id: "family", name: "Family", icon: "fa-heart", signs: ["mother", "father", "baby", "family"] },
    { id: "feelings", name: "Feelings", icon: "fa-face-smile", signs: ["happy", "sad", "smile", "rainbow", "heart"] },
    { id: "tech", name: "Technology", icon: "fa-laptop", signs: ["computer", "phone"] },
    { id: "fun", name: "Fun & Activities", icon: "fa-music", signs: ["music", "dance", "rainbow"] }
  ],

  lessons: [
    {
      id: 1,
      title: "The ASL Alphabet",
      desc: "Learn letters A through Z with hand shapes",
      signs: Object.keys(SIGN_DATA.alphabet).slice(0, 13),
      difficulty: "Beginner"
    },
    {
      id: 2,
      title: "Letters Q-Z",
      desc: "Complete the alphabet and practice tricky letters",
      signs: Object.keys(SIGN_DATA.alphabet).slice(13),
      difficulty: "Beginner"
    },
    {
      id: 3,
      title: "Friendly Greetings",
      desc: "Say hello, thank you, and please in ASL",
      signs: ["hello", "thank", "please", "sorry", "love", "help"],
      difficulty: "Beginner"
    },
    {
      id: 4,
      title: "Essential Communication",
      desc: "Learn words you use every day",
      signs: ["water", "eat", "drink", "sleep", "school", "book", "more"],
      difficulty: "Intermediate"
    },
    {
      id: 5,
      title: "Family & Feelings",
      desc: "Talk about loved ones and emotions",
      signs: ["mother", "father", "baby", "family", "happy", "sad", "smile"],
      difficulty: "Intermediate"
    },
    {
      id: 6,
      title: "Tech & Modern Signs",
      desc: "Signs for the digital world",
      signs: ["computer", "phone", "music", "dance", "rainbow", "heart"],
      difficulty: "Advanced"
    }
  ]
};
window.SIGN_DATA = SIGN_DATA;
(function () {
const IMG_DIR = 'uploads/Universe-images/', VID_DIR = 'uploads/Universe-videos/';
const VIDEO = { moscow: 'Moscow', russia: 'Russia', earth: 'Earth', moon: 'Moon', sun: 'Sun', mercury: 'Mercury', venus: 'Venus', mars: 'Mars', asteroids: 'Asteroids', jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune', pluto: 'Pluto', milkyway: 'MilkyWay', andromeda: 'Andromeda', universe: 'Universe' };
// picture file names that differ from the clip name (file names are case-sensitive once the page is hosted)
const IMG = { asteroids: 'asteroids' };
const POSES = { wave: 'Cosmo-wave', point: 'Cosmo-point', cheer: 'Cosmo-cheer', fly: 'Cosmo-fly' };
const RED = '#e0453a', BLUE = '#4f8fe0', YEL = '#f2c94c', GRN = '#5aa85a', SAND = '#e3c08a', MARS = '#d9653b';
const C = (en, ru, x) => Object.assign({ en, ru }, x);
const GAMES = {
  moscow: { q: ['What color is the star on the Kremlin tower?', 'Какого цвета звезда на башне Кремля?'], a: 0, c: [C('Red', 'Красная', { color: RED }), C('Blue', 'Синяя', { color: BLUE }), C('Yellow', 'Жёлтая', { color: YEL })] },
  russia: { q: ['Is Russia big or small?', 'Россия большая или маленькая?'], a: 0, c: [C('Very big', 'Очень большая', { icon: 'ph-arrows-out' }), C('Small', 'Маленькая', { icon: 'ph-arrows-in' })] },
  earth: { q: ['What covers most of Earth?', 'Чего больше всего на Земле?'], a: 0, c: [C('Water', 'Воды', { color: BLUE }), C('Sand', 'Песка', { color: SAND }), C('Grass', 'Травы', { color: GRN })] },
  moon: { q: ['Is there air on the Moon?', 'Есть ли на Луне воздух?'], a: 1, c: [C('Yes', 'Да', { icon: 'ph-wind' }), C('No', 'Нет', { icon: 'ph-prohibit' })] },
  solarmap: { q: ['Which one is our planet?', 'Какая планета — наша?'], a: 1, c: [C('Mars', 'Марс', { img: 'mars' }), C('Earth', 'Земля', { img: 'earth' }), C('Jupiter', 'Юпитер', { img: 'jupiter' })] },
  sun: { q: ['Is the Sun a star or a planet?', 'Солнце — это звезда или планета?'], a: 0, c: [C('A star', 'Звезда', { icon: 'ph-star' }), C('A planet', 'Планета', { icon: 'ph-planet' })] },
  mercury: { q: ['Which planet is closest to the Sun?', 'Какая планета ближе всех к Солнцу?'], a: 0, c: [C('Mercury', 'Меркурий', { img: 'mercury' }), C('Neptune', 'Нептун', { img: 'neptune' })] },
  venus: { q: ['Is Venus hot or cold?', 'На Венере жарко или холодно?'], a: 0, c: [C('Hot', 'Жарко', { icon: 'ph-fire' }), C('Cold', 'Холодно', { icon: 'ph-snowflake' })] },
  mars: { q: ['What color is Mars?', 'Какого цвета Марс?'], a: 0, c: [C('Red', 'Красный', { color: MARS }), C('Blue', 'Синий', { color: BLUE }), C('Green', 'Зелёный', { color: GRN })] },
  asteroids: { q: ['What are asteroids made of?', 'Из чего сделаны астероиды?'], a: 0, c: [C('Rock', 'Из камня', { icon: 'ph-mountains' }), C('Ice cream', 'Из мороженого', { icon: 'ph-ice-cream' })] },
  jupiter: { q: ['Which one is bigger?', 'Кто больше?'], a: 0, c: [C('Jupiter', 'Юпитер', { img: 'jupiter' }), C('Earth', 'Земля', { img: 'earth' })] },
  saturn: { q: ['What are Saturn’s rings made of?', 'Из чего кольца Сатурна?'], a: 0, c: [C('Ice and rock', 'Изо льда и камней', { icon: 'ph-snowflake' }), C('Ribbons', 'Из ленточек', { icon: 'ph-gift' })] },
  uranus: { q: ['How does Uranus roll?', 'Как катится Уран?'], a: 0, c: [C('On its side', 'На боку', { icon: 'ph-arrow-arc-right' }), C('Standing up', 'Стоя', { icon: 'ph-arrow-up' })] },
  neptune: { q: ['What color is Neptune?', 'Какого цвета Нептун?'], a: 0, c: [C('Blue', 'Синий', { color: BLUE }), C('Red', 'Красный', { color: RED }), C('Yellow', 'Жёлтый', { color: YEL })] },
  pluto: { q: ['What shape is on Pluto?', 'Какая фигура есть на Плутоне?'], a: 0, c: [C('A heart', 'Сердце', { icon: 'ph-heart' }), C('A star', 'Звезда', { icon: 'ph-star' }), C('A square', 'Квадрат', { icon: 'ph-square' })] },
  milkyway: { q: ['Where does our Sun live?', 'Где живёт наше Солнце?'], a: 0, c: [C('In the Milky Way', 'В Млечном Пути', { icon: 'ph-spiral' }), C('In a cookie jar', 'В банке с печеньем', { icon: 'ph-cookie' })] },
  andromeda: { q: ['Which is closer to us?', 'Что к нам ближе?'], a: 0, c: [C('The Moon', 'Луна', { img: 'moon' }), C('Andromeda', 'Андромеда', { icon: 'ph-spiral' })] },
  universe: { q: ['What is in the universe?', 'Что есть во Вселенной?'], a: 0, c: [C('Everything!', 'Всё-всё!', { icon: 'ph-sparkle' }), C('Nothing', 'Ничего', { icon: 'ph-circle-dashed' })] },
};
const UI = {
  en: { game: 'Find it!', tryAgain: 'Try again!', yay: 'Yay! You got it!', stickers: 'My stickers', newSticker: 'New sticker!', flyHome: 'Fly home', flyHomeTop: 'The end', flyingHome: 'Flying home…',
    welcome: n => n ? `Welcome home, ${n}!` : 'Welcome home!', welcomeSub: 'You flew all the way across the universe and back.', again: 'Fly again', close: 'Close',
    introTitle: n => n ? `${n}’s trip through space` : 'A trip through space', introSub: 'With Cosmo, from Moscow to the whole universe', letsFly: 'Let’s fly!', locked: 'Play “Find it!” to win' },
  ru: { game: 'Найди!', tryAgain: 'Попробуй ещё!', yay: 'Ура! Правильно!', stickers: 'Мои наклейки', newSticker: 'Новая наклейка!', flyHome: 'Домой', flyHomeTop: 'Конец пути', flyingHome: 'Летим домой…',
    welcome: n => n ? `С возвращением, ${n}!` : 'С возвращением домой!', welcomeSub: 'Ты пролетел через всю Вселенную и вернулся домой.', again: 'Ещё раз', close: 'Закрыть',
    introTitle: n => n ? `${n} летит в космос` : 'Путешествие в космос', introSub: 'Вместе с Космо — от Москвы до всей Вселенной', letsFly: 'Полетели!', locked: 'Сыграй в «Найди!»' },
};

// Google Veo prompts
const VSTYLE = 'Pixar-style 3D animation, soft cinematic lighting with a warm rim light, rich saturated colors, smooth rounded friendly shapes, gentle motion, made for a 6-year-old. Subject centered on a pure black space background.';
const VLOOP = 'Slow calm camera, one continuous shot, seamless loop, no cuts. No text, no dialogue, no music. 16:9.';
const VSCENE = 'One continuous shot, no cuts. No text, no dialogue. Soft magical sound effects only. 16:9, 8 seconds.';
const COSMO = 'Cosmo, a round white-and-soft-lavender rocket character with big friendly eyes, little fin arms and a round window (use the Cosmo reference image)';
const BOY = 'a smiling 6-year-old boy (use the reference photo of my son, keep his face recognizable in Pixar style)';
const VIDEOS = [
  { id: 'intro', file: 'Intro', title: 'Intro: Cosmo picks him up', secs: '~9 s scene', scene: true,
    start: `${COSMO} has just landed on snowy Red Square in Moscow at night, St. Basil’s colorful domes glowing behind it, the round hatch open and ${BOY} leaning out of it, waving at the camera. Pixar-style 3D animated film still, soft cinematic lighting, warm rim light, rich colors, the night sky fading to black at the edges. No text. Landscape 3:2, 1536×1024.`,
    startMJ: 'The white-and-lavender rocket character from the first attached image, standing upright on snowy Red Square in Moscow at night after landing, St. Basil’s colorful domes glowing behind it. Its round window is open and the boy from the second attached image, as a smiling 6-year-old Pixar character with the same face and hair, leans out waving at the camera. The rocket stands on the right third of the frame, empty snowy square on the left. Pixar-style 3D animated film still, soft cinematic lighting, warm rim light, rich colors, night sky fading to black at the edges --ar 3:2',
    motion: 'Snow falls gently on Red Square, the boy inside the window waves and smiles, the rocket gently wobbles on the ground, its little engine glowing.',
    extend: 'The rocket slowly lifts off the snowy ground with a puff of glowing flame and rises straight up out of the top of the frame, leaving a sparkly trail. Red Square stays in view.' },
  { id: 'home', file: 'Home', title: 'Ending: back home in Moscow', secs: '~9 s scene', scene: true,
    start: `${COSMO} flying down out of a starry night sky toward snowy Red Square in Moscow, a sparkly flame trail behind it, ${BOY} smiling through the round window. St. Basil’s domes glowing below. Pixar-style 3D animated film still, soft cinematic lighting, warm rim light, rich colors, the sky fading to black at the edges. No text. Landscape 3:2, 1536×1024.`,
    startMJ: 'The white-and-lavender rocket character from the first attached image, flying down out of a starry night sky toward snowy Red Square in Moscow with a sparkly flame trail, the boy from the second attached image, as a smiling 6-year-old Pixar character with the same face and hair, looking out of its round window. St. Basil’s domes glowing below. The rocket in the upper right of the frame. Pixar-style 3D animated film still, soft cinematic lighting, warm rim light, rich colors, sky fading to black at the edges --ar 3:2',
    motion: 'The rocket glides down and lands softly on the snowy square with a puff of glowing flame, snow swirls around it.',
    extend: 'The round hatch opens, the boy hops out onto the snow, throws both arms up happily and waves at the camera while the Kremlin star twinkles.' },
  { id: 'moscow', motion: 'Slow push-in on Red Square at night: snow falls gently, the red Kremlin star twinkles, warm windows flicker, St. Basil’s domes glow.' },
  { id: 'russia', motion: 'The clay-style globe slowly rotates, a tiny toy train chugs across Russia, the glowing heart pin over Moscow pulses softly.' },
  { id: 'earth', motion: 'Earth slowly rotates, clouds drift, sunlight glints on the oceans, the thin blue atmosphere glows.' },
  { id: 'moon', motion: 'A tiny astronaut hops in slow motion on the Moon, kicking up glittery dust, the flag sways gently, Earth hangs in the distance.' },
  { id: 'sun', motion: 'Swirling orange and gold plasma flows across the Sun, a gentle solar flare loops up and falls back, warm light pulses.' },
  { id: 'mercury', motion: 'Mercury slowly turns, its craters catching the bright sunlight, a soft heat shimmer at its edge.' },
  { id: 'venus', motion: 'Thick pale-yellow clouds swirl slowly around Venus with a warm hazy glow.' },
  { id: 'mars', motion: 'Mars slowly rotates, the little rover on its horizon rolls forward, turns its camera head and blinks its lights.' },
  { id: 'asteroids', motion: 'Rocky asteroids tumble slowly past the camera while a tiny friendly spaceship zips between them.' },
  { id: 'jupiter', motion: 'Jupiter’s creamy stripes flow sideways, the Great Red Spot storm spins, a tiny blue Earth floats beside it.' },
  { id: 'saturn', motion: 'The camera glides slowly along Saturn’s wide rings, ice particles sparkle and drift.' },
  { id: 'uranus', motion: 'Pale blue-green Uranus rolls slowly on its side, its faint rings turning with it.' },
  { id: 'neptune', motion: 'White streaky clouds race across deep blue Neptune, a dark storm spot swirls.' },
  { id: 'pluto', motion: 'Pluto rotates very slowly in place, the bright white heart-shaped plain stays visible, soft light on the icy surface, stars stay still. Nothing appears on the planet, no creatures, no objects, no faces, no new shapes.' },
  { id: 'milkyway', motion: 'The Milky Way spiral galaxy turns slowly like a glowing pinwheel, a small glowing arrow pulses on one outer arm.' },
  { id: 'andromeda', motion: 'A slow drift toward the Andromeda galaxy, its spiral arms shimmer with millions of stars.' },
  { id: 'universe', motion: 'A slow flight through a field of colorful galaxies drifting past and gently twinkling, like jewels in space.' },
];
const POSE_PROMPTS = [
  { id: 'wave', title: 'Cosmo waving', desc: 'waving hello with one fin arm, big warm smile' },
  { id: 'point', title: 'Cosmo pointing', desc: 'pointing up and to the right with one fin arm, curious excited face, as if saying “look at that!”' },
  { id: 'cheer', title: 'Cosmo cheering', desc: 'both fin arms up in celebration, eyes squeezed shut with joy, little golden sparkles around' },
  { id: 'fly', title: 'Cosmo flying', desc: 'tilted about 45° flying up and to the right, a long bright flame and sparkle trail behind' },
];
const posePrompt = p => `Using the attached Cosmo image, keep the rocket design identical. Put the child from the second attached photo in the window, in the same Pixar style, keeping his face recognizable. Cosmo is ${p.desc}. Full body, centered, on a pure black background (#000000). Pixar-style 3D animated film still, soft cinematic lighting, warm rim light. No text, no letters. Portrait 2:3, 1024×1536.`;

const MJ = {
  style: 'Gentle Pixar-style 3D animation, slow smooth camera, the subject stays centered, soft glowing light, nothing new appears.',
  sceneStyle: 'Gentle Pixar-style 3D animation, soft glowing light, nothing new appears.',
  loop: '--motion low --loop --bs 2',
  scene: '--motion low --bs 4',
  guard: 'Static camera, wide shot, no zoom. The rocket keeps exactly the same shape and design, it never changes into another object. The boy stays the same size and his hands stay inside the round window.',
};
window.UNIVERSE_X = { MJ, IMG_DIR, VID_DIR, VIDEO, IMG, POSES, GAMES, UI, VIDEOS, VSTYLE, VLOOP, VSCENE, POSE_PROMPTS, posePrompt };
})();

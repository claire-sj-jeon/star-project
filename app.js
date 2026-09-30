
const firebaseConfig = {
    apiKey: "AIzaSyBv3uxm20pImzHAPN_uwhXxHA4CVnAmZp8",
    authDomain: "star-project-13866.firebaseapp.com",
    databaseURL: "https://star-project-13866-default-rtdb.firebaseio.com",
    projectId: "star-project-13866",
    storageBucket: "star-project-13866.firebasestorage.app",
    messagingSenderId: "766253294108",
    appId: "1:766253294108:web:c4429ae0819d58a298f5d9"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();


const SCALE = 3, W = 600 * SCALE, H = 900 * SCALE;
const PX_PER_PT = 600 / (55 / 25.4 * 72);
const pt = (size) => size * PX_PER_PT * SCALE;

const TYPE_LABELS = {
  blue: "Blue main-sequence star",
  golden: "Sun-like (G-type) star",
  red_dwarf: "Red dwarf (M-type) star",
  red_giant: "Red giant star"
};
const TYPE_DESCRIPTIONS = {
  blue: "A hot, luminous star burning fiercely at over 10,000 degrees. Blue stars live fast and bright, shining with the intensity of thousands of Suns.",
  golden: "A calm, steady star much like our own Sun. Golden stars burn for billions of years, warm and constant, the kind of star around which life can flourish.",
  red_dwarf: "The smallest and longest-lived of all stars. A red dwarf glows softly for trillions of years, outlasting nearly everything else in the universe.",
  red_giant: "A star in its magnificent final act, swollen to hundreds of times its original size and glowing a deep amber red."
};


let starPool = null;
const overlayImg = new Image();
overlayImg.src = "assets/overlay.png";

const cardFont = new FontFace("CardFont", "url(assets/SF-Pro-Text-BoldItalic.otf)");
const fontReady = cardFont.load().then(f => document.fonts.add(f));

fetch("assets/star_pool.json")
  .then(r => r.json())
  .then(data => { starPool = data; });


async function claimStar(type) {
  const shuffled = [...starPool[type]].sort(() => Math.random() - 0.5);
  for (const star of shuffled) {
    const res = await db.ref("used/" + star.source_id)
      .transaction(cur => (cur === null ? true : undefined));
    if (res.committed) return star;
  }
  throw new Error("pool_empty");
}

function loadStarImage(ra, dec) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = "https://alasky.u-strasbg.fr/hips-image-services/hips2fits"
      + "?hips=CDS%2FP%2FDSS2%2Fcolor&ra=" + ra + "&dec=" + dec
      + "&fov=0.03&width=700&height=700&format=jpg";
  });
}

function wrapText(ctx, text, maxW) {
  const words = text.split(" "), lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width <= maxW) line = test;
    else { if (line) lines.push(line); line = w; }
  }
  if (line) lines.push(line);
  return lines;
}

async function buildCard(star, userName, starImg) {
  await fontReady;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d");


  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);


  const iw = starImg.width * SCALE, ih = starImg.height * SCALE;
  ctx.drawImage(starImg, (W - iw) / 2, 300 * SCALE - ih / 2, iw, ih);


  ctx.drawImage(overlayImg, 0, 0, W, H);


  ctx.fillStyle = "#000";
  ctx.font = `${pt(4)}px CardFont`;
  ctx.fillText(`${userName} ${star.source_id}`, 77 * SCALE, 610 * SCALE + pt(4));

  ctx.font = `${pt(3)}px CardFont`;
  ctx.fillText(TYPE_LABELS[star.type], 77 * SCALE, 695 * SCALE + pt(3));


  let y = 695 * SCALE + pt(3) * 2.35;
  for (const line of wrapText(ctx, TYPE_DESCRIPTIONS[star.type], 450 * SCALE)) {
    ctx.fillText(line, 77 * SCALE, y);
    y += pt(3) * 1.35;
  }

  const distLy = Math.round((1000 / star.parallax) * 3.26156);
  ctx.fillText(
    `Located in the Milky Way galaxy, ${distLy.toLocaleString()} light years away`,
    77 * SCALE, 800 * SCALE + pt(3)
  );

  return cv.toDataURL("image/jpeg", 0.9);
}


document.getElementById("submit-btn").addEventListener("click", async () => {
  const typeEl = document.querySelector('input[name="starType"]:checked');
  const name = document.getElementById("starName").value.trim();
  const hint = document.getElementById("form-hint");

  if (!typeEl || !name || !starPool) {
    hint.classList.remove("hidden");
    return;
  }
  hint.classList.add("hidden");

  document.getElementById("form-screen").classList.add("hidden");
  document.getElementById("loading-screen").classList.remove("hidden");

  try {
    const star = await claimStar(typeEl.value);
    star.type = typeEl.value;

    const starImg = await loadStarImage(star.ra, star.dec);
    const cardUrl = await buildCard(star, name, starImg);


    await db.ref("cards").push({
      starName: name,
      sourceId: star.source_id,
      card_b64: cardUrl,
      createdAt: Date.now()
    });

    const img = document.getElementById("result-card");
    img.src = cardUrl;
    document.getElementById("download-btn").href = cardUrl;
    document.getElementById("loading-screen").classList.add("hidden");
    document.getElementById("result-screen").classList.remove("hidden");
    requestAnimationFrame(() => img.classList.add("show"));
  } catch (e) {

    document.getElementById("loading-text").textContent =
      "the sky is busy — please refresh and try again ✦";
  }
});

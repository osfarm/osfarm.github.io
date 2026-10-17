// Visionneuse 3D de la maquette SCI Les Chênes Verts / REBUS (/fr/rebus/plan/).
// Les calques (GLB Draco) et les vues viennent de assets/3d/chenes-verts/scene.json, produit par la chaîne
// de la maquette (FreeCAD -> Blender). Chaque objet porte ses métadonnées dans les extras glTF (userData).
//
// Imports par URL complète (versions ESM de jsDelivr, three@0.170.0 figé) et non par importmap :
// l'en-tête du site charge déjà un module (header-banner.js), et Firefox ignore une importmap déclarée
// après le premier module. Les modules complémentaires importent tous /npm/three@0.170.0/+esm :
// une seule instance de three.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/+esm';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js/+esm';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/GLTFLoader.js/+esm';
import { DRACOLoader } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/DRACOLoader.js/+esm';

const racine = document.getElementById('maquette');
const BASE = racine.dataset.base;
const DRACO = racine.dataset.draco;
const zone = racine.querySelector('.maquette-vue');
const etat = racine.querySelector('.maquette-etat');
const fiche = racine.querySelector('.maquette-fiche');

const LIBELLES_VUES = {
  site: "Vue d'ensemble", rebus: 'REBUS', facade_sud: 'Façade sud',
  terrasse_est: 'Terrasse est', reseaux: 'Réseaux enterrés',
};
const LIBELLES_RESEAUX = {
  EP_actuel: 'Eaux pluviales (existant)', EP_travaux: 'EP et EU (travaux)', Eau_puit: 'Eau du puits',
  Adduction: "Adduction d'eau", Elec: 'Électricité', Elec_solaire: 'Électricité solaire',
};
const LIBELLES_CATEGORIES = {
  mur: 'Mur', muret: 'Muret', cloison: 'Cloison', bardage: 'Bardage', fenetre: 'Fenêtre', porte: 'Porte',
  toiture: 'Toiture', sol: 'Sol', poteau: 'Poteau', charpente: 'Charpente bois', arbre: 'Arbre',
  mobilier: 'Mobilier',
};
const LIBELLES_CHAMPS = {
  Etat_element: 'État', Hauteur_m: 'Hauteur', Toit: 'Toiture', Murs: 'Murs', materiau: 'Matériau', Calque: 'Réseau', Nature: 'Nature',
  Diametre_mm: 'Diamètre', Profondeur_min_m: 'Profondeur', Espece: 'Essence', Niveau_m: 'Niveau du sol',
  Surface_DXF_m2: 'Surface', Ident: 'Référence plan',
  Numero: 'N° sur le plan', Dimensions: 'Dimensions (l × p × h)', Piece: 'Pièce', Origine: 'Dimensions d’après',
};

function webglDisponible() {
  try {
    const c = document.createElement('canvas');
    // la raison d'un refus (accélération graphique désactivée, pilote bloqué…) n'est donnée que par cet événement
    c.addEventListener('webglcontextcreationerror', (e) => console.warn('[maquette] WebGL indisponible :', e.statusMessage));
    return !!(window.WebGL2RenderingContext && c.getContext('webgl2'));
  } catch (e) {
    return false;
  }
}

if (!webglDisponible()) {
  racine.classList.add('maquette-sans-webgl');
  etat.textContent = "La 3D demande WebGL, indisponible dans ce navigateur (accélération graphique désactivée ?). "
    + 'Voici un rendu de la maquette.';
} else {
  demarrer().catch((e) => {
    console.error(e);
    etat.textContent = 'La maquette n’a pas pu être chargée.';
  });
}

async function demarrer() {
  const config = await (await fetch(BASE + 'scene.json')).json();

  // Rendu
  const rendu = new THREE.WebGLRenderer({ antialias: true });
  rendu.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  rendu.outputColorSpace = THREE.SRGBColorSpace;
  rendu.toneMapping = THREE.AgXToneMapping;
  rendu.shadowMap.enabled = true;
  rendu.shadowMap.type = THREE.PCFSoftShadowMap;
  rendu.domElement.setAttribute('aria-label', "Maquette 3D du REBUS et de son site");
  zone.appendChild(rendu.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#d7e6f1');
  const brouillard = new THREE.Fog('#d7e6f1', 250, 900);
  scene.fog = brouillard;

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 3000);
  const controles = new OrbitControls(camera, rendu.domElement);
  controles.enableDamping = true;
  controles.maxPolarAngle = Math.PI * 0.495;
  controles.minDistance = 2;
  controles.maxDistance = 600;

  // Vue de dessus : projection orthographique, nord en haut (-z en glTF), on ne fait que glisser et zoomer
  const cameraPlan = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 2000);
  cameraPlan.up.set(0, 0, -1);
  const controlesPlan = new OrbitControls(cameraPlan, rendu.domElement);
  Object.assign(controlesPlan, { enableRotate: false, enableDamping: true, screenSpacePanning: true,
    minZoom: 0.15, maxZoom: 12, enabled: false });
  controlesPlan.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
  controlesPlan.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN };
  const DEMI_HAUTEUR_PLAN = 17;  // m visibles au-dessus et au-dessous du centre, au zoom 1 (le REBUS en entier)
  let enPlan = false;
  const cameraActive = () => (enPlan ? cameraPlan : camera);
  function cadrerPlan() {
    const a = zone.clientWidth / zone.clientHeight;
    const h = DEMI_HAUTEUR_PLAN * (a < 1 ? 1 / a : 1);  // en portrait, garder toute la largeur du bâtiment
    Object.assign(cameraPlan, { left: -h * a, right: h * a, top: h, bottom: -h });
    cameraPlan.updateProjectionMatrix();
  }

  // Lumière : ciel + soleil d'après-midi venant du sud-ouest (comme les rendus)
  scene.add(new THREE.HemisphereLight('#e8f2ff', '#56663f', 1.4));
  const soleil = new THREE.DirectionalLight('#fff4e0', 2.6);
  const az = THREE.MathUtils.degToRad(225), el = THREE.MathUtils.degToRad(38);
  const dir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
  const centreCafe = new THREE.Vector3(...config.vues.rebus.cible);
  soleil.position.copy(centreCafe).addScaledVector(dir, 200);
  soleil.target.position.copy(centreCafe);
  soleil.castShadow = true;
  soleil.shadow.mapSize.set(2048, 2048);
  Object.assign(soleil.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, near: 50, far: 400 });
  soleil.shadow.bias = -0.0005;
  scene.add(soleil, soleil.target);

  // Chargement des calques
  const draco = new DRACOLoader().setDecoderPath(DRACO);
  const chargeur = new GLTFLoader().setDRACOLoader(draco);
  const calques = {};
  let charges = 0;
  etat.textContent = `Chargement de la maquette… 0 / ${config.calques.length}`;
  await Promise.all(config.calques.map(async (c) => {
    const gltf = await chargeur.loadAsync(BASE + c.fichier);
    const objet = c.id === 'arbres' ? instancier(gltf.scene) : gltf.scene;
    objet.name = c.id;
    objet.visible = c.visible;
    objet.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = c.id !== 'terrain' && c.id !== 'reseaux';
      if (o.material && o.material.map) o.material.map.anisotropy = rendu.capabilities.getMaxAnisotropy();
      // surfaces posées sur le terrain (cour, routes, bassin) : toujours devant le terrain simplifié pour le web
      if ((metadonnees(o).label || o.name || '').includes('drape')) {
        o.material.polygonOffset = true;
        o.material.polygonOffsetFactor = -4;
        o.material.polygonOffsetUnits = -4;
      }
      o.receiveShadow = c.id === 'terrain' || c.id.startsWith('rebus');
    });
    calques[c.id] = objet;
    scene.add(objet);
    charges += 1;
    etat.textContent = `Chargement de la maquette… ${charges} / ${config.calques.length}`;
  }));
  etat.textContent = '';
  racine.classList.add('maquette-prete');

  // Matériaux du terrain : rendus translucides à la demande (pour voir les réseaux)
  const materiauxTerrain = [];
  calques.terrain.traverse((o) => { if (o.isMesh) materiauxTerrain.push(o.material); });
  function terrainTranslucide(oui) {
    for (const m of materiauxTerrain) {
      m.transparent = oui;
      m.opacity = oui ? 0.3 : 1;
      m.depthWrite = !oui;
      m.needsUpdate = true;
    }
  }

  // Toiture du REBUS : masquée en vue de dessus pour voir les pièces
  const toitures = [];
  for (const id of ['rebus_EDL', 'rebus_ESQ']) {
    calques[id].traverse((o) => { if (o.userData.Categorie === 'toiture') toitures.push(o); });
  }
  const afficherToitures = (oui) => toitures.forEach((o) => { o.visible = oui; });

  function modePlan(oui) {
    enPlan = oui;
    controles.enabled = !oui;
    controlesPlan.enabled = oui;
    scene.fog = oui ? null : brouillard;
    racine.classList.toggle('maquette-en-plan', oui);
    if (!oui) return;
    const c = centreCafe;
    cameraPlan.position.set(c.x, c.y + 500, c.z);
    controlesPlan.target.copy(c);
    cameraPlan.zoom = 1;
    cadrerPlan();
    controlesPlan.update();
  }

  construirePanneau(config, calques, terrainTranslucide, allerA, { modePlan, afficherToitures });

  // Vues et transitions
  function allerA(nom, immediat = false) {
    const v = config.vues[nom];
    if (!v) return;
    if (enPlan) modePlan(false);
    const de = { p: camera.position.clone(), c: controles.target.clone() };
    const vers = { p: new THREE.Vector3(...v.position), c: new THREE.Vector3(...v.cible) };
    // Vues composées pour un écran paysage : en portrait, la caméra recule pour garder le cadrage en largeur
    if (camera.aspect < 1.4) vers.p.sub(vers.c).multiplyScalar(Math.min(2.2, 1.4 / camera.aspect)).add(vers.c);
    if (immediat || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      camera.position.copy(vers.p); controles.target.copy(vers.c); controles.update(); return;
    }
    const t0 = performance.now();
    (function pas(t) {
      const k = Math.min(1, (t - t0) / 900);
      const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      camera.position.lerpVectors(de.p, vers.p, e);
      controles.target.lerpVectors(de.c, vers.c, e);
      if (k < 1) requestAnimationFrame(pas);
    })(t0);
  }
  camera.aspect = zone.clientWidth / zone.clientHeight;
  allerA('rebus', true);

  // Sélection d'un objet au clic (sans glisser)
  const rayon = new THREE.Raycaster();
  const souris = new THREE.Vector2();
  let appui = null;
  let surligne = null;
  rendu.domElement.addEventListener('pointerdown', (e) => { appui = [e.clientX, e.clientY]; });
  rendu.domElement.addEventListener('pointerup', (e) => {
    if (!appui || Math.hypot(e.clientX - appui[0], e.clientY - appui[1]) > 5) return;
    const r = rendu.domElement.getBoundingClientRect();
    souris.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    rayon.setFromCamera(souris, cameraActive());
    const visibles = Object.values(calques).filter((c) => c.visible);
    const touche = rayon.intersectObjects(visibles, true).find((i) => estVisible(i.object));
    if (surligne) { surligne.material = surligne.userData._materiau; surligne = null; }
    if (!touche || calques.terrain.getObjectById(touche.object.id)) { fiche.hidden = true; return; }
    if (touche.object.isInstancedMesh) {  // un arbre : fiche sans surlignage (le matériau est partagé)
      afficherFiche({ ...touche.object.userData.instances[touche.instanceId], Categorie: 'arbre' });
      return;
    }
    surligne = touche.object;
    surligne.userData._materiau = surligne.material;
    surligne.material = surligne.material.clone();
    surligne.material.emissive = new THREE.Color('#ffb000');
    surligne.material.emissiveIntensity = 0.45;
    const inst = touche.object.userData.instances;
    afficherFiche(inst ? { ...inst[touche.instanceId], Categorie: 'arbre' } : metadonnees(touche.object));
  });

  // Boucle et redimensionnement
  new ResizeObserver(() => {
    const { clientWidth: w, clientHeight: h } = zone;
    rendu.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    cadrerPlan();
  }).observe(zone);
  rendu.setAnimationLoop(() => {
    (enPlan ? controlesPlan : controles).update();
    rendu.render(scene, cameraActive());
  });
}

// Les milliers d'arbres partagent quelques modèles : un InstancedMesh par (géométrie, matériau)
// au lieu d'un objet par arbre. Les métadonnées de chaque arbre restent disponibles pour la fiche.
function instancier(racineArbres) {
  racineArbres.updateMatrixWorld(true);
  const groupes = new Map();
  racineArbres.traverse((o) => {
    if (!o.isMesh) return;
    const cle = o.geometry.uuid + '|' + o.material.uuid;
    if (!groupes.has(cle)) groupes.set(cle, { geometrie: o.geometry, materiau: o.material, matrices: [], meta: [] });
    const g = groupes.get(cle);
    g.matrices.push(o.matrixWorld.clone());
    g.meta.push(metadonnees(o));
  });
  const resultat = new THREE.Group();
  for (const g of groupes.values()) {
    const im = new THREE.InstancedMesh(g.geometrie, g.materiau, g.matrices.length);
    g.matrices.forEach((m, i) => im.setMatrixAt(i, m));
    im.userData.instances = g.meta;
    im.computeBoundingSphere();
    resultat.add(im);
  }
  return resultat;
}

function estVisible(o) {
  for (let p = o; p; p = p.parent) if (!p.visible) return false;
  return true;
}

function metadonnees(o) {
  for (let p = o; p; p = p.parent) if (p.userData && p.userData.label) return p.userData;
  return {};
}

function afficherFiche(m) {
  const lignes = [];
  for (const [cle, libelle] of Object.entries(LIBELLES_CHAMPS)) {
    let v = m[cle];
    if (v === undefined || v === '' || (cle === 'Ident' && (!m.Categorie || ['piece', 'mobilier'].includes(m.Categorie)))) continue;
    if (m.Categorie === 'mobilier' && ['Etat_element', 'materiau'].includes(cle)) continue;
    if (cle === 'Calque') v = LIBELLES_RESEAUX[v] || v;
    if (cle === 'Diametre_mm') v = `Ø ${v} mm`;
    if (cle === 'Profondeur_min_m') {
      const max = m.Profondeur_max_m;
      v = max && Math.abs(max - v) > 0.01 ? `${v.toFixed(2)} à ${max.toFixed(2)} m` : `${Number(v).toFixed(2)} m`;
    }
    if (cle === 'Hauteur_m') v = `${Number(v).toFixed(1).replace('.', ',')} m`;
    if (cle === 'Toit' || cle === 'Murs') v = String(v).replace(/_/g, ' ');
    if (cle === 'Niveau_m') v = `${v >= 0 ? '+' : ''}${Number(v).toFixed(2)} m`;
    if (cle === 'Surface_DXF_m2') v = `${String(v).replace('.', ',')} m²`;
    if (cle === 'Etat_element') v = { existant: 'existant', neuf: 'neuf (projet)', demoli: 'démoli', projet: 'projet' }[v] || v;
    lignes.push(`<dt>${libelle}</dt><dd>${echapper(String(v))}</dd>`);
  }
  let titre = LIBELLES_CATEGORIES[m.Categorie] || 'Élément';
  if (m.Categorie === 'piece') titre = m.Ident;
  else if (m.Categorie === 'mobilier') titre = m.Libelle;
  else if (m.Espece !== undefined) titre = 'Arbre';
  else if (m.Calque) titre = 'Canalisation';
  else if ((m.label || '').startsWith('SITE_regard')) titre = 'Regard';
  else if ((m.label || '').startsWith('SITE_batiment')) titre = m.Forme === 'jardin' ? 'Jardin' : 'Bâtiment voisin';
  else if ((m.label || '').startsWith('SITE_cloture')) titre = 'Clôture';
  fiche.innerHTML = `<button type="button" class="maquette-fermer" aria-label="Fermer">×</button>
    <strong>${echapper(titre || 'Élément')}</strong><dl>${lignes.join('') || '<dd>Pas de détail.</dd>'}</dl>`;
  fiche.hidden = false;
  fiche.querySelector('.maquette-fermer').addEventListener('click', () => { fiche.hidden = true; });
}

function echapper(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function construirePanneau(config, calques, terrainTranslucide, allerA, plan) {
  const panneau = racine.querySelector('.maquette-panneau');

  // État du REBUS
  const etats = panneau.querySelector('.maquette-etats');
  for (const [id, libelle] of [['rebus_ESQ', 'Projet'], ['rebus_EDL', 'État actuel']]) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn-sm';
    b.textContent = libelle;
    b.setAttribute('aria-pressed', String(calques[id].visible));
    b.addEventListener('click', () => {
      calques.rebus_ESQ.visible = id === 'rebus_ESQ';
      calques.rebus_EDL.visible = id === 'rebus_EDL';
      if (caseMobilier) {  // le mobilier fait partie du projet : indisponible en état actuel
        caseMobilier.disabled = id !== 'rebus_ESQ';
        calques.mobilier.visible = id === 'rebus_ESQ' && caseMobilier.checked;
      }
      etats.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    });
    etats.appendChild(b);
  }

  // Calques
  const liste = panneau.querySelector('.maquette-calques');
  const sousReseaux = panneau.querySelector('.maquette-reseaux');
  let caseReseaux = null;
  let caseMobilier = null;
  for (const c of config.calques) {
    if (c.id.startsWith('rebus')) continue;
    const l = caseACocher(c.libelle, c.visible, (oui) => {
      calques[c.id].visible = oui;
      if (c.id === 'reseaux') {
        sousReseaux.hidden = !oui;
        terrainTranslucide(oui);
        translucide.querySelector('input').checked = oui;
      }
    });
    if (c.id === 'reseaux') caseReseaux = l.querySelector('input');
    if (c.id === 'mobilier') caseMobilier = l.querySelector('input');
    liste.appendChild(l);
  }
  const translucide = caseACocher('Terrain translucide', false, terrainTranslucide);
  liste.appendChild(translucide);
  const toiture = caseACocher('Toiture du REBUS', true, plan.afficherToitures);
  liste.appendChild(toiture);

  // Réseaux : un interrupteur par réseau, avec sa couleur
  for (const r of config.reseaux) {
    const l = caseACocher(LIBELLES_RESEAUX[r.calque] || r.calque, true, (oui) => {
      calques.reseaux.traverse((o) => { if (o.userData.Calque === r.calque) o.visible = oui; });
    }, r.couleur);
    sousReseaux.appendChild(l);
  }
  sousReseaux.hidden = !calques.reseaux.visible;

  // Vues
  const vues = panneau.querySelector('.maquette-vues');
  const dessus = document.createElement('button');
  for (const nom of Object.keys(config.vues)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn-sm';
    b.textContent = LIBELLES_VUES[nom] || nom;
    b.addEventListener('click', () => {
      if (nom === 'reseaux' && !calques.reseaux.visible) caseReseaux.click();
      basculerPlan(false);
      allerA(nom);
    });
    vues.appendChild(b);
  }
  // Vue de dessus : plan 2D de la maquette, toiture du REBUS masquée
  dessus.type = 'button';
  dessus.className = 'btn btn-sm';
  dessus.textContent = 'Vue de dessus (plan)';
  dessus.setAttribute('aria-pressed', 'false');
  function basculerPlan(oui) {
    if ((dessus.getAttribute('aria-pressed') === 'true') === oui) return;
    dessus.setAttribute('aria-pressed', String(oui));
    plan.modePlan(oui);
    const caseToiture = toiture.querySelector('input');
    if (caseToiture.checked === oui) caseToiture.click();  // toiture masquée en plan, rétablie en 3D
  }
  dessus.addEventListener('click', () => {
    const oui = dessus.getAttribute('aria-pressed') !== 'true';
    basculerPlan(oui);
    if (!oui) allerA('rebus');
  });
  vues.appendChild(dessus);
}

function caseACocher(libelle, coche, auChangement, couleur) {
  const l = document.createElement('label');
  l.className = 'maquette-case';
  const i = document.createElement('input');
  i.type = 'checkbox';
  i.checked = coche;
  i.addEventListener('change', () => auChangement(i.checked));
  l.appendChild(i);
  if (couleur) {
    const p = document.createElement('span');
    p.className = 'maquette-pastille';
    p.style.background = couleur;
    l.appendChild(p);
  }
  l.appendChild(document.createTextNode(' ' + libelle));
  return l;
}

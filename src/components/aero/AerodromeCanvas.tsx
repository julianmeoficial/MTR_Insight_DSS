"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { RunwayRef, TerminalRef } from "@/domain/erpm";
import { gsap } from "@/lib/gsap";
import styles from "./AerodromeScene.module.css";

export type AerodromeVolumeId =
  | "rwy1"
  | "rwy2"
  | "t1"
  | "t2"
  | "cargo"
  | "tower"
  | "hub"
  | "support"
  | null;

export type AerodromeView = "overview" | "plan" | "landside";

export type AerodromeStatus = "loading" | "ready" | "error";

type Props = {
  runways: RunwayRef[];
  terminals: TerminalRef[];
  /** Published cargo warehouses such as B104; one bay each */
  cargoWarehouses: readonly string[];
  showProjected: boolean;
  highlight?: AerodromeVolumeId;
  view: AerodromeView;
  onSelect: (id: AerodromeVolumeId) => void;
  onStatus: (status: AerodromeStatus) => void;
  /** HTML sign tags that follow the camera (no text in WebGL) */
  tags: Record<Exclude<AerodromeVolumeId, null>, string>;
};

/** Scene units: 1 unit = 10 m. Heights are drawn 3× to read from above. */
const U = 0.1;
const V = 3 * U;
/**
 * Centerline spacing of the parallel runways. Above the ICAO 1 035 m for
 * independent approaches and wide enough for a midfield terminal complex.
 */
const SEPARATION_M = 1_500;
const TAXI_OFFSET_M = 160;
/** Expansion layout, meters along z from RWY 14/32 toward RWY2 */
const LAYOUT = {
  t1Apron: { x: -170, z: 265 },
  t1Curb: 420,
  gtc: { x: -110, z: 690 },
  t2Curb: 975,
  t2Head: 1040,
  t2Pier: 1100,
  t2Apron: 1205,
  walkX: -110,
  supportX: 590,
  crossTaxiX: 790,
} as const;

type Palette = {
  light: boolean;
  bg: THREE.Color;
  grass: THREE.Color;
  park: THREE.Color;
  tree: THREE.Color;
  strip: THREE.Color;
  asphalt: THREE.Color;
  road: THREE.Color;
  concrete: THREE.Color;
  marking: THREE.Color;
  taxiLine: THREE.Color;
  facade: THREE.Color;
  roof: THREE.Color;
  glass: THREE.Color;
  cargoRoof: THREE.Color;
  arff: THREE.Color;
  dock: THREE.Color;
  livery: THREE.Color;
  car: THREE.Color;
  edgeLight: THREE.Color;
  greenLight: THREE.Color;
  redLight: THREE.Color;
  accent: THREE.Color;
};

function readPalette(): Palette {
  const css = getComputedStyle(document.documentElement);
  const c = (name: string, fallback: string) => {
    const raw = css.getPropertyValue(name).trim();
    try {
      return new THREE.Color(raw || fallback);
    } catch {
      return new THREE.Color(fallback);
    }
  };
  const bg = c("--bg", "#08090a");
  const s1 = c("--surface-1", "#0f1011");
  const s2 = c("--surface-2", "#141516");
  const s4 = c("--surface-4", "#212226");
  const fg = c("--fg", "#f7f8f8");
  const fg2 = c("--fg-2", "#b4b8bf");
  const fg3 = c("--fg-3", "#8a8f98");
  const fg4 = c("--fg-4", "#62666d");
  const ok = c("--ok", "#4cc38a");
  const accent = c("--accent", "#f2c230");
  const crit = c("--crit", "#eb5757");
  const light = (s1.r + s1.g + s1.b) / 3 > 0.5;

  // Architectural-model look: sage field, charcoal pavement, white roofs.
  const grass = light ? s4.clone().lerp(ok, 0.42) : s1.clone().lerp(ok, 0.06);
  const park = grass.clone().lerp(ok, light ? 0.25 : 0.1);
  // Steel-teal glazing: blue alone drifts toward violet under white light.
  const glass = c("--series-3", "#4fc1b2")
    .lerp(c("--series-1", "#6f97f0"), 0.35)
    .lerp(fg3, 0.35)
    .lerp(light ? s2 : bg, light ? 0.2 : 0.45);
  const asphalt = light ? fg3.clone().lerp(fg, 0.28) : s4.clone().lerp(fg, 0.06);
  const concrete = light ? s4.clone().lerp(fg3, 0.2) : s4.clone().lerp(fg, 0.17);
  const facade = light ? fg4.clone().lerp(s2, 0.3) : s4.clone().lerp(fg, 0.3);
  return {
    light,
    bg,
    grass,
    park,
    tree: park.clone().lerp(ok, light ? 0.3 : 0.1).lerp(light ? fg : bg, light ? 0.2 : 0.25),
    strip: grass.clone().lerp(light ? s2 : s4, 0.5),
    asphalt,
    road: asphalt.clone().lerp(concrete, 0.3),
    concrete,
    marking: light ? s2.clone() : fg.clone(),
    taxiLine: accent.clone(),
    facade,
    roof: light ? s2.clone() : fg3.clone().lerp(s4, 0.15),
    glass,
    cargoRoof: c("--series-4", "#c8894b"),
    arff: crit.clone().lerp(facade, 0.2),
    dock: bg.clone().lerp(fg3, 0.15),
    livery: light ? s2.clone() : fg.clone().lerp(fg2, 0.15),
    car: fg3.clone().lerp(light ? s2 : s4, 0.2),
    edgeLight: fg.clone().lerp(accent, 0.2),
    greenLight: ok.clone(),
    redLight: crit,
    accent,
  };
}

type Volume = {
  id: Exclude<AerodromeVolumeId, null>;
  group: THREE.Group;
  /** Footprint for the selection ring, in scene units */
  footprint: { x: number; z: number; w: number; d: number };
  anchor: THREE.Vector3;
  projected: boolean;
};

/** Deterministic jitter so trees and cars sit the same on every load. */
function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Orbitable schematic aerodrome built from the infrastructure data: runway
 * lengths and widths, terminals, cargo bays, aprons, lights and parked
 * aircraft. The expansion adds a parallel runway and a midfield complex
 * (T2, intermodal hub, skybridge, cargo belt, support zone). Numbers stay
 * in the HTML sidecar (DESIGN.md §7).
 */
export function AerodromeCanvas({
  runways,
  terminals,
  cargoWarehouses,
  showProjected,
  highlight,
  view,
  onSelect,
  onStatus,
  tags,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const tagLayerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<{
    setProjected: (on: boolean) => void;
    setHighlight: (id: AerodromeVolumeId) => void;
    setView: (v: AerodromeView, animate: boolean) => void;
  } | null>(null);
  const selectRef = useRef(onSelect);
  const statusRef = useRef(onStatus);
  const state = useRef({ showProjected, highlight, view, runways, terminals, cargoWarehouses, tags });

  // Declared before the build effect so the build reads current props.
  useEffect(() => {
    selectRef.current = onSelect;
    statusRef.current = onStatus;
    state.current = { showProjected, highlight, view, runways, terminals, cargoWarehouses, tags };
  });

  /** Rebuild WebGL only when the infrastructure geometry changes. */
  const geometryKey = JSON.stringify({
    r: runways.map((r) => [r.id, r.lengthM, r.widthM, r.status]),
    t: terminals.map((t) => [t.id, t.widebodyStands, t.status]),
    c: cargoWarehouses.length,
  });

  useEffect(() => {
    const host = hostRef.current;
    const tagLayer = tagLayerRef.current;
    if (!host || !tagLayer) return;
    const { runways, terminals, cargoWarehouses, tags } = state.current;
    const initial = { current: state.current };
    statusRef.current("loading");

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    } catch {
      statusRef.current("error");
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const canvasEl = renderer.domElement;
    canvasEl.className = styles.glCanvas;
    host.insertBefore(canvasEl, tagLayer);

    let palette = readPalette();
    const scene = new THREE.Scene();
    scene.background = palette.bg;
    scene.fog = new THREE.Fog(palette.bg, 520, 1500);

    const camera = new THREE.PerspectiveCamera(36, 1, 1, 4000);
    const controls = new OrbitControls(camera, canvasEl);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI * 0.46;
    controls.minDistance = 30;
    controls.maxDistance = 900;
    controls.screenSpacePanning = false;

    const hemi = new THREE.HemisphereLight(0xffffff, 0x222222, 1);
    const sun = new THREE.DirectionalLight(0xfff7ec, 1.5);
    sun.position.set(-180, 260, -60);
    sun.target.position.set(20, 0, 70);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.0005;
    const sc = sun.shadow.camera;
    sc.left = -280;
    sc.right = 280;
    sc.top = 200;
    sc.bottom = -200;
    sc.near = 10;
    sc.far = 900;
    scene.add(hemi, sun, sun.target);

    // Materials keyed by role so a theme change only recolors. Lambert
    // shaders compile in a fraction of the time of PBR ones.
    const mats = {
      grass: new THREE.MeshLambertMaterial(),
      park: new THREE.MeshLambertMaterial(),
      tree: new THREE.MeshLambertMaterial(),
      strip: new THREE.MeshLambertMaterial(),
      asphalt: new THREE.MeshLambertMaterial(),
      road: new THREE.MeshLambertMaterial(),
      concrete: new THREE.MeshLambertMaterial(),
      marking: new THREE.MeshBasicMaterial(),
      taxiLine: new THREE.MeshBasicMaterial(),
      facade: new THREE.MeshLambertMaterial(),
      roof: new THREE.MeshLambertMaterial(),
      glass: new THREE.MeshLambertMaterial(),
      cargoRoof: new THREE.MeshLambertMaterial(),
      arff: new THREE.MeshLambertMaterial(),
      dock: new THREE.MeshLambertMaterial(),
      livery: new THREE.MeshLambertMaterial(),
      car: new THREE.MeshLambertMaterial(),
      taxi: new THREE.MeshLambertMaterial(),
      parcel: new THREE.MeshLambertMaterial(),
      edgeLight: new THREE.MeshBasicMaterial(),
      greenLight: new THREE.MeshBasicMaterial(),
      redLight: new THREE.MeshBasicMaterial(),
      ring: new THREE.LineBasicMaterial(),
    };

    function paint(p: Palette) {
      scene.background = p.bg;
      (scene.fog as THREE.Fog).color = p.bg;
      mats.grass.color.copy(p.grass);
      mats.park.color.copy(p.park);
      mats.tree.color.copy(p.tree);
      mats.strip.color.copy(p.strip);
      mats.asphalt.color.copy(p.asphalt);
      mats.road.color.copy(p.road);
      mats.concrete.color.copy(p.concrete);
      mats.marking.color.copy(p.marking);
      mats.taxiLine.color.copy(p.taxiLine);
      mats.facade.color.copy(p.facade);
      mats.roof.color.copy(p.roof);
      mats.glass.color.copy(p.glass);
      mats.cargoRoof.color.copy(p.cargoRoof);
      mats.arff.color.copy(p.arff);
      mats.dock.color.copy(p.dock);
      mats.livery.color.copy(p.livery);
      mats.car.color.copy(p.car);
      mats.taxi.color.copy(p.accent);
      mats.parcel.color.copy(p.cargoRoof);
      mats.edgeLight.color.copy(p.edgeLight);
      mats.greenLight.color.copy(p.greenLight);
      mats.redLight.color.copy(p.redLight);
      mats.ring.color.copy(p.accent);
      hemi.groundColor.copy(p.bg);
      // A light page needs more fill so the field does not read muddy.
      hemi.intensity = p.light ? 1.35 : 1.1;
    }
    paint(palette);

    const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
    const tmp = new THREE.Object3D();

    /** Flat slab at ground level (meters in, units out). */
    function slab(
      parent: THREE.Object3D,
      mat: THREE.Material,
      xM: number,
      zM: number,
      wM: number,
      dM: number,
      y = 0.02,
      thick = 0.04,
    ) {
      const m = new THREE.Mesh(box(wM * U, thick, dM * U), mat);
      m.position.set(xM * U, y + thick / 2, zM * U);
      m.receiveShadow = true;
      parent.add(m);
      return m;
    }

    function building(
      parent: THREE.Object3D,
      xM: number,
      zM: number,
      wM: number,
      dM: number,
      hM: number,
      wall: THREE.Material,
      roof: THREE.Material,
    ) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(box(wM * U, hM * V, dM * U), wall);
      body.position.y = (hM * V) / 2;
      body.castShadow = true;
      body.receiveShadow = true;
      const cap = new THREE.Mesh(box(wM * U + 0.3, 0.25, dM * U + 0.3), roof);
      cap.position.y = hM * V + 0.12;
      cap.castShadow = true;
      g.add(body, cap);
      g.position.set(xM * U, 0, zM * U);
      parent.add(g);
      return g;
    }

    /** One draw call for many copies; positions in meters, y in units. */
    function scatter(
      parent: THREE.Object3D,
      geo: THREE.BufferGeometry,
      mat: THREE.Material,
      points: readonly (readonly [number, number, number?, number?])[],
      shadow = false,
    ) {
      const mesh = new THREE.InstancedMesh(geo, mat, Math.max(1, points.length));
      points.forEach(([x, z, y = 0, rot = 0], i) => {
        tmp.position.set(x * U, y, z * U);
        tmp.rotation.set(0, rot, 0);
        tmp.updateMatrix();
        mesh.setMatrixAt(i, tmp.matrix);
      });
      mesh.count = points.length;
      mesh.castShadow = shadow;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    }

    /** Low-poly tree row or grove, seeded so it never shifts. */
    const treeGeo = new THREE.ConeGeometry(0.75, 2.4, 6);
    treeGeo.translate(0, 1.2, 0);
    function trees(parent: THREE.Object3D, pts: [number, number][], seed: number) {
      const r = rand(seed);
      const jittered = pts.map(([x, z]) => [x + (r() - 0.5) * 8, z + (r() - 0.5) * 8] as const);
      scatter(parent, treeGeo, mats.tree, jittered, true);
    }
    function row(x0: number, x1: number, z: number, step: number): [number, number][] {
      const out: [number, number][] = [];
      for (let x = x0; x <= x1; x += step) out.push([x, z]);
      return out;
    }
    function col(x: number, z0: number, z1: number, step: number): [number, number][] {
      const out: [number, number][] = [];
      for (let z = z0; z <= z1; z += step) out.push([x, z]);
      return out;
    }

    /** Surface lot with cars parked in rows. */
    function parkingLot(parent: THREE.Object3D, xM: number, zM: number, wM: number, dM: number, seed: number) {
      slab(parent, mats.road, xM, zM, wM, dM, 0.015, 0.03);
      const r = rand(seed);
      const cars: [number, number][] = [];
      const rows = Math.floor(dM / 18);
      const perRow = Math.floor(wM / 4);
      for (let j = 0; j < rows; j += 1) {
        for (let i = 0; i < perRow; i += 1) {
          if (r() < 0.28) continue;
          cars.push([xM - wM / 2 + 2 + i * 4, zM - dM / 2 + 6 + j * 18]);
        }
      }
      scatter(parent, box(0.22, 0.16, 0.45), mats.car, cars.map(([x, z]) => [x, z, 0.1] as const));
    }

    /** Simple low-poly airliner, length and span in meters; nose at +x. */
    function aircraft(lengthM: number, spanM: number) {
      const g = new THREE.Group();
      const fus = new THREE.Mesh(
        new THREE.CylinderGeometry(lengthM * 0.045 * U, lengthM * 0.045 * U, lengthM * U, 10),
        mats.livery,
      );
      fus.rotation.z = Math.PI / 2;
      fus.position.y = lengthM * 0.07 * U;
      const wing = new THREE.Mesh(box(lengthM * 0.16 * U, 0.08, spanM * U), mats.livery);
      wing.position.set(lengthM * 0.04 * U, lengthM * 0.05 * U, 0);
      const stab = new THREE.Mesh(box(lengthM * 0.08 * U, 0.06, spanM * 0.32 * U), mats.livery);
      stab.position.set(-lengthM * 0.44 * U, lengthM * 0.09 * U, 0);
      const fin = new THREE.Mesh(box(lengthM * 0.1 * U, lengthM * 0.13 * U, 0.08), mats.livery);
      fin.position.set(-lengthM * 0.44 * U, lengthM * 0.15 * U, 0);
      for (const m of [fus, wing, stab, fin]) {
        m.castShadow = true;
        g.add(m);
      }
      return g;
    }

    const volumes: Volume[] = [];
    function volume(
      id: Exclude<AerodromeVolumeId, null>,
      group: THREE.Group,
      footprint: Volume["footprint"],
      anchorY: number,
      projected: boolean,
    ) {
      group.traverse((o) => {
        o.userData.volumeId = id;
      });
      volumes.push({
        id,
        group,
        footprint,
        anchor: new THREE.Vector3(footprint.x, anchorY, footprint.z),
        projected,
      });
    }

    const rwy1 = runways.find((r) => r.id === "RWY1")!;
    const rwy2 = runways.find((r) => r.id === "RWY2");
    const t2 = terminals.find((t) => t.id === "T2");

    // Ground
    const groundGroup = new THREE.Group();
    scene.add(groundGroup);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(3200, 3200), mats.grass);
    ground.rotation.x = -Math.PI / 2;
    ground.position.z = 70;
    ground.receiveShadow = true;
    groundGroup.add(ground);

    function runwayGroup(r: RunwayRef, zM: number, xM: number) {
      const g = new THREE.Group();
      const L = r.lengthM;
      const W = r.widthM;
      slab(g, mats.strip, xM, zM, L + 120, Math.max(150, W * 3), 0.005, 0.01);
      slab(g, mats.asphalt, xM, zM, L, W);
      // Threshold piano keys, designation bars, centerline dashes
      const keys = Math.max(4, Math.round(W / 6));
      const keyPts: [number, number, number][] = [];
      for (const end of [-1, 1]) {
        for (let i = 0; i < keys; i += 1) {
          keyPts.push([xM + end * (L / 2 - 25), zM - W / 2 + (W / keys) * (i + 0.5), 0.075]);
        }
      }
      scatter(g, box(30 * U, 0.02, (W / (keys * 2.2)) * U), mats.marking, keyPts);
      // Touchdown zone bars at 150 m and 300 m from each threshold
      const tdz: [number, number, number][] = [];
      for (const end of [-1, 1]) {
        for (const d of [150, 300]) {
          for (const side of [-1, 1]) tdz.push([xM + end * (L / 2 - d), zM + side * W * 0.25, 0.075]);
        }
      }
      scatter(g, box(22 * U, 0.02, W * 0.12 * U), mats.marking, tdz);
      const dashCount = Math.floor((L - 160) / 60);
      const dashes: [number, number, number][] = [];
      for (let i = 0; i < dashCount; i += 1) dashes.push([xM - L / 2 + 80 + i * 60, zM, 0.075]);
      scatter(g, box(30 * U, 0.02, 0.9 * U), mats.marking, dashes);

      const spacing = 60;
      const perSide = Math.floor(L / spacing) + 1;
      const edge: [number, number, number][] = [];
      for (const side of [-1, 1]) {
        for (let i = 0; i < perSide; i += 1) edge.push([xM - L / 2 + i * spacing, zM + side * (W / 2 + 3), 0.2]);
      }
      const lamp = box(0.5, 0.35, 0.5);
      scatter(g, lamp, mats.edgeLight, edge);
      const barCount = Math.round(W / 4);
      const green: [number, number, number][] = [];
      const red: [number, number, number][] = [];
      for (let i = 0; i < barCount; i += 1) {
        const zz = zM - W / 2 + (W / (barCount - 1)) * i;
        green.push([xM - L / 2 - 4, zz, 0.2]);
        red.push([xM + L / 2 + 4, zz, 0.2]);
      }
      scatter(g, lamp, mats.greenLight, green);
      scatter(g, lamp, mats.redLight, red);
      // Approach light bar before the threshold
      const approach: [number, number, number][] = [];
      for (let i = 1; i <= 10; i += 1) approach.push([xM - L / 2 - 30 * i, zM, 0.2]);
      scatter(g, lamp, mats.edgeLight, approach);
      // PAPI: four units left of the threshold, aiming point side
      for (let i = 0; i < 4; i += 1) {
        const papi = new THREE.Mesh(box(1, 0.6, 1), i < 2 ? mats.redLight : mats.edgeLight);
        papi.position.set((xM - L / 2 + 300) * U, 0.3, (zM - W / 2 - 15 - i * 9) * U);
        g.add(papi);
      }
      return g;
    }

    /** Taxiway slab with its yellow centerline. */
    function taxiway(parent: THREE.Object3D, xM: number, zM: number, wM: number, dM: number) {
      slab(parent, mats.asphalt, xM, zM, wM, dM);
      if (wM >= dM) slab(parent, mats.taxiLine, xM, zM, wM, 0.8, 0.07, 0.01);
      else slab(parent, mats.taxiLine, xM, zM, 0.8, dM, 0.07, 0.01);
    }

    // ── Existing airside: RWY 14/32, taxiway A, T1, cargo, tower
    const rwy1Group = runwayGroup(rwy1, 0, 0);
    scene.add(rwy1Group);
    volume("rwy1", rwy1Group, { x: 0, z: 0, w: rwy1.lengthM * U, d: rwy1.widthM * U }, 2, false);

    const taxiA = new THREE.Group();
    const taxiLen = rwy1.lengthM * 0.86;
    taxiway(taxiA, 0, TAXI_OFFSET_M, taxiLen, 23);
    for (const x of [-taxiLen / 2 + 20, -260, 320, taxiLen / 2 - 20]) {
      taxiway(taxiA, x, TAXI_OFFSET_M / 2, 23, TAXI_OFFSET_M - rwy1.widthM / 2);
    }
    scene.add(taxiA);

    // T1: apron with stands and ERJ-145s, two-level terminal, glazing
    const t1Group = new THREE.Group();
    const { x: apronX, z: apronZ } = LAYOUT.t1Apron;
    slab(t1Group, mats.concrete, apronX, apronZ, 340, 150);
    slab(t1Group, mats.asphalt, apronX, TAXI_OFFSET_M + 37, 40, 60);
    for (let i = 0; i < 5; i += 1) {
      const sx = apronX - 140 + i * 70;
      slab(t1Group, mats.taxiLine, sx, apronZ + 5, 0.8, 90, 0.07, 0.01);
      if (i < 4) {
        const plane = aircraft(30, 20);
        plane.position.set(sx * U, 0.06, (apronZ + 10) * U);
        plane.rotation.y = -Math.PI / 2;
        t1Group.add(plane);
      }
    }
    const t1Bldg = building(t1Group, apronX, apronZ + 105, 200, 50, 12, mats.facade, mats.roof);
    const glazing = new THREE.Mesh(box(190 * U, 5 * V, 0.15), mats.glass);
    glazing.position.set(0, 6 * V, -25 * U - 0.08);
    t1Bldg.add(glazing);
    building(t1Group, apronX - 30, apronZ + 105, 110, 36, 18, mats.facade, mats.roof);
    // Curbside canopy
    const canopy = new THREE.Mesh(box(160 * U, 0.15, 12 * U), mats.roof);
    canopy.position.set(apronX * U, 6 * V, (apronZ + 136) * U);
    canopy.castShadow = true;
    t1Group.add(canopy);
    scene.add(t1Group);
    volume("t1", t1Group, { x: apronX * U, z: (apronZ + 40) * U, w: 34, d: 24 }, 6, false);

    // Control tower beside the T1 apron
    const tower = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 32 * V, 12), mats.facade);
    shaft.position.y = 16 * V;
    shaft.castShadow = true;
    const cab = new THREE.Mesh(new THREE.CylinderGeometry(2, 1.6, 5 * V, 8), mats.glass);
    cab.position.y = 34 * V;
    const cabRoof = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 0.4, 8), mats.roof);
    cabRoof.position.y = 36.6 * V;
    tower.add(shaft, cab, cabRoof);
    tower.position.set((apronX - 230) * U, 0, (apronZ + 30) * U);
    scene.add(tower);
    volume("tower", tower, { x: (apronX - 230) * U, z: (apronZ + 30) * U, w: 6, d: 6 }, 16, false);

    // Cargo terminal: one bay per published warehouse, dock doors, apron
    const cargoGroup = new THREE.Group();
    const bays = Math.max(1, cargoWarehouses.length);
    const bayW = 45;
    const cargoX = 170;
    const cargoZ = 250;
    slab(cargoGroup, mats.concrete, cargoX, cargoZ, bays * bayW + 80, 120);
    slab(cargoGroup, mats.asphalt, cargoX, TAXI_OFFSET_M + 30, 30, 50);
    for (let i = 0; i < bays; i += 1) {
      const bx = cargoX - ((bays - 1) * bayW) / 2 + i * bayW;
      const bay = building(cargoGroup, bx, cargoZ + 85, bayW - 4, 40, 9, mats.facade, mats.cargoRoof);
      for (let d = 0; d < 3; d += 1) {
        const door = new THREE.Mesh(box(8 * U, 5 * V, 0.15), mats.dock);
        door.position.set((-12 + d * 12) * U, 2.5 * V, -20 * U - 0.08);
        bay.add(door);
      }
    }
    const freighter = aircraft(40, 34);
    freighter.position.set(cargoX * U, 0.06, (cargoZ - 10) * U);
    freighter.rotation.y = -Math.PI / 2;
    cargoGroup.add(freighter);
    scene.add(cargoGroup);
    volume("cargo", cargoGroup, { x: cargoX * U, z: (cargoZ + 30) * U, w: (bays * bayW + 80) * U, d: 16 }, 4, false);

    // Existing landside: access road, surface lot, tree rows
    slab(groundGroup, mats.road, -40, LAYOUT.t1Curb, 900, 16, 0.01, 0.02);
    slab(groundGroup, mats.marking, -40, LAYOUT.t1Curb, 900, 0.5, 0.032, 0.005);
    parkingLot(groundGroup, apronX, 470, 220, 56, 11);
    trees(
      groundGroup,
      // Gaps leave room for the surface lot and the expansion taxi bay
      row(-470, 380, 440, 26).filter(([x]) => (x < apronX - 120 || x > apronX + 120) && (x < -45 || x > 85)),
      3,
    );

    // ── Expansion: RWY 14L/32R north, midfield T2, intermodal hub, support
    const projectedGroup = new THREE.Group();
    scene.add(projectedGroup);
    const z2 = SEPARATION_M;
    const x2 = rwy2 ? (rwy2.lengthM - rwy1.lengthM) / 8 : 0;
    const taxiBZ = z2 - 190;

    if (rwy2) {
      const rwy2Group = runwayGroup(rwy2, z2, x2);
      projectedGroup.add(rwy2Group);
      volume("rwy2", rwy2Group, { x: x2 * U, z: z2 * U, w: rwy2.lengthM * U, d: rwy2.widthM * U }, 2, true);

      const taxiB = new THREE.Group();
      const lenB = rwy2.lengthM * 0.9;
      taxiway(taxiB, x2, taxiBZ, lenB, 30);
      // Rapid exits and end connectors
      for (const x of [x2 - lenB / 2 + 20, x2 - 700, x2 + 200, x2 + 1000, x2 + lenB / 2 - 20]) {
        taxiway(taxiB, x, (taxiBZ + z2 - rwy2.widthM / 2) / 2, 25, z2 - rwy2.widthM / 2 - taxiBZ);
      }
      // Crossfield taxiway: airside link between both runway systems
      const cx = LAYOUT.crossTaxiX;
      taxiway(taxiB, cx, (TAXI_OFFSET_M + taxiBZ) / 2, 30, taxiBZ - TAXI_OFFSET_M);
      projectedGroup.add(taxiB);
    }

    if (t2) {
      const t2Group = new THREE.Group();
      const pierW = 760;
      const pierX = 90;
      // Apron, stands, aircraft and jet bridges
      slab(t2Group, mats.concrete, pierX, LAYOUT.t2Apron, pierW + 40, 170);
      const pierFace = LAYOUT.t2Pier + 18;
      const stands: { x: number; L: number; span: number }[] = [];
      let sx = pierX - pierW / 2 + 50;
      for (let i = 0; i < Math.max(1, t2.widebodyStands); i += 1) {
        stands.push({ x: sx, L: 67, span: 65 });
        sx += 85;
      }
      while (sx < pierX + pierW / 2 - 25) {
        stands.push({ x: sx, L: 38, span: 36 });
        sx += 50;
      }
      for (const s of stands) {
        slab(t2Group, mats.taxiLine, s.x, pierFace + 50, 0.8, 100, 0.07, 0.01);
        const plane = aircraft(s.L, s.span);
        plane.position.set(s.x * U, 0.06, (pierFace + 10 + s.L / 2) * U);
        plane.rotation.y = Math.PI / 2;
        t2Group.add(plane);
        const bridge = new THREE.Mesh(box(4 * U, 4 * V, 22 * U), mats.roof);
        bridge.position.set((s.x + s.L * 0.06) * U, 5 * V, (pierFace + 9) * U);
        bridge.rotation.y = 0.35;
        bridge.castShadow = true;
        t2Group.add(bridge);
      }
      // Linear pier with full-height glazing on the airside face
      building(t2Group, pierX, LAYOUT.t2Pier, pierW, 36, 12, mats.facade, mats.roof);
      const pierGlass = new THREE.Mesh(box(pierW * U, 8 * V, 0.15), mats.glass);
      pierGlass.position.set(pierX * U, 5 * V, (pierFace + 0.2) * U);
      t2Group.add(pierGlass);
      // Headhouse: glass hall under a floating roof that overhangs the curb
      const hall = new THREE.Mesh(box(300 * U, 18 * V, 80 * U), mats.glass);
      hall.position.set(pierX * U, 9 * V, LAYOUT.t2Head * U);
      hall.castShadow = true;
      const roofSlab = new THREE.Mesh(box(380 * U, 0.5, 140 * U), mats.roof);
      roofSlab.position.set(pierX * U, 20 * V, (LAYOUT.t2Head - 12) * U);
      roofSlab.castShadow = true;
      roofSlab.receiveShadow = true;
      // Roof columns (tree columns of modern terminals)
      scatter(
        t2Group,
        new THREE.CylinderGeometry(0.25, 0.4, 20 * V, 6).translate(0, 10 * V, 0),
        mats.roof,
        [-150, -75, 0, 75, 150].map((dx) => [pierX + dx, LAYOUT.t2Head - 75] as const),
        true,
      );
      // Departures viaduct along the curb
      const deck = new THREE.Mesh(box(320 * U, 0.3, 16 * U), mats.road);
      deck.position.set(pierX * U, 6 * V, (LAYOUT.t2Curb + 4) * U);
      deck.castShadow = true;
      deck.receiveShadow = true;
      t2Group.add(hall, roofSlab, deck);
      scatter(
        t2Group,
        box(0.4, 6 * V, 0.4).translate(0, 3 * V, 0),
        mats.concrete,
        row(pierX - 150, pierX + 150, LAYOUT.t2Curb + 4, 30).map(([x, z]) => [x, z] as const),
      );
      projectedGroup.add(t2Group);
      volume("t2", t2Group, { x: pierX * U, z: ((LAYOUT.t2Head + LAYOUT.t2Apron) / 2) * U, w: (pierW + 40) * U, d: 30 }, 9, true);
    }

    // Landside between both terminals, laid out for flow: one-way ring,
    // split curbs, taxi and bus bays, a pedestrian skybridge and a cargo belt
    const hubGroup = new THREE.Group();
    const { x: gx, z: gz } = LAYOUT.gtc;
    const westRoad = -380;
    const eastRoad = 360;

    /** Road with dashed lane lines, axis-aligned, meters. */
    function road(x0: number, z0: number, x1: number, z1: number, width: number) {
      const alongX = Math.abs(x1 - x0) >= Math.abs(z1 - z0);
      const len = alongX ? Math.abs(x1 - x0) : Math.abs(z1 - z0);
      const cx = (x0 + x1) / 2;
      const cz = (z0 + z1) / 2;
      slab(hubGroup, mats.road, cx, cz, alongX ? len : width, alongX ? width : len, 0.01, 0.02);
      const dashes: [number, number, number][] = [];
      for (let d = 6; d < len - 6; d += 18) {
        for (const lane of [-width / 6, width / 6]) {
          dashes.push(
            alongX
              ? [Math.min(x0, x1) + d, cz + lane, 0.033]
              : [cx + lane, Math.min(z0, z1) + d, 0.033],
          );
        }
      }
      scatter(hubGroup, alongX ? box(6 * U, 0.004, 0.4 * U) : box(0.4 * U, 0.004, 6 * U), mats.marking, dashes);
    }
    /** Rows of identical vehicles (taxis, buses, trucks) parked side by side. */
    function vehicles(
      mat: THREE.Material,
      geo: THREE.BufferGeometry,
      x0: number,
      z0: number,
      cols: number,
      rows: number,
      dx: number,
      dz: number,
      y: number,
    ) {
      const pts: [number, number, number][] = [];
      for (let j = 0; j < rows; j += 1) {
        for (let i = 0; i < cols; i += 1) pts.push([x0 + i * dx, z0 + j * dz, y]);
      }
      scatter(hubGroup, geo, mat, pts, true);
    }

    // One-way ring: T1 curb → east link → T2 curb → west link
    road(westRoad, LAYOUT.t2Curb, eastRoad + 10, LAYOUT.t2Curb, 22);
    for (const x of [westRoad, eastRoad]) road(x, LAYOUT.t1Curb, x, LAYOUT.t2Curb, 20);
    // Dual boulevard from the city with a planted median, into a roundabout
    const blvdEnd = westRoad - 34;
    road(-1300, gz - 9, blvdEnd, gz - 9, 14);
    road(-1300, gz + 9, blvdEnd, gz + 9, 14);
    slab(hubGroup, mats.park, (-1300 + blvdEnd) / 2, gz, 1300 + blvdEnd, 4, 0.02, 0.012);
    const rb = new THREE.Mesh(new THREE.RingGeometry(18 * U, 34 * U, 40), mats.road);
    rb.rotation.x = -Math.PI / 2;
    rb.position.set(westRoad * U, 0.034, gz * U);
    rb.receiveShadow = true;
    const rbIsland = new THREE.Mesh(new THREE.CircleGeometry(18 * U, 32), mats.park);
    rbIsland.rotation.x = -Math.PI / 2;
    rbIsland.position.set(westRoad * U, 0.036, gz * U);
    hubGroup.add(rb, rbIsland);
    // Hub access spur: roundabout → bus and taxi plaza
    road(westRoad + 34, gz, gx - 120, gz, 16);

    // Intermodal hub: plaza, glass hall, green roof, bus bays
    slab(hubGroup, mats.concrete, gx, gz, 240, 140);
    const gtc = building(hubGroup, gx, gz, 160, 80, 12, mats.glass, mats.park);
    gtc.children[1].scale.set(1, 1.6, 1);
    const bus = box(2.6 * U, 3.2 * V, 12 * U).translate(0, 1.6 * V, 0);
    vehicles(mats.livery, bus, gx - 106, gz - 40, 1, 6, 0, 16, 0.04);
    // Bus bay canopy
    const busCanopy = new THREE.Mesh(box(10 * U, 0.12, 100 * U), mats.roof);
    busCanopy.position.set((gx - 98) * U, 4.2 * V, gz * U);
    busCanopy.castShadow = true;
    hubGroup.add(busCanopy);

    // Taxi bays: holding rows next to each curb, short walk to the doors
    const taxi = box(1.8 * U, 1.5 * V, 4.6 * U).translate(0, 0.75 * V, 0);
    slab(hubGroup, mats.road, 20, 462, 110, 44, 0.012, 0.024);
    vehicles(mats.taxi, taxi, -28, 450, 17, 3, 5.6, 11, 0.04);
    slab(hubGroup, mats.road, -250, 938, 150, 34, 0.012, 0.024);
    vehicles(mats.taxi, taxi, -318, 928, 24, 2, 5.6, 14, 0.04);
    // Taxi pick-up lane canopies at both curbs
    for (const [x, z, w] of [
      [20, LAYOUT.t1Curb + 14, 100],
      [-250, LAYOUT.t2Curb - 18, 140],
    ] as const) {
      const c = new THREE.Mesh(box(w * U, 0.12, 8 * U), mats.roof);
      c.position.set(x * U, 4 * V, z * U);
      c.castShadow = true;
      hubGroup.add(c);
    }

    // Parking garages north and south of the park
    for (const pz of [560, 830]) {
      const garage = new THREE.Group();
      for (let lvl = 0; lvl < 4; lvl += 1) {
        const deckMesh = new THREE.Mesh(box(180 * U, 0.22, 100 * U), lvl === 3 ? mats.roof : mats.concrete);
        deckMesh.position.y = 0.11 + lvl * 3.4 * V;
        deckMesh.castShadow = true;
        deckMesh.receiveShadow = true;
        garage.add(deckMesh);
      }
      scatter(
        garage,
        box(0.6, 3 * 3.4 * V, 0.6).translate(0, 1.5 * 3.4 * V, 0),
        mats.concrete,
        [-80, -27, 27, 80].flatMap((dx) => [-40, 40].map((dz) => [dx, dz] as const)),
      );
      garage.position.set(120 * U, 0, pz * U);
      hubGroup.add(garage);
    }
    // Hotel tower and surface lot on the west side
    building(hubGroup, -250, 575, 70, 36, 28, mats.glass, mats.roof);
    parkingLot(hubGroup, -230, 850, 210, 110, 23);
    // Central park between the garages
    slab(hubGroup, mats.park, 120, 695, 200, 120, 0.02, 0.02);
    const rnd = rand(41);
    const grove: [number, number][] = [];
    for (let i = 0; i < 46; i += 1) grove.push([30 + rnd() * 180, 645 + rnd() * 100]);
    trees(hubGroup, grove, 5);
    trees(
      hubGroup,
      [
        ...row(-1250, blvdEnd - 30, gz - 26, 28),
        ...row(-1250, blvdEnd - 30, gz + 26, 28),
        ...col(westRoad - 20, 450, 900, 30).filter(([, z]) => Math.abs(z - gz) > 50),
        ...col(eastRoad + 20, 450, 950, 30),
      ],
      7,
    );

    // Pedestrian skybridge T1 → hub → T2 with branches to garages and hotel.
    // Glass-walled, wide enough for two moving walkways and a free lane.
    const walkY = 8 * V;
    const bridgeH = 4.5 * V;
    const pylons: (readonly [number, number])[] = [];
    function skybridge(x0: number, z0: number, x1: number, z1: number, width: number) {
      const alongX = Math.abs(x1 - x0) >= Math.abs(z1 - z0);
      const len = alongX ? Math.abs(x1 - x0) : Math.abs(z1 - z0);
      const w = alongX ? len * U : width * U;
      const d = alongX ? width * U : len * U;
      const cx = ((x0 + x1) / 2) * U;
      const cz = ((z0 + z1) / 2) * U;
      const floor = new THREE.Mesh(box(w, 0.25, d), mats.concrete);
      floor.position.set(cx, walkY, cz);
      const tube = new THREE.Mesh(box(w * (alongX ? 1 : 0.92), bridgeH, d * (alongX ? 0.92 : 1)), mats.glass);
      tube.position.set(cx, walkY + bridgeH / 2, cz);
      const lid = new THREE.Mesh(box(w + (alongX ? 0 : 0.3), 0.18, d + (alongX ? 0.3 : 0)), mats.roof);
      lid.position.set(cx, walkY + bridgeH + 0.09, cz);
      for (const m of [floor, tube, lid]) {
        m.castShadow = true;
        hubGroup.add(m);
      }
      for (let t = 30; t < len - 20; t += 55) {
        pylons.push(alongX ? [Math.min(x0, x1) + t, (z0 + z1) / 2] : [(x0 + x1) / 2, Math.min(z0, z1) + t]);
      }
    }
    const spineZ0 = LAYOUT.t1Apron.z + 128;
    const spineZ1 = LAYOUT.t2Head - 40;
    skybridge(LAYOUT.walkX, spineZ0, LAYOUT.walkX, spineZ1, 16);
    skybridge(LAYOUT.walkX + 8, 560, 30, 560, 9);
    skybridge(LAYOUT.walkX + 8, 830, 30, 830, 9);
    skybridge(LAYOUT.walkX - 8, 575, -215, 575, 9);
    scatter(
      hubGroup,
      new THREE.CylinderGeometry(0.28, 0.36, walkY, 6).translate(0, walkY / 2, 0),
      mats.concrete,
      pylons,
      true,
    );
    // Vertical cores (stairs, lifts) where the bridge lands on each curb
    for (const z of [LAYOUT.t1Curb + 18, LAYOUT.t2Curb - 20]) {
      const core = new THREE.Mesh(box(10 * U, walkY + bridgeH, 10 * U), mats.facade);
      core.position.set((LAYOUT.walkX + 14) * U, (walkY + bridgeH) / 2, z * U);
      core.castShadow = true;
      hubGroup.add(core);
    }

    // Cargo link: elevated belt between T1 cargo and the T2 cargo annex,
    // with truck yards at both ends for landside pick-up.
    const beltY = 7 * V;
    const beltPath = [
      new THREE.Vector2(200, 362),
      new THREE.Vector2(255, 362),
      new THREE.Vector2(255, 1040),
      new THREE.Vector2(282, 1040),
    ];
    const beltSegs = beltPath.slice(1).map((b, i) => {
      const a = beltPath[i]!;
      return { a, b, len: a.distanceTo(b) };
    });
    const beltLen = beltSegs.reduce((sum, sg) => sum + sg.len, 0);
    const beltPylons: (readonly [number, number])[] = [];
    for (const { a, b, len } of beltSegs) {
      const alongX = Math.abs(b.x - a.x) > Math.abs(b.y - a.y);
      const cx = ((a.x + b.x) / 2) * U;
      const cz = ((a.y + b.y) / 2) * U;
      const belt = new THREE.Mesh(alongX ? box(len * U, 0.12, 4 * U) : box(4 * U, 0.12, len * U), mats.asphalt);
      belt.position.set(cx, beltY, cz);
      belt.castShadow = true;
      hubGroup.add(belt);
      for (const side of [-1, 1]) {
        const rail = new THREE.Mesh(alongX ? box(len * U, 0.22, 0.06) : box(0.06, 0.22, len * U), mats.cargoRoof);
        rail.position.set(cx + (alongX ? 0 : side * 2.2 * U), beltY + 0.12, cz + (alongX ? side * 2.2 * U : 0));
        hubGroup.add(rail);
      }
      for (let t = 25; t < len - 10; t += 45) {
        const k = t / len;
        beltPylons.push([a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k]);
      }
    }
    scatter(
      hubGroup,
      box(0.3, beltY, 0.3).translate(0, beltY / 2, 0),
      mats.cargoRoof,
      beltPylons,
      true,
    );
    const parcelCount = 48;
    const parcels = new THREE.InstancedMesh(box(2.6 * U, 1.6 * V, 2.6 * U), mats.parcel, parcelCount);
    parcels.castShadow = true;
    hubGroup.add(parcels);
    const parcelPos = new THREE.Vector2();
    function beltPoint(dist: number) {
      let d = ((dist % beltLen) + beltLen) % beltLen;
      for (const { a, b, len } of beltSegs) {
        if (d <= len) return parcelPos.copy(a).lerp(b, d / len);
        d -= len;
      }
      return parcelPos.copy(beltPath[beltPath.length - 1]!);
    }
    function moveParcels(t: number) {
      // Half the parcels run T1 → T2, the other half return on the same belt
      for (let i = 0; i < parcelCount; i += 1) {
        const dir = i % 2 === 0 ? 1 : -1;
        const p = beltPoint((i / parcelCount) * beltLen + dir * t * 22);
        tmp.position.set(p.x * U, beltY + 0.06 + 0.8 * V, p.y * U);
        tmp.rotation.set(0, 0, 0);
        tmp.updateMatrix();
        parcels.setMatrixAt(i, tmp.matrix);
      }
      parcels.instanceMatrix.needsUpdate = true;
    }
    moveParcels(0);
    // T2 cargo annex beside the headhouse, opening onto the pier apron
    building(hubGroup, 310, 1040, 60, 60, 10, mats.facade, mats.cargoRoof);
    // Truck yards: T1 cargo landside and the annex
    const truck = box(2.6 * U, 3.8 * V, 14 * U).translate(0, 1.9 * V, 0);
    slab(hubGroup, mats.concrete, 160, 388, 150, 34, 0.012, 0.024);
    vehicles(mats.facade, truck, 105, 388, 5, 1, 22, 0, 0.04);
    road(eastRoad, LAYOUT.t2Curb, eastRoad, 1040, 16);
    slab(hubGroup, mats.concrete, 400, 1035, 70, 60, 0.012, 0.024);
    vehicles(mats.facade, truck, 380, 1035, 3, 1, 18, 0, 0.04);

    projectedGroup.add(hubGroup);
    volume("hub", hubGroup, { x: gx * U, z: gz * U, w: 26, d: 16 }, 6, true);

    // Support zone: MRO hangar, fuel farm, fire and rescue (SEI) station
    const supportGroup = new THREE.Group();
    const sxM = LAYOUT.supportX;
    const hangarZ = taxiBZ - 110;
    slab(supportGroup, mats.concrete, sxM, taxiBZ - 45, 150, 60);
    building(supportGroup, sxM, hangarZ, 120, 80, 20, mats.facade, mats.roof);
    // Barrel-vault roof spanning the hangar door
    const vaultGeo = new THREE.CylinderGeometry(60 * U, 60 * U, 80 * U, 18, 1, false, Math.PI / 2, Math.PI);
    vaultGeo.rotateX(Math.PI / 2);
    vaultGeo.scale(1, 0.35, 1);
    const vault = new THREE.Mesh(vaultGeo, mats.roof);
    vault.position.set(sxM * U, 20 * V, hangarZ * U);
    vault.castShadow = true;
    supportGroup.add(vault);
    const mroPlane = aircraft(38, 36);
    mroPlane.position.set(sxM * U, 0.06, (taxiBZ - 50) * U);
    mroPlane.rotation.y = Math.PI / 2;
    supportGroup.add(mroPlane);
    // Fuel farm with bunded tanks
    slab(supportGroup, mats.concrete, sxM, 690, 150, 100);
    scatter(
      supportGroup,
      new THREE.CylinderGeometry(1.2, 1.2, 14 * V, 16).translate(0, 7 * V, 0),
      mats.roof,
      [-45, 0, 45].flatMap((dx) => [-22, 22].map((dz) => [sxM + dx, 690 + dz] as const)),
      true,
    );
    // SEI station on taxiway A, short run to both runways
    slab(supportGroup, mats.concrete, sxM - 60, TAXI_OFFSET_M + 70, 90, 70);
    building(supportGroup, sxM - 60, TAXI_OFFSET_M + 95, 70, 30, 8, mats.facade, mats.arff);
    trees(supportGroup, col(sxM + 110, 450, 1150, 32), 9);
    projectedGroup.add(supportGroup);
    volume("support", supportGroup, { x: sxM * U, z: hangarZ * U, w: 15, d: 11 }, 10, true);

    // Selection ring: one accent rectangle reused for every volume
    const ring = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-0.5, 0, -0.5),
        new THREE.Vector3(0.5, 0, -0.5),
        new THREE.Vector3(0.5, 0, 0.5),
        new THREE.Vector3(-0.5, 0, 0.5),
      ]),
      mats.ring,
    );
    ring.position.y = 0.3;
    ring.visible = false;
    scene.add(ring);

    // HTML sign tags
    const tagEls = new Map<string, HTMLButtonElement>();
    for (const v of volumes) {
      const el = document.createElement("button");
      el.type = "button";
      el.className = styles.tag;
      el.dataset.kind = v.id.startsWith("rwy") ? "runway" : "location";
      if (v.projected) el.dataset.projected = "true";
      el.textContent = tags[v.id];
      el.addEventListener("click", () => {
        selectRef.current(v.id);
        setHighlight(v.id);
      });
      tagLayer.appendChild(el);
      tagEls.set(v.id, el);
    }

    let projectedOn = initial.current.showProjected;
    function setProjected(on: boolean) {
      projectedOn = on;
      projectedGroup.visible = on;
      for (const v of volumes) {
        const el = tagEls.get(v.id);
        if (el) el.hidden = v.projected && !on;
      }
      if (!on && currentHighlight && volumes.find((v) => v.id === currentHighlight)?.projected) {
        setHighlight(null);
      }
    }

    let currentHighlight: AerodromeVolumeId = null;
    function setHighlight(id: AerodromeVolumeId) {
      currentHighlight = id;
      const v = volumes.find((x) => x.id === id);
      for (const [key, el] of tagEls) el.dataset.active = key === id ? "true" : "false";
      if (!v || (v.projected && !projectedOn)) {
        ring.visible = false;
        return;
      }
      ring.visible = true;
      ring.position.x = v.footprint.x;
      ring.position.z = v.footprint.z;
      ring.scale.set(v.footprint.w + 4, 1, v.footprint.d + 4);
    }

    /** Camera distance that fits a half-width × half-depth box on screen. */
    function fit(halfW: number, halfD: number) {
      const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      return Math.max(halfW / (tanV * camera.aspect), halfD / tanV);
    }

    function viewPose(v: AerodromeView) {
      const r2 = rwy2 ? { min: (x2 - rwy2.lengthM / 2) * U, max: (x2 + rwy2.lengthM / 2) * U } : null;
      const minX = Math.min(-rwy1.lengthM * U * 0.5, projectedOn && r2 ? r2.min : 0) - 8;
      const maxX = Math.max(rwy1.lengthM * U * 0.5, projectedOn && r2 ? r2.max : 0) + 8;
      const minZ = -12;
      const maxZ = projectedOn ? z2 * U + 12 : 52;
      const c = new THREE.Vector3((minX + maxX) / 2, 0, (minZ + maxZ) / 2);
      const d = fit((maxX - minX) / 2, (maxZ - minZ) / 2);
      if (v === "plan") {
        return { pos: new THREE.Vector3(c.x + 0.01, d * 1.02, c.z + 0.01), target: c };
      }
      if (v === "landside") {
        if (projectedOn) {
          return {
            // From the east: skybridge, taxi bays and cargo belt in one frame
            pos: new THREE.Vector3(58, 62, 30),
            target: new THREE.Vector3(2, 0, 72),
          };
        }
        return {
          pos: new THREE.Vector3(-30, 24, 58),
          target: new THREE.Vector3(-2, 0, 26),
        };
      }
      if (projectedOn) {
        // From the RWY 14/32 side, so T1 sits in front and T2 behind it
        // and frame the terminal complex rather than both runway ends.
        const focus = new THREE.Vector3(14, 0, (z2 * U) / 2);
        const dir = new THREE.Vector3(0.38, 0.6, -0.7).normalize();
        return { pos: focus.clone().addScaledVector(dir, fit(110, 74) * 0.8), target: focus };
      }
      const dir = new THREE.Vector3(0.3, 0.58, 0.76).normalize();
      return { pos: c.clone().addScaledVector(dir, d * 0.64), target: c };
    }

    let viewTween: gsap.core.Timeline | null = null;
    let currentView = initial.current.view;
    function setView(v: AerodromeView, animate: boolean) {
      currentView = v;
      const pose = viewPose(v);
      viewTween?.kill();
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!animate || reduced) {
        camera.position.copy(pose.pos);
        controls.target.copy(pose.target);
        controls.update();
        return;
      }
      viewTween = gsap
        .timeline({ defaults: { duration: 0.9, ease: "power2.inOut" } })
        .to(camera.position, { x: pose.pos.x, y: pose.pos.y, z: pose.pos.z }, 0)
        .to(controls.target, { x: pose.target.x, y: pose.target.y, z: pose.target.z }, 0);
    }

    setProjected(initial.current.showProjected);
    setHighlight(initial.current.highlight ?? null);
    apiRef.current = { setProjected, setHighlight, setView };

    // Click selects only when the pointer did not drag (orbit)
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let down: { x: number; y: number } | null = null;
    const onDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY };
    };
    const onUp = (e: PointerEvent) => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 4) return;
      const rect = canvasEl.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const targets = volumes.filter((v) => !v.projected || projectedOn).map((v) => v.group);
      const hit = raycaster.intersectObjects(targets, true)[0];
      const id = (hit?.object.userData.volumeId ?? null) as AerodromeVolumeId;
      selectRef.current(id);
      setHighlight(id);
    };
    canvasEl.addEventListener("pointerdown", onDown);
    canvasEl.addEventListener("pointerup", onUp);

    const onLost = (e: Event) => {
      e.preventDefault();
      statusRef.current("error");
    };
    canvasEl.addEventListener("webglcontextlost", onLost);

    // Theme changes recolor materials, no rebuild
    const themeObserver = new MutationObserver(() => {
      palette = readPalette();
      paint(palette);
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    let sized = false;
    const resize = () => {
      const { clientWidth: w, clientHeight: h } = host;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      // First real size frames the camera with the right aspect
      if (!sized) {
        sized = true;
        setView(currentView, false);
      }
    };
    resize();
    if (!sized) setView(currentView, false);
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    let onScreen = true;
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry?.isIntersecting ?? false;
    });
    io.observe(host);

    const projectedVec = new THREE.Vector3();
    function placeTags() {
      const w = host!.clientWidth;
      const h = host!.clientHeight;
      for (const v of volumes) {
        const el = tagEls.get(v.id);
        if (!el || el.hidden) continue;
        projectedVec.copy(v.anchor).project(camera);
        const behind = projectedVec.z > 1;
        el.style.opacity = behind ? "0" : "1";
        el.style.transform = `translate(-50%, -100%) translate(${((projectedVec.x + 1) / 2) * w}px, ${((1 - projectedVec.y) / 2) * h}px)`;
      }
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let firstFrame = true;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      // Draw the first frame even off screen so the scene is ready on scroll
      if ((!onScreen || document.hidden) && !firstFrame) return;
      if (projectedOn && !reducedMotion) moveParcels(now / 1000);
      controls.update();
      renderer.render(scene, camera);
      placeTags();
      if (firstFrame) {
        firstFrame = false;
        statusRef.current("ready");
      }
    };
    // Compile shaders in parallel (KHR_parallel_shader_compile) without
    // blocking the page, then start drawing.
    // The expansion is included so toggling it later does not stall.
    let disposed = false;
    projectedGroup.visible = true;
    const compiled = renderer.compileAsync(scene, camera);
    projectedGroup.visible = projectedOn;
    compiled
      .catch(() => undefined)
      .then(() => {
        if (!disposed) raf = requestAnimationFrame(tick);
      });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      viewTween?.kill();
      ro.disconnect();
      io.disconnect();
      themeObserver.disconnect();
      canvasEl.removeEventListener("pointerdown", onDown);
      canvasEl.removeEventListener("pointerup", onUp);
      canvasEl.removeEventListener("webglcontextlost", onLost);
      controls.dispose();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments || o instanceof THREE.LineLoop) {
          o.geometry.dispose();
        }
        if (o instanceof THREE.InstancedMesh) o.dispose();
      });
      for (const m of Object.values(mats)) m.dispose();
      renderer.dispose();
      canvasEl.remove();
      tagLayer.replaceChildren();
      apiRef.current = null;
    };
  }, [geometryKey]);

  useEffect(() => {
    apiRef.current?.setProjected(showProjected);
    apiRef.current?.setView(view, true);
    // Re-frame when the projected assets appear or disappear.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- view handled below
  }, [showProjected]);

  useEffect(() => {
    apiRef.current?.setHighlight(highlight ?? null);
  }, [highlight]);

  useEffect(() => {
    apiRef.current?.setView(view, true);
  }, [view]);

  return (
    <div ref={hostRef} className={styles.canvasHost}>
      <div ref={tagLayerRef} className={styles.tagLayer} />
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { RunwayRef, TerminalRef } from "@/domain/erpm";
import { gsap } from "@/lib/gsap";
import styles from "./AerodromeScene.module.css";

export type AerodromeVolumeId = "rwy1" | "rwy2" | "t1" | "t2" | "cargo" | "tower" | null;

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

/** Scene units: 1 unit = 10 m. Buildings are drawn 2× taller to read. */
const U = 0.1;
const V = 3 * U;
/** ICAO minimum for independent parallel approaches (m). */
const PARALLEL_SEPARATION_M = 1_035;
const TAXI_OFFSET_M = 160;

type Palette = {
  bg: THREE.Color;
  grass: THREE.Color;
  strip: THREE.Color;
  asphalt: THREE.Color;
  concrete: THREE.Color;
  marking: THREE.Color;
  taxiLine: THREE.Color;
  facade: THREE.Color;
  roof: THREE.Color;
  glass: THREE.Color;
  cargoRoof: THREE.Color;
  dock: THREE.Color;
  livery: THREE.Color;
  edgeLight: THREE.Color;
  greenLight: THREE.Color;
  redLight: THREE.Color;
  projected: THREE.Color;
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
  const s4 = c("--surface-4", "#212226");
  const fg = c("--fg", "#f7f8f8");
  const fg2 = c("--fg-2", "#b4b8bf");
  const fg3 = c("--fg-3", "#8a8f98");
  const ok = c("--ok", "#4cc38a");
  const accent = c("--accent", "#f2c230");
  const s1Brightness = (s1.r + s1.g + s1.b) / 3;
  const light = s1Brightness > 0.5;
  return {
    bg,
    grass: s1.clone().lerp(ok, light ? 0.1 : 0.055),
    strip: s1.clone().lerp(fg, light ? 0.02 : 0.035),
    asphalt: light ? fg3.clone().lerp(bg, 0.45) : s4.clone().lerp(fg, 0.07),
    concrete: light ? fg3.clone().lerp(bg, 0.25) : s4.clone().lerp(fg, 0.16),
    marking: light ? bg.clone() : fg.clone(),
    taxiLine: accent.clone(),
    facade: fg3.clone().lerp(s4, light ? 0.1 : 0.45),
    roof: fg2.clone().lerp(s4, light ? 0 : 0.25),
    glass: c("--series-1", "#6f97f0").lerp(bg, 0.55),
    cargoRoof: c("--series-4", "#c8894b"),
    dock: bg.clone().lerp(fg3, 0.15),
    livery: fg.clone().lerp(fg2, 0.15),
    edgeLight: fg.clone().lerp(accent, 0.2),
    greenLight: ok.clone(),
    redLight: c("--crit", "#eb5757"),
    projected: fg3.clone(),
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

/**
 * Orbitable schematic aerodrome built from the infrastructure data: runway
 * lengths and widths, terminals, cargo bays, aprons, lights and parked
 * aircraft. Numbers stay in the HTML sidecar (DESIGN.md §7).
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
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
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
    scene.fog = new THREE.Fog(palette.bg, 260, 620);

    const camera = new THREE.PerspectiveCamera(38, 1, 1, 2000);
    const controls = new OrbitControls(camera, canvasEl);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI * 0.46;
    controls.minDistance = 40;
    controls.maxDistance = 520;
    controls.screenSpacePanning = false;

    const hemi = new THREE.HemisphereLight(0xffffff, 0x222222, 1.1);
    const sun = new THREE.DirectionalLight(0xfff1d6, 1.6);
    sun.position.set(-160, 220, 140);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera;
    sc.left = -260;
    sc.right = 260;
    sc.top = 200;
    sc.bottom = -200;
    sc.near = 10;
    sc.far = 700;
    scene.add(hemi, sun);

    // Materials keyed by role so a theme change only recolors.
    const mats = {
      grass: new THREE.MeshStandardMaterial({ roughness: 1 }),
      strip: new THREE.MeshStandardMaterial({ roughness: 1 }),
      asphalt: new THREE.MeshStandardMaterial({ roughness: 0.92 }),
      concrete: new THREE.MeshStandardMaterial({ roughness: 0.85 }),
      marking: new THREE.MeshBasicMaterial(),
      taxiLine: new THREE.MeshBasicMaterial(),
      facade: new THREE.MeshStandardMaterial({ roughness: 0.7 }),
      roof: new THREE.MeshStandardMaterial({ roughness: 0.6 }),
      glass: new THREE.MeshStandardMaterial({ roughness: 0.2, metalness: 0.4 }),
      cargoRoof: new THREE.MeshStandardMaterial({ roughness: 0.65 }),
      dock: new THREE.MeshStandardMaterial({ roughness: 0.9 }),
      livery: new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.1 }),
      edgeLight: new THREE.MeshBasicMaterial(),
      greenLight: new THREE.MeshBasicMaterial(),
      redLight: new THREE.MeshBasicMaterial(),
      projected: new THREE.MeshStandardMaterial({
        roughness: 0.9,
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
      }),
      projectedEdge: new THREE.LineDashedMaterial({ dashSize: 3, gapSize: 2 }),
      ring: new THREE.LineBasicMaterial(),
    };

    function paint(p: Palette) {
      scene.background = p.bg;
      (scene.fog as THREE.Fog).color = p.bg;
      mats.grass.color.copy(p.grass);
      mats.strip.color.copy(p.strip);
      mats.asphalt.color.copy(p.asphalt);
      mats.concrete.color.copy(p.concrete);
      mats.marking.color.copy(p.marking);
      mats.taxiLine.color.copy(p.taxiLine);
      mats.facade.color.copy(p.facade);
      mats.roof.color.copy(p.roof);
      mats.glass.color.copy(p.glass);
      mats.cargoRoof.color.copy(p.cargoRoof);
      mats.dock.color.copy(p.dock);
      mats.livery.color.copy(p.livery);
      mats.edgeLight.color.copy(p.edgeLight);
      mats.greenLight.color.copy(p.greenLight);
      mats.redLight.color.copy(p.redLight);
      mats.projected.color.copy(p.projected);
      mats.projectedEdge.color.copy(p.projected);
      mats.ring.color.copy(p.accent);
      hemi.groundColor.copy(p.bg);
    }
    paint(palette);

    const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);

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

    function dashedOutline(parent: THREE.Object3D, w: number, h: number, d: number, y: number) {
      const geo = new THREE.EdgesGeometry(box(w, h, d));
      const lines = new THREE.LineSegments(geo, mats.projectedEdge);
      lines.computeLineDistances();
      lines.position.y = y;
      parent.add(lines);
      return lines;
    }

    /** Simple low-poly airliner, length and span in meters. */
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

    // Ground and airfield strip
    const groundGroup = new THREE.Group();
    scene.add(groundGroup);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), mats.grass);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    groundGroup.add(ground);

    function runwayGroup(r: RunwayRef, zM: number, xM: number, projected: boolean) {
      const g = new THREE.Group();
      const L = r.lengthM;
      const W = r.widthM;
      slab(g, mats.strip, xM, zM, L + 120, Math.max(150, W * 3), 0.005, 0.01);
      const deck = slab(g, projected ? mats.projected : mats.asphalt, xM, zM, L, W);
      if (projected) dashedOutline(g, L * U, 0.05, W * U, deck.position.y);
      if (!projected) {
        // Threshold piano keys, centerline dashes, edge lights
        const keys = Math.max(4, Math.round(W / 6));
        const keyGeo = box(30 * U, 0.02, (W / (keys * 2.2)) * U);
        const keyMesh = new THREE.InstancedMesh(keyGeo, mats.marking, keys * 2);
        const tmp = new THREE.Object3D();
        let k = 0;
        for (const end of [-1, 1]) {
          for (let i = 0; i < keys; i += 1) {
            const zz = (-W / 2 + (W / keys) * (i + 0.5)) * U;
            tmp.position.set((xM + end * (L / 2 - 25)) * U, 0.075, zM * U + zz);
            tmp.updateMatrix();
            keyMesh.setMatrixAt(k, tmp.matrix);
            k += 1;
          }
        }
        g.add(keyMesh);

        const dashCount = Math.floor((L - 160) / 60);
        const dash = new THREE.InstancedMesh(box(30 * U, 0.02, 0.9 * U), mats.marking, dashCount);
        for (let i = 0; i < dashCount; i += 1) {
          tmp.position.set((xM - L / 2 + 80 + i * 60) * U, 0.075, zM * U);
          tmp.updateMatrix();
          dash.setMatrixAt(i, tmp.matrix);
        }
        g.add(dash);

        const spacing = 60;
        const perSide = Math.floor(L / spacing) + 1;
        const lights = new THREE.InstancedMesh(box(0.5, 0.35, 0.5), mats.edgeLight, perSide * 2);
        let li = 0;
        for (const side of [-1, 1]) {
          for (let i = 0; i < perSide; i += 1) {
            tmp.position.set((xM - L / 2 + i * spacing) * U, 0.2, (zM + side * (W / 2 + 3)) * U);
            tmp.updateMatrix();
            lights.setMatrixAt(li, tmp.matrix);
            li += 1;
          }
        }
        g.add(lights);
        const barCount = Math.round(W / 4);
        const green = new THREE.InstancedMesh(box(0.5, 0.35, 0.5), mats.greenLight, barCount);
        const red = new THREE.InstancedMesh(box(0.5, 0.35, 0.5), mats.redLight, barCount);
        for (let i = 0; i < barCount; i += 1) {
          const zz = (zM - W / 2 + (W / (barCount - 1)) * i) * U;
          tmp.position.set((xM - L / 2 - 4) * U, 0.2, zz);
          tmp.updateMatrix();
          green.setMatrixAt(i, tmp.matrix);
          tmp.position.set((xM + L / 2 + 4) * U, 0.2, zz);
          tmp.updateMatrix();
          red.setMatrixAt(i, tmp.matrix);
        }
        g.add(green, red);
        // PAPI: four units left of the threshold, aiming point side
        for (let i = 0; i < 4; i += 1) {
          const papi = new THREE.Mesh(box(1, 0.6, 1), i < 2 ? mats.redLight : mats.edgeLight);
          papi.position.set((xM - L / 2 + 300) * U, 0.3, (zM - W / 2 - 15 - i * 9) * U);
          g.add(papi);
        }
      }
      return g;
    }

    // ── Existing airside: RWY 14/32, taxiway A, T1, cargo, tower
    const rwy1Group = runwayGroup(rwy1, 0, 0, false);
    scene.add(rwy1Group);
    volume("rwy1", rwy1Group, { x: 0, z: 0, w: rwy1.lengthM * U, d: rwy1.widthM * U }, 2, false);

    const taxiA = new THREE.Group();
    const taxiLen = rwy1.lengthM * 0.86;
    slab(taxiA, mats.asphalt, 0, TAXI_OFFSET_M, taxiLen, 23);
    slab(taxiA, mats.taxiLine, 0, TAXI_OFFSET_M, taxiLen, 0.8, 0.07, 0.01);
    for (const x of [-taxiLen / 2 + 20, -260, 320, taxiLen / 2 - 20]) {
      slab(taxiA, mats.asphalt, x, TAXI_OFFSET_M / 2, 23, TAXI_OFFSET_M - rwy1.widthM / 2);
      slab(taxiA, mats.taxiLine, x, TAXI_OFFSET_M / 2, 0.8, TAXI_OFFSET_M - rwy1.widthM / 2, 0.07, 0.01);
    }
    scene.add(taxiA);

    // T1: apron with stands and ERJ-145s, two-level terminal, glazing
    const t1Group = new THREE.Group();
    const apronX = -170;
    const apronZ = 265;
    slab(t1Group, mats.concrete, apronX, apronZ, 340, 150);
    slab(t1Group, mats.asphalt, apronX, TAXI_OFFSET_M + 37, 40, 60);
    for (let i = 0; i < 5; i += 1) {
      const sx = apronX - 140 + i * 70;
      slab(t1Group, mats.taxiLine, sx, apronZ + 5, 0.8, 90, 0.07, 0.01);
      if (i < 4) {
        const plane = aircraft(30, 20);
        plane.position.set(sx * U, 0.06, (apronZ + 10) * U);
        plane.rotation.y = Math.PI / 2;
        t1Group.add(plane);
      }
    }
    const t1Bldg = building(t1Group, apronX, apronZ + 105, 200, 50, 12, mats.facade, mats.roof);
    const glazing = new THREE.Mesh(box(190 * U, 5 * V, 0.15), mats.glass);
    glazing.position.set(0, 6 * V, -25 * U - 0.08);
    t1Bldg.add(glazing);
    building(t1Group, apronX - 30, apronZ + 105, 110, 36, 18, mats.facade, mats.roof);
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
    freighter.rotation.y = Math.PI / 2;
    cargoGroup.add(freighter);
    scene.add(cargoGroup);
    volume("cargo", cargoGroup, { x: cargoX * U, z: (cargoZ + 30) * U, w: (bays * bayW + 80) * U, d: 16 }, 4, false);

    // Landside access road
    slab(groundGroup, mats.asphalt, -40, 420, 900, 14, 0.01, 0.02);

    // ── Projected: RWY 14L/32R, taxiway B, midfield T2 with A350 stands
    const projectedGroup = new THREE.Group();
    scene.add(projectedGroup);
    let rwy2Group: THREE.Group | null = null;
    let t2Group: THREE.Group | null = null;
    if (rwy2) {
      const z2 = -PARALLEL_SEPARATION_M;
      const x2 = (rwy2.lengthM - rwy1.lengthM) / 4;
      rwy2Group = runwayGroup(rwy2, z2, x2, true);
      projectedGroup.add(rwy2Group);
      volume("rwy2", rwy2Group, { x: x2 * U, z: z2 * U, w: rwy2.lengthM * U, d: rwy2.widthM * U }, 2, true);
      const taxiB = new THREE.Group();
      slab(taxiB, mats.projected, x2, z2 + 190, rwy2.lengthM * 0.9, 25);
      slab(taxiB, mats.projected, 700, (z2 + 190 - rwy1.widthM) / 2, 25, Math.abs(z2 + 190) - rwy1.widthM);
      projectedGroup.add(taxiB);
    }
    if (t2) {
      t2Group = new THREE.Group();
      const tz = -560;
      slab(t2Group, mats.projected, 120, tz - 110, 560, 160);
      const bldg = new THREE.Mesh(box(480 * U, 16 * V, 70 * U), mats.projected);
      bldg.position.set(120 * U, 8 * V, tz * U);
      t2Group.add(bldg);
      dashedOutline(t2Group, 480 * U, 16 * V, 70 * U, 8 * V).position.set(120 * U, 8 * V, tz * U);
      for (let i = 0; i < Math.max(1, t2.widebodyStands); i += 1) {
        const plane = aircraft(67, 65);
        plane.position.set((-60 + i * 110) * U, 0.06, (tz - 120) * U);
        plane.rotation.y = -Math.PI / 2;
        plane.traverse((o) => {
          if (o instanceof THREE.Mesh) o.material = mats.projected;
        });
        t2Group.add(plane);
      }
      projectedGroup.add(t2Group);
      volume("t2", t2Group, { x: 120 * U, z: (tz - 50) * U, w: 56, d: 26 }, 8, true);
    }

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

    function viewPose(v: AerodromeView) {
      const span = projectedOn && rwy2 ? Math.max(rwy1.lengthM, rwy2.lengthM) * U : rwy1.lengthM * U;
      const midZ = projectedOn ? -PARALLEL_SEPARATION_M * U * 0.45 : 12;
      if (v === "plan") {
        return {
          pos: new THREE.Vector3(0.01, span * (projectedOn ? 1.05 : 0.95), midZ + 0.01),
          target: new THREE.Vector3(0, 0, midZ),
        };
      }
      if (v === "landside") {
        return {
          pos: new THREE.Vector3(-30, 24, 58),
          target: new THREE.Vector3(-2, 0, 26),
        };
      }
      return {
        pos: new THREE.Vector3(span * 0.16, span * (projectedOn ? 0.42 : 0.3), midZ + span * (projectedOn ? 0.62 : 0.44)),
        target: new THREE.Vector3(0, 0, midZ),
      };
    }

    let viewTween: gsap.core.Timeline | null = null;
    function setView(v: AerodromeView, animate: boolean) {
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
    setView(initial.current.view, false);
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

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = host;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    let onScreen = true;
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry?.isIntersecting ?? false;
    });
    io.observe(host);

    const projected = new THREE.Vector3();
    function placeTags() {
      const w = host!.clientWidth;
      const h = host!.clientHeight;
      for (const v of volumes) {
        const el = tagEls.get(v.id);
        if (!el || el.hidden) continue;
        projected.copy(v.anchor).project(camera);
        const behind = projected.z > 1;
        el.style.opacity = behind ? "0" : "1";
        el.style.transform = `translate(-50%, -100%) translate(${((projected.x + 1) / 2) * w}px, ${((1 - projected.y) / 2) * h}px)`;
      }
    }

    let raf = 0;
    let firstFrame = true;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!onScreen || document.hidden) return;
      controls.update();
      renderer.render(scene, camera);
      placeTags();
      if (firstFrame) {
        firstFrame = false;
        statusRef.current("ready");
      }
    };
    tick();

    return () => {
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

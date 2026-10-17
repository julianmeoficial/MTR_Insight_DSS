"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import styles from "./ApronCanvas.module.css";

export function ApronCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const host = hostRef.current;
    if (!host || reduced) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x08090a, 0.045);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 2.4, 6.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    const canvasEl = renderer.domElement;
    canvasEl.className = styles.glCanvas;
    host.appendChild(canvasEl);

    const ambient = new THREE.AmbientLight(0xf2c230, 0.15);
    const dir = new THREE.DirectionalLight(0xffe6a8, 0.55);
    dir.position.set(-4, 6, 2);
    scene.add(ambient, dir);

    const apron = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 16),
      new THREE.MeshStandardMaterial({
        color: 0x1b1c18,
        roughness: 0.92,
        metalness: 0.05,
      }),
    );
    apron.rotation.x = -Math.PI / 2;
    scene.add(apron);

    const centerline = new THREE.Mesh(
      new THREE.PlaneGeometry(0.08, 14),
      new THREE.MeshBasicMaterial({
        color: 0xf2c230,
        transparent: true,
        opacity: 0.35,
      }),
    );
    centerline.rotation.x = -Math.PI / 2;
    centerline.position.y = 0.02;
    scene.add(centerline);

    const count = 80;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 1] = 0.2 + Math.random() * 2.2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const dust = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({
        color: 0xd9b26a,
        size: 0.035,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
      }),
    );
    scene.add(dust);

    let frame = 0;
    let raf = 0;
    let running = true;
    let visible = true;

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

    const onVisibility = () => {
      running = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVisibility);

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry?.isIntersecting ?? false;
      },
      { root: null, threshold: 0.05 },
    );
    io.observe(host);

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!running || !visible) return;
      frame += 1;
      if (frame % 2 !== 0) return;
      dust.rotation.y += 0.0008;
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      io.disconnect();
      ro.disconnect();
      dustGeo.dispose();
      (dust.material as THREE.Material).dispose();
      apron.geometry.dispose();
      (apron.material as THREE.Material).dispose();
      centerline.geometry.dispose();
      (centerline.material as THREE.Material).dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, [reduced]);

  if (reduced) {
    return <div className={styles.fallback} aria-hidden />;
  }

  return <div ref={hostRef} className={styles.canvas} aria-hidden />;
}

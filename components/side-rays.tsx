"use client";

import { Mesh, Program, Renderer, Triangle } from "ogl";
import { useEffect, useRef, useState } from "react";
import "./side-rays.css";

type RayOrigin = "top-right" | "top-left" | "bottom-right" | "bottom-left";
type Vector2 = [number, number];
type Vector3 = [number, number, number];
type Uniform<T> = { value: T };

type SideRaysUniforms = {
  iTime: Uniform<number>;
  iResolution: Uniform<Vector2>;
  iSpeed: Uniform<number>;
  iRayColor1: Uniform<Vector3>;
  iRayColor2: Uniform<Vector3>;
  iIntensity: Uniform<number>;
  iSpread: Uniform<number>;
  iFlipX: Uniform<number>;
  iFlipY: Uniform<number>;
  iTilt: Uniform<number>;
  iSaturation: Uniform<number>;
  iBlend: Uniform<number>;
  iFalloff: Uniform<number>;
  iOpacity: Uniform<number>;
};

type SideRaysProps = {
  speed?: number;
  rayColor1?: string;
  rayColor2?: string;
  intensity?: number;
  spread?: number;
  origin?: RayOrigin;
  tilt?: number;
  saturation?: number;
  blend?: number;
  falloff?: number;
  opacity?: number;
  className?: string;
};

function hexToRgb(hex: string): Vector3 {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  return match
    ? [
        Number.parseInt(match[1], 16) / 255,
        Number.parseInt(match[2], 16) / 255,
        Number.parseInt(match[3], 16) / 255,
      ]
    : [1, 1, 1];
}

function originToFlip(origin: RayOrigin): Vector2 {
  switch (origin) {
    case "top-left":
      return [1, 0];
    case "bottom-right":
      return [0, 1];
    case "bottom-left":
      return [1, 1];
    default:
      return [0, 0];
  }
}

const vertexShader = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const fragmentShader = `precision highp float;

uniform float iTime;
uniform vec2 iResolution;
uniform float iSpeed;
uniform vec3 iRayColor1;
uniform vec3 iRayColor2;
uniform float iIntensity;
uniform float iSpread;
uniform float iFlipX;
uniform float iFlipY;
uniform float iTilt;
uniform float iSaturation;
uniform float iBlend;
uniform float iFalloff;
uniform float iOpacity;

float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord, float seedA, float seedB, float speed) {
  vec2 sourceToCoord = coord - raySource;
  float cosAngle = dot(normalize(sourceToCoord), rayRefDirection);
  return clamp(
    (0.45 + 0.15 * sin(cosAngle * seedA + iTime * speed)) +
    (0.3 + 0.2 * cos(-cosAngle * seedB + iTime * speed)),
    0.0, 1.0) *
    clamp((iResolution.x - length(sourceToCoord)) / iResolution.x, 0.5, 1.0);
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy;
  if (iFlipX > 0.5) fragCoord.x = iResolution.x - fragCoord.x;
  if (iFlipY > 0.5) fragCoord.y = iResolution.y - fragCoord.y;

  vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);
  vec2 rayPos = vec2(iResolution.x * 1.1, -0.5 * iResolution.y);

  float tiltRad = iTilt * 3.14159265 / 180.0;
  float cs = cos(tiltRad);
  float sn = sin(tiltRad);
  vec2 rel = coord - rayPos;
  vec2 tiltedCoord = vec2(rel.x * cs - rel.y * sn, rel.x * sn + rel.y * cs) + rayPos;

  float halfSpread = iSpread * 0.275;
  vec2 rayRefDir1 = normalize(vec2(cos(0.785398 + halfSpread), sin(0.785398 + halfSpread)));
  vec2 rayRefDir2 = normalize(vec2(cos(0.785398 - halfSpread), sin(0.785398 - halfSpread)));

  vec4 rays1 = vec4(iRayColor1, 1.0) * rayStrength(rayPos, rayRefDir1, tiltedCoord, 36.2214, 21.11349, iSpeed);
  vec4 rays2 = vec4(iRayColor2, 1.0) * rayStrength(rayPos, rayRefDir2, tiltedCoord, 22.3991, 18.0234, iSpeed * 0.2);

  vec4 color = rays1 * (1.0 - iBlend) * 0.9 + rays2 * iBlend * 0.9;

  float distanceToLight = length(fragCoord.xy - vec2(rayPos.x, iResolution.y - rayPos.y)) / iResolution.y;
  float brightness = iIntensity * 0.4 / pow(max(distanceToLight, 0.001), iFalloff);
  color.rgb *= brightness;

  float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  color.rgb = mix(vec3(gray), color.rgb, iSaturation);

  color.a = max(color.r, max(color.g, color.b)) * iOpacity;
  gl_FragColor = color;
}`;

export function SideRays({
  speed = 2.5,
  rayColor1 = "#EAB308",
  rayColor2 = "#96c8ff",
  intensity = 2,
  spread = 2,
  origin = "top-right",
  tilt = 0,
  saturation = 1.5,
  blend = 0.75,
  falloff = 1.6,
  opacity = 1,
  className = "",
}: SideRaysProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const uniformsRef = useRef<SideRaysUniforms>(null);
  const rendererRef = useRef<Renderer>(null);
  const animationIdRef = useRef<number>(null);
  const meshRef = useRef<Mesh>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry?.isIntersecting ?? false),
      { threshold: 0.1 },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const container = containerRef.current;

    if (!container) {
      return;
    }

    const containerElement: HTMLDivElement = container;
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    async function initializeWebGl() {
      await new Promise((resolve) => setTimeout(resolve, 10));

      if (cancelled || !containerElement.isConnected) {
        return;
      }

      const renderer = new Renderer({
        dpr: Math.min(window.devicePixelRatio, 2),
        alpha: true,
      });
      rendererRef.current = renderer;

      const { gl } = renderer;
      gl.canvas.style.width = "100%";
      gl.canvas.style.height = "100%";
      containerElement.replaceChildren(gl.canvas);

      const [flipX, flipY] = originToFlip(origin);
      const uniforms: SideRaysUniforms = {
        iTime: { value: 0 },
        iResolution: { value: [1, 1] },
        iSpeed: { value: speed },
        iRayColor1: { value: hexToRgb(rayColor1) },
        iRayColor2: { value: hexToRgb(rayColor2) },
        iIntensity: { value: intensity },
        iSpread: { value: spread },
        iFlipX: { value: flipX },
        iFlipY: { value: flipY },
        iTilt: { value: tilt },
        iSaturation: { value: saturation },
        iBlend: { value: blend },
        iFalloff: { value: falloff },
        iOpacity: { value: opacity },
      };
      uniformsRef.current = uniforms;

      const geometry = new Triangle(gl);
      const program = new Program(gl, {
        vertex: vertexShader,
        fragment: fragmentShader,
        uniforms,
      });
      const mesh = new Mesh(gl, { geometry, program });
      meshRef.current = mesh;

      function updateSize() {
        renderer.dpr = Math.min(window.devicePixelRatio, 2);
        const { clientWidth, clientHeight } = containerElement;
        renderer.setSize(clientWidth, clientHeight);
        uniforms.iResolution.value = [
          clientWidth * renderer.dpr,
          clientHeight * renderer.dpr,
        ];
      }

      function renderFrame(time: number) {
        if (cancelled) {
          return;
        }

        uniforms.iTime.value = time * 0.001;
        renderer.render({ scene: mesh });
        animationIdRef.current = requestAnimationFrame(renderFrame);
      }

      window.addEventListener("resize", updateSize);
      updateSize();
      animationIdRef.current = requestAnimationFrame(renderFrame);

      cleanup = () => {
        if (animationIdRef.current !== null) {
          cancelAnimationFrame(animationIdRef.current);
          animationIdRef.current = null;
        }

        window.removeEventListener("resize", updateSize);
        const loseContext = gl.getExtension(
          "WEBGL_lose_context",
        ) as WEBGL_lose_context | null;
        loseContext?.loseContext();
        gl.canvas.remove();
        rendererRef.current = null;
        uniformsRef.current = null;
        meshRef.current = null;
      };
    }

    void initializeWebGl();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [
    isVisible,
    speed,
    rayColor1,
    rayColor2,
    intensity,
    spread,
    origin,
    tilt,
    saturation,
    blend,
    falloff,
    opacity,
  ]);

  useEffect(() => {
    const uniforms = uniformsRef.current;

    if (!uniforms) {
      return;
    }

    uniforms.iSpeed.value = speed;
    uniforms.iRayColor1.value = hexToRgb(rayColor1);
    uniforms.iRayColor2.value = hexToRgb(rayColor2);
    uniforms.iIntensity.value = intensity;
    uniforms.iSpread.value = spread;
    const [flipX, flipY] = originToFlip(origin);
    uniforms.iFlipX.value = flipX;
    uniforms.iFlipY.value = flipY;
    uniforms.iTilt.value = tilt;
    uniforms.iSaturation.value = saturation;
    uniforms.iBlend.value = blend;
    uniforms.iFalloff.value = falloff;
    uniforms.iOpacity.value = opacity;
  }, [
    speed,
    rayColor1,
    rayColor2,
    intensity,
    spread,
    origin,
    tilt,
    saturation,
    blend,
    falloff,
    opacity,
  ]);

  return (
    <div
      ref={containerRef}
      className={`side-rays-container ${className}`.trim()}
    />
  );
}

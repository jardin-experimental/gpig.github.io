import { NextRequest, NextResponse } from "next/server";

/**
 * Génère un modèle 3D ANIMÉ (contrairement à box-model, statique) : une
 * bouteille + une colonne de mousse qui jaillit en boucle, pour illustrer
 * la réaction du "dentifrice d'éléphant" (décomposition catalytique du
 * peroxyde d'hydrogène — 2 H2O2 → 2 H2O + O2, catalysée par l'iodure de
 * potassium ou la catalase, très exothermique).
 *
 * Simplification assumée : la géométrie est stylisée (cylindres), pas un
 * rendu photoréaliste de mousse. Le paramètre `speed` accélère/ralentit
 * l'animation pour illustrer qu'un catalyseur plus concentré accélère la
 * réaction sans en changer le résultat — c'est le point pédagogique.
 *
 * Query params : ?speed=1.0 (0.3 à 3, multiplicateur de vitesse de la boucle)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const speed = Math.max(0.3, Math.min(3, parseFloat(searchParams.get("speed") ?? "1")));

  const glb = buildToothpasteGlb(speed);
  const arrayBuffer = glb.buffer.slice(glb.byteOffset, glb.byteOffset + glb.byteLength) as ArrayBuffer;

  return new NextResponse(arrayBuffer, {
    headers: {
      "Content-Type": "model/gltf-binary",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

type Vec3 = [number, number, number];

function faceNormal(p0: Vec3, p1: Vec3, p2: Vec3): Vec3 {
  const e1: Vec3 = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]];
  const e2: Vec3 = [p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]];
  const cx = e1[1] * e2[2] - e1[2] * e2[1];
  const cy = e1[2] * e2[0] - e1[0] * e2[2];
  const cz = e1[0] * e2[1] - e1[1] * e2[0];
  const len = Math.hypot(cx, cy, cz) || 1;
  return [cx / len, cy / len, cz / len];
}

function buildCylinder({
  radiusTop,
  radiusBottom,
  height,
  segments,
  capBottom = true,
  capTop = false,
}: {
  radiusTop: number;
  radiusBottom: number;
  height: number;
  segments: number;
  capBottom?: boolean;
  capTop?: boolean;
}) {
  const positions: number[] = [];
  const normals: number[] = [];

  function pushTri(p0: Vec3, p1: Vec3, p2: Vec3) {
    const n = faceNormal(p0, p1, p2);
    positions.push(...p0, ...p1, ...p2);
    for (let i = 0; i < 3; i++) normals.push(...n);
  }

  for (let i = 0; i < segments; i++) {
    const a0 = (i / segments) * 2 * Math.PI;
    const a1 = ((i + 1) / segments) * 2 * Math.PI;
    const b0: Vec3 = [radiusBottom * Math.cos(a0), 0, radiusBottom * Math.sin(a0)];
    const b1: Vec3 = [radiusBottom * Math.cos(a1), 0, radiusBottom * Math.sin(a1)];
    const t0: Vec3 = [radiusTop * Math.cos(a0), height, radiusTop * Math.sin(a0)];
    const t1: Vec3 = [radiusTop * Math.cos(a1), height, radiusTop * Math.sin(a1)];
    pushTri(b0, b1, t1);
    pushTri(b0, t1, t0);
  }

  if (capBottom) {
    for (let i = 0; i < segments; i++) {
      const a0 = (i / segments) * 2 * Math.PI;
      const a1 = ((i + 1) / segments) * 2 * Math.PI;
      pushTri(
        [0, 0, 0],
        [radiusBottom * Math.cos(a1), 0, radiusBottom * Math.sin(a1)],
        [radiusBottom * Math.cos(a0), 0, radiusBottom * Math.sin(a0)]
      );
    }
  }
  if (capTop) {
    for (let i = 0; i < segments; i++) {
      const a0 = (i / segments) * 2 * Math.PI;
      const a1 = ((i + 1) / segments) * 2 * Math.PI;
      pushTri(
        [0, height, 0],
        [radiusTop * Math.cos(a0), height, radiusTop * Math.sin(a0)],
        [radiusTop * Math.cos(a1), height, radiusTop * Math.sin(a1)]
      );
    }
  }

  return { positions, normals };
}

function float32Buffer(values: number[]): Buffer {
  const buf = Buffer.alloc(values.length * 4);
  values.forEach((v, i) => buf.writeFloatLE(v, i * 4));
  return buf;
}

function padTo4(buf: Buffer, padByte: number): Buffer {
  const r = buf.length % 4;
  if (r === 0) return buf;
  return Buffer.concat([buf, Buffer.alloc(4 - r, padByte)]);
}

function minMax(flatVec3: number[]) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < flatVec3.length; i += 3) {
    for (let axis = 0; axis < 3; axis++) {
      min[axis] = Math.min(min[axis], flatVec3[i + axis]);
      max[axis] = Math.max(max[axis], flatVec3[i + axis]);
    }
  }
  return { min, max };
}

function buildLathe(
  profile: [number, number][],
  segments: number,
  capBottom = true
) {
  const positions: number[] = [];
  const normals: number[] = [];
  function pushTri(p0: Vec3, p1: Vec3, p2: Vec3) {
    const n = faceNormal(p0, p1, p2);
    positions.push(...p0, ...p1, ...p2);
    for (let i = 0; i < 3; i++) normals.push(...n);
  }
  for (let ring = 0; ring < profile.length - 1; ring++) {
    const [r0, y0] = profile[ring];
    const [r1, y1] = profile[ring + 1];
    for (let i = 0; i < segments; i++) {
      const a0 = (i / segments) * 2 * Math.PI;
      const a1 = ((i + 1) / segments) * 2 * Math.PI;
      const b0: Vec3 = [r0 * Math.cos(a0), y0, r0 * Math.sin(a0)];
      const b1: Vec3 = [r0 * Math.cos(a1), y0, r0 * Math.sin(a1)];
      const t0: Vec3 = [r1 * Math.cos(a0), y1, r1 * Math.sin(a0)];
      const t1: Vec3 = [r1 * Math.cos(a1), y1, r1 * Math.sin(a1)];
      if (r0 > 1e-6) pushTri(b0, b1, t1);
      if (r1 > 1e-6) pushTri(b0, t1, t0);
    }
  }
  if (capBottom) {
    const [r0, y0] = profile[0];
    for (let i = 0; i < segments; i++) {
      const a0 = (i / segments) * 2 * Math.PI;
      const a1 = ((i + 1) / segments) * 2 * Math.PI;
      pushTri([0, y0, 0], [r0 * Math.cos(a1), y0, r0 * Math.sin(a1)], [r0 * Math.cos(a0), y0, r0 * Math.sin(a0)]);
    }
  }
  return { positions, normals };
}

function buildToothpasteGlb(speed: number): Buffer {
  const bottleHeight = 0.14;

  const bottle = buildCylinder({
    radiusTop: 0.03,
    radiusBottom: 0.035,
    height: bottleHeight,
    segments: 16,
    capBottom: true,
    capTop: false,
  });

  // Pointe fine et arrondie (façon tour de potier) plutôt qu'un cylindre à
  // bout plat — reproduit le style de l'éruption haute et effilée observée
  // dans la référence vidéo, au lieu d'une simple bosse.
  const localFoamHeight = 0.15;
  const foamProfile: [number, number][] = [
    [0.03, 0.0],
    [0.032, 0.05],
    [0.028, 0.55],
    [0.016, 0.85],
    [0.006, 0.97],
    [0.0, 1.0],
  ].map(([r, yFrac]) => [r, yFrac * localFoamHeight]);
  const foam = buildLathe(foamProfile, 16, true);

  const buffers: Buffer[] = [];
  let offset = 0;
  function addBuffer(values: number[]) {
    const buf = float32Buffer(values);
    buffers.push(buf);
    const view = { byteOffset: offset, byteLength: buf.length };
    offset += buf.length;
    return view;
  }

  const bottlePosView = addBuffer(bottle.positions);
  const bottleNormView = addBuffer(bottle.normals);
  const foamPosView = addBuffer(foam.positions);
  const foamNormView = addBuffer(foam.normals);

  // Keyframes de l'éruption : minuscule -> jaillit haut et fin -> se
  // stabilise -> reset (boucle stylisée, pas une rétraction physique
  // réelle de la mousse). L'échelle Y monte beaucoup plus que X/Z pour
  // garder l'aspect "pointe fine qui jaillit" plutôt qu'un blob qui gonfle.
  const rawTimes = [0, 0.6, 0.9, 1.3, 2.2, 2.5];
  const times = rawTimes.map((t) => t / speed);
  const scales: number[][] = [
    [0.1, 0.05, 0.1],
    [1.0, 3.2, 1.0],
    [1.1, 4.2, 1.1],
    [1.0, 4.0, 1.0],
    [1.0, 4.0, 1.0],
    [0.1, 0.05, 0.1],
  ];
  const timeView = addBuffer(times);
  const scaleView = addBuffer(scales.flat());

  const bin = Buffer.concat(buffers);
  const binPadded = padTo4(bin, 0x00);

  const bottlePosMinMax = minMax(bottle.positions);
  const foamPosMinMax = minMax(foam.positions);

  const gltfJson = {
    asset: { version: "2.0", generator: "gpig-ar-toothpaste" },
    scene: 0,
    scenes: [{ nodes: [0, 1] }],
    nodes: [
      { mesh: 0, name: "bottle" },
      { mesh: 1, name: "foam", translation: [0, bottleHeight, 0], scale: [0.05, 0.05, 0.05] },
    ],
    meshes: [
      { primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, material: 0 }] },
      { primitives: [{ attributes: { POSITION: 2, NORMAL: 3 }, material: 1 }] },
    ],
    materials: [
      {
        pbrMetallicRoughness: { baseColorFactor: [0.55, 0.35, 0.15, 1], metallicFactor: 0.1, roughnessFactor: 0.6 },
        doubleSided: true,
      },
      {
        pbrMetallicRoughness: { baseColorFactor: [0.96, 0.95, 0.9, 1], metallicFactor: 0.0, roughnessFactor: 0.9 },
        doubleSided: true,
      },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: bottle.positions.length / 3,
        type: "VEC3",
        min: bottlePosMinMax.min,
        max: bottlePosMinMax.max,
      },
      { bufferView: 1, componentType: 5126, count: bottle.normals.length / 3, type: "VEC3" },
      {
        bufferView: 2,
        componentType: 5126,
        count: foam.positions.length / 3,
        type: "VEC3",
        min: foamPosMinMax.min,
        max: foamPosMinMax.max,
      },
      { bufferView: 3, componentType: 5126, count: foam.normals.length / 3, type: "VEC3" },
      {
        bufferView: 4,
        componentType: 5126,
        count: times.length,
        type: "SCALAR",
        min: [times[0]],
        max: [times[times.length - 1]],
      },
      { bufferView: 5, componentType: 5126, count: scales.length, type: "VEC3" },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: bottlePosView.byteOffset, byteLength: bottlePosView.byteLength, target: 34962 },
      { buffer: 0, byteOffset: bottleNormView.byteOffset, byteLength: bottleNormView.byteLength, target: 34962 },
      { buffer: 0, byteOffset: foamPosView.byteOffset, byteLength: foamPosView.byteLength, target: 34962 },
      { buffer: 0, byteOffset: foamNormView.byteOffset, byteLength: foamNormView.byteLength, target: 34962 },
      { buffer: 0, byteOffset: timeView.byteOffset, byteLength: timeView.byteLength },
      { buffer: 0, byteOffset: scaleView.byteOffset, byteLength: scaleView.byteLength },
    ],
    buffers: [{ byteLength: bin.length }],
    animations: [
      {
        samplers: [{ input: 4, output: 5, interpolation: "LINEAR" }],
        channels: [{ sampler: 0, target: { node: 1, path: "scale" } }],
      },
    ],
  };

  const jsonBuf = padTo4(Buffer.from(JSON.stringify(gltfJson)), 0x20);

  const header = Buffer.alloc(12);
  header.write("glTF", 0, "ascii");
  header.writeUInt32LE(2, 4);
  const totalLength = 12 + 8 + jsonBuf.length + 8 + binPadded.length;
  header.writeUInt32LE(totalLength, 8);

  const jsonChunkHeader = Buffer.alloc(8);
  jsonChunkHeader.writeUInt32LE(jsonBuf.length, 0);
  jsonChunkHeader.write("JSON", 4, "ascii");

  const binChunkHeader = Buffer.alloc(8);
  binChunkHeader.writeUInt32LE(binPadded.length, 0);
  binChunkHeader.writeUInt32LE(0x004e4942, 4);

  return Buffer.concat([header, jsonChunkHeader, jsonBuf, binChunkHeader, binPadded]);
}

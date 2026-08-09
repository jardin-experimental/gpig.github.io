import { NextRequest, NextResponse } from "next/server";

/**
 * Génère un modèle 3D (cube) au format .glb, dont la taille et la couleur
 * dépendent des paramètres de la simulation (densité/flottaison), pour
 * l'afficher dans <model-viewer> sur /ar/densite.
 *
 * Pas de dépendance externe : le format glTF binaire est assez simple pour
 * être construit à la main (JSON + buffer binaire), ce qui évite d'avoir à
 * héberger un vrai fichier 3D statique ou à dépendre d'un service tiers.
 *
 * Query params : ?size=0.12&r=240&g=169&b=78  (taille en mètres, RGB 0-255)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const size = Math.max(0.02, Math.min(1, parseFloat(searchParams.get("size") ?? "0.15")));
  const r = clamp255(searchParams.get("r"), 240);
  const g = clamp255(searchParams.get("g"), 169);
  const b = clamp255(searchParams.get("b"), 78);

  const glb = buildCubeGlb(size, [r / 255, g / 255, b / 255, 1]);
  const arrayBuffer = glb.buffer.slice(glb.byteOffset, glb.byteOffset + glb.byteLength) as ArrayBuffer;

  return new NextResponse(arrayBuffer, {
    headers: {
      "Content-Type": "model/gltf-binary",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

function clamp255(value: string | null, fallback: number) {
  const n = value != null ? parseInt(value, 10) : fallback;
  return Number.isFinite(n) ? Math.max(0, Math.min(255, n)) : fallback;
}

function buildCubeGlb(size: number, color: [number, number, number, number]): Buffer {
  const h = size / 2;

  // 24 sommets (4 par face, pour des normales plates par face) + normales.
  const facePositions: [number, number, number][][] = [
    // +X
    [[h, -h, -h], [h, h, -h], [h, h, h], [h, -h, h]],
    // -X
    [[-h, -h, h], [-h, h, h], [-h, h, -h], [-h, -h, -h]],
    // +Y
    [[-h, h, -h], [-h, h, h], [h, h, h], [h, h, -h]],
    // -Y
    [[-h, -h, h], [-h, -h, -h], [h, -h, -h], [h, -h, h]],
    // +Z
    [[-h, -h, h], [h, -h, h], [h, h, h], [-h, h, h]],
    // -Z
    [[h, -h, -h], [-h, -h, -h], [-h, h, -h], [h, h, -h]],
  ];
  const faceNormals: [number, number, number][] = [
    [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1],
  ];

  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  facePositions.forEach((face, faceIndex) => {
    const base = faceIndex * 4;
    face.forEach((p) => positions.push(...p));
    for (let i = 0; i < 4; i++) normals.push(...faceNormals[faceIndex]);
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  });

  const positionsBuf = float32Buffer(positions);
  const normalsBuf = float32Buffer(normals);
  const indicesBuf = uint16Buffer(indices);

  const bin = Buffer.concat([positionsBuf, normalsBuf, indicesBuf]);

  const positionsMin = reduceMinMax(positions);
  const gltfJson = {
    asset: { version: "2.0", generator: "gpig-ar-box" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [
      {
        primitives: [
          {
            attributes: { POSITION: 0, NORMAL: 1 },
            indices: 2,
            material: 0,
          },
        ],
      },
    ],
    materials: [
      {
        pbrMetallicRoughness: { baseColorFactor: color, metallicFactor: 0.1, roughnessFactor: 0.7 },
        doubleSided: true,
      },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126, // FLOAT
        count: positions.length / 3,
        type: "VEC3",
        min: positionsMin.min,
        max: positionsMin.max,
      },
      { bufferView: 1, componentType: 5126, count: normals.length / 3, type: "VEC3" },
      { bufferView: 2, componentType: 5123, count: indices.length, type: "SCALAR" }, // UNSIGNED_SHORT
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: positionsBuf.length, target: 34962 },
      { buffer: 0, byteOffset: positionsBuf.length, byteLength: normalsBuf.length, target: 34962 },
      { buffer: 0, byteOffset: positionsBuf.length + normalsBuf.length, byteLength: indicesBuf.length, target: 34963 },
    ],
    buffers: [{ byteLength: bin.length }],
  };

  const jsonBuf = padTo4(Buffer.from(JSON.stringify(gltfJson)), 0x20); // padding espace
  const binPadded = padTo4(bin, 0x00);

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
  binChunkHeader.writeUInt32LE(0x004e4942, 4); // "BIN\0"

  return Buffer.concat([header, jsonChunkHeader, jsonBuf, binChunkHeader, binPadded]);
}

function float32Buffer(values: number[]): Buffer {
  const buf = Buffer.alloc(values.length * 4);
  values.forEach((v, i) => buf.writeFloatLE(v, i * 4));
  return buf;
}

function uint16Buffer(values: number[]): Buffer {
  const buf = Buffer.alloc(values.length * 2);
  values.forEach((v, i) => buf.writeUInt16LE(v, i * 2));
  return buf;
}

function padTo4(buf: Buffer, padByte: number): Buffer {
  const remainder = buf.length % 4;
  if (remainder === 0) return buf;
  const padding = Buffer.alloc(4 - remainder, padByte);
  return Buffer.concat([buf, padding]);
}

function reduceMinMax(flatVec3: number[]) {
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

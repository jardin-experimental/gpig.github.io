import { NextRequest, NextResponse } from "next/server";

/**
 * Génère un .usdz — nécessaire pour qu'AR Quick Look (iOS) affiche le
 * modèle ET joue son animation en vraie réalité augmentée (caméra +
 * ancrage spatial). Sans ce fichier, iOS n'a que l'aperçu 3D interactif
 * sur la page (pas la vraie RA caméra).
 *
 * ATTENTION — fiabilité non garantie : ce fichier contient un layer USD
 * au format ASCII (.usda) zippé, ce que la spécification USDZ autorise en
 * théorie, mais Quick Look est connu pour être strict et les outils
 * officiels (usdzconvert, Reality Converter) produisent presque toujours
 * du binaire "crate" (.usdc), jamais testé de mon côté sur un vrai iPhone.
 * Si ce fichier ne s'ouvre pas correctement dans Quick Look, la solution
 * fiable à 100% est de convertir le .glb existant (déjà fonctionnel) avec
 * Reality Converter (app gratuite Apple, Mac) et d'héberger le résultat
 * comme fichier statique à la place de cette route.
 *
 * Query params : ?speed=1.0 (0.3 à 3, même paramètre que toothpaste-model)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const speed = Math.max(0.3, Math.min(3, parseFloat(searchParams.get("speed") ?? "1")));

  const usdz = buildToothpasteUsdz(speed);
  const arrayBuffer = usdz.buffer.slice(usdz.byteOffset, usdz.byteOffset + usdz.byteLength) as ArrayBuffer;

  return new NextResponse(arrayBuffer, {
    headers: {
      "Content-Type": "model/vnd.usdz+zip",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

type Vec3 = [number, number, number];
interface Tri {
  p: [Vec3, Vec3, Vec3];
}

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
}): Tri[] {
  const tris: Tri[] = [];
  function pushTri(p0: Vec3, p1: Vec3, p2: Vec3) {
    tris.push({ p: [p0, p1, p2] });
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
  return tris;
}

function fmtNum(n: number): string {
  return Number.isInteger(n) ? n.toFixed(1) : n.toFixed(6).replace(/0+$/, "").replace(/\.$/, ".0");
}

function meshToUsda(name: string, tris: Tri[], colorRGB: [number, number, number], extraLines = ""): string {
  const points: Vec3[] = [];
  const faceVertexCounts: number[] = [];
  const faceVertexIndices: number[] = [];
  let idx = 0;
  for (const tri of tris) {
    for (const p of tri.p) points.push(p);
    faceVertexCounts.push(3);
    faceVertexIndices.push(idx, idx + 1, idx + 2);
    idx += 3;
  }
  const pointsStr = points.map((p) => `(${fmtNum(p[0])}, ${fmtNum(p[1])}, ${fmtNum(p[2])})`).join(", ");
  return `    def Mesh "${name}"
    {
        int[] faceVertexCounts = [${faceVertexCounts.join(", ")}]
        int[] faceVertexIndices = [${faceVertexIndices.join(", ")}]
        point3f[] points = [${pointsStr}]
        color3f[] primvars:displayColor = [(${colorRGB.join(", ")})] (
            interpolation = "constant"
        )
        uniform token subdivisionScheme = "none"
${extraLines}    }
`;
}

function buildUsda(speed: number): string {
  const bottleHeight = 0.14;
  const bottleTris = buildCylinder({
    radiusTop: 0.03,
    radiusBottom: 0.035,
    height: bottleHeight,
    segments: 16,
    capBottom: true,
    capTop: false,
  });
  const foamTris = buildCylinder({
    radiusTop: 0.05,
    radiusBottom: 0.025,
    height: 0.18,
    segments: 16,
    capBottom: true,
    capTop: true,
  });

  const fps = 24;
  const rawTimes = [0, 0.7, 1.0, 1.3, 2.2, 2.5];
  const frames = rawTimes.map((t) => Math.round((t / speed) * fps));
  const scales: Vec3[] = [
    [0.05, 0.05, 0.05],
    [1.1, 1.5, 1.1],
    [1.0, 1.3, 1.0],
    [1.05, 1.35, 1.05],
    [1.0, 1.3, 1.0],
    [0.05, 0.05, 0.05],
  ];
  const timeSamples = frames.map((f, i) => `            ${f}: (${scales[i].join(", ")}),`).join("\n");

  const foamExtra = `        double3 xformOp:translate = (0, ${bottleHeight}, 0)
        float3 xformOp:scale.timeSamples = {
${timeSamples}
        }
        uniform token[] xformOpOrder = ["xformOp:translate", "xformOp:scale"]
`;

  return `#usda 1.0
(
    defaultPrim = "World"
    upAxis = "Y"
    metersPerUnit = 1
    timeCodesPerSecond = ${fps}
    startTimeCode = ${frames[0]}
    endTimeCode = ${frames[frames.length - 1]}
)

def Xform "World"
{
${meshToUsda("bottle", bottleTris, [0.55, 0.35, 0.15])}
${meshToUsda("foam", foamTris, [0.96, 0.95, 0.9], foamExtra)}}
`;
}

// --- CRC32 (nécessaire pour l'en-tête ZIP, Node n'expose pas de calcul CRC32 public) ---
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();
function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Empaquette un seul fichier dans un ZIP non compressé (méthode STORE),
 * avec les données alignées sur 64 octets — requis par la spec USDZ pour
 * permettre le streaming direct depuis l'archive sans décompression.
 */
function buildUsdz(usdaContent: string): Buffer {
  const usdaBuf = Buffer.from(usdaContent, "utf8");
  const filenameBuf = Buffer.from("model.usda", "ascii");

  const fixedLocalHeaderSize = 30;
  const baseExtraSize = 4;
  const neededPad = (64 - ((fixedLocalHeaderSize + filenameBuf.length + baseExtraSize) % 64)) % 64;
  const extraFieldLen = baseExtraSize + neededPad;
  const crc = crc32(usdaBuf);

  const localHeader = Buffer.alloc(fixedLocalHeaderSize);
  localHeader.writeUInt32LE(0x04034b50, 0);
  localHeader.writeUInt16LE(20, 4);
  localHeader.writeUInt16LE(0, 6);
  localHeader.writeUInt16LE(0, 8);
  localHeader.writeUInt16LE(0, 10);
  localHeader.writeUInt16LE(0, 12);
  localHeader.writeUInt32LE(crc, 14);
  localHeader.writeUInt32LE(usdaBuf.length, 18);
  localHeader.writeUInt32LE(usdaBuf.length, 22);
  localHeader.writeUInt16LE(filenameBuf.length, 26);
  localHeader.writeUInt16LE(extraFieldLen, 28);

  const extraField = Buffer.alloc(extraFieldLen);
  extraField.writeUInt16LE(0xcafe, 0);
  extraField.writeUInt16LE(neededPad, 2);

  const localEntry = Buffer.concat([localHeader, filenameBuf, extraField, usdaBuf]);

  const centralHeader = Buffer.alloc(46);
  centralHeader.writeUInt32LE(0x02014b50, 0);
  centralHeader.writeUInt16LE(20, 4);
  centralHeader.writeUInt16LE(20, 6);
  centralHeader.writeUInt16LE(0, 8);
  centralHeader.writeUInt16LE(0, 10);
  centralHeader.writeUInt16LE(0, 12);
  centralHeader.writeUInt16LE(0, 14);
  centralHeader.writeUInt32LE(crc, 16);
  centralHeader.writeUInt32LE(usdaBuf.length, 20);
  centralHeader.writeUInt32LE(usdaBuf.length, 24);
  centralHeader.writeUInt16LE(filenameBuf.length, 28);
  centralHeader.writeUInt16LE(0, 30);
  centralHeader.writeUInt16LE(0, 32);
  centralHeader.writeUInt16LE(0, 34);
  centralHeader.writeUInt16LE(0, 36);
  centralHeader.writeUInt32LE(0, 38);
  centralHeader.writeUInt32LE(0, 42);

  const centralEntry = Buffer.concat([centralHeader, filenameBuf]);

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(1, 8);
  eocd.writeUInt16LE(1, 10);
  eocd.writeUInt32LE(centralEntry.length, 12);
  eocd.writeUInt32LE(localEntry.length, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([localEntry, centralEntry, eocd]);
}

function buildToothpasteUsdz(speed: number): Buffer {
  return buildUsdz(buildUsda(speed));
}

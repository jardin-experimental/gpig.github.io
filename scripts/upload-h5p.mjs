/**
 * Usage : node upload-h5p.mjs mon-contenu.h5p densite-catalyseur
 *
 * 1. Décompresse le fichier .h5p (c'est un zip) dans un dossier temporaire
 * 2. Uploade récursivement tous les fichiers vers le bucket "h5p-content"
 *    sous le préfixe {contentId}/, en préservant la structure de dossiers
 *
 * Prérequis : npm install @supabase/supabase-js adm-zip
 */

import AdmZip from "adm-zip";
import { createClient } from "@supabase/supabase-js";
import { readdirSync, statSync, rmSync, mkdtempSync } from "fs";
import { join, relative } from "path";
import { tmpdir } from "os";

const [, , h5pFilePath, contentId] = process.argv;

if (!h5pFilePath || !contentId) {
  console.error("Usage: node upload-h5p.mjs <fichier.h5p> <content-id>");
  process.exit(1);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "h5p-content";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Variables NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises dans l'environnement."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Devine le content-type pour que les fichiers servis depuis le bucket
// soient interprétés correctement par le navigateur (JS, CSS, JSON, fonts...)
function guessContentType(filePath) {
  const ext = filePath.split(".").pop()?.toLowerCase();
  const map = {
    js: "application/javascript",
    css: "text/css",
    json: "application/json",
    html: "text/html",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    svg: "image/svg+xml",
    gif: "image/gif",
    woff: "font/woff",
    woff2: "font/woff2",
    ttf: "font/ttf",
    mp3: "audio/mpeg",
    mp4: "video/mp4",
    webm: "video/webm",
  };
  return map[ext] || "application/octet-stream";
}

function walk(dir) {
  let files = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      files = files.concat(walk(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

async function main() {
  console.log(`Décompression de ${h5pFilePath}...`);
  const tempDir = mkdtempSync(join(tmpdir(), "h5p-"));
  const zip = new AdmZip(h5pFilePath);
  zip.extractAllTo(tempDir, true);

  const files = walk(tempDir);
  console.log(`${files.length} fichiers à uploader vers ${BUCKET}/${contentId}/`);

  let uploaded = 0;
  let failed = 0;

  for (const filePath of files) {
    const fs = await import("fs/promises");
    const buffer = await fs.readFile(filePath);
    const relativePath = relative(tempDir, filePath).split("\\").join("/"); // normalise Windows
    const storagePath = `${contentId}/${relativePath}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: guessContentType(filePath),
        upsert: true,
      });

    if (error) {
      console.error(`Échec: ${storagePath} — ${error.message}`);
      failed++;
    } else {
      uploaded++;
      process.stdout.write(`\rUploadés: ${uploaded}/${files.length}`);
    }
  }

  console.log(`\n\nTerminé. ${uploaded} fichiers uploadés, ${failed} échecs.`);

  rmSync(tempDir, { recursive: true, force: true });

  if (failed === 0) {
    console.log(
      `\nContenu disponible via h5p_content_id = "${contentId}" dans lecon_contents.`
    );
  }
}

main().catch((err) => {
  console.error("Erreur:", err);
  process.exit(1);
});
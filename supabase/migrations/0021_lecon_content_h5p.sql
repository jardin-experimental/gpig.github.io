-- Ajout du support H5P à lecon_contents, en suivant le même pattern que
-- video_url / vdoCipher_id : une colonne dédiée plutôt qu'un champ JSON générique.

alter table lecon_contents
  add column if not exists h5p_content_id text;

-- h5p_content_id correspond au nom du dossier dans le bucket Supabase Storage
-- "h5p-content" (ex: "densite-catalyseur"), utilisé tel quel par le composant H5PPlayer.
--
-- Convention : si h5p_content_id est NULL, la leçon n'a pas de contenu H5P
-- et le composant H5PPlayer n'est simplement pas rendu sur la page.

comment on column lecon_contents.h5p_content_id is
  'Identifiant du contenu H5P (dossier dans le bucket Supabase Storage "h5p-content"). NULL si aucun contenu H5P pour cette leçon.';
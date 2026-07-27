-- ============================================================
-- add-pendulum-lesson.sql
-- Ajoute une leçon "exercice" (simulation interactive) au chapitre
-- "Les mouvements" de la formation Physique — Découverte, en position 3
-- (après la vidéo et le quiz déjà en place).
-- ============================================================

do $$
declare
  v_chap uuid;
  v_lecon uuid;
begin
  select c.id into v_chap
  from chapitres c
  join modules m on m.id = c.module_id
  join formations f on f.id = m.formation_id
  where f.slug = 'physique-decouverte'
    and m.titre = 'Mécanique de base'
    and c.titre = 'Les mouvements';

  if v_chap is null then
    raise exception 'Chapitre "Les mouvements" introuvable — le script seed-sciences.sql a-t-il bien été exécuté ?';
  end if;

  insert into lecons (chapitre_id, titre, type, position)
  values (v_chap, 'Simulation — Le pendule simple', 'exercice', 3)
  returning id into v_lecon;

  insert into lecon_contents (lecon_id, contenu_texte, ressources)
  values (
    v_lecon,
    'Manipule la longueur et l''angle du pendule pour observer comment sa période d''oscillation évolue, puis réponds à la question.',
    '{"component": "pendulum-quiz"}'::jsonb
  );
end $$;

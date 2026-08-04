-- ============================================================
-- 0015_fix_acheter_panier_atomes_overload.sql
--
-- La migration 0014 a fait un `create or replace function
-- acheter_panier_atomes(p_adresse jsonb default null)`, mais comme la
-- version d'origine (0013) n'avait aucun paramètre, Postgres a créé une
-- deuxième fonction en surcharge au lieu de remplacer la première.
-- On supprime ici l'ancienne version sans paramètre : la version avec
-- p_adresse (valeur par défaut null) la couvre entièrement, y compris
-- pour un appel sans argument.
-- ============================================================

drop function if exists public.acheter_panier_atomes();
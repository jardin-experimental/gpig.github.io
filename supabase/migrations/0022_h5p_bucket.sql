-- Création du bucket h5p-content (lecture publique, écriture réservée au service_role)
-- À exécuter dans l'éditeur SQL Supabase, ou via le dashboard Storage > New bucket.

insert into storage.buckets (id, name, public)
values ('h5p-content', 'h5p-content', true)
on conflict (id) do nothing;

-- Policy : lecture publique (nécessaire pour que le navigateur charge les assets H5P)
create policy "Lecture publique du contenu H5P"
  on storage.objects for select
  using (bucket_id = 'h5p-content');

-- Pas de policy insert/update/delete pour les rôles anon/authenticated :
-- seul le service_role (utilisé par le script d'upload et la route API) peut écrire.
-- Cela évite qu'un utilisateur connecté puisse modifier les contenus H5P depuis le client.
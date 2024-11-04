set search_path=nnya;

create table "iconografia" (
  "icono" text NOT NULL, 
  "extension" text NOT NULL, 
  "descripcion" text NOT NULL, 
  "orden" integer, 
primary key ("icono")
);
grant select, insert, update, delete on "iconografia" to "nnya_user";


insert into iconografia (icono, extension, descripcion, orden)
values
('leyes-gris', 'svg', 'Acceso a Leyes vinculadas al indicador.', 1),
('ficha-tecnica-gris', 'svg', 'Acceso a Ficha técnica del indicador (definiciones, fuentes y metadata complementaria)', 2),
('mapa-gris', 'svg', 'Acceso a mapa', 3),
('ods4', 'png', 'Objetivo de Desarrollo Sostenible (Agenda 2030) Muestra los indicadores que forman parte del programa.', 4),
('estrella', 'svg', 'La presencia de la estrella en la esquina superior derecha de un indicador, muestra que fue recientemente actualizado', 5);


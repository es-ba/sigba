create or replace function ch_pass_trg() returns trigger
  language plpgsql
as
$body$
begin
  if new.usu_blanquear_clave and new.usu_interno is distinct from old.usu_interno then
    new.usu_clave := md5(new.usu_interno||new.usu_usu);
    new.usu_blanquear_clave := false;
    new.usu_interno := old.usu_interno;
  end if;
  return new;
end;
$body$;

create trigger ch_pass_trg before update on usuarios
  for each row
  execute ch_pass_trg();
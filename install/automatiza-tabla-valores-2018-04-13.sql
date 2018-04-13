SET ROLE sigba_owner;
SET search_path=sigba;

ALTER TABLE variables ADD COLUMN estado_tabla_valores TEXT;
ALTER TABLE variables ADD CONSTRAINT "valor invalido en estado_variable" CHECK (estado_tabla_valores=ANY (ARRAY['nueva'::TEXT,'quitar'::TEXT]));




CREATE OR REPLACE FUNCTION sigba.agregar_quitar_variables()
  RETURNS integer AS
$BODY$
DECLARE
   str_add_or_drop_var  TEXT;
   str_upd_estado_var   TEXT;
   estado_tabla_valores TEXT;
   variable             TEXT;
   estado_variable      RECORD;
   i                    int;
   filas_insertadas int := 0;
BEGIN
  str_add_or_drop_var='ALTER TABLE valores #addOrDrop #var_nueva_o_vieja';
  str_upd_estado_var='UPDATE variables SET estado_tabla_valores=#estado_variable WHERE variable=#variable';
  FOR estado_variable IN
      SELECT v.estado_tabla_valores,v.variable FROM variables v
  LOOP
    IF estado_variable.estado_tabla_valores='nueva' THEN 
      str_add_or_drop_var=replace(str_add_or_drop_var,'#addOrDrop','ADD COLUMN');
      str_add_or_drop_var=replace(str_add_or_drop_var,'#var_nueva_o_vieja',estado_variable.variable);
      str_add_or_drop_var=str_add_or_drop_var||' TEXT';
      EXECUTE str_add_or_drop_var;
      str_upd_estado_var=replace(str_upd_estado_var,'#estado_variable','NULL');
      str_upd_estado_var=replace(str_upd_estado_var,'#variable',quote_literal(estado_variable.variable));
      --raise notice 'str_add_or_drop_var %', str_add_or_drop_var;
      --raise notice 'str_upd_estado_var %', str_upd_estado_var;
      GET DIAGNOSTICS i= ROW_COUNT;
      filas_insertadas=filas_insertadas+i;
      EXECUTE str_upd_estado_var;
    END IF;
    IF estado_variable.estado_tabla_valores='quitar' THEN
      str_add_or_drop_var=replace(str_add_or_drop_var,'#addOrDrop','DROP COLUMN');
      str_add_or_drop_var=replace(str_add_or_drop_var,'#var_nueva_o_vieja',estado_variable.variable);
      EXECUTE str_add_or_drop_var;
      DELETE FROM variables v WHERE v.variable=estado_variable.variable;
      str_upd_estado_var=replace(str_upd_estado_var,'#estado_variable','null');
      str_upd_estado_var=replace(str_upd_estado_var,'#variable',quote_literal(estado_variable.variable));
      raise notice 'str_add_or_drop_var %', str_add_or_drop_var;
      raise notice 'str_upd_estado_var %', str_upd_estado_var;
      EXECUTE str_upd_estado_var;
    END IF;
  END LOOP;
  return filas_insertadas;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE SECURITY DEFINER
  COST 100;
ALTER FUNCTION sigba.agregar_quitar_variables()
  OWNER TO sigba_owner;


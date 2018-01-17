set search_path= sigba;
--17/11/09
alter table valores
    add column g_g_activ text;
    
alter table indicadores 
    add column icono    text,
    add column metas    text;

--17/11/13
alter table agrupacion_principal
    add column icono    text;
alter table dimension
    add column icono    text;
alter table indicadores
    add column ods      text;

--17/11/15
FALTA AGREGAR LOS GRANT QUE CORRIO EMILIO EN PRODUCCIÓN PARA calcular_totales y diferencia totales (ver dif para_install)

--21/12/2017
--carga inicial de tabla tabulados
insert into tabulados(indicador, cortantes)
  select indicador, cortantes
  from celdas
  group by indicador, cortantes
  order by indicador, cortantes;
update tabulados t
  set habilitado=false
  from (select indicador, nohabilitados, x from indicadores , unnest(nohabilitados)x) as y
  where t.indicador=y.indicador and t.cortantes=y.x 
 
--11/01/2018
--carga de tabla tabulados
insert into tabulados(indicador, cortantes)
  select indicador, cortantes
  from celdas
  where (indicador,cortantes) not in (select indicador,cortantes from tabulados)
  group by indicador, cortantes
  order by indicador, cortantes;
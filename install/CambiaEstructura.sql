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
  
-- Sincronización momentánea entre las tablas celdas y valores
update celdas cc set cortantes=x.cor_correctos
from (
select v.indicador, v.cortantes cor_correctos,c.cortantes,c.cortes--, *
 from valores v inner join celdas c on v.indicador=c.indicador and v.cortes=c.cortes
 where c.cortantes is distinct from v.cortantes

)x where  x.indicador=cc.indicador and cc.cortes=x.cortes

--------------------------------------------------------------------------------
--19/01/2018     
alter table tabulados add column invalido boolean;
---------------------------------------------------

create table "tabulados_variables" (
  "indicador" text NOT NULL, 
  "cortantes" jsonb NOT NULL, 
  "variable" text NOT NULL, 
  "ubicacion_tabulado" text, 
  "orden_tabulado" integer, 
  "ubicacion_grafico" text, 
  "orden_grafico" integer
, primary key ("indicador", "cortantes", "variable")
);
grant select, insert, update, delete on "tabulados_variables" to "sigba_user";

alter table "tabulados_variables" add constraint "valor invalido en ubicacion_tabulado" check (ubicacion_tabulado in ('fil', 'col','z'));
alter table "tabulados_variables" add constraint "valor invalido en ubicacion_grafico" check (ubicacion_grafico in ('fil', 'col','z'));-- FKs

alter table "tabulados_variables" add constraint  "tabulados_variables tabulados REL " foreign key ("indicador", "cortantes") references "tabulados" ("indicador", "cortantes")  on update cascade;
alter table "tabulados_variables" add constraint  "tabulados_variables indicadores_variables REL " foreign key ("indicador", "variable") references "indicadores_variables" ("indicador", "variable")  on update cascade;--CONSTRAINS SCHEMA SIGBA
alter table "cortes_celdas" add constraint  "cortes_celdas indicadores_variables REL " foreign key ("indicador", "variable") references "indicadores_variables" ("indicador", "variable")  on delete cascade on update cascade;
alter table tabulados alter column invalido set default false
-----------------------------------------------------------
-- 23-01-2018
alter table cortes add column color text;

--nueva sincronizacion  FALTA PROBAR TODO!!!!
-- el usuario puede borrar tabulados
-- agregar a la condicion de la rutina de alta de tabulados que no inserte tabulados con cortantes={}
-- sacar codicion de  invalido false al trigger de tabulados_tabulados_variables
-- modificar rutina para el caso tabulado existente invalido y con dato en celdas => invalido false
-- PASOS:
select * INTO tabulados_bak from tabulados
  order by indicador, cortantes;
delete from tabulados;
-- alta de tabulados desde boton de la aplicacion 
-- insert invalidos consistentes
with t as (
   select indicador,cortantes, var.var
   from tabulados_bak t ,jsonb_object_keys(cortantes) var
   where 
      not exists (select indicador,cortantes from celdas c where c.indicador=t.indicador and c.cortantes=t.cortantes)
 ), t1 as (
   select t.indicador, t.cortantes, var, variable, count(*) over (partition by t.indicador,t.cortantes) n_c, count(variable) over (partition by t.indicador, t.cortantes) n_v
   from t left join indicadores_variables i on i.indicador=t.indicador and i.variable=t.var
 ), t_ins as (
   select indicador, cortantes  
    from t1 where n_c=n_v
   group by 1 ,2)
insert into tabulados(indicador, cortantes, invalido)  
 select indicador, cortantes, true
 from t_ins;
-- rescatar seteos del usuario desde bak  
update tabulados t
  set (habilitado   = b.habilitado     
    ,mostrar_cuadro = b.mostrar_cuadro 
    ,mostrar_grafico= b.mostrar_grafico
    ,tipo_grafico   = b.tipo_grafico    
    ,orientacion    = b.orientacion 
    ,apilado        = b.apilado)
 from tabulados_bak b
 where b.indicador=t.indicador and b.cortantes=t.cortantes and 
 (b.habilitado is distinct from t.habilitado or
  b.mostrar_cuadro is distinct from t.mostrar_cuadro or        
  b.mostrar_grafico is distinct from t.mostrar_grafico or 
  b.tipo_grafico is distinct from t.tipo_grafico or 
  b.orientacion is distinct from t.orientacion  
  );

alter table "indicadores" add constraint  "indicadores fte REL " foreign key ("fte") references "fte" ("fte")  on update cascade;
alter table "indicadores" add constraint  "indicadores um REL " foreign key ("um") references "um" ("um")  on update cascade;

select 'tabulados' as table_name, enance_table('tabulados','indicador,cortantes') as result 
 UNION select 'tabulados_variables' as table_name, enance_table('tabulados_variables','indicador,cortantes,variable') as result;
 
--18/01/26 modificaciones en tabulados_variables
alter table tabulados_variables
drop column "orden_grafico",
add column  "ubicacion_tabulado_serie" text, 
add column "orden_tabulado_serie" integer, 
add column "ubicacion_grafico_serie" text;

alter table "tabulados_variables" add constraint "valor invalido en ubicacion_tabulado_serie" check (ubicacion_tabulado_serie in ('fil', 'col','z'));
alter table "tabulados_variables" add constraint "valor invalido en ubicacion_grafico_serie" check (ubicacion_grafico_serie in ('fil', 'col','z'));-- FKs
 

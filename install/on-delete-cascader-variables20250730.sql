set search_path=sicuidados;

alter table "cortes_celdas" drop constraint "cortes_celdas cortes REL";
alter table "cortes_celdas" add constraint "cortes_celdas cortes REL" foreign key ("variable", "valor_corte") references "cortes" ("variable", "valor_corte")  on delete cascade on update cascade;

alter table "tabulados_variables" drop constraint "tabulados_variables indicadores_variables REL";
alter table "tabulados_variables" add constraint "tabulados_variables indicadores_variables REL" foreign key ("indicador", "variable") references "indicadores_variables" ("indicador", "variable")  on delete cascade on update cascade;

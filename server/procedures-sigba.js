"use strict";

var ProceduresExamples = {};
function inlineLog(mmm){ console.log('----------------------------------',mmm); return mmm; }
ProceduresExamples = [
    {
        action:'tabulado/validar',
        parameters:[
            {name:'indicador'            ,typeName:'text'},
            {name:'camposCortantes'      ,typeName:'text'},
            {name:'cortantes'            ,typeName:'text'},
            {name:'annioCortante'        ,typeName:'text'},
            {name:'usuario'              ,typeName:'text'},
        ],
        coreFunction:function(context, parameters){
            var condicion=(parameters.annioCortante!='TRUE')?'cc.valor_corte = $3 ':' $3';
            var updateString=
            "WITH validar AS(  "+
                "SELECT v.indicador, cortantes,v.cortes, cc.valor_corte annio, valor, usu_validacion, fecha_validacion,origen_validacion "+
                "FROM celdas v "+
                "LEFT JOIN cortes_celdas cc ON v.indicador=cc.indicador AND v.cortes=cc.cortes AND cc.variable='annio'"+
                "WHERE v.indicador=$1  AND "+parameters.camposCortantes+" = $2::jsonb AND "+condicion+
                "GROUP BY v.indicador, v.cortes, cc.valor_corte"+
            ")"+
            "UPDATE valores y SET usu_validacion=$4, fecha_validacion=current_timestamp, "+
                "origen_validacion=jsonb_build_object('indicador',$1,'cortantes',$2,'annio',$3)"+
                "FROM validar x WHERE x.indicador = y.indicador AND x.cortes=y.cortes";
            return context.client.query(updateString,[parameters.indicador,parameters.cortantes,parameters.annioCortante,parameters.usuario]
            ).fetchAll().then(function(result){
                return result.rowCount;
            });
        }
    },
    {
        action:'tabulado/esta-validado',
        parameters:[
            {name:'indicador'            ,typeName:'text'},
            {name:'camposCortantes'      ,typeName:'text'},
            {name:'cortantes'            ,typeName:'text'},
            {name:'annioCortante'        ,typeName:'text'},
            {name:'usuario'              ,typeName:'text'},
        ],
        coreFunction:function(context, parameters){
            var condicion=(parameters.annioCortante!='TRUE')?'cc.valor_corte = $3 ':' $3';
            var selectString=
                     "WITH validar AS(  "+
                        "SELECT v.indicador, cortantes,v.cortes, cc.valor_corte annio, valor, usu_validacion, fecha_validacion,origen_validacion "+
                        "FROM celdas v "+
                        "LEFT JOIN cortes_celdas cc ON v.indicador=cc.indicador AND v.cortes=cc.cortes AND cc.variable='annio'"+
                        "WHERE v.indicador=$1  AND "+parameters.camposCortantes+" = $2::jsonb AND "+condicion+
                        "GROUP BY v.indicador, v.cortes, cc.valor_corte"+
                      ")"+
                      "SELECT count(*) FROM validar "+
                      "WHERE usu_validacion IS NOT NULL AND fecha_validacion IS NOT NULL AND origen_validacion IS NOT NULL ";
            return context.client.query(selectString,[parameters.indicador,parameters.cortantes,parameters.annioCortante]
            ).fetchOneRowIfExists().then(function(result){
                return result.row.count;
            });
        }
    },
    {
        action:'tabulado/habilitar',
        parameters:[
            {name:'indicador'       ,typeName:'text'},
            //{name:'camposCortantes' ,typeName:'text'},
            //{name:'cortantes'       ,typeName:'text'},
            //{name:'annioCortante'   ,typeName:'text'},
           // {name:'usuario'         ,typeName:'text'},
            {name:'habilitar'       ,typeName:'boolean'},
            {name:'cortante_orig'   ,typeName:'jsonb'}
        ],
        coreFunction:function(context, parameters){
            var updateString="UPDATE indicadores set nohabilitados="+(parameters.habilitar?
                'case when array_remove(nohabilitados,$1)=array[]::jsonb[] then null else array_remove(nohabilitados,$1) end ':
                ' array_append(nohabilitados,$1)')+' where indicador=$2';
            return context.client.query(updateString,[parameters.cortante_orig,parameters.indicador]
            ).fetchOneRowIfExists().then(function(result){
                return result.rowCount;
            });
            return 'Habilitar/desHabilitar';
        }
    },
    {
        action:'calcular/discrepancias',
        parameters:[],
        coreFunction:function(context, parameters){
            
            return context.client.query(
                `SELECT * FROM diferencia_totales`
            ).fetchAll().then(function(result){
                return result.rows;
            });
        }
    },
    {
        action:'calcular/totales',
        parameters:[],
        coreFunction:function(context, parameters){
            return context.client.query(`SELECT valores_totales() totales_calculados,cargar_totales() totales_cargados`).fetchOneRowIfExists().then(function(result){
                return result.row.totales_cargados;
            });
        }
    },
];

module.exports = ProceduresExamples;
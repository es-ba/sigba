"use strict";

module.exports = function(context){
    return context.be.tableDefAdapt({
        name:'tabulados',
        editable:context.user.usu_rol === 'ingresador' || context.user.usu_rol ==='admin' || context.user.usu_rol ==='programador';
        fields: [
            {name:'indicador'        , label:'Código indicador', typeName:'text'     , allow:{select: true,insert:false, update:false},
            {name:'cortantes'        , label:'Cortantes'       , typeName:'jsonb'    , allow:{select: true,insert:false, update:false},
            {name:'habilitado'       , label:'Habilitado'      , typeName:'boolean'         , defaultValue:true},
            {name:'mostrar'          , label:'Mostrar'         , typeName:'boolean'         , defaultValue:true},
            {name:'graficar'         , label:'Graficar'        , typeName:'boolean'         , defaultValue:true},
            {name:'tipografico'      , label:'Tipo Gráfico'    , typeName:'text'            , defaultValue:'lineas'},
            {name:'usu_validacion'                             , typeName:'text'     , allow:{select: true,insert:false, update:false}},
            {name:'fecha_validacion'                           , typeName:'timestamp', allow:{select: true,insert:false, update:false}},
            {name:'origen_validacion'                          , typeName:'text'     , allow:{select: true,insert:false, update:false}},
        ], 
        primaryKey:['indicador','cortantes'],
        foreignKeys:[
            {references:'indicadores', fields:['indicador']},
        ],
        detailTables:[
            {table: 'valores', fields:['indicador', 'cortantes'], abr:'V', label:'valores'}
        ]
    },context);
}
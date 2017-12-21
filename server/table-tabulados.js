"use strict";

module.exports = function(context){
    return context.be.tableDefAdapt({
        name: 'tabulados',
        editable: context.user.usu_rol === 'ingresador' || context.user.usu_rol === 'admin' || context.user.usu_rol === 'programador',
        fields: [
            {name:'indicador'        , label:'Código indicador', typeName:'text'     , allow:{select: true,insert:false, update:false}},
            {name:'cortantes'        , label:'Cortantes'       , typeName:'jsonb'    , allow:{select: true,insert:false, update:false}},
            {name:'habilitado'       , label:'Habilitado'      , typeName:'boolean'  , defaultValue:true},
            {name:'mostrar_cuadro'   , label:'Mostrar Cuadro'  , typeName:'boolean'  , defaultValue:true},
            {name:'mostrar_grafico'  , label:'Mostrar Gráfico' , typeName:'boolean'  , defaultValue:true},
            {name:'tipo_grafico'     , label:'Tipo Gráfico'    , typeName:'text'     , defaultValue:'line', },
            {name:'orientacion'      , label:'Orientación'     , typeName:'text'     , defaultValue:'horizontal'},
        ], 
        primaryKey:['indicador','cortantes'],
        foreignKeys:[
            {references:'indicadores', fields:['indicador']},
        ],
        constraints:[
            {constraintType:'check' , consName:"tipo de gráfico", expr:"tipo_grafico in ('linea', 'barra')"},
            {constraintType:'check' , consName:"orientación", expr:"orientacion in ('horizontal', 'vertical')"},
        ],
        detailTables:[
            {table: 'valores', fields:['indicador', 'cortantes'], abr:'V', label:'valores'}
        ]
    },context);
}
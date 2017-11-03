"use strict";

module.exports = function(context){
    var puedeEditar = context.user.usu_rol === 'ingresador'  || context.user.usu_rol ==='admin'  || context.user.usu_rol ==='programador';    
    return context.be.tableDefAdapt({
        name:'cortes_celdas',
        editable: puedeEditar,
        fields: [
            {name:'indicador'     ,               label:'Código indicador'         , typeName:'text' ,nullable:false},
            {name:'cortes'        ,isSlicer:true, label:'Cortes'                   , typeName:'jsonb', allow:{select: true,insert:false, update:false}},
            {name:'variable'      ,               label:'Coeficiente de variación' , typeName:'text'},
            {name:'valor_corte'   ,               label:'Numerador'                , typeName:'text'},
        ],
        slicerField:'cortes',
        primaryKey:['indicador','cortes', 'variable'], // poner acá el autonumérico
        foreignKeys:[
            {references:'celdas', fields:['indicador', 'cortes'], onDelete:'cascade'},
            {references:'cortes', fields:['variable', 'valor_corte']},
        ]
    },context);
}

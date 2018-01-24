"use strict";

module.exports = function(context){
    var puedeEditar = context.user.usu_rol === 'ingresador'  || context.user.usu_rol ==='admin'  || context.user.usu_rol ==='programador';
    return context.be.tableDefAdapt({
        name:'cortes',
        editable: puedeEditar,
        fields: [
            {name: 'variable'         ,typeName:'text'          ,nullable:false},
            {name: 'valor_corte'      ,typeName:'text'          ,nullable:false},
            {name: 'denominacion'     ,typeName:'text'          },
            {name: 'descripcion'      ,typeName:'text'          },
            {name: 'color'            ,typeName:'text'          },
            {name: 'orden'            ,typeName:'integer'       },
        ],
        primaryKey:['variable', 'valor_corte'],
        foreignKeys:[
            {references:'variables', fields:['variable']},
        ]
    },context);
}
"use strict";

module.exports = function(context){
    var puedeEditar = context.user.usu_rol === 'ingresador'  || context.user.usu_rol ==='admin'  || context.user.usu_rol ==='programador';
    return context.be.tableDefAdapt({
        name:'fte',
        editable: puedeEditar,
        fields: [
            {name: 'fte'          ,typeName:'text'          ,nullable:false},
            {name: 'denominacion' ,typeName:'text'          },
            {name: 'descripcion'  ,typeName:'text'          },
        ],
        primaryKey:['fte'],
        detailTables:[
            {table: 'valores', fields:[{source:'fte', target:'fte'}], abr:'V', label:'valores'}
        ]
    },context);
}
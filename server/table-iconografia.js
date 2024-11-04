"use strict";

module.exports = function(context){
    var puedeEditar = context.user.usu_rol ==='admin'  || context.user.usu_rol ==='programador';
    return context.be.tableDefAdapt({
        name:'iconografia',
        editable: puedeEditar,
        fields: [
            {name: 'icono'       ,typeName:'text'    ,nullable:false },
            {name: 'extension'   ,typeName:'text'    ,nullable:false },
            {name: 'descripcion' ,typeName:'text'                    },
            {name: 'orden'       ,typeName:'integer'                 },
        ],
        primaryKey:['icono']
    },context);
}
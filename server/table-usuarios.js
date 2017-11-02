"use strict";

module.exports = function(context){
    var admin = context.user.usu_rol==='admin';
    return context.be.tableDefAdapt({
        name:'usuarios',
        title:'Usuarios de la Aplicación',
        editable:admin,
        fields:[
            {name:'usu_usu'              , typeName:'text'   , nullable:false   },
            {name:'usu_rol'              , typeName:'text'                    },
            {name:'usu_clave'            , typeName:'text'                    },
            {name:'usu_activo'           , typeName:'boolean' , nullable:false   ,defaultValue:false},
            {name:'usu_nombre'           , typeName:'text'                    },
            {name:'usu_apellido'         , typeName:'text'                    },
            {name:'usu_blanquear_clave'  , typeName:'boolean' , nullable:false   ,defaultValue:false},
            {name:'usu_interno'          , typeName:'text'                    },
            {name:'usu_mail'             , typeName:'text'                    },
            {name:'usu_mail_alternativo' , typeName:'text'                    },
            {name:'usu_rol_secundario'   , typeName:'text'                    },
            {name:'usu_tlg'              , typeName:'integer' , nullable:false}
        ],
        primaryKey:['usu_usu']
    },context);
}

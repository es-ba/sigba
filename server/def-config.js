module.exports = 
`server:
  port: 3053
  base-url: /sigba
  skins:
    "":
      local-path: client/
    confort:
      local-path: node_modules/backend-skins/dist/
    confort-bis:
      local-path: node_modules/backend-skins/dist/
    confort-dark:
      local-path: node_modules/backend-skins/dist/
db:
  motor: postgresql
  host: localhost
  database: sigba_db
  schema: sigba
  user: sigba_user
login:
  table: usuarios
  userFieldName: usu_usu
  passFieldName: usu_clave
  rolFieldName: usu_rol
  infoFieldList: [usu_usu, usu_rol, usu_nombre]
  activeClausule: usu_activo
  messages:
    userOrPassFail: el nombre de usuario no existe o la clave no corresponde
    lockedFail: el usuario se encuentra bloqueado
    inactiveFail: es usuario está marcado como inactivo
  plus:
    allowHttpLogin: true
    loginForm:
      formTitle: entrada
      usernameLabel: Usuario
      passwordLabel: Clave
      buttonLabel: Entrar
    successRedirect: /menu
    fileStore: true
install:
  dump:
    db:
      owner: sigba_owner
    enances: inline
    scripts:
      post-adapt: 
      - para-install.sql
      - ../node_modules/pg-triggers/lib/recreate-his.sql
      - ../node_modules/pg-triggers/lib/table-changes.sql
      - ../node_modules/pg-triggers/lib/function-changes-trg.sql
      - ../node_modules/pg-triggers/lib/enance.sql
    skip-content: true
client-setup:
  cursors: true
  skin: "confort"
  menu: true
  lang: es
  conTextoPrincipal: false
  labels:
    agrupacion-principal: Derecho
    agrupacion-secundaria: Dimensión
  logos:
  - estadistica
content: []  
`;
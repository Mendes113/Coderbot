/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.id != \"\" && (@request.auth.role = \"teacher\" || @request.auth.role = \"admin\")",
    "deleteRule": "@request.auth.id != \"\" && (teacher = @request.auth.id || @request.auth.role = \"admin\")",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text_board_id",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_title",
        "max": 120,
        "min": 1,
        "name": "title",
        "pattern": "",
        "presentable": true,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "editor_description",
        "name": "description",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "editor"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_2478702895",
        "hidden": false,
        "id": "rel_class",
        "maxSelect": 1,
        "minSelect": 1,
        "name": "class",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "rel_teacher",
        "maxSelect": 1,
        "minSelect": 1,
        "name": "teacher",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_class_missions",
        "hidden": false,
        "id": "rel_missions",
        "maxSelect": 99,
        "name": "missions",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "bool_is_active",
        "name": "is_active",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "autodate_created",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate_updated",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "pbc_mission_boards",
    "indexes": [
      "CREATE INDEX `idx_mission_boards_class` ON `mission_boards` (`class`)",
      "CREATE INDEX `idx_mission_boards_is_active` ON `mission_boards` (`is_active`)"
    ],
    "listRule": "@request.auth.id != \"\" && (class.createdBy ?= @request.auth.id || @request.auth.role = \"admin\" || (@collection.class_members.user.id ?= @request.auth.id && @collection.class_members.class.id ?= class))",
    "name": "mission_boards",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.id != \"\" && (teacher = @request.auth.id || @request.auth.role = \"admin\")",
    "viewRule": "@request.auth.id != \"\" && (class.createdBy ?= @request.auth.id || @request.auth.role = \"admin\" || (@collection.class_members.user.id ?= @request.auth.id && @collection.class_members.class.id ?= class))"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_mission_boards");
  return app.delete(collection);
})

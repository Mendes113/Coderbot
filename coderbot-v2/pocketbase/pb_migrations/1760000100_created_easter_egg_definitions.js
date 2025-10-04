/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.role = 'admin'",
    "deleteRule": "@request.auth.role = 'admin'",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text3208210256",
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
        "hidden": false,
        "id": "text_name",
        "max": 100,
        "min": null,
        "name": "name",
        "pattern": "^[a-z_]+$",
        "presentable": true,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "text_display_name",
        "max": 200,
        "min": null,
        "name": "display_name",
        "pattern": "",
        "presentable": true,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "text_description",
        "max": 500,
        "min": null,
        "name": "description",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "select_trigger_type",
        "maxSelect": 1,
        "name": "trigger_type",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "clicks",
          "sequence",
          "time_based",
          "combo"
        ]
      },
      {
        "hidden": false,
        "id": "json_trigger_config",
        "maxSize": 2000000,
        "name": "trigger_config",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "json"
      },
      {
        "hidden": false,
        "id": "text_achievement_message",
        "max": 1000,
        "min": null,
        "name": "achievement_message",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "number_points",
        "max": null,
        "min": 0,
        "name": "points",
        "onlyInt": true,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "text_icon",
        "max": 10,
        "min": null,
        "name": "icon",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "bool_is_active",
        "name": "is_active",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "select_category",
        "maxSelect": 1,
        "name": "category",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "ui_interaction",
          "exploration",
          "achievement",
          "secret"
        ]
      },
      {
        "hidden": false,
        "id": "select_difficulty",
        "maxSelect": 1,
        "name": "difficulty",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "easy",
          "medium",
          "hard",
          "legendary"
        ]
      }
    ],
    "indexes": [],
    "listRule": "is_active = true",
    "name": "easter_egg_definitions",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.role = 'admin'",
    "viewRule": "is_active = true"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("easter_egg_definitions");
  return app.delete(collection);
});

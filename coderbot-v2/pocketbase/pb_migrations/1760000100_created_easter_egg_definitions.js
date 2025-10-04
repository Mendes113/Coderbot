/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "easter_egg_definitions_id",
    "created": "2025-01-04 10:01:00.000Z",
    "updated": "2025-01-04 10:01:00.000Z",
    "name": "easter_egg_definitions",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "name",
        "name": "name",
        "type": "text",
        "required": true,
        "presentable": true,
        "unique": false,
        "options": {
          "min": null,
          "max": 100,
          "pattern": "^[a-z_]+$"
        }
      },
      {
        "system": false,
        "id": "display_name",
        "name": "display_name",
        "type": "text",
        "required": true,
        "presentable": true,
        "unique": false,
        "options": {
          "min": null,
          "max": 200,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "description",
        "name": "description",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": 500,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "trigger_type",
        "name": "trigger_type",
        "type": "select",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "clicks",
            "sequence",
            "time_based",
            "combo"
          ]
        }
      },
      {
        "system": false,
        "id": "trigger_config",
        "name": "trigger_config",
        "type": "json",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSize": 2000000
        }
      },
      {
        "system": false,
        "id": "achievement_message",
        "name": "achievement_message",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": 1000,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "points",
        "name": "points",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": null,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "icon",
        "name": "icon",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": 10,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "is_active",
        "name": "is_active",
        "type": "bool",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {}
      },
      {
        "system": false,
        "id": "category",
        "name": "category",
        "type": "select",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "ui_interaction",
            "exploration",
            "achievement",
            "secret"
          ]
        }
      },
      {
        "system": false,
        "id": "difficulty",
        "name": "difficulty",
        "type": "select",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "easy",
            "medium",
            "hard",
            "legendary"
          ]
        }
      }
    ],
    "indexes": [
      "CREATE UNIQUE INDEX idx_easter_egg_name ON easter_egg_definitions (name)",
      "CREATE INDEX idx_easter_egg_active ON easter_egg_definitions (is_active)"
    ],
    "listRule": "is_active = true",
    "viewRule": "is_active = true",
    "createRule": "@request.auth.role = 'admin'",
    "updateRule": "@request.auth.role = 'admin'",
    "deleteRule": "@request.auth.role = 'admin'",
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("easter_egg_definitions_id");

  return dao.deleteCollection(collection);
});

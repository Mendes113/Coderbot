/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "user_easter_egg_progress_id",
    "created": "2025-01-04 10:02:00.000Z",
    "updated": "2025-01-04 10:02:00.000Z",
    "name": "user_easter_egg_progress",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "user",
        "name": "user",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": ["name", "email"]
        }
      },
      {
        "system": false,
        "id": "easter_egg",
        "name": "easter_egg",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "easter_egg_definitions_id",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": ["name", "display_name"]
        }
      },
      {
        "system": false,
        "id": "current_value",
        "name": "current_value",
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
        "id": "session_data",
        "name": "session_data",
        "type": "json",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSize": 2000000
        }
      },
      {
        "system": false,
        "id": "is_completed",
        "name": "is_completed",
        "type": "bool",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {}
      },
      {
        "system": false,
        "id": "completed_at",
        "name": "completed_at",
        "type": "date",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": "",
          "max": ""
        }
      },
      {
        "system": false,
        "id": "attempts",
        "name": "attempts",
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
        "id": "metadata",
        "name": "metadata",
        "type": "json",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSize": 2000000
        }
      }
    ],
    "indexes": [
      "CREATE INDEX idx_progress_user ON user_easter_egg_progress (user)",
      "CREATE INDEX idx_progress_easter_egg ON user_easter_egg_progress (easter_egg)",
      "CREATE INDEX idx_progress_completed ON user_easter_egg_progress (is_completed)",
      "CREATE UNIQUE INDEX idx_progress_unique ON user_easter_egg_progress (user, easter_egg)"
    ],
    "listRule": "@request.auth.id != '' && user = @request.auth.id",
    "viewRule": "@request.auth.id != '' && user = @request.auth.id",
    "createRule": "@request.auth.id != '' && user = @request.auth.id",
    "updateRule": "@request.auth.id != '' && user = @request.auth.id",
    "deleteRule": null,
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("user_easter_egg_progress_id");

  return dao.deleteCollection(collection);
});

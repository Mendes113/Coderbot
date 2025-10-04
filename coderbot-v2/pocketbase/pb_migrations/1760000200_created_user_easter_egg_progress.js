/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Get the easter_egg_definitions collection ID
  const easterEggCollection = app.findCollectionByNameOrId("easter_egg_definitions");
  
  const collection = new Collection({
    "createRule": "",
    "deleteRule": "",
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
        "cascadeDelete": true,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "relation_user",
        "maxSelect": 1,
        "minSelect": 1,
        "name": "user",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": true,
        "collectionId": easterEggCollection.id,
        "hidden": false,
        "id": "relation_easter_egg",
        "maxSelect": 1,
        "minSelect": 1,
        "name": "easter_egg",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "number_current_value",
        "max": null,
        "min": 0,
        "name": "current_value",
        "onlyInt": true,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "json_session_data",
        "maxSize": 2000000,
        "name": "session_data",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
      },
      {
        "hidden": false,
        "id": "bool_is_completed",
        "name": "is_completed",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "date_completed_at",
        "max": "",
        "min": "",
        "name": "completed_at",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "hidden": false,
        "id": "number_attempts",
        "max": null,
        "min": 0,
        "name": "attempts",
        "onlyInt": true,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "json_metadata",
        "maxSize": 2000000,
        "name": "metadata",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
      }
    ],
    "indexes": [
      "CREATE INDEX idx_progress_user ON user_easter_egg_progress (user)",
      "CREATE INDEX idx_progress_easter_egg ON user_easter_egg_progress (easter_egg)",
      "CREATE INDEX idx_progress_completed ON user_easter_egg_progress (is_completed)",
      "CREATE UNIQUE INDEX idx_progress_unique ON user_easter_egg_progress (user, easter_egg)"
    ],
    "listRule": "@request.auth.id = user",
    "name": "user_easter_egg_progress",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.id = user",
    "viewRule": "@request.auth.id = user"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("user_easter_egg_progress");
  return app.delete(collection);
});

/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
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
        "hidden": false,
        "id": "text_achievement_id",
        "max": null,
        "min": null,
        "name": "achievement_id",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "text_achievement_name",
        "max": null,
        "min": null,
        "name": "achievement_name",
        "pattern": "",
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
        "id": "date_unlocked_at",
        "max": "",
        "min": "",
        "name": "unlocked_at",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "hidden": false,
        "id": "bool_is_new",
        "name": "is_new",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
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
      "CREATE INDEX idx_user_achievements_user ON user_achievements (user)",
      "CREATE INDEX idx_user_achievements_achievement_id ON user_achievements (achievement_id)",
      "CREATE INDEX idx_user_achievements_unlocked_at ON user_achievements (unlocked_at)",
      "CREATE UNIQUE INDEX idx_user_achievements_unique ON user_achievements (user, achievement_id)"
    ],
    "listRule": "@request.auth.id = user",
    "name": "user_achievements",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.id = user",
    "viewRule": "@request.auth.id = user"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("user_achievements");
  return app.delete(collection);
});

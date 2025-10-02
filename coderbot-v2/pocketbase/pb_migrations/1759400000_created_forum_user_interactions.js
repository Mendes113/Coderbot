/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.id != \"\"",
    "deleteRule": "@request.auth.id != \"\" && (@request.auth.role = \"admin\" || user = @request.auth.id)",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text_pk_forum_interaction",
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
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "rel_user",
        "maxSelect": 1,
        "minSelect": 1,
        "name": "user",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
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
        "hidden": false,
        "id": "sel_interaction_type",
        "maxSelect": 1,
        "name": "interaction_type",
        "presentable": true,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "post_viewed",
          "post_expanded",
          "comment_created",
          "external_link_clicked"
        ]
      },
      {
        "hidden": false,
        "id": "text_target_id",
        "max": 255,
        "min": 0,
        "name": "target_id",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "json_metadata",
        "name": "metadata",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
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
    "id": "pbc_forum_user_interactions",
    "indexes": [
      "CREATE INDEX `idx_forum_interactions_user` ON `forum_user_interactions` (`user`)",
      "CREATE INDEX `idx_forum_interactions_class` ON `forum_user_interactions` (`class`)",
      "CREATE INDEX `idx_forum_interactions_type` ON `forum_user_interactions` (`interaction_type`)",
      "CREATE INDEX `idx_forum_interactions_created` ON `forum_user_interactions` (`created`)"
    ],
    "listRule": "@request.auth.id != \"\" && (@request.auth.role = \"admin\" || user = @request.auth.id)",
    "name": "forum_user_interactions",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.id != \"\" && (@request.auth.role = \"admin\" || user = @request.auth.id)",
    "viewRule": "@request.auth.id != \"\" && (@request.auth.role = \"admin\" || user = @request.auth.id)"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_forum_user_interactions");
  return app.delete(collection);
})

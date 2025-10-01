/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.id != \"\" && (post.class.createdBy ?= @request.auth.id || @request.auth.role = \"admin\" || (@collection.class_members.user.id ?= @request.auth.id && @collection.class_members.class.id ?= post.class))",
    "deleteRule": "@request.auth.id != \"\" && (author = @request.auth.id || post.class.createdBy ?= @request.auth.id || @request.auth.role = \"admin\")",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text_pk_comment",
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
        "collectionId": "pbc_class_forum_posts",
        "hidden": false,
        "id": "rel_post",
        "maxSelect": 1,
        "minSelect": 1,
        "name": "post",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "rel_author",
        "maxSelect": 1,
        "minSelect": 1,
        "name": "author",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "text_content",
        "max": 0,
        "min": 1,
        "name": "content",
        "pattern": "",
        "presentable": true,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
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
    "id": "pbc_class_forum_comments",
    "indexes": [
      "CREATE INDEX `idx_class_forum_comments_post` ON `class_forum_comments` (`post`)"
    ],
    "listRule": "@request.auth.id != \"\" && (post.class.createdBy ?= @request.auth.id || @request.auth.role = \"admin\" || (@collection.class_members.user.id ?= @request.auth.id && @collection.class_members.class.id ?= post.class))",
    "name": "class_forum_comments",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.id != \"\" && (author = @request.auth.id || post.class.createdBy ?= @request.auth.id || @request.auth.role = \"admin\")",
    "viewRule": "@request.auth.id != \"\" && (post.class.createdBy ?= @request.auth.id || @request.auth.role = \"admin\" || (@collection.class_members.user.id ?= @request.auth.id && @collection.class_members.class.id ?= post.class))"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_class_forum_comments");
  return app.delete(collection);
})

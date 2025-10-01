/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.id != \"\" && (class.createdBy ?= @request.auth.id || @request.auth.role = \"admin\")",
    "deleteRule": "@request.auth.id != \"\" && (author = @request.auth.id || class.createdBy ?= @request.auth.id || @request.auth.role = \"admin\")",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text_pk_post",
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
        "id": "editor_content",
        "name": "content",
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
        "id": "sel_post_type",
        "maxSelect": 1,
        "name": "type",
        "presentable": true,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "aviso",
          "info",
          "conteudo",
          "arquivos",
          "links",
          "mensagens"
        ]
      },
      {
        "hidden": false,
        "id": "json_links",
        "name": "links",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
      },
      {
        "hidden": false,
        "id": "file_attachments",
        "maxSelect": 10,
        "maxSize": 52428800,
        "mimeTypes": [],
        "name": "attachments",
        "presentable": false,
        "required": false,
        "system": false,
        "thumbs": [],
        "type": "file"
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
    "id": "pbc_class_forum_posts",
    "indexes": [
      "CREATE INDEX `idx_class_forum_posts_class` ON `class_forum_posts` (`class`)",
      "CREATE INDEX `idx_class_forum_posts_type` ON `class_forum_posts` (`type`)
    ],
    "listRule": "@request.auth.id != \"\" && (class.createdBy ?= @request.auth.id || @request.auth.role = \"admin\" || (@collection.class_members.user.id ?= @request.auth.id && @collection.class_members.class.id ?= class))",
    "name": "class_forum_posts",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.id != \"\" && (author = @request.auth.id || class.createdBy ?= @request.auth.id || @request.auth.role = \"admin\")",
    "viewRule": "@request.auth.id != \"\" && (class.createdBy ?= @request.auth.id || @request.auth.role = \"admin\" || (@collection.class_members.user.id ?= @request.auth.id && @collection.class_members.class.id ?= class))"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_class_forum_posts");
  return app.delete(collection);
})

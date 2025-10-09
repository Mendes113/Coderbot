/// <reference path="../pb_data/types.d.ts" />/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {migrate((app) => {

  const collection = new Collection({  const collection = new Collection({

    "createRule": "@request.auth.id != \"\"",    "id": "pbc_code_snippets",

    "deleteRule": "@request.auth.id != \"\" && user = @request.auth.id",    "name": "code_snippets",

    "fields": [    "type": "base",

      {    "system": false,

        "autogeneratePattern": "[a-z0-9]{15}",    "schema": [

        "hidden": false,      {

        "id": "text_id",        "system": false,

        "max": 15,        "id": "text_id",

        "min": 15,        "name": "id",

        "name": "id",        "type": "text",

        "pattern": "^[a-z0-9]+$",        "required": true,

        "presentable": false,        "presentable": false,

        "primaryKey": true,        "unique": false,

        "required": true,        "options": {

        "system": true,          "min": 15,

        "type": "text"          "max": 15,

      },          "pattern": "^[a-z0-9]+$"

      {        },

        "cascadeDelete": true,        "primaryKey": true,

        "collectionId": "_pb_users_auth_",        "autogeneratePattern": "[a-z0-9]{15}",

        "hidden": false,        "hidden": false

        "id": "rel_user",      },

        "maxSelect": 1,      {

        "minSelect": 1,        "system": false,

        "name": "user",        "id": "rel_user",

        "presentable": false,        "name": "user",

        "required": true,        "type": "relation",

        "system": false,        "required": true,

        "type": "relation"        "presentable": false,

      },        "unique": false,

      {        "options": {

        "hidden": false,          "collectionId": "_pb_users_auth_",

        "id": "text_title",          "cascadeDelete": true,

        "max": 200,          "minSelect": 1,

        "min": 1,          "maxSelect": 1,

        "name": "title",          "displayFields": []

        "pattern": "",        },

        "presentable": false,        "hidden": false

        "required": true,      },

        "system": false,      {

        "type": "text"        "system": false,

      },        "id": "text_title",

      {        "name": "title",

        "hidden": false,        "type": "text",

        "id": "text_code",        "required": true,

        "max": 102400,        "presentable": false,

        "min": 0,        "unique": false,

        "name": "code",        "options": {

        "pattern": "",          "min": 1,

        "presentable": false,          "max": 200,

        "required": true,          "pattern": ""

        "system": false,        },

        "type": "text"        "hidden": false

      },      },

      {      {

        "hidden": false,        "system": false,

        "id": "text_language",        "id": "text_code",

        "max": 50,        "name": "code",

        "min": 1,        "type": "text",

        "name": "language",        "required": true,

        "pattern": "",        "presentable": false,

        "presentable": false,        "unique": false,

        "required": true,        "options": {

        "system": false,          "min": null,

        "type": "text"          "max": 102400,

      },          "pattern": ""

      {        },

        "hidden": false,        "hidden": false

        "id": "text_file_name",      },

        "max": 200,      {

        "min": 0,        "system": false,

        "name": "fileName",        "id": "text_language",

        "pattern": "",        "name": "language",

        "presentable": false,        "type": "text",

        "required": false,        "required": true,

        "system": false,        "presentable": false,

        "type": "text"        "unique": false,

      },        "options": {

      {          "min": 1,

        "hidden": false,          "max": 50,

        "id": "date_last_modified",          "pattern": ""

        "name": "lastModified",        },

        "presentable": false,        "hidden": false

        "required": false,      },

        "system": false,      {

        "type": "date"        "system": false,

      },        "id": "text_file_name",

      {        "name": "fileName",

        "hidden": false,        "type": "text",

        "id": "bool_is_favorite",        "required": false,

        "name": "isFavorite",        "presentable": false,

        "presentable": false,        "unique": false,

        "required": false,        "options": {

        "system": false,          "min": null,

        "type": "bool"          "max": 200,

      },          "pattern": ""

      {        },

        "hidden": false,        "hidden": false

        "id": "json_tags",      },

        "maxSize": 10000,      {

        "name": "tags",        "system": false,

        "presentable": false,        "id": "date_last_modified",

        "required": false,        "name": "lastModified",

        "system": false,        "type": "date",

        "type": "json"        "required": false,

      },        "presentable": false,

      {        "unique": false,

        "hidden": false,        "options": {

        "id": "autodate_created",          "min": "",

        "name": "created",          "max": ""

        "onCreate": true,        },

        "onUpdate": false,        "hidden": false

        "presentable": false,      },

        "system": false,      {

        "type": "autodate"        "system": false,

      },        "id": "bool_is_favorite",

      {        "name": "isFavorite",

        "hidden": false,        "type": "bool",

        "id": "autodate_updated",        "required": false,

        "name": "updated",        "presentable": false,

        "onCreate": true,        "unique": false,

        "onUpdate": true,        "options": {},

        "presentable": false,        "hidden": false

        "system": false,      },

        "type": "autodate"      {

      }        "system": false,

    ],        "id": "json_tags",

    "id": "pbc_code_snippets",        "name": "tags",

    "indexes": [        "type": "json",

      "CREATE INDEX `idx_code_snippets_user` ON `code_snippets` (`user`)",        "required": false,

      "CREATE INDEX `idx_code_snippets_language` ON `code_snippets` (`language`)",        "presentable": false,

      "CREATE INDEX `idx_code_snippets_modified` ON `code_snippets` (`lastModified`)"        "unique": false,

    ],        "options": {

    "listRule": "@request.auth.id != \"\" && user = @request.auth.id",          "maxSize": 10000

    "name": "code_snippets",        },

    "system": false,        "hidden": false

    "type": "base",      },

    "updateRule": "@request.auth.id != \"\" && user = @request.auth.id",      {

    "viewRule": "@request.auth.id != \"\" && user = @request.auth.id"        "system": false,

  });        "id": "autodate_created",

        "name": "created",

  return app.save(collection);        "type": "autodate",

}, (app) => {        "required": false,

  const collection = app.findCollectionByNameOrId("pbc_code_snippets");        "presentable": false,

  return app.delete(collection);        "unique": false,

});        "options": {

          "onCreate": true,
          "onUpdate": false
        },
        "hidden": false
      },
      {
        "system": false,
        "id": "autodate_updated",
        "name": "updated",
        "type": "autodate",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "onCreate": true,
          "onUpdate": true
        },
        "hidden": false
      }
    ],
    "indexes": [
      "CREATE INDEX idx_code_snippets_user ON code_snippets (user)",
      "CREATE INDEX idx_code_snippets_language ON code_snippets (language)",
      "CREATE INDEX idx_code_snippets_modified ON code_snippets (lastModified)"
    ],
    "listRule": "@request.auth.id != \"\" && user = @request.auth.id",
    "viewRule": "@request.auth.id != \"\" && user = @request.auth.id",
    "createRule": "@request.auth.id != \"\"",
    "updateRule": "@request.auth.id != \"\" && user = @request.auth.id",
    "deleteRule": "@request.auth.id != \"\" && user = @request.auth.id"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_code_snippets");

  return app.delete(collection);
});
          "max": 100000,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "language_field",
        "name": "language",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": 50,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "filename_field",
        "name": "fileName",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": 255,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "modified_field",
        "name": "lastModified",
        "type": "date",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": "",
          "max": ""
        }
      },
      {
        "system": false,
        "id": "favorite_field",
        "name": "isFavorite",
        "type": "bool",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {}
      },
      {
        "system": false,
        "id": "tags_field",
        "name": "tags",
        "type": "json",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSize": 1000
        }
      }
    ],
    "indexes": [
      "CREATE INDEX idx_code_snippets_user ON code_snippets (user)",
      "CREATE INDEX idx_code_snippets_language ON code_snippets (language)",
      "CREATE INDEX idx_code_snippets_modified ON code_snippets (lastModified)"
    ],
    "listRule": "@request.auth.id != \"\" && user = @request.auth.id",
    "viewRule": "@request.auth.id != \"\" && user = @request.auth.id",
    "createRule": "@request.auth.id != \"\" && user = @request.auth.id",
    "updateRule": "@request.auth.id != \"\" && user = @request.auth.id",
    "deleteRule": "@request.auth.id != \"\" && user = @request.auth.id",
    "options": {}
  })

  return Dao(db).saveCollection(collection)
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("code_snippets_001");

  return dao.deleteCollection(collection);
})

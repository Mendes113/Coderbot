/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "code_snippets_001",
    "created": "2025-10-09 00:00:00.000Z",
    "updated": "2025-10-09 00:00:00.000Z",
    "name": "code_snippets",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "user_id",
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
          "displayFields": ["email", "name"]
        }
      },
      {
        "system": false,
        "id": "title_field",
        "name": "title",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 1,
          "max": 200,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "code_field",
        "name": "code",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
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

/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.id = user_id",
    "deleteRule": "@request.auth.id = user_id",
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
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "relation3545646658",
        "maxSelect": 1,
        "minSelect": 1,
        "name": "user_id",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_2478702900",
        "hidden": false,
        "id": "relation1579384326",
        "maxSelect": 1,
        "minSelect": 1,
        "name": "assessment_id",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_2478702899",
        "hidden": false,
        "id": "relation1843675174",
        "maxSelect": 1,
        "minSelect": 1,
        "name": "question_id",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text2954786283",
        "max": 0,
        "min": 0,
        "name": "user_answer",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "bool3065897394",
        "name": "is_correct",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "number4176908405",
        "max": null,
        "min": 0,
        "name": "time_taken_seconds",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number5287019516",
        "max": null,
        "min": 0,
        "name": "hints_used",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "number6398120627",
        "max": 5,
        "min": 1,
        "name": "confidence_level",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "autodate2990389176",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate3332085495",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "pbc_2478702901",
    "indexes": [],
    "listRule": "@request.auth.id = user_id",
    "name": "assessment_responses",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.id = user_id",
    "viewRule": "@request.auth.id = user_id"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2478702901");

  return app.delete(collection);
}) 
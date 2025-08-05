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
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text1579384326",
        "max": 0,
        "min": 0,
        "name": "question_text",
        "pattern": "",
        "presentable": true,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "select1843675174",
        "maxSelect": 1,
        "name": "question_type",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "multiple_choice",
          "code_completion",
          "debugging",
          "free_form"
        ]
      },
      {
        "hidden": false,
        "id": "select2954786283",
        "maxSelect": 1,
        "name": "difficulty_level",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "beginner",
          "intermediate",
          "advanced",
          "expert"
        ]
      },
      {
        "hidden": false,
        "id": "json3065897394",
        "name": "concept_ids",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "json"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text4176908405",
        "max": 0,
        "min": 0,
        "name": "correct_answer",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "json5287019516",
        "name": "options",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text6398120627",
        "max": 0,
        "min": 0,
        "name": "explanation",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "json7409231738",
        "name": "hints",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
      },
      {
        "hidden": false,
        "id": "number8520342849",
        "max": null,
        "min": 1,
        "name": "estimated_time_minutes",
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
    "id": "pbc_2478702899",
    "indexes": [],
    "listRule": "",
    "name": "assessment_questions",
    "system": false,
    "type": "base",
    "updateRule": "",
    "viewRule": ""
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2478702899");

  return app.delete(collection);
}) 
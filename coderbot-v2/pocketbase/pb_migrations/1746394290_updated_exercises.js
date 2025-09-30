/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1804250889")

  // add field
  collection.fields.addAt(1, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text724990059",
    "max": 0,
    "min": 0,
    "name": "title",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(2, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3950563313",
    "max": 0,
    "min": 0,
    "name": "Description",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "select3144380399",
    "maxSelect": 1,
    "name": "difficulty",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "easy",
      "medium",
      "hard",
      "extra hard"
    ]
  }))

  // add field
  collection.fields.addAt(4, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text4224597626",
    "max": 0,
    "min": 0,
    "name": "subject",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1804250889")

  // remove field
  collection.fields.removeById("text724990059")

  // remove field
  collection.fields.removeById("text3950563313")

  // remove field
  collection.fields.removeById("select3144380399")

  // remove field
  collection.fields.removeById("text4224597626")

  return app.save(collection)
})

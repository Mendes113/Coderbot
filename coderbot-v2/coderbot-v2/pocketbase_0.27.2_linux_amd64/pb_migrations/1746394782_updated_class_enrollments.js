/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1769608725")

  // add field
  collection.fields.addAt(2, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_2478702895",
    "hidden": false,
    "id": "relation3981121951",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "class",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1769608725")

  // remove field
  collection.fields.removeById("relation3981121951")

  return app.save(collection)
})

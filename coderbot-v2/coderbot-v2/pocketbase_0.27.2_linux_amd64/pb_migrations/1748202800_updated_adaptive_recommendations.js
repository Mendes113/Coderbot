/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("adaptive_recommendations")

  // Add viewed field
  collection.fields.addAt(10, new Field({
    "hidden": false,
    "id": "bool8520342849",
    "name": "viewed",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  // Add applied field
  collection.fields.addAt(11, new Field({
    "hidden": false,
    "id": "bool9631453950",
    "name": "applied",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("adaptive_recommendations")

  // Remove applied field
  collection.fields.removeById("bool9631453950")

  // Remove viewed field
  collection.fields.removeById("bool8520342849")

  return app.save(collection)
}) 
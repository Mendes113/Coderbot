/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  try {
    const collection = app.findCollectionByNameOrId("dynamic_prompts")

    // update collection data
    unmarshal({
      "createRule": "",
      "deleteRule": "",
      "listRule": "",
      "updateRule": "",
      "viewRule": ""
    }, collection)

    return app.save(collection)
  } catch (e) {
    // Collection doesn't exist yet, skip this migration
    console.log("Collection 'dynamic_prompts' not found, skipping update")
    return null
  }
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("dynamic_prompts")

    // update collection data
    unmarshal({
      "createRule": null,
      "deleteRule": null,
      "listRule": null,
      "updateRule": null,
      "viewRule": null
    }, collection)

    return app.save(collection)
  } catch (e) {
    // Collection doesn't exist, skip this migration
    console.log("Collection 'dynamic_prompts' not found, skipping rollback")
    return null
  }
})

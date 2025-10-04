/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("easter_egg_definitions_id");

  // Easter Egg 1: Notification Clicks
  dao.db().newQuery("INSERT INTO easter_egg_definitions (id, name, display_name, description, trigger_type, trigger_config, achievement_message, points, icon, is_active, category, difficulty, created, updated) VALUES ({:id}, {:name}, {:display_name}, {:description}, {:trigger_type}, {:trigger_config}, {:achievement_message}, {:points}, {:icon}, {:is_active}, {:category}, {:difficulty}, {:created}, {:updated})").bind({
    id: "ee_notification_clicks",
    name: "notification_clicks",
    display_name: "Mestre das Notificações",
    description: "Descobriu o segredo das notificações clicando 3 vezes!",
    trigger_type: "clicks",
    trigger_config: JSON.stringify({
      requiredClicks: 3,
      timeWindow: 1000,
      resetOnDelay: true
    }),
    achievement_message: "🎉 Parabéns! Você descobriu um dos segredos escondidos do CoderBot! O sistema de notificações tem mais surpresas do que parece. Continue explorando para encontrar outros easter eggs!",
    points: 50,
    icon: "🔔",
    is_active: true,
    category: "ui_interaction",
    difficulty: "medium",
    created: new Date().toISOString(),
    updated: new Date().toISOString()
  }).execute();

  // Easter Egg 2: Avatar Explorer
  dao.db().newQuery("INSERT INTO easter_egg_definitions (id, name, display_name, description, trigger_type, trigger_config, achievement_message, points, icon, is_active, category, difficulty, created, updated) VALUES ({:id}, {:name}, {:display_name}, {:description}, {:trigger_type}, {:trigger_config}, {:achievement_message}, {:points}, {:icon}, {:is_active}, {:category}, {:difficulty}, {:created}, {:updated})").bind({
    id: "ee_avatar_explorer",
    name: "avatar_explorer",
    display_name: "Explorador de Avatares",
    description: "Descobriu que o avatar tem vida própria!",
    trigger_type: "clicks",
    trigger_config: JSON.stringify({
      requiredClicks: 1,
      timeWindow: 500,
      resetOnDelay: false
    }),
    achievement_message: "🧙‍♂️ Uau! Você descobriu que seu avatar tem poderes especiais! Cada interação revela mais sobre os mistérios escondidos do sistema. Será que existem outros segredos?",
    points: 25,
    icon: "👤",
    is_active: true,
    category: "exploration",
    difficulty: "easy",
    created: new Date().toISOString(),
    updated: new Date().toISOString()
  }).execute();

  // Easter Egg 3: Theme Master
  dao.db().newQuery("INSERT INTO easter_egg_definitions (id, name, display_name, description, trigger_type, trigger_config, achievement_message, points, icon, is_active, category, difficulty, created, updated) VALUES ({:id}, {:name}, {:display_name}, {:description}, {:trigger_type}, {:trigger_config}, {:achievement_message}, {:points}, {:icon}, {:is_active}, {:category}, {:difficulty}, {:created}, {:updated})").bind({
    id: "ee_theme_master",
    name: "theme_master",
    display_name: "Mestre dos Temas",
    description: "Dominou os segredos da personalização visual!",
    trigger_type: "clicks",
    trigger_config: JSON.stringify({
      requiredClicks: 3,
      timeWindow: 1000,
      resetOnDelay: true
    }),
    achievement_message: "✨ Incrível! Você desbloqueou os poderes ocultos da personalização de temas! O sistema agora reconhece sua maestria. Mas será que esse é o único easter egg relacionado ao tema?",
    points: 75,
    icon: "🎨",
    is_active: true,
    category: "ui_interaction",
    difficulty: "hard",
    created: new Date().toISOString(),
    updated: new Date().toISOString()
  }).execute();

  // Easter Egg 4: Konami Code (Legendary)
  dao.db().newQuery("INSERT INTO easter_egg_definitions (id, name, display_name, description, trigger_type, trigger_config, achievement_message, points, icon, is_active, category, difficulty, created, updated) VALUES ({:id}, {:name}, {:display_name}, {:description}, {:trigger_type}, {:trigger_config}, {:achievement_message}, {:points}, {:icon}, {:is_active}, {:category}, {:difficulty}, {:created}, {:updated})").bind({
    id: "ee_konami_code",
    name: "konami_code",
    display_name: "Gamer Nostálgico",
    description: "Descobriu o código secreto dos games clássicos!",
    trigger_type: "sequence",
    trigger_config: JSON.stringify({
      sequence: ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"],
      timeWindow: 5000
    }),
    achievement_message: "🎮 LEGENDARY! Você conhece a história dos games! O Konami Code vive eternamente. Parabéns, verdadeiro gamer!",
    points: 150,
    icon: "🕹️",
    is_active: true,
    category: "secret",
    difficulty: "legendary",
    created: new Date().toISOString(),
    updated: new Date().toISOString()
  }).execute();

  console.log("✅ Seeded 4 easter eggs successfully!");
  
  return null;
}, (db) => {
  const dao = new Dao(db);
  
  // Deletar os easter eggs criados
  const easterEggIds = [
    "ee_notification_clicks",
    "ee_avatar_explorer",
    "ee_theme_master",
    "ee_konami_code"
  ];

  easterEggIds.forEach(id => {
    try {
      const record = dao.findRecordById("easter_egg_definitions", id);
      dao.deleteRecord(record);
    } catch (e) {
      console.log(`Could not delete easter egg ${id}:`, e);
    }
  });

  console.log("✅ Rolled back easter eggs seed");
  
  return null;
});

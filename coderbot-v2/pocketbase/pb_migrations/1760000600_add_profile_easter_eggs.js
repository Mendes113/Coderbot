/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId('easter_egg_definitions');
  
  const profileEasterEggs = [
    // 🖼️ Avatar Personalizado
    {
      name: 'avatar_personalizado',
      display_name: 'Avatar Único',
      description: 'Fez upload de um avatar personalizado!',
      trigger_type: 'profile_action',
      trigger_config: {
        action: 'avatar_upload',
        type: 'custom_upload'
      },
      achievement_message: '🖼️ Estilo próprio! Seu avatar está incrível!',
      points: 25,
      icon: '🎨',
      is_active: true,
      category: 'personalization',
      difficulty: 'easy',
      metadata: {
        animation: 'bounce'
      }
    },
    
    // 🎨 Colecionador de Avatares
    {
      name: 'colecionador_avatares',
      display_name: 'Colecionador de Avatares',
      description: 'Selecionou um avatar preset da galeria!',
      trigger_type: 'profile_action',
      trigger_config: {
        action: 'preset_avatar_select',
        type: 'preset_selection'
      },
      achievement_message: '🎨 Bom gosto! Os presets são incríveis!',
      points: 20,
      icon: '🖼️',
      is_active: true,
      category: 'personalization',
      difficulty: 'easy',
      metadata: {
        animation: 'glow'
      }
    },
    
    // 📝 Primeira Bio
    {
      name: 'primeira_bio',
      display_name: 'Primeira Bio',
      description: 'Adicionou uma bio ao perfil pela primeira vez!',
      trigger_type: 'profile_action',
      trigger_config: {
        action: 'first_bio',
        type: 'initial_bio'
      },
      achievement_message: '📝 Ótimo! Conte mais sobre você!',
      points: 15,
      icon: '✍️',
      is_active: true,
      category: 'profile',
      difficulty: 'easy',
      metadata: {
        animation: 'bounce'
      }
    },
    
    // 📚 Bio Eloquente
    {
      name: 'bio_eloquente',
      display_name: 'Bio Eloquente',
      description: 'Escreveu uma bio com 100+ caracteres!',
      trigger_type: 'profile_action',
      trigger_config: {
        action: 'bio_length',
        min_length: 100,
        type: 'bio_milestone'
      },
      achievement_message: '📚 Escritor nato! Sua bio está incrível!',
      points: 30,
      icon: '📖',
      is_active: true,
      category: 'profile',
      difficulty: 'easy',
      metadata: {
        animation: 'glow'
      }
    },
    
    // ✍️ Bio Master
    {
      name: 'bio_master',
      display_name: 'Bio Master',
      description: 'Escreveu uma bio com 200+ caracteres!',
      trigger_type: 'profile_action',
      trigger_config: {
        action: 'bio_length',
        min_length: 200,
        type: 'bio_milestone'
      },
      achievement_message: '✍️ Mestre da escrita! Sua história inspira!',
      points: 50,
      icon: '📜',
      is_active: true,
      category: 'profile',
      difficulty: 'medium',
      metadata: {
        animation: 'confetti'
      }
    },
    
    // 🎯 Perfil Completo
    {
      name: 'perfil_completo',
      display_name: 'Perfil 100%',
      description: 'Completou 100% do perfil (nome + bio + avatar)!',
      trigger_type: 'profile_action',
      trigger_config: {
        action: 'profile_complete',
        requirements: ['name', 'bio', 'avatar'],
        type: 'full_completion'
      },
      achievement_message: '🎯 Perfeição! Seu perfil está completo!',
      points: 100,
      icon: '✅',
      is_active: true,
      category: 'profile',
      difficulty: 'medium',
      metadata: {
        animation: 'confetti',
        rarity: 'rare'
      }
    }
  ];

  // Atualizar easter eggs existentes que precisam de correção
  const updatedEasterEggs = [
    // Atualizar Konami Code para ter tipo correto
    {
      name: 'konami_code',
      updates: {
        trigger_type: 'sequence',
        trigger_config: {
          type: 'sequence',
          keys: ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'],
          timeout: 2000
        },
        metadata: {
          animation: 'matrix_rain',
          sound: 'retro_game',
          rarity: 'legendary'
        }
      }
    },
    
    // Atualizar Curious Mind (DevTools)
    {
      name: 'curious_mind',
      updates: {
        display_name: 'Detetive das DevTools',
        description: 'Abriu as DevTools para investigar o código!',
        trigger_type: 'devtools',
        trigger_config: {
          type: 'devtools_open',
          detection_method: 'window_size_threshold'
        },
        achievement_message: '🛠️ Detetive encontrado! Você é curioso sobre como as coisas funcionam!',
        icon: '🕵️',
        points: 50,
        difficulty: 'easy',
        category: 'exploration',
        metadata: {
          animation: 'glow',
          hint: 'F12 é seu amigo'
        }
      }
    },
    
    // Atualizar Vim Master
    {
      name: 'vim_master',
      updates: {
        trigger_type: 'text_pattern',
        trigger_config: {
          type: 'text_pattern',
          commands: [':w', ':q', ':wq', ':q!', 'dd', 'yy', 'gg'],
          required_count: 3,
          timeout: 60000
        },
        points: 75,
        difficulty: 'medium',
        category: 'technical',
        metadata: {
          animation: 'bounce',
          hint: 'Tente digitar comandos Vim em qualquer input'
        }
      }
    },
    
    // Atualizar Treasure Hunter
    {
      name: 'treasure_hunter',
      updates: {
        trigger_type: 'navigation_pattern',
        trigger_config: {
          type: 'navigation_pattern',
          required_paths: [
            '/dashboard/chat',
            '/dashboard/student',
            '/dashboard/whiteboard',
            '/dashboard/notes',
            '/profile'
          ],
          timeout: 120000
        },
        points: 100,
        difficulty: 'medium',
        metadata: {
          animation: 'confetti',
          progress_tracking: true
        }
      }
    },
    
    // Atualizar Early Bird
    {
      name: 'early_bird',
      updates: {
        trigger_type: 'time_based',
        trigger_config: {
          type: 'time_based',
          start_hour: 5,
          end_hour: 7,
          timezone: 'America/Sao_Paulo'
        },
        metadata: {
          animation: 'glow',
          encouragement: 'Continue assim! Hábitos matinais são poderosos!'
        }
      }
    },
    
    // Atualizar Night Owl
    {
      name: 'night_owl',
      updates: {
        display_name: 'Coruja Noturna',
        description: 'Programando de madrugada! (23h-2h)',
        trigger_type: 'time_based',
        trigger_config: {
          type: 'time_based',
          start_hour: 23,
          end_hour: 2,
          timezone: 'America/Sao_Paulo'
        },
        icon: '🦉',
        metadata: {
          animation: 'glow',
          warning: 'Lembre-se: sono é importante para a produtividade!'
        }
      }
    }
  ];

  // Inserir novos profile easter eggs
  console.log('[Migration] Adding profile easter eggs...');
  profileEasterEggs.forEach(eggData => {
    try {
      // Verificar se já existe
      const existing = app.findFirstRecordByData('easter_egg_definitions', 'name', eggData.name);
      if (existing) {
        console.log(`[Seed] Easter egg "${eggData.name}" already exists, skipping...`);
        return;
      }

      // Criar novo record
      const record = new Record(collection);
      Object.keys(eggData).forEach(key => {
        record.set(key, eggData[key]);
      });

      app.save(record);
      console.log(`[Seed] ✅ Created: ${eggData.display_name}`);
    } catch (error) {
      console.error(`[Seed] ❌ Failed to create "${eggData.name}":`, error);
    }
  });

  // Atualizar easter eggs existentes
  console.log('[Migration] Updating existing easter eggs...');
  updatedEasterEggs.forEach(({ name, updates }) => {
    try {
      const record = app.findFirstRecordByData('easter_egg_definitions', 'name', name);
      if (!record) {
        console.log(`[Update] Easter egg "${name}" not found, skipping...`);
        return;
      }

      // Aplicar updates
      Object.keys(updates).forEach(key => {
        record.set(key, updates[key]);
      });

      app.save(record);
      console.log(`[Update] ✅ Updated: ${name}`);
    } catch (error) {
      console.error(`[Update] ❌ Failed to update "${name}":`, error);
    }
  });

  console.log('[Migration] ✅ Profile easter eggs migration completed!');
  
}, (app) => {
  // Rollback: remove os profile easter eggs
  const profileEggNames = [
    'avatar_personalizado',
    'colecionador_avatares',
    'primeira_bio',
    'bio_eloquente',
    'bio_master',
    'perfil_completo'
  ];

  console.log('[Rollback] Removing profile easter eggs...');
  profileEggNames.forEach(name => {
    try {
      const record = app.findFirstRecordByData('easter_egg_definitions', 'name', name);
      if (record) {
        app.delete(record);
        console.log(`[Rollback] ✅ Deleted: ${name}`);
      }
    } catch (error) {
      console.error(`[Rollback] ❌ Failed to delete "${name}":`, error);
    }
  });
  
  console.log('[Rollback] Profile easter eggs rollback completed!');
});


import { Category } from './types';

export const DIAMOND_QUIZ_CATEGORIES: Category[] = [
  { id: 'ff_char_skills', name: 'Character Skills', icon: '👤', description: 'Alok, Chrono, and passive ability cooldowns.', color: 'from-orange-600 to-red-600' },
  { id: 'ff_weapon_stats', name: 'Weapon Stats', icon: '🔫', description: 'Damage, Range, and Fire Rate of all ARs/SMGs.', color: 'from-blue-600 to-indigo-600' },
  { id: 'ff_bermuda', name: 'Bermuda Secrets', icon: '🗺️', description: 'Best loot at Peak, Factory, and Clock Tower.', color: 'from-green-600 to-emerald-600' },
  { id: 'ff_evo_skins', name: 'Evo Skin Mastery', icon: '🐉', description: 'Blue Flame Draco, Cobra MP40, and level perks.', color: 'from-purple-600 to-fuchsia-600' },
  { id: 'ff_pets', name: 'Pet Abilities', icon: '🐾', description: 'Mr. Waggor, Falco, and Ottero skill effects.', color: 'from-yellow-600 to-amber-600' },
  { id: 'ff_gloo_walls', name: 'Gloo Wall Tactics', icon: '🛡️', description: '360 degree walls and sit-up wall strategy.', color: 'from-rose-600 to-pink-600' },
  { id: 'ff_sniping', name: 'Sniper Skills', icon: '🎯', description: 'AWM, M82B, and Kar98k damage drop-off.', color: 'from-cyan-700 to-blue-900' },
  { id: 'ff_kalahari', name: 'Kalahari Expedition', icon: '🏜️', description: 'Navigation and survival in the desert map.', color: 'from-yellow-700 to-orange-900' },
  { id: 'ff_purgatory', name: 'Purgatory Survival', icon: '🚠', description: 'Zip-line routes and high-tier loot zones.', color: 'from-blue-500 to-teal-700' },
  { id: 'ff_rank_push', name: 'Rank Push Logic', icon: '🎖️', description: 'Points calculation from Bronze to Grandmaster.', color: 'from-amber-400 to-yellow-600' },
  { id: 'ff_esports', name: 'FFWS Legends', icon: '🏆', description: 'Esports history, champions, and pro teams.', color: 'from-indigo-500 to-blue-800' },
  { id: 'ff_incubator', name: 'Incubator Vault', icon: '🧬', description: 'Rare bundles, blueprint history, and stones.', color: 'from-fuchsia-500 to-purple-800' },
  { id: 'ff_vehicles', name: 'Vehicle Mastery', icon: '🏎️', description: 'Misha ability and car combat mechanics.', color: 'from-slate-500 to-slate-800' },
  { id: 'ff_alpine', name: 'Alpine Combat', icon: '❄️', description: 'Snow terrain tactics and Vantage point spots.', color: 'from-sky-300 to-blue-500' },
  { id: 'ff_nexterra', name: 'Nexterra Tech', icon: '🪐', description: 'Zero-G zones and portal mechanics.', color: 'from-violet-500 to-indigo-700' },
  { id: 'ff_combos', name: 'Ability Synergy', icon: '🌀', description: 'Passive and Active skill combination metas.', color: 'from-emerald-400 to-green-600' },
  { id: 'ff_med_items', name: 'Healing Items', icon: '💉', description: 'Inhalers, Medkits, and Treatment guns.', color: 'from-rose-500 to-red-700' },
  { id: 'ff_elite_pass', name: 'Pass History', icon: '🎫', description: 'Old Elite Pass themes and rare badges.', color: 'from-stone-500 to-orange-800' },
  { id: 'ff_throwables', name: 'Grenade Cooking', icon: '💣', description: 'Timer mastery and Flashbang strategies.', color: 'from-orange-800 to-black' }
];

export const TECH_AI_CATEGORIES: Category[] = [
  { id: 'coding_python', name: 'Python Pro', icon: '🐍', description: 'Django, Flask, and Data Science basics.', color: 'from-blue-500 to-cyan-500' },
  { id: 'ai_chatgpt', name: 'Generative AI', icon: '🤖', description: 'Prompt Engineering and LLM knowledge.', color: 'from-emerald-500 to-teal-500' },
  { id: 'cyber_sec', name: 'Ethical Hacking', icon: '💻', description: 'Network security and malware analysis.', color: 'from-red-500 to-slate-900' },
  { id: 'web_dev', name: 'Full Stack', icon: '🌐', description: 'React, Node.js, and MongoDB.', color: 'from-indigo-500 to-purple-500' }
];

export const ANIME_CATEGORIES: Category[] = [
  { id: 'one_piece', name: 'One Piece', icon: '🏴‍☠️', description: 'Luffy, Yonko, and Devil Fruit trivia.', color: 'from-yellow-500 to-red-500' },
  { id: 'naruto_shippu', name: 'Naruto', icon: '🍥', description: 'Jutsu, Akatsuki, and Shinobi history.', color: 'from-orange-500 to-yellow-600' },
  { id: 'demon_slayer', name: 'Demon Slayer', icon: '⚔️', description: 'Breathing styles and Upper Moons.', color: 'from-green-400 to-emerald-600' },
  { id: 'attack_titan', name: 'AoT Lore', icon: '🧱', description: 'Titans, Walls, and Survey Corps.', color: 'from-stone-600 to-red-900' }
];

export const CRYPTO_CATEGORIES: Category[] = [
  { id: 'bitcoin_master', name: 'Bitcoin 101', icon: '₿', description: 'Halving, Mining, and Satoshi Nakamoto.', color: 'from-orange-400 to-yellow-500' },
  { id: 'nft_world', name: 'NFT & Web3', icon: '🖼️', description: 'Digital art, Smart contracts, and Opensea.', color: 'from-purple-400 to-indigo-600' },
  { id: 'altcoin_gems', name: 'Altcoins', icon: '💎', description: 'Ethereum, Solana, and Meme coins.', color: 'from-blue-400 to-sky-600' }
];

export const CRICKET_CATEGORIES: Category[] = [
  { id: 'ipl_fever', name: 'IPL Master', icon: '🏏', description: 'Teams, Winners, and Orange Cap holders.', color: 'from-indigo-600 to-blue-800' },
  { id: 't20_world', name: 'T20 World Cup', icon: '🏆', description: 'Records, Over-history, and ICC events.', color: 'from-emerald-600 to-green-800' },
  { id: 'cricket_stats', name: 'Legends & Stats', icon: '📉', description: 'Kohli, Sachin, and Dhoni records.', color: 'from-blue-500 to-indigo-700' }
];

export const STARTUP_CATEGORIES: Category[] = [
  { id: 'shark_tank', name: 'Shark Tank India', icon: '🦈', description: 'Deals, Founders, and Pitch trivia.', color: 'from-sky-500 to-blue-700' },
  { id: 'unicorn_india', name: 'Unicorn Tech', icon: '🦄', description: 'Zomato, Paytm, and Byjus growth.', color: 'from-pink-500 to-rose-700' },
  { id: 'biz_marketing', name: 'Marketing Guru', icon: '📢', description: 'Ads, Branding, and Growth Hacking.', color: 'from-amber-500 to-orange-700' }
];

export const SPACE_CATEGORIES: Category[] = [
  { id: 'isro_missions', name: 'ISRO Pride', icon: '🚀', description: 'Chandrayaan, Mangalyaan, and Gaganyaan.', color: 'from-orange-500 to-sky-500' },
  { id: 'nasa_explore', name: 'NASA Secrets', icon: '🌌', description: 'Apollo, Mars Rover, and ISS.', color: 'from-blue-600 to-indigo-900' },
  { id: 'black_holes', name: 'Astro Physics', icon: '🕳️', description: 'Cosmos, Stars, and Time dilation.', color: 'from-slate-700 to-black' }
];

export const HEALTH_CATEGORIES: Category[] = [
  { id: 'gym_workout', name: 'Gym Rats', icon: '💪', description: 'Exercises, Muscle groups, and Training.', color: 'from-slate-600 to-stone-800' },
  { id: 'nutrition_diet', name: 'Diet & Nutrition', icon: '🍎', description: 'Proteins, Keto, and Vitamins.', color: 'from-green-500 to-emerald-700' },
  { id: 'yoga_mental', name: 'Yoga & Zen', icon: '🧘', description: 'Poses, Meditation, and Wellness.', color: 'from-teal-400 to-cyan-600' }
];

export const AUTO_CATEGORIES: Category[] = [
  { id: 'supercars_f1', name: 'Supercars & F1', icon: '🏎️', description: 'Lamborghini, Ferrari, and Formula 1.', color: 'from-red-600 to-rose-800' },
  { id: 'electric_ev', name: 'Tesla & EVs', icon: '⚡', description: 'Electric future and battery tech.', color: 'from-sky-400 to-blue-600' },
  { id: 'vintage_bikes', name: 'Biker Life', icon: '🏍️', description: 'Royal Enfield and Hayabusa trivia.', color: 'from-stone-600 to-zinc-800' }
];

export const MOVIE_CATEGORIES: Category[] = [
  { id: 'marvel_dc', name: 'Superhero Hub', icon: '🦸', description: 'MCU, DCU, and Comic facts.', color: 'from-red-500 to-blue-600' },
  { id: 'bollywood_90s', name: 'Bollywood Hits', icon: '🎭', description: 'SRK, Salman, and 90s Classics.', color: 'from-amber-400 to-orange-600' },
  { id: 'netflix_series', name: 'Streaming Hits', icon: '📺', description: 'Money Heist, Stranger Things, etc.', color: 'from-red-600 to-black' }
];

export const FOOD_CATEGORIES: Category[] = [
  { id: 'street_food', name: 'Street Foodie', icon: '🥘', description: 'Indian, Asian, and Global snacks.', color: 'from-orange-400 to-yellow-600' },
  { id: 'chef_cuisine', name: 'Master Chef', icon: '👨‍🍳', description: 'Cooking techniques and exotic food.', color: 'from-emerald-400 to-teal-600' },
  { id: 'coffee_tea', name: 'Coffee Culture', icon: '☕', description: 'Latte art, Brewing, and Origins.', color: 'from-amber-700 to-stone-800' }
];

export const EXAM_MISSION_CATEGORIES: Category[] = [
  { id: 'ind_geo', name: 'Indian Geography', icon: '🇮🇳', description: 'Rivers, Mountains, and Climate.', color: 'from-green-600 to-emerald-900' },
  { id: 'polity', name: 'Indian Polity', icon: '⚖️', description: 'Parliament, Judiciary, and Gov.', color: 'from-indigo-600 to-blue-900' },
  { id: 'consti', name: 'Constitution', icon: '📖', description: 'Articles, Parts, and Amendments.', color: 'from-violet-600 to-indigo-900' }
];

export const MAIN_MISSION_HUBS = [
  { id: 'DIAMOND', name: 'DIAMOND QUIZ', icon: '💎', categories: DIAMOND_QUIZ_CATEGORIES, color: 'border-orange-500', tag: 'POPULAR' },
  { id: 'TECH', name: 'TECH & AI HUB', icon: '🤖', categories: TECH_AI_CATEGORIES, color: 'border-blue-500', tag: 'LATEST' },
  { id: 'ANIME', name: 'ANIME UNIVERSE', icon: '🍥', categories: ANIME_CATEGORIES, color: 'border-yellow-500', tag: 'HOT' },
  { id: 'CRYPTO', name: 'CRYPTO & WEB3', icon: '₿', categories: CRYPTO_CATEGORIES, color: 'border-purple-500', tag: 'LATEST' },
  { id: 'CRICKET', name: 'CRICKET MANIA', icon: '🏏', categories: CRICKET_CATEGORIES, color: 'border-indigo-500', tag: 'HOT' },
  { id: 'STARTUP', name: 'STARTUP WORLD', icon: '🦄', categories: STARTUP_CATEGORIES, color: 'border-pink-500', tag: 'NEW' },
  { id: 'SPACE', name: 'SPACE & COSMOS', icon: '🚀', categories: SPACE_CATEGORIES, color: 'border-sky-500', tag: 'POPULAR' },
  { id: 'HEALTH', name: 'HEALTH & GYM', icon: '💪', categories: HEALTH_CATEGORIES, color: 'border-emerald-500', tag: 'TRENDING' },
  { id: 'AUTO', name: 'SUPER CARS & F1', icon: '🏎️', categories: AUTO_CATEGORIES, color: 'border-red-500', tag: 'HOT' },
  { id: 'MOVIES', name: 'CINEPHILE HUB', icon: '🦸', categories: MOVIE_CATEGORIES, color: 'border-rose-500', tag: 'POPULAR' },
  { id: 'FOOD', name: 'GLOBAL FOODIE', icon: '🥘', categories: FOOD_CATEGORIES, color: 'border-amber-500', tag: 'LATEST' },
  { id: 'EXAM', name: 'EXAM MISSIONS', icon: '🎓', categories: EXAM_MISSION_CATEGORIES, color: 'border-slate-500', tag: 'ELITE' },
];

export const REWARD_COINS_PER_AD = 100;
export const QUIZ_REWARD_BASE = 50;

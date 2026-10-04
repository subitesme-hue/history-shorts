// Picks the next Future Shift topic. Runs at 1 pm and 7 pm Dubai -> 35 videos over 17.5 days, then stops by itself.
// Video number = 2 per day counted from START_DATE (1 pm = first of the day, 7 pm = second).
// To restart the series later or start on another day: change START_DATE to the first day you want (Dubai date).
const START_DATE = '2026-10-05';
const TOTAL = 35;
const TOPICS = [["Artificial Intelligence", "neural", "Artificial_intelligence"], ["Blockchain", "chain", "Blockchain"], ["Industrial Robots", "robot", "Industrial_robot"], ["Smart Cities", "network", "Smart_city"], ["Quantum Computing", "orbit", "Quantum_computing"], ["Generative AI", "neural", "Generative_artificial_intelligence"], ["Smart Contracts", "chain", "Smart_contract"], ["Humanoid Robots", "robot", "Humanoid_robot"], ["Internet of Things", "network", "Internet_of_things"], ["Large Language Models", "neural", "Large_language_model"], ["Cryptocurrency", "chain", "Cryptocurrency"], ["Automation", "robot", "Automation"], ["Self-Driving Cars", "network", "Self-driving_car"], ["Fourth Industrial Revolution", "network", "Fourth_Industrial_Revolution"], ["Machine Learning", "neural", "Machine_learning"], ["Central Bank Digital Currency", "chain", "Central_bank_digital_currency"], ["3D Printing", "robot", "3D_printing"], ["Digital Twins", "network", "Digital_twin"], ["Computer Vision", "neural", "Computer_vision"], ["Decentralized Finance", "chain", "Decentralized_finance"], ["Delivery Robots", "robot", "Delivery_robot"], ["Drones", "network", "Unmanned_aerial_vehicle"], ["Brain-Computer Interfaces", "neural", "Brain–computer_interface"], ["Smart Grid", "network", "Smart_grid"], ["Augmented Reality", "orbit", "Augmented_reality"], ["Cloud Computing", "network", "Cloud_computing"], ["5G Networks", "network", "5G"], ["Nanotechnology", "orbit", "Nanotechnology"], ["Gene Editing", "orbit", "CRISPR_gene_editing"], ["Electric Vehicles", "network", "Electric_vehicle"], ["Edge Computing", "network", "Edge_computing"], ["Hydrogen Economy", "orbit", "Hydrogen_economy"], ["Virtual Reality", "orbit", "Virtual_reality"], ["Vertical Farming", "network", "Vertical_farming"], ["Cultured Meat", "orbit", "Cultured_meat"]];

const inputs = $input.all().map(i => i.json);
const fromSchedule = inputs.some(j => j && ('timestamp' in j || 'Readable date' in j));

const DAY = 86400000;
const dubai = new Date(Date.now() + 4 * 3600000);              // Dubai = UTC+4, no daylight saving
const start = Date.parse(START_DATE + 'T00:00:00Z');
const dayNo = Math.floor((dubai.getTime() - start) / DAY);
const slot = dayNo * 2 + (dubai.getUTCHours() >= 16 ? 1 : 0); // 13:00 run -> even, 19:00 run -> odd

let index = slot;
if (fromSchedule) {
  if (slot < 0) return [];          // series hasn't started yet
  if (slot >= TOTAL) return [];     // all 35 done -> stop quietly (nothing posted)
} else {
  index = Math.min(TOTAL - 1, Math.max(0, slot));   // manual Test run: preview the topic due now
}

const [topic, visual, wiki_title] = TOPICS[index];
return [{ json: {
  topic, visual, wiki_title,
  video_number: index + 1,
  of_total: TOTAL,
  music: 'music/future-' + ((index % 4) + 1) + '.mp3',
  _test: !fromSchedule,
} }];

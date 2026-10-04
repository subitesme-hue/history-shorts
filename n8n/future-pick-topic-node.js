// Picks today's technology.
// Default: rotates through the built-in TOPICS list, one per day (no Google Sheet needed).
// Optional: put a Google Sheets "Get row(s)" node in front (columns topic | visual | wiki_title | status)
// and the first row with status = pending is used instead.
// "Test run" (manual) renders only and never posts. The schedule posts.
const TOPICS = [["Artificial Intelligence","neural","Artificial_intelligence"],["Blockchain","chain","Blockchain"],["Industrial Robots","robot","Industrial_robot"],["Smart Cities","network","Smart_city"],["Quantum Computing","orbit","Quantum_computing"],["Generative AI","neural","Generative_artificial_intelligence"],["Smart Contracts","chain","Smart_contract"],["Humanoid Robots","robot","Humanoid_robot"],["Internet of Things","network","Internet_of_things"],["Large Language Models","neural","Large_language_model"],["Cryptocurrency","chain","Cryptocurrency"],["Automation","robot","Automation"],["Self-Driving Cars","network","Self-driving_car"],["Fourth Industrial Revolution","network","Fourth_Industrial_Revolution"],["Machine Learning","neural","Machine_learning"],["Central Bank Digital Currency","chain","Central_bank_digital_currency"],["3D Printing","robot","3D_printing"],["Digital Twins","network","Digital_twin"],["Computer Vision","neural","Computer_vision"],["Decentralized Finance","chain","Decentralized_finance"],["Delivery Robots","robot","Delivery_robot"],["Drones","network","Unmanned_aerial_vehicle"],["Brain-Computer Interfaces","neural","Brain–computer_interface"],["Smart Grid","network","Smart_grid"],["Augmented Reality","orbit","Augmented_reality"],["Cloud Computing","network","Cloud_computing"],["5G Networks","network","5G"],["Nanotechnology","orbit","Nanotechnology"],["Gene Editing","orbit","CRISPR_gene_editing"],["Electric Vehicles","network","Electric_vehicle"],["Edge Computing","network","Edge_computing"],["Hydrogen Economy","orbit","Hydrogen_economy"],["Virtual Reality","orbit","Virtual_reality"],["Vertical Farming","network","Vertical_farming"],["Cultured Meat","orbit","Cultured_meat"],["Satellite Internet","network","Satellite_internet_constellation"]];

const inputs = $input.all().map(i => i.json);
const fromSchedule = inputs.some(j => j && ('timestamp' in j || 'Readable date' in j));
const sheetRows = inputs.filter(r => r && r.topic && r.wiki_title);
const pending = sheetRows.find(r => String(r.status || '').toLowerCase() === 'pending');
if (sheetRows.length && !pending) throw new Error('No row with status = pending left in the Topics sheet.');

// Day number in Dubai time since the series started (5 Oct 2026).
const DAY = 86400000;
const dubaiNow = Date.now() + 4 * 3600000;
const dayIndex = Math.max(0, Math.floor(dubaiNow / DAY) - Math.floor(Date.UTC(2026, 9, 5) / DAY));

let row;
if (pending) row = { ...pending };
else {
  const [topic, visual, wiki_title] = TOPICS[dayIndex % TOPICS.length];
  row = { topic, visual, wiki_title };
}
row.day_index = dayIndex;
row.music = 'music/future-' + ((dayIndex % 4) + 1) + '.mp3';
row._test = !fromSchedule;
return [{ json: row }];

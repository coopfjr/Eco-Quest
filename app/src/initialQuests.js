// src/initialQuests.js
// The quest library. Each quest has a stable `id` (used as its Firestore document id),
// so seeding can add or update quests without duplicating them.
// Tags must come from the action domains in OnboardingScreen (CLIMATE_TAGS):
// Energy, Mobility, Food, Digital, Home, Consumption, Fitness.
// Descriptions describe the action only; they make no impact claims (design doc 2.3.7).

const easy = (id, title, description, tags, proof_required = false) =>
  ({ id, title, description, points: 50, difficulty: 'Easy', tags, proof_required });
const medium = (id, title, description, tags, proof_required = false) =>
  ({ id, title, description, points: 100, difficulty: 'Medium', tags, proof_required });
const hard = (id, title, description, tags, proof_required = false) =>
  ({ id, title, description, points: 150, difficulty: 'Hard', tags, proof_required });

const initialQuests = [
  // ---------------- EASY · 50 pts · under 15 minutes of effort ----------------
  easy('ghost-power-hunt', 'Ghost Power Hunt', 'Unplug 3 chargers or appliances that are idle or fully charged.', ['Energy', 'Home'], true),
  easy('natural-daylight-shift', 'Natural Daylight Shift', 'Keep ceiling lights off for 2 daytime study or work hours.', ['Energy', 'Home'], true),
  easy('five-minute-shower', 'Five-Minute Shower', 'Keep today\'s shower to 5 minutes or less. Set a timer.', ['Home', 'Energy']),
  easy('cold-wash', 'Cold Wash', 'Wash a load of laundry on the cold setting.', ['Energy', 'Home']),
  easy('bring-your-bottle', 'Bring Your Bottle', 'Carry a reusable bottle all day and refill it instead of buying drinks.', ['Consumption']),
  easy('reusable-cup-run', 'Reusable Cup Run', 'Get your coffee or tea in your own mug or cup.', ['Consumption', 'Food'], true),
  easy('inbox-clean-up', 'Inbox Clean-Up', 'Delete 100 old emails and unsubscribe from 3 mailing lists you never read.', ['Digital']),
  easy('tote-it', 'Tote It', 'Bring your own bag for any shopping you do today.', ['Consumption']),
  easy('lights-out-sweep', 'Lights-Out Sweep', 'Before bed, switch off every light and screen in your home that isn\'t in use.', ['Energy', 'Home']),
  easy('tap-off', 'Tap Off', 'Turn the tap off while you brush your teeth, morning and night.', ['Home']),
  easy('stairs-only', 'Stairs Only', 'Take the stairs instead of the elevator all day.', ['Fitness', 'Energy']),
  easy('leftovers-first', 'Leftovers First', 'Eat something from your fridge that would otherwise go to waste.', ['Food']),
  easy('sort-it-right', 'Sort It Right', 'Look up your local recycling rules and sort one bin correctly.', ['Home', 'Consumption']),
  easy('dim-the-screen', 'Dim the Screen', 'Use dark mode or lower brightness on your phone and laptop all day.', ['Digital', 'Energy']),
  easy('thermostat-nudge', 'Thermostat Nudge', 'Turn your heating down by 1°C today, or skip the space heater.', ['Energy', 'Home']),
  easy('meat-free-lunch', 'Meat-Free Lunch', 'Choose a vegetarian or vegan lunch today.', ['Food'], true),
  easy('cutlery-kit', 'Cutlery Kit', 'Pack reusable cutlery so you can say no to plastic utensils today.', ['Consumption', 'Food']),
  easy('stream-smarter', 'Stream Smarter', 'Watch videos in standard definition instead of HD today.', ['Digital']),
  easy('walk-and-talk', 'Walk and Talk', 'Take a phone call or catch-up while walking outside.', ['Fitness']),
  easy('full-loads-only', 'Full Loads Only', 'Only run the dishwasher or washing machine when it\'s full.', ['Home', 'Energy']),
  easy('go-receipt-free', 'Go Receipt-Free', 'Say no to printed receipts all day, or ask for email receipts.', ['Consumption']),
  easy('cloud-clean-up', 'Cloud Clean-Up', 'Delete 50 duplicate photos or old files from your cloud storage.', ['Digital']),
  easy('local-snack', 'Local Snack', 'Pick a snack that was grown or made in your region.', ['Food']),
  easy('draft-check', 'Draft Check', 'Find one drafty window or door at home and block it with a towel or draft stopper.', ['Home', 'Energy'], true),
  easy('learn-one-thing', 'Learn One Thing', 'Read about a local conservation project and share one thing you learned.', ['Digital']),

  // ---------------- MEDIUM · 100 pts · takes some planning ----------------
  medium('active-commute', 'Active Commute', 'Take transit, cycle or walk for your trip to campus or work.', ['Mobility', 'Fitness'], true),
  medium('zero-single-use-day', 'Zero Single-Use Day', 'Use only reusable mugs, cutlery and bottles all day.', ['Consumption', 'Food']),
  medium('plant-powered-plate', 'Plant-Powered Plate', 'Eat a fully plant-based lunch or dinner today.', ['Food'], true),
  medium('fridge-first-dinner', 'Fridge-First Dinner', 'Cook dinner using only what\'s already in your fridge and pantry.', ['Food'], true),
  medium('line-dry', 'Line Dry', 'Air-dry a full load of laundry instead of using the dryer.', ['Energy', 'Home'], true),
  medium('screen-free-evening', 'Screen-Free Evening', 'No TV, gaming or laptop for 2 hours tonight. Read, walk or cook instead.', ['Digital', 'Energy']),
  medium('walk-the-last-stop', 'Walk the Last Stop', 'Get off transit one stop early and walk the rest, both ways.', ['Mobility', 'Fitness']),
  medium('fix-it', 'Fix It', 'Repair something instead of replacing it: sew a button, patch a hole or glue a handle.', ['Consumption', 'Home'], true),
  medium('second-hand-first', 'Second-Hand First', 'If you need to buy something today, check a thrift store or marketplace first.', ['Consumption']),
  medium('refill-run', 'Refill Run', 'Refill a container at a bulk or refill store instead of buying new packaging.', ['Consumption', 'Food'], true),
  medium('compost-it', 'Compost It', 'Collect your food scraps all day and put them in the green bin or compost.', ['Food', 'Home']),
  medium('packed-lunch', 'Packed Lunch', 'Bring a homemade lunch in reusable containers instead of buying takeout.', ['Food', 'Consumption'], true),
  medium('digital-declutter', 'Digital Declutter', 'Delete 5 apps you don\'t use and clear 2 GB of old files from your phone.', ['Digital']),
  medium('thermostat-down', 'Thermostat Down', 'Keep the heat 2°C lower than usual all day and layer up instead.', ['Energy', 'Home']),
  medium('daylight-day', 'Daylight Day', 'Use no indoor lights before sunset.', ['Energy', 'Home']),
  medium('litter-pick', 'Litter Pick', 'Spend 20 minutes picking up litter in a park, street or beach near you.', ['Fitness'], true),
  medium('swap-or-lend', 'Swap or Lend', 'Borrow, lend or swap one item with a friend or neighbour instead of buying it.', ['Consumption']),
  medium('leak-hunt', 'Leak Hunt', 'Check your taps, toilet and shower for leaks, and fix or report any you find.', ['Home']),
  medium('new-veg-recipe', 'New Veg Recipe', 'Cook a vegetarian recipe you\'ve never made before.', ['Food'], true),
  medium('carpool', 'Carpool', 'Share a ride with someone for a trip you\'d both otherwise drive alone.', ['Mobility']),
  medium('no-delivery-day', 'No-Delivery Day', 'Skip food and package deliveries all day.', ['Consumption', 'Food']),
  medium('plant-something', 'Plant Something', 'Plant a seed, herb or houseplant cutting.', ['Home'], true),
  medium('power-settings', 'Power Settings', 'Set your computer to sleep after 10 minutes and switch off always-on devices overnight.', ['Energy', 'Digital']),
  medium('ten-thousand-steps', 'Ten Thousand Steps', 'Walk at least 10,000 steps today, replacing at least one short ride.', ['Fitness', 'Mobility']),
  medium('market-run', 'Market Run', 'Buy your produce at a farmers\' market or from a local grower.', ['Food'], true),

  // ---------------- HARD · 150 pts · a full day or a real commitment ----------------
  hard('car-free-errand', 'Car-Free Errand', 'Walk or bike to an errand you\'d normally drive to.', ['Mobility', 'Fitness'], true),
  hard('no-buy-day', 'No-Buy Day', 'Spend $0 today on non-essential goods or single-use items.', ['Consumption']),
  hard('plant-based-day', 'Plant-Based Day', 'Eat only plant-based food for every meal today.', ['Food']),
  hard('car-free-day', 'Car-Free Day', 'Make every trip today on foot, by bike or on transit. No car or ride-hail.', ['Mobility']),
  hard('zero-waste-day', 'Zero-Waste Day', 'Get through the whole day without throwing anything in the landfill bin.', ['Consumption']),
  hard('screen-free-day', 'Screen-Free Day', 'No recreational screen time all day. School and work screens are fine.', ['Digital']),
  hard('bike-both-ways', 'Bike Both Ways', 'Cycle to and from campus or work today.', ['Mobility', 'Fitness'], true),
  hard('lights-out-evening', 'Lights-Out Evening', 'After sunset use only one lamp, and have every device off by 9 pm.', ['Energy', 'Home']),
  hard('mend-and-wear', 'Mend and Wear', 'Repair a piece of clothing you\'d stopped wearing, then wear it today.', ['Consumption'], true),
  hard('clean-up-hour', 'Clean-Up Hour', 'Join or run a 1-hour litter clean-up with at least one other person.', ['Fitness'], true),
  hard('batch-cook', 'Batch Cook', 'Cook a plant-based batch big enough for at least 4 meals this week.', ['Food'], true),
  hard('closet-swap', 'Closet Swap', 'Donate, swap or sell 5 things you no longer use instead of throwing them out.', ['Consumption', 'Home'], true),
  hard('home-energy-audit', 'Home Energy Audit', 'Go room by room: unplug idle devices, note drafts and swap one bulb for an LED.', ['Energy', 'Home']),
  hard('local-food-day', 'Local Food Day', 'Eat only food grown or made in your region for the whole day.', ['Food']),
  hard('no-new-plastic', 'No New Plastic', 'Buy nothing packaged in single-use plastic today.', ['Consumption', 'Food']),
  hard('five-k-commute', 'Five-K Commute', 'Walk or bike a trip of 5 km or more that you\'d normally ride.', ['Mobility', 'Fitness'], true),
  hard('big-digital-clean-up', 'Big Digital Clean-Up', 'Delete 1,000 emails or 5 GB of old files and unused cloud backups.', ['Digital']),
  hard('three-minute-shower', 'Three-Minute Shower', 'Keep your shower to 3 minutes and use the warm-up water for plants.', ['Home']),
  hard('veg-dinner-party', 'Veg Dinner Party', 'Cook a plant-based meal for at least two other people.', ['Food'], true),
  hard('layer-up-day', 'Layer Up Day', 'Keep the heat off or at its lowest setting all day and dress warmly instead.', ['Energy', 'Home']),
  hard('teach-one', 'Teach One', 'Show a friend or housemate how to sort recycling or start composting, and do it together.', ['Home', 'Consumption']),
  hard('transit-explorer', 'Transit Explorer', 'Plan and take a weekend outing entirely by transit, bike or foot.', ['Mobility'], true),
  hard('repair-cafe', 'Repair Café', 'Take a broken item to a repair café or fix-it event, or fix an electronic yourself.', ['Consumption'], true),
  hard('zero-food-waste', 'Zero Food Waste', 'Throw away no food at all today, including plate scraps.', ['Food']),
  hard('offline-until-noon', 'Offline Until Noon', 'No social media or browsing until noon. Calls and messages for school or work are fine.', ['Digital']),
];

export default initialQuests;

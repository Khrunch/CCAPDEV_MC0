const mongoose = require("mongoose");
const Court = require("./models/Courts");

const mongodb_URI = 'mongodb://player:qwerty12345@ac-nkebxal-shard-00-00.mebmczc.mongodb.net:27017,ac-nkebxal-shard-00-01.mebmczc.mongodb.net:27017,ac-nkebxal-shard-00-02.mebmczc.mongodb.net:27017/TerryPick?ssl=true&replicaSet=atlas-27jkma-shard-0&authSource=admin&appName=CCAPDEV';

const dummyCourts = [
    {
        name: "greenhills2",
        location: { address: "Ortigas Ave, San Juan, Metro Manila" },
        description: "Premium indoor wooden court. Nearest landmark: Greenhills Shopping Center.",
        type: "Outdoor", surface: "Hardcourt", totalCourts: 2,
        rates: { weekday: 350, weekend: 450 },
        amenities: ["Parking", "Restrooms", "Water station", "Lights (evening play)"],
        rules: ["Bring your own paddles", "No outside food on court"],
        ownerId: new mongoose.Types.ObjectId(), averageRating: 4.8
    },
    {
        name: "bgc_rooftop",
        location: { address: "9th Ave, BGC, Taguig, Metro Manila" },
        description: "Rooftop access via Building B elevator. Bring a light jacket.",
        type: "Outdoor", surface: "Acrylic", totalCourts: 1,
        rates: { weekday: 500, weekend: 500 },
        amenities: ["Paid parking", "Locker area (limited)", "Rooftop lights"],
        rules: ["No metal studs", "Last entry 9:30 PM"],
        ownerId: new mongoose.Types.ObjectId(), averageRating: 4.5
    },
    {
        name: "makati_gym",
        location: { address: "J.P. Rizal Ave, Makati, Metro Manila" },
        description: "Check-in at the front desk before entering. Peak hours: 5-8 PM.",
        type: "Indoor", surface: "Wooden", totalCourts: 3,
        rates: { weekday: 300, weekend: 400 },
        amenities: ["Restrooms", "Water refill", "Benches", "Air-conditioned"],
        rules: ["Non-marking shoes required", "No food inside the gym"],
        ownerId: new mongoose.Types.ObjectId(), averageRating: 4.2
    },
    {
        name: "qc_community",
        location: { address: "Commonwealth Ave, Quezon City, Metro Manila" },
        description: "Best time to play: late afternoon. Bring water.",
        type: "Outdoor", surface: "Concrete", totalCourts: 4,
        rates: { weekday: 150, weekend: 250 },
        amenities: ["Free parking (limited)", "Covered waiting area"],
        rules: ["First-come, first-served for walk-ins", "Respect quiet hours after 10 PM"],
        ownerId: new mongoose.Types.ObjectId(), averageRating: 4.0
    },
    {
        name: "alabang_hub",
        location: { address: "Alabang-Zapote Rd, Muntinlupa, Metro Manila" },
        description: "Allow extra time for parking on weekends.",
        type: "Indoor", surface: "Rubberized", totalCourts: 2,
        rates: { weekday: 450, weekend: 550 },
        amenities: ["Parking", "Showers", "Pro shop (limited)"],
        rules: ["No resin/talc", "Equipment returns within 10 minutes"],
        ownerId: new mongoose.Types.ObjectId(), averageRating: 4.6
    },
    {
        name: "pasig_riverside",
        location: { address: "Riverside Dr, Pasig, Metro Manila" },
        description: "Morning sessions are cooler and less crowded.",
        type: "Outdoor", surface: "Hardcourt", totalCourts: 2,
        rates: { weekday: 200, weekend: 300 },
        amenities: ["Street parking", "Nearby café", "Public restrooms (park)"],
        rules: ["No glass bottles", "Clean as you go"],
        ownerId: new mongoose.Types.ObjectId(), averageRating: 4.1
    }
];

mongoose.connect(mongodb_URI).then(async () => {
    console.log("Connected to MongoDB. Injecting 6 dummy courts...");
    await Court.deleteMany({}); 
    await Court.insertMany(dummyCourts);
    console.log("Success! Courts are in the DB.");
    process.exit();
}).catch(err => console.error(err));
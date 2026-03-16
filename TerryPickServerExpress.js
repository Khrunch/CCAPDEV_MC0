const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const User = require("./models/Users");
const Court = require("./models/Courts");
const Reservation = require("./models/Reservations");
const Review = require("./models/Reviews");

const app = express();
const hostname = "localhost";
const port = 3000;

const mongodb_URI = 'mongodb://player:qwerty12345@ac-nkebxal-shard-00-00.mebmczc.mongodb.net:27017,ac-nkebxal-shard-00-01.mebmczc.mongodb.net:27017,ac-nkebxal-shard-00-02.mebmczc.mongodb.net:27017/TerryPick?ssl=true&replicaSet=atlas-27jkma-shard-0&authSource=admin&appName=CCAPDEV';

mongoose.connect(mongodb_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use(express.static(__dirname));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//default page redirect
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "Home Page.html"));
});

function slugifyCourtKey(name) {
  return (String(name || "").trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "").slice(0, 40) || "court");
}

function parseDateTime(dateStr, timeStr) {
    if (timeStr.includes(' ')) {
        const [time, period] = timeStr.split(' ');
        let [hours, minutes] = time.split(':');
        hours = parseInt(hours, 10);
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        return new Date(`${dateStr}T${String(hours).padStart(2, '0')}:${minutes}:00`);
    }
    return new Date(`${dateStr}T${timeStr}:00`);
}

// ----------------------------------------------------
// AUTH ROUTES
// ----------------------------------------------------
app.post('/signup', async (req, res) => {
  try {
    const { username, password, retype_password, court_name, address } = req.body;
    const isOwnerSignup = !!(court_name && String(court_name).trim() !== "");

    if (password !== retype_password) return res.status(400).json({ ok: false, error: "Passwords do not match." });

    const newUser = new User({ username: username.trim(), password: password, role: isOwnerSignup ? "owner" : "player" });
    const savedUser = await newUser.save();
    
    let ownerCourtKey = "";
    if (isOwnerSignup) {
        ownerCourtKey = slugifyCourtKey(court_name);
        const newCourt = new Court({
            name: ownerCourtKey, location: { address: address },
            ownerId: savedUser._id, type: 'indoor', description: `Official court for ${username}`
        });
        const savedCourt = await newCourt.save();
        savedUser.courtId = savedCourt._id;
        await savedUser.save();
    }
    return res.status(201).json({ ok: true, username: savedUser.username, role: savedUser.role, ownerCourt: ownerCourtKey });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ ok: false, error: "Username already exists." });
    res.status(500).json({ ok: false, error: "Server error during signup." });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username: username.trim() }).populate('courtId');
    if (!user || user.password !== password) return res.status(401).json({ ok: false, error: "Invalid credentials." });
    const ownerCourt = user.courtId ? user.courtId.name : "";
    return res.status(200).json({ ok: true, username: user.username, role: user.role, ownerCourt });
  } catch (error) { res.status(500).json({ error: "Server error during login." }); }
});

// ----------------------------------------------------
// PROFILE & COURT UPDATES
// ----------------------------------------------------
app.post('/edit-profile', async (req, res) => {
    try {
        const { username, password, bio } = req.body;
        let updateData = { bio: bio || "" };
        if (password && password.trim() !== "") updateData.password = password; 
        await User.findOneAndUpdate({ username }, updateData);
        res.redirect('/Profile Page.html');
    } catch (err) { res.status(500).send("Update failed."); }
});

// FIXED: COURT UPDATE (Using hidden original-court-name)
app.post('/edit-court-profile', async (req, res) => {
    try {
        const { "original-court-name": originalName, location, description, rates, amenities } = req.body;
        
        if (!originalName) return res.status(400).send("Error: Original court key missing.");

        await Court.findOneAndUpdate(
            { name: originalName }, 
            { $set: {
                "location.address": location, 
                description: description, 
                rates: { weekday: parseInt(rates) || 0, weekend: parseInt(rates) || 0 }, 
                amenities: amenities ? amenities.split(',').map(s => s.trim()) : []
            }}
        );
        res.redirect('/Owner Dashboard.html');
    } catch (err) { 
        res.status(500).send(`Court update failed: ${err.message}`); 
    }
});


app.post('/api/save-court', async (req, res) => {
    try {
        const { username, courtName } = req.body;
        const user = await User.findOne({ username });
        const court = await Court.findOne({ name: courtName });
        if (!user || !court) return res.status(404).json({ error: "Not found" });

        const index = user.savedCourts.indexOf(court._id);
        if (index === -1) user.savedCourts.push(court._id);
        else user.savedCourts.splice(index, 1);
        
        await user.save();
        res.json({ ok: true, isSaved: index === -1 });
    } catch (err) { res.status(500).json({ error: "Server error" }); }
});

// ----------------------------------------------------
// DATA FETCHING 
// ----------------------------------------------------
app.get('/api/courts/all', async (req, res) => {
    try {
        const courts = await Court.find({});
        res.json({ ok: true, courts });
    } catch (err) { res.status(500).json({ ok: false }); }
});

app.get('/api/courts/:name', async (req, res) => {
    try {
        const court = await Court.findOne({ name: req.params.name });
        if (!court) return res.status(404).json({ ok: false, error: "Court not found" });
        res.json({ ok: true, court });
    } catch (err) { res.status(500).json({ ok: false }); }
});

app.get('/api/user-profile-full/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username }).populate('savedCourts');
        if (!user) return res.status(404).json({ ok: false, error: "User not found" });

        const bookings = await Reservation.find({ userId: user._id, status: 'active' }).populate('courtId').sort({ startTime: 1 });
        
        res.json({
            ok: true, bio: user.bio || "", memberSince: user.createdAt,
            stats: { total: bookings.length, favorites: user.savedCourts.length, upcoming: bookings.length },
            bookings: bookings, favorites: user.savedCourts
        });
    } catch (err) { res.status(500).json({ ok: false }); }
});

// ----------------------------------------------------
// RESERVATIONS & DASHBOARD
// ----------------------------------------------------
app.get('/availability', async (req, res) => {
    try {
        const { court, startDate, endDate } = req.query;
        if (!court || !startDate || !endDate) return res.status(400).json({ ok: false });

        const courtDoc = await Court.findOne({ name: court });
        if (!courtDoc) return res.status(404).json({ ok: false });

        const start = new Date(`${startDate}T00:00:00`);
        const end = new Date(`${endDate}T23:59:59`);

        const reservations = await Reservation.find({
            courtId: courtDoc._id, startTime: { $gte: start, $lte: end }, status: { $in: ['active', 'pending'] }
        });

        const booked = [];
        reservations.forEach(res => {
            const dateStr = res.startTime.toISOString().split('T')[0];
            const startHour = res.startTime.getHours();
            const endHour = res.endTime.getHours(); 
            for (let h = startHour; h < endHour; h++) booked.push(`${dateStr}|${String(h).padStart(2, '0')}:00`);
        });
        return res.status(200).json({ ok: true, booked });
    } catch (error) { res.status(500).json({ ok: false }); }
});

app.post('/reserve', async (req, res) => {
    try {
        const { court, date, time, username } = req.body;
        if (!court || !date || !time || !username) return res.status(400).json({ ok: false, error: "Missing fields." });
        
        const courtDoc = await Court.findOne({ name: court });
        if (!courtDoc) return res.status(404).json({ ok: false, error: "Court not found." });
        
        const userDoc = await User.findOne({ username });
        const startTime = parseDateTime(date, time);
        
        // CHANGED: duration is now 1 hour (1 * 60 * 60 * 1000 ms)
        const endTime = new Date(startTime.getTime() + (1 * 60 * 60 * 1000)); 

        // FIXED: Counts how many bookings already exist for this exact 1-hour block
        const conflicting = await Reservation.countDocuments({ 
            courtId: courtDoc._id, 
            startTime: startTime, 
            status: 'active' 
        });

        // FIXED: Only allows reservation if capacity (totalCourts) is not reached
        if (conflicting >= (courtDoc.totalCourts || 1)) {
            return res.status(409).json({ ok: false, error: "Capacity reached for this hour." });
        }

        const newRes = new Reservation({
            courtId: courtDoc._id, 
            userId: userDoc ? userDoc._id : null, 
            bookedByName: userDoc ? userDoc.username : username, 
            startTime: startTime, 
            endTime: endTime, 
            status: 'active' 
        });
        
        await newRes.save();
        return res.status(201).json({ ok: true });
    } catch (error) { 
        res.status(500).json({ ok: false, error: error.message }); 
    }
});

app.get('/api/owner-reservations/:username', async (req, res) => {
    try {
        const owner = await User.findOne({ username: req.params.username });
        if (!owner || !owner.courtId) return res.status(404).json({ ok: false });
        
        const reservations = await Reservation.find({ courtId: owner.courtId }).sort({ startTime: 1 });
        res.json({ ok: true, reservations });
    } catch (err) { res.status(500).json({ ok: false }); }
});

app.put('/api/reservations/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        await Reservation.findByIdAndUpdate(req.params.id, { status });
        res.json({ ok: true });
    } catch (err) { res.status(500).json({ ok: false }); }
});

// CHANGED: Cancel reservation - use PATCH instead of DELETE
app.patch('/api/reservations/:id/cancel', async (req, res) => {
    try {
        const { username } = req.body;
        if (!username) return res.status(400).json({ ok: false, error: "Username required." });

        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) return res.status(404).json({ ok: false, error: "Reservation not found." });

        // Verify the user owns this reservation
        const user = await User.findOne({ username });
        if (!user || String(reservation.userId) !== String(user._id)) {
            return res.status(403).json({ ok: false, error: "Not authorized to cancel this reservation." });
        }

        reservation.status = 'cancelled';
        await reservation.save();
        res.json({ ok: true });
    } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ----------------------------------------------------
// REVIEWS
// ----------------------------------------------------
app.get('/api/reviews/latest', async (req, res) => {
    try {
        const reviews = await Review.find({}).populate('courtId', 'name').populate('userId', 'username').sort({ _id: -1 }).limit(6);
        res.json({ ok: true, reviews });
    } catch (err) { res.status(500).json({ ok: false }); }
});

app.post('/api/reviews', async (req, res) => {
    try {
        const { courtKey, username, rating, comment } = req.body;
        const court = await Court.findOne({ name: courtKey });
        const user = await User.findOne({ username });
        if(!court || !user) return res.status(404).json({ ok: false });

        const newReview = new Review({ courtId: court._id, userId: user._id, rating, comment });
        await newReview.save();
        res.json({ ok: true });
    } catch (err) { res.status(500).json({ ok: false }); }
});

app.get('/api/reviews/:courtName', async (req, res) => {
    try {
        const court = await Court.findOne({ name: req.params.courtName });
        if(!court) return res.status(404).json({ ok: false });

        const reviews = await Review.find({ courtId: court._id }).populate('userId', 'username').sort({ _id: -1 });
        res.json({ ok: true, reviews });
    } catch (err) { res.status(500).json({ ok: false }); }
});

app.listen(port, hostname, () => { console.log(`Server running at http://${hostname}:${port}/`); });
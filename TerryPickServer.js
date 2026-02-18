const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const hostname = "localhost";
const port = 3000;

const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

function send(res, statusCode, headers, body) {
  res.writeHead(statusCode, headers);
  res.end(body);
}

function sendJson(res, statusCode, data) {
  send(
    res,
    statusCode,
    { "Content-Type": "application/json; charset=utf-8" },
    JSON.stringify(data)
  );
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function parseForm(body) {
  const out = {};
  const params = new URLSearchParams(body);
  for (const [k, v] of params.entries()) out[k] = v;
  return out;
}

function slugifyCourtKey(name) {
  return (
    String(name || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 40) || "court"
  );
}

/**
 * Hardcoded / in-memory users (DEMO ONLY)
 * NOTE: resets when server restarts
 */
const usersByUsername = new Map();

const reservations = {};

// seed demo accounts
usersByUsername.set("terryp", {
  username: "terryp",
  password: "pickle123",
  role: "player",
  courtKey: "",
});

usersByUsername.set("owner1", {
  username: "owner1",
  password: "pickle123",
  role: "owner",
  courtKey: "greenhills2",
});

usersByUsername.set("alexr", {
  username: "alexr",
  password: "pickle123",
  role: "player",
  courtKey: "",
});

usersByUsername.set("guest123", {
  username: "guest123",
  password: "pickle123",
  role: "player",
  courtKey: "",
});

usersByUsername.set("sammyg", {
  username: "sammyg",
  password: "pickle123",
  role: "player",
  courtKey: "",
});

usersByUsername.set("owner2", {
  username: "owner2",
  password: "pickle123",
  role: "owner",
  courtKey: "bgc_rooftop",
});

usersByUsername.set("owner3", {
  username: "owner3",
  password: "pickle123",
  role: "owner",
  courtKey: "makati_gym",
});

function safeResolveFromPublic(requestPath) {
  const cleaned = requestPath.replace(/^\/+/, "");
  const resolved = path.resolve(PUBLIC_DIR, cleaned);
  const publicRoot = path.resolve(PUBLIC_DIR);

  if (!resolved.startsWith(publicRoot + path.sep) && resolved !== publicRoot) {
    return null;
  }
  return resolved;
}

const server = http.createServer(async (req, res) => {
  try {
    if (!req.url) {
      return send(res, 400, { "Content-Type": "text/plain; charset=utf-8" }, "Bad Request");
    }

    const url = new URL(req.url, `http://${req.headers.host || `${hostname}:${port}`}`);
    const pathname = decodeURIComponent(url.pathname);

    // normalize trailing slashes ("/signup/" -> "/signup")
    const route = pathname.replace(/\/+$/, "") || "/";

    console.log(`${new Date().toISOString()} ${req.method} ${route}`);

    // =========================
    // API routes (DEMO ONLY)
    // =========================
    if (req.method === "POST" && (route === "/signup" || route === "/login")) {
      const contentType = String(req.headers["content-type"] || "");
      const raw = await readBody(req);

      const data =
        contentType.includes("application/json") ? JSON.parse(raw || "{}") : parseForm(raw || "");

      if (route === "/signup") {
        const username = String(data.username || "").trim();
        const password = String(data.password || "");
        const retype = String(data.retype_password || "");

        const isOwnerSignup = data.court_name != null && String(data.court_name).trim() !== "";

        if (!username || !password) {
          return sendJson(res, 400, { ok: false, error: "Username and password are required." });
        }
        if (password !== retype) {
          return sendJson(res, 400, { ok: false, error: "Passwords do not match." });
        }
        if (usersByUsername.has(username)) {
          return sendJson(res, 409, { ok: false, error: "Username already exists." });
        }

        const role = isOwnerSignup ? "owner" : "player";
        const ownerCourt =
          role === "owner" ? slugifyCourtKey(String(data.court_name || "")) : "";

        usersByUsername.set(username, {
          username,
          password, // demo only (plaintext)
          role,
          courtKey: ownerCourt,
          courtName: role === "owner" ? String(data.court_name || "").trim() : "",
          address: role === "owner" ? String(data.address || "").trim() : "",
          mobileNo: role === "owner" ? String(data.mobile_no || "").trim() : "",
          createdAt: new Date(),
          lastLogin: null,
        });

        return sendJson(res, 201, { ok: true, username, role, ownerCourt });
      }

      if (route === "/login") {
        const username = String(data.username || "").trim();
        const password = String(data.password || "");

        if (!username || !password) {
          return sendJson(res, 400, { ok: false, error: "Username and password are required." });
        }

        const user = usersByUsername.get(username);
        if (!user || user.password !== password) {
          return sendJson(res, 401, { ok: false, error: "Invalid credentials." });
        }

        user.lastLogin = new Date();

        return sendJson(res, 200, {
          ok: true,
          username: user.username,
          role: user.role,
          ownerCourt: user.courtKey || "",
        });
      }
    }

    // if someone navigates to /signup or /login in the browser, redirect to the HTML pages
    if (req.method === "GET" && route === "/signup") {
      res.writeHead(302, { Location: "/Signup Page.html" });
      return res.end();
    }
    if (req.method === "GET" && route === "/login") {
      res.writeHead(302, { Location: "/Login Page.html" });
      return res.end();
    }

    // =========================
    // Reservation API (DEMO ONLY)
    // =========================
    if (req.method === "GET" && route === "/availability") {
      const court = url.searchParams.get("court");
      const date = url.searchParams.get("date");

      if (!court || !date) {
        return sendJson(res, 400, { ok: false, error: "court and date are required" });
      }

      const booked =
        reservations[court]?.[date]
          ? Array.from(reservations[court][date])
          : [];

      return sendJson(res, 200, { ok: true, booked });
    }

    if (req.method === "POST" && route === "/reserve") {
      const raw = await readBody(req);
      const data = JSON.parse(raw || "{}");

      const { court, date, time, username } = data;

      if (!court || !date || !time || !username) {
        return sendJson(res, 400, { ok: false, error: "Missing fields" });
      }

      reservations[court] ??= {};
      reservations[court][date] ??= new Set();

      if (reservations[court][date].has(time)) {
        return sendJson(res, 409, { ok: false, error: "Slot already booked" });
      }

      reservations[court][date].add(time);
      return sendJson(res, 201, { ok: true });
    }

    // =========================
    // static file handling
    // =========================
    let staticPathname = pathname;
    if (staticPathname === "/") staticPathname = "/Home Page.html";

    const filePath = safeResolveFromPublic(staticPathname);
    if (!filePath) {
      return send(res, 403, { "Content-Type": "text/plain; charset=utf-8" }, "Forbidden");
    }

    fs.stat(filePath, (err, stat) => {
      if (err || !stat.isFile()) {
        return send(res, 404, { "Content-Type": "text/plain; charset=utf-8" }, "Not Found");
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || "application/octet-stream";

      res.writeHead(200, { "Content-Type": contentType });

      const stream = fs.createReadStream(filePath);
      stream.on("error", () => {
        send(res, 500, { "Content-Type": "text/plain; charset=utf-8" }, "Server Error");
      });
      stream.pipe(res);
    });
  } catch (e) {
    console.error("REQUEST ERROR:", e);
    send(res, 500, { "Content-Type": "text/plain; charset=utf-8" }, "Server Error");
  }
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

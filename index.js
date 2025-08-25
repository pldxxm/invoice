const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const userRouter = require("./routes/user.route");
const dashboardRouter = require("./routes/dashboard.route");
const customerRouter = require("./routes/customer.route");
const invoiceRouter = require("./routes/invoice.route");
const session = require("express-session");
const flash = require("connect-flash");
const MongoStore = require("connect-mongo");
const mongoose = require("mongoose");

const app = express();

// load env variables
require("dotenv").config();

require("./lib/dbConnect");

// Security middleware - Allow all scripts temporarily
// app.use(
//   helmet({
//     contentSecurityPolicy: {
//       directives: {
//         defaultSrc: ["'self'"],
//         styleSrc: ["'self'", "'unsafe-inline'", "https:"],
//         scriptSrc: ["'self'", "'unsafe-inline'", "https:"],
//         scriptSrcElem: ["'self'", "'unsafe-inline'", "https:"],
//         imgSrc: ["'self'", "data:", "https:"],
//         fontSrc: ["'self'", "https:"],
//         connectSrc: ["'self'"],
//         frameSrc: ["'none'"],
//         objectSrc: ["'none'"],
//         baseUri: ["'self'"],
//         formAction: ["'self'"],
//       },
//     },
//   })
// );

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// Rate limiting - Production-appropriate limits
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (about 67 requests/minute)
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limits for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 auth attempts per 15 minutes
  message:
    "Too many authentication attempts from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general rate limiting to all routes
app.use(generalLimiter);

// Apply stricter rate limiting to authentication routes
app.use("/api/user", authLimiter);

// Environment-based logging
if (process.env.NODE_ENV === "production") {
  app.use(morgan("combined")); // Production logging
} else {
  app.use(morgan("dev")); // Development logging
}

// allow json in request.body
app.use(express.json({ limit: "10mb" }));
// allow form data in request.body
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// the view folder
app.set("views", __dirname + "/views");
// Enable view caching in production
app.set("view cache", process.env.NODE_ENV === "production");
//set the view engine to ejs
app.set("view engine", "ejs");

// serve static files with production-optimized caching
if (process.env.NODE_ENV === "production") {
  // Production: Enable caching for static files
  app.use(
    express.static(__dirname + "/public", {
      etag: true,
      lastModified: true,
      maxAge: "1d", // Cache for 1 day
      setHeaders: (res, path) => {
        if (path.endsWith(".css") || path.endsWith(".js")) {
          res.setHeader("Cache-Control", "public, max-age=86400"); // 1 day
        } else if (
          path.endsWith(".png") ||
          path.endsWith(".jpg") ||
          path.endsWith(".jpeg") ||
          path.endsWith(".gif")
        ) {
          res.setHeader("Cache-Control", "public, max-age=604800"); // 1 week
        }
      },
    })
  );
} else {
  // Development: Disable caching for easier development
  app.use(
    express.static(__dirname + "/public", {
      etag: false,
      lastModified: false,
      cacheControl: true,
      maxAge: 0,
      setHeaders: (res) => res.set("Cache-Control", "no-store"),
    })
  );
}
// trust first proxy
app.set("trust proxy", 1);
//enable session for authentication
app.use(
  session({
    secret: process.env.AUTH_SECRET,
    name: "sid",
    saveUninitialized: false,
    resave: false,
    store: MongoStore.create({
      client: mongoose.connection.getClient(),
      collectionName: "sessions",
      ttl: 60 * 60 * 24 * 7,
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: process.env.NODE_ENV === "production" ? "lax" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

// enable a global middleware flash to deal with all request if necessary, no need to import in the router file again
app.use(flash());

// let userRouter handle url starting with /api/user
app.get("/", (req, res) => {
  res.render("pages/index", { title: "Home" });
});

app.use("/api/user", userRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/customers", customerRouter);
app.use("/api/invoices", invoiceRouter);

// Only expose test route in development
if (process.env.NODE_ENV !== "production") {
  app.get("/test", (req, res) => {
    res.render("pages/test", { title: "Test" });
  });
}

//fallback route for 404
app.get(/.*/, (req, res) => {
  res.status(404).render("pages/error", {
    title: "Not Found",
    errorTitle: "404,Not Found",
    errorMessage: "The page you are looking for does not exist.",
  });
});

const PORT = process.env.PORT || 8844;

app.listen(PORT, "127.0.0.1", () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`Server bound to: 127.0.0.1:${PORT}`);
});

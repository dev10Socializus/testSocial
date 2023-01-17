const express = require("express");
const requireAll = require("require-all");
const path = require("path");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const { logger } = require("./middleware/logger");
const errorHandlers = require("./middleware/errorHandlers");
const jwt = require("express-jwt");
const morgan = require("morgan");
const {
  errorHandler,
  ensureAuthenticated,
  PUBLIC_ROUTES,
} = require("forest-express-mongoose");

//Imports Routes
const loginRoute = require("./routes/v1/loginRoute");
const assetsRoute = require("./routes/v1/AssetRoute");
const userRoute = require("./routes/v1/userRoutes");
const profileRoute = require("./routes/v1/profileRoute");
const eventRoute = require("./routes/v1/EventRoute");

const app = express();

let allowedOrigins = [/\.forestadmin\.com$/, /localhost:\d{4}$/];

if (process.env.CORS_ORIGINS) {
  allowedOrigins = allowedOrigins.concat(process.env.CORS_ORIGINS.split(","));
}

const corsConfig = {
  origin: allowedOrigins,
  maxAge: 86400, // NOTICE: 1 day
  credentials: true,
};

app.use(morgan("tiny"));
// Support for request-private-network as the `cors` package
// doesn't support it by default
// See: https://github.com/expressjs/cors/issues/236
app.use((req, res, next) => {
  if (req.headers["access-control-request-private-network"]) {
    res.setHeader("access-control-allow-private-network", "true");
  }
  next(null);
});
app.use(
  "/forest/authentication",
  cors({
    ...corsConfig,
    // The null origin is sent by browsers for redirected AJAX calls
    // we need to support this in authentication routes because OIDC
    // redirects to the callback route
    origin: corsConfig.origin.concat("null"),
  })
);
app.use(cors(corsConfig));
app.use(bodyParser.json());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

//Middleware Config
app.use(logger);
app.use(errorHandlers);

//Define Routes

app.use("/api/v1", loginRoute);
app.use("/api/v1", assetsRoute);
app.use("/api/v1", userRoute);
app.use("/api/v1", profileRoute);
app.use("/api/v1", eventRoute);

//

app.use(
  jwt({
    secret: process.env.FOREST_AUTH_SECRET,
    credentialsRequired: false,
    algorithms: ["HS256"],
  })
);

app.use("/forest", (request, response, next) => {
  if (PUBLIC_ROUTES.includes(request.url)) {
    return next();
  }
  return ensureAuthenticated(request, response, next);
});

requireAll({
  dirname: path.join(__dirname, "routes"),
  recursive: true,
  resolve: (Module) => app.use("/forest", Module),
});

requireAll({
  dirname: path.join(__dirname, "middlewares"),
  recursive: true,
  resolve: (Module) => Module(app),
});

app.use(errorHandler());

module.exports = app;

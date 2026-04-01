const express = require("express");
const app = express();
const morgan = require("morgan");
const bodyparser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");

const authRoutes = require("./src/api/routes/auth");
const invoiceRoutes = require("./src/api/routes/invoice");

// app.use(cors);
app.use(morgan("dev"));
app.use(cors());
app.use(helmet());
app.disable("etag");
app.use(bodyparser.urlencoded({ limit: "100mb", extended: true }));
app.use(bodyparser.json({ limit: "100mb" }));
app.disable("x-powered-by");
app.use(compression());

app.use((req, res, next) => {
  // console.log("origin url:", req);

  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-Width, Content-Type, Accept, Authorization",
  );
  if (req.method == "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(504).json({});
  }

  // var ip =
  //   (req.headers["x-forwarded-for"] || "").split(",").pop().trim() ||
  //   req.connection.remoteAddress ||
  //   req.socket.remoteAddress ||
  //   req.connection.socket.remoteAddress;
  // const device = req.headers["user-agent"];
  // console.log("ip address::", ip, ",,,,,device:::", device);

  next();
});

app.use("/auth", authRoutes);
app.use("/invoice", invoiceRoutes);

app.use((req, res, next) => {
  const error = new Error("bankInvoice server not Found " + new Date());
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: { message: error.message },
  });
});

app.use((req, res, next) => {
  res.status(200).json({ message: "it works" });
});

module.exports = app;

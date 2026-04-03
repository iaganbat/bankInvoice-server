const http = require("http");
const app = require("./app");
const os = require("os");
const port = process.env.PORT || 4001;
const server = http.createServer(app);

const CLIENT = require("./src/database");

server.timeout = 300000;

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name in interfaces) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "0.0.0.0"; // Default if none found
}
// console.log("Local IP Address:", getLocalIpAddress());
server.listen(port, function () {
  // const a = require("./nodemon.json");
  // console.log(a.env.dbConfig);
  console.log(
    "bankInvoice server listening in " + port + ", timeout " + server.timeout,
  );

  // const today = new Date();
  // console.log("today::", dateFormat(today, "yyyy/mm/dd"));

  // const yesterday = new Date();
  // yesterday.setDate(yesterday.getDate() - 1);
  // console.log("yesterday::", dateFormat(yesterday, "yyyy/mm/dd"));

  // const tmp = new Date();
  // const startOfWeek = new Date(
  //   tmp.getFullYear(),
  //   tmp.getMonth(),
  //   tmp.getDate() - tmp.getDay() + 1
  // );
  // console.log("startOfWeek::", dateFormat(startOfWeek, "yyyy/mm/dd"));

  // const tmp1 = new Date();
  // const startOfMonth = new Date(tmp1.getFullYear(), tmp1.getMonth(), 1);
  // console.log("startOfMonth::", dateFormat(startOfMonth, "yyyy/mm/dd"));
});

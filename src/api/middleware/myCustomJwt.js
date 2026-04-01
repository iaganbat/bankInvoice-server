const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    // next();
    // return;
    var token = req.headers.authorization;
    // console.log(token);

    if (token == "null" || token == "undefined")
      return res
        .status(403)
        .json({ error: true, message: "No token provided." });
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    if (!decoded)
      return res.status(401).json({ message: "Unauthorized request" });
    req.loggedUser = decoded;
    // console.log("decoded:", token, decoded, process.env.JWT_KEY);
    next();
  } catch (error) {
    console.log("useJwt error:", error);
    return res.status(401).json({
      errorId: 401,
      message: "JWT Auth failed",
    });
  }
};

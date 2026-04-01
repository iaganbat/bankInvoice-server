const router = require("express").Router();
const bcrypt = require("bcrypt");
const dateFormat = require("dateformat");
const jwt = require("jsonwebtoken");

const useMyJwt = require("../middleware/myCustomJwt");
const { isEmpty, isEmptyDecimal } = require("../../../common");
const { CONNECTION_POOL, POOL_CONNECT } = require("../../database");
require("dotenv").config();

const CONSTANT_USER_TYPE = [{ id: "Admin", name: "Administrator" }];

router.get("/login", async (req, res, next) => {
  try {
    const { id, password } = req.query;

    if (isEmpty(id))
      return res
        .status(400)
        .json({ message: "Нэвтрэх код тодорхойгүй байна." });

    if (isEmpty(password))
      return res.status(400).json({ message: "Нууц үг тодорхойгүй байна." });

    await POOL_CONNECT;

    const lstFoundUser = (
      await CONNECTION_POOL.request().query(
        `SELECT CONVERT(VARCHAR, PkId) pkId, id, name, password FROM Users WHERE isDeleted=0 AND id = '${id}'`,
      )
    ).recordset;

    if (lstFoundUser.length < 1)
      return res.status(400).json({ message: "Хэрэглэгч олдсонгүй." });

    bcrypt.compare(password, lstFoundUser[0].password, (err, result) => {
      if (err) {
        return res.status(401).json({ message: err.message });
      }
      if (result) {
        const userObj = {
          pkId: lstFoundUser[0].pkId,
          id: lstFoundUser[0].id,
          name: lstFoundUser[0].name,
          config: { dayLimit: 80 },
        };
        const token = jwt.sign(userObj, process.env.JWT_KEY, {
          expiresIn: "8h",
        });

        return res.status(200).json({ token: token, ...userObj });
      }
      return res.status(400).json({ message: "Нууц үг буруу байна." });
    });
  } catch (e) {
    // console.log("login error::", e);
    return res.status(500).json({ message: e.message });
  }
});

router.post("/user/list", useMyJwt, async (req, res, next) => {
  try {
    const { filterValue } = req.body;

    await POOL_CONNECT;

    const lst = (
      await CONNECTION_POOL.request().query(
        `SELECT CONVERT(VARCHAR, pkId) pkId, id, name, financeId FROM Users WHERE isDeleted=0`,
      )
    ).recordset;

    return res.status(200).json(lst);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

router.get("/user/detail", useMyJwt, async (req, res, next) => {
  try {
    const { pkId } = req.query;

    if (isEmptyDecimal(pkId))
      return res.status(400).json({ message: "Хэрэглэгч тодорхойгүй байна." });

    await POOL_CONNECT;

    const lst = (
      await CONNECTION_POOL.request().query(
        `SELECT CONVERT(VARCHAR, pkId) pkId, id, name, financeId, password FROM Users WHERE isDeleted=0 AND pkId = ${pkId}`,
      )
    ).recordset;

    if (isEmpty(lst) || lst.length < 1)
      return res.status(400).json({ message: "Хэрэглэгч олдохгүй байна." });

    return res.status(200).json({ ...lst[0] });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

router.post("/changePassword", useMyJwt, async (req, res, next) => {
  try {
    const { pkId, password } = req.body;

    if (isEmptyDecimal(pkId))
      return res.status(400).json({ message: "Хэрэглэгч тодорхойгүй байна." });
    if (isEmpty(password))
      return res
        .status(400)
        .json({ message: "Шинэ нууц үг тодорхойгүй байна." });

    await POOL_CONNECT;

    const lst = (
      await CONNECTION_POOL.request().query(
        `SELECT CONVERT(VARCHAR, pkId) pkId FROM Users WHERE isDeleted=0 AND pkId = ${pkId}`,
      )
    ).recordset;
    if (isEmpty(lst) || lst.length < 1)
      return res.status(400).json({ message: "Хэрэглэгч олдохгүй байна." });

    const encrypted_pass = await bcrypt.hash(password, 10);

    await CONNECTION_POOL.request().query(
      `UPDATE Users SET Password = '${encrypted_pass}' WHERE isDeleted=0 AND pkId = ${pkId}`,
    );

    return res.status(200).json({ message: "success" });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

router.post("/user", useMyJwt, async (req, res, next) => {
  try {
    const { pkId, id, name, password, financeId } = req.body;

    console.log(req.body);

    if (isEmpty(id))
      return res
        .status(400)
        .json({ message: "Нэвтрэх код тодорхойгүй байна." });
    if (isEmpty(name))
      return res
        .status(400)
        .json({ message: "Хэрэглэгчийн нэр тодорхойгүй байна." });
    if (isEmpty(password))
      return res.status(400).json({ message: "Нууц үг тодорхойгүй байна." });
    if (isEmpty(financeId))
      return res
        .status(400)
        .json({ message: "Санхүүгийн хэрэглэгчийн код тодорхойгүй байна." });

    const encrypted_pass = await bcrypt.hash(password, 10);

    await POOL_CONNECT;

    const lstCheckFinanceId = (
      await CONNECTION_POOL.request().query(
        `SELECT * FROM VIEW_FinanceUser WHERE UserId = '${financeId}'`,
      )
    ).recordset;
    if (lstCheckFinanceId.length < 1)
      return res.status(400).json({
        message: "Санхүүгийн системээс хэрэглэгчийн код олдохгүй байна.",
      });

    if (isEmptyDecimal(pkId)) {
      const lstIdDuplicated = (
        await CONNECTION_POOL.request().query(
          `SELECT CONVERT(VARCHAR, pkId) pkId, id, name FROM Users WHERE isDeleted=0 AND id = '${id}'`,
        )
      ).recordset;

      if (lstIdDuplicated.length > 0)
        return res
          .status(400)
          .json({ message: "Хэрэглэгчийн код давхардаж байна." });

      await CONNECTION_POOL.request().query(
        `INSERT INTO Users (id, name, password, financeId, isDeleted, role, createdDate) VALUES ('${id}','${name}','${encrypted_pass}', '${financeId}', 0, 'user', CONVERT(NVARCHAR(23), GETDATE(), 121))`,
      );

      return res.status(200).json({ message: "successfully" });
    } else {
      const lsts = (
        await CONNECTION_POOL.request().query(
          `SELECT CONVERT(VARCHAR, pkId) pkId FROM Users WHERE isDeleted=0 AND pkId = ${pkId};
          SELECT CONVERT(VARCHAR, pkId) pkId FROM Users WHERE isDeleted=0 AND id = '${id}' AND pkId <> ${pkId}`,
        )
      ).recordsets;

      console.log(lsts[0], lsts[1]);

      if (lsts[0].length < 1)
        return res.status(400).json({ message: "Хэрэглэгч олдохгүй байна." });

      if (lsts[1].length > 0)
        return res
          .status(400)
          .json({ message: "Хэрэглэгчийн код давхардаж байна." });

      await CONNECTION_POOL.request().query(
        `UPDATE Users SET id='${id}', name=N'${name}', financeId='${financeId}', modifiedDate=CONVERT(NVARCHAR(23), GETDATE(), 121) WHERE IsDeleted = 0 AND PkId =${pkId} `,
      );

      return res.status(200).json({ message: "successfully" });
    }
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

router.delete("/user", useMyJwt, async (req, res, next) => {
  try {
    const { pkId } = req.query;

    if (isEmptyDecimal(pkId))
      return res.status(400).json({ message: "Хэрэглэгч тодорхойгүй байна." });

    await POOL_CONNECT;

    const lst = (
      await CONNECTION_POOL.request().query(
        `SELECT CONVERT(VARCHAR, pkId) userPkId, role FROM Users WHERE pkId = ${pkId}`,
      )
    ).recordset;
    if (lst.length < 1)
      return res.status(400).json({ message: "Хэрэглэгч олдохгүй байна." });

    if (lst[0].role?.toLowerCase() == "admin")
      return res
        .status(400)
        .json({ message: "Системийн хэрэглэгчийг устгах боломжгүй" });

    await CONNECTION_POOL.request().query(
      `UPDATE Users SET IsDeleted=1, modifiedDate=CONVERT(NVARCHAR(23), GETDATE(), 121) WHERE isDeleted=0 AND pkId = ${pkId}`,
    );

    return res.status(200).json({ message: "successfully" });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: e.message });
  }
});

router.get("/aboutMe", useMyJwt, async (req, res, next) => {
  return res.status(200).json({ ...req.loggedUser });
});

module.exports = router;

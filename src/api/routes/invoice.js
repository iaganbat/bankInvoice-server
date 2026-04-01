const router = require("express").Router();
const mssql = require("mssql");
const dateFormat = require("dateformat");

const useJwt = require("../middleware/myCustomJwt");
const { isEmpty, isEmptyDecimal } = require("../../../common");
const { POOL_CONNECT, CONNECTION_POOL } = require("../../database");

require("dotenv").config();

const createdDateFormat = "yyyy/mm/dd HH:MM:ss:l";

router.post("/importExcel", useJwt, async (req, res, next) => {
  try {
    const { items } = req.body;

    // console.log(req.body);
    // return res.status(400).json({ message: "OKLA" });

    if (isEmpty(items) || !Array.isArray(items) || items.length < 1)
      return res.status(400).json({ message: "items not defined" });

    const tvp = new mssql.Table();
    tvp.columns.add("RowNo", mssql.NVarChar(50));
    tvp.columns.add("IncomeDate", mssql.NVarChar(50));
    tvp.columns.add("VoucherDate", mssql.NVarChar(50));
    tvp.columns.add("VoucherTime", mssql.NVarChar(50));
    tvp.columns.add("TerminalNo", mssql.NVarChar(50));
    tvp.columns.add("CardType", mssql.NVarChar(50));
    tvp.columns.add("TotalAmount", mssql.Numeric(24, 2));
    tvp.columns.add("FeeAmount", mssql.Numeric(24, 2));
    tvp.columns.add("FeePercent", mssql.Numeric(24, 2));
    tvp.columns.add("Amount", mssql.Numeric(24, 2));
    tvp.columns.add("ReferenceNo", mssql.NVarChar(50));
    tvp.columns.add("CustomerId", mssql.NVarChar(50));

    items.map((i) => {
      tvp.rows.add(
        i.rowNo,
        i.invDate,
        i.voucherDate,
        i.voucherTime,
        i.terminalNo,
        i.cardNo,
        Number(i.totalAmount),
        Math.abs(Number(i.feeAmount)),
        0,
        Number(i.amount),
        i.referenceNo,
        i.customerId,
      );
    });

    await POOL_CONNECT;
    const sqlRequest = CONNECTION_POOL.request();
    sqlRequest.input("UserPkId", mssql.NVarChar, req.loggedUser.pkId);
    sqlRequest.input("Params", mssql.TVP, tvp);

    const lst = (await sqlRequest.execute("MOD_ImportFile")).recordset;

    return res.status(200).json(lst);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

// router.post("/voucher", useJwt, async (req, res, next) => {
//   try {
//     const { rowPkId } = req.body;

//     if (isEmptyDecimal(rowPkId))
//       return res.status(400).json({ message: "template not defined" });

//     await POOL_CONNECT;
//     const tran = new mssql.Transaction(POOL_CONNECT);

//     try {
//       await tran.begin();

//       const sqlRequest = new mssql.Request(tran);

//       sqlRequest.input("TemplatePkId", mssql.NVarChar, rowPkId);
//       sqlRequest.input("UserPkId", mssql.NVarChar, req.loggedUser.pkId);

//       const lstRtrn = (await sqlRequest.execute("MOD_Voucher")).recordset;

//       await tran.commit();

//       return res.status(200).json(lstRtrn);
//     } catch {
//       await tran.rollback();
//     }
//   } catch (e) {
//     return res.status(500).json({ message: e.message });
//   }
// });

router.post("/voucher", useJwt, async (req, res, next) => {
  try {
    const { rowPkId } = req.body;

    if (isEmptyDecimal(rowPkId))
      return res.status(400).json({ message: "template not defined" });

    await POOL_CONNECT;

    const sqlRequest = CONNECTION_POOL.request();

    sqlRequest.input("TemplatePkId", mssql.NVarChar, rowPkId);
    sqlRequest.input("UserPkId", mssql.NVarChar, req.loggedUser.pkId);

    const lstRtrn = (await sqlRequest.execute("MOD_Voucher")).recordset;

    return res.status(200).json(lstRtrn);
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: e.message });
  }
});

router.post("/systemConfiguration", useJwt, async (req, res, next) => {
  try {
    const { configs } = req.body;

    if (isEmpty(configs) || !Array.isArray(configs) || configs.length < 1)
      return res
        .status(400)
        .json({ message: "Хадгалах тохиргоо тодорхойгүй байна." });

    if (configs.some((i) => isEmpty(i.id)))
      return res
        .status(400)
        .json({ message: "Тохиргоо нь тодорхойгүй мөр бичлэг байна." });
    if (configs.some((i) => isEmpty(i.value)))
      return res
        .status(400)
        .json({ message: "Тохиргооны утга нь тодорхойгүй мөр бичлэг байна." });

    await POOL_CONNECT;

    const sqlRequest = CONNECTION_POOL.request();

    const lstExists = (
      await sqlRequest.query("SELECT id, value FROM SystemConfiguration")
    ).recordset;

    const allWait = configs.map(async (i) => {
      if (lstExists.filter((y) => y.id == i.id).length > 0)
        await sqlRequest.query(
          `UPDATE SystemConfiguration SET Value = '${i.value}' WHERE Id = '${i.id}'`,
        );
      else
        await sqlRequest.query(
          `INSERT INTO SystemConfiguration (Id, Value) VALUES ('${i.id}','${i.value}')`,
        );
    });

    await Promise.all(allWait);

    return res.status(200).json({ message: "successfully" });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

router.post("/systemConfiguration/list", useJwt, async (req, res, next) => {
  try {
    const { ids } = req.body;

    await POOL_CONNECT;

    let where = "";
    if (Array.isArray(ids) && ids.length > 0) {
      where = ` WHERE Id IN ('${ids.join("','")}') `;
    }

    const sqlRequest = CONNECTION_POOL.request();

    const lst = (
      await sqlRequest.query(
        "SELECT id, value FROM SystemConfiguration " + where,
      )
    ).recordset;

    return res.status(200).json(lst);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
});

module.exports = router;

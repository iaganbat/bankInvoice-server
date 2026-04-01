const dateformat = require("dateformat");
var methods = {};

methods.isEmpty = (pObj) => {
  if (pObj === null || pObj === undefined || pObj === "") return true;
  // else if (Object.keys(pObj).length == 0) return true;
  else return false;
};

methods.isEmptyDecimal = (pObj) => {
  if (
    pObj === null ||
    pObj === undefined ||
    pObj === "" ||
    pObj === 0 ||
    pObj === "0" ||
    pObj == "null"
  )
    return true;
  else return false;
};

methods.getCurrentDate = () => {
  var x = new Date();
  var offset = -x.getTimezoneOffset();
  // console.log(
  //   (offset >= 0 ? "+" : "-") + parseInt(offset / 60) + ":" + (offset % 60)
  // );
  x.setHours(x.getHours() + parseInt(offset / 60));
  return x;
};

methods.getToday = () => {
  var x = new Date();
  var offset = -x.getTimezoneOffset();
  // console.log(
  //   (offset >= 0 ? "+" : "-") + parseInt(offset / 60) + ":" + (offset % 60)
  // );
  x.setHours(x.getHours() + parseInt(offset / 60));
  x.setHours(0, 0, 0, 0);
  x.setHours(x.getHours() + parseInt(offset / 60));
  return dateformat(new Date(), "yyyy/mm/dd");
};

methods.getDate = (pObject) => {
  if (pObject == null || pObject == undefined) return new Date("1970-01-01");
  var pObj = pObject.toString().replace("/", "-");
  var x = new Date(pObj.replace("/", "-"));
  return x;
};

methods.getDifferenceDay = (pDate1, pDate2) => {
  const date1 = new Date(pDate1);
  const date2 = new Date(pDate2);
  const diff = date2.getTime() - date1.getTime();
  const days = Math.round(diff / (1000 * 3600 * 24));
  return days;
};

module.exports = methods;

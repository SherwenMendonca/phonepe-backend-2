const express = require("express");
const crypto = require("crypto");
const app = express();
const port = process.env.PORT || 3000;

const merchantId = "PGTESTPAYUAT";
const saltKey = "e522d95d-49fe-46a4-acdb-1349f91958cf";
const redirectUrl = "https://www.google.com"; // Change this to your actual redirect URL

app.get("/pay", async (req, res) => {
  const { amount, name, email } = req.query;
  const transactionId = "TID" + Date.now();

  const data = {
    merchantId,
    merchantTransactionId: transactionId,
    merchantUserId: name || "Guest",
    amount: parseInt(amount),
    redirectUrl,
    redirectMode: "REDIRECT",
    callbackUrl: redirectUrl,
    paymentInstrument: {
      type: "PAY_PAGE"
    }
  };

  const jsonData = JSON.stringify(data);
  const base64Data = Buffer.from(jsonData).toString("base64");

  const stringToSign = base64Data + "/pg/v1/pay" + saltKey;
  const xVerify = crypto.createHash("sha256").update(stringToSign).digest("hex") + "###1";

  try {
    const response = await fetch("https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": xVerify,
        "X-MERCHANT-ID": merchantId
      },
      body: JSON.stringify({ request: base64Data })
    });

    const result = await response.json();

    if (result.success) {
      res.redirect(result.data.instrumentResponse.redirectInfo.url);
    } else {
      res.send("Payment failed: " + result.code);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal error");
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

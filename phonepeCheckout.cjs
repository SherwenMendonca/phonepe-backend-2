const express = require("express");
const crypto = require("crypto");
const app = express();
const port = process.env.PORT || 10000;

const merchantId = "PGTESTPAYUAT86";
const saltKey = "96434309-7796-489d-8924-ab56988a6076";
const redirectUrl = "https://www.google.com";

app.get("/pay", async (req, res) => {
  const { amount, name, email } = req.query;
  const transactionId = "TID" + Date.now();

  const payload = {
    merchantId,
    merchantTransactionId: transactionId,
    merchantUserId: name || "Guest",
    amount: parseInt(amount),
    redirectUrl,
    redirectMode: "REDIRECT",
    callbackUrl: redirectUrl,
    paymentInstrument: { type: "PAY_PAGE" }
  };

  const base64Data = Buffer.from(JSON.stringify(payload)).toString("base64");
  const signature = crypto
    .createHash("sha256")
    .update(base64Data + "/pg/v1/pay" + saltKey)
    .digest("hex") + "###1";

  try {
    const resp = await fetch(
      "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": signature,
          "X-MERCHANT-ID": merchantId
        },
        body: JSON.stringify({ request: base64Data })
      }
    );
    const result = await resp.json();
    if (result.success) {
      return res.redirect(result.data.instrumentResponse.redirectInfo.url);
    }
    return res.send("Payment failed: " + result.code);
  } catch (e) {
    console.error(e);
    return res.status(500).send("Internal error");
  }
});

app.listen(port, () => console.log(`Server running on port ${port}`));

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const admin = require("firebase-admin");
const cron = require("node-cron");

const app = express();

app.use(cors());
app.use(bodyParser.json());

const serviceAccount = require("./firebase-adminsdk.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

let userTokens = [];

app.post("/save-token", (req, res) => {
  const { token } = req.body;

  if (!userTokens.includes(token)) {
    userTokens.push(token);
  }

  console.log("Saved token:", token);

  res.json({
    success: true
  });
});

/*
//Add this temporary API in backend: Notification should instantly appear. while open "http://localhost:3000/test-notification"
app.get("/test-notification", async (req, res) => {
  for (const token of userTokens) {
    await sendPushNotification(token);
  }

  res.send("Notification sent");
});
*/

async function sendPushNotification(token) {
  const message = {
    notification: {
      title: "Campus Shoes",
      body: "Come back and explore our latest catalogue!"
    },
    token: token
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("Notification sent:", response);
  } catch (error) {
    console.error(error);
  }
}

/*
Runs every 30 minutes
*/
cron.schedule("*/10 * * * *", async () => {
  console.log("Sending reminders...");

  for (const token of userTokens) {
    await sendPushNotification(token);
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
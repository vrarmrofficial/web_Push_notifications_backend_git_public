require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const admin = require("firebase-admin");
const cron = require("node-cron");

const app = express();

app.use(cors());
app.use(bodyParser.json());

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
  })
});

let userTokens = [];

app.post("/save-token", (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: "Token is required"
    });
  }

  if (!userTokens.includes(token)) {
    userTokens.push(token);
  }

  console.log("Saved token:", token);

  res.json({
    success: true
  });
});

app.get("/test-notification", async (req, res) => {
  try {
    for (const token of userTokens) {
      await sendPushNotification(token);
    }

    res.send("Test Notification sent");
  } catch (error) {
    console.error(error);

    res.status(500).send("Failed to send notifications");
  }
});

async function sendPushNotification(token) {
  /*const message = {
    notification: {
      title: "Campus Shoes",
      body: "Come back and explore our latest catalogue!"
    },
    token
  };*/
  const message = {
    data: {
      title: "Campus Shoes",
      body: "Come back and explore our latest catalogue!",
      url: "https://web-push-notify-test.netlify.app/"
    },
    token
  };

  try {
    const response = await admin.messaging().send(message);

    console.log("Notification sent:", response);
  } catch (error) {
    console.error("Firebase Error:", error);
  }
}

/*
Runs every 2 minutes
*/
cron.schedule("*/2 * * * *", async () => {
  console.log("Sending reminders...");

  for (const token of userTokens) {
    await sendPushNotification(token);
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
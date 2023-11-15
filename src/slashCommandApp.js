require('dotenv').config();
const { App } = require('@slack/bolt');
const messageHandler = require('./messageHandler');
const express = require('express');
const axios = require('axios');
const { MongoClient, ServerApiVersion } = require('mongodb');

// MongoDB connection setup
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
let db;

async function connectToMongoDB() {
  await client.connect();
  db = client.db(process.env.DB_NAME);
  console.log("Connected to MongoDB!");
}
connectToMongoDB();

// Initialize Slack Bolt App
const slackApp = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

// Initialize Express Server
const expressApp = express();
expressApp.use(express.json());
expressApp.use(express.urlencoded({ extended: true }));

// Integrate Slack Bolt app with Express
expressApp.use('/slack/events', slackApp.receiver.router);

// Express route for Slack slash commands
expressApp.post('/slack/commands', async (req, res) => {
  const { command, user_id, team_id } = req.body;

  if (command === '/mooterspeak') {
    res.status(200).json({
      response_type: 'ephemeral',
      text: 'Do you want to turn MooterSpeak on or off?',
      attachments: [
        {
          text: 'Choose an option',
          fallback: 'You are unable to choose an option',
          callback_id: 'mooterspeak_preference',
          color: '#3AA3E3',
          attachment_type: 'default',
          actions: [
            {
              name: 'on',
              text: 'On',
              type: 'button',
              value: 'on',
            },
            {
              name: 'off',
              text: 'Off',
              type: 'button',
              value: 'off',
            }
          ]
        }
      ]
    });
  }
});

// Function to handle user preferences
async function handleUserPreference(userId, workspaceId, optIn) {
  const collection = db.collection('userPreferences');
  await collection.updateOne(
    { userId, workspaceId },
    { $set: { optIn } },
    { upsert: true }
  );
}

// Express routes for opt-in and opt-out
expressApp.post('/opt-in', async (req, res) => {
  const { userId, workspaceId } = req.body;
  await handleUserPreference(userId, workspaceId, true);
  res.status(200).json({ message: 'Opt-in successful' });
});

expressApp.post('/opt-out', async (req, res) => {
  const { userId, workspaceId } = req.body;
  await handleUserPreference(userId, workspaceId, false);
  res.status(200).json({ message: 'Opt-out successful' });
});

// Slack actions handling
slackApp.action('mooterspeak_preference', async ({ body, ack, client }) => {
  await ack();
  const optIn = body.actions[0].value === 'on';

  await axios.post(`${process.env.SERVER_URL}/${optIn ? 'opt-in' : 'opt-out'}`, {
    userId: body.user.id,
    workspaceId: body.team.id
  });
});

// Slack message handling
slackApp.message(async ({ message, say, client }) => {
  const collection = db.collection('userPreferences');
  const userPref = await collection.findOne({
    userId: message.user,
    workspaceId: message.team
  });

  if (userPref && userPref.optIn) {
    await messageHandler({ message, say, client });
  }
});

// Start the Express server
const PORT = process.env.PORT || 10000;
expressApp.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Start the Slack Bolt app
(async () => {
  await slackApp.start(PORT);
  console.log('Bolt app is running!');
})();
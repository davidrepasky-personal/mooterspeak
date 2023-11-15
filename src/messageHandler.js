// This is the file that runs our message translator.

const { translateText } = require('./translate');
const { isEnglish } = require('./utils');
const { App } = require('@slack/bolt');
//const { getApprovedUsers } = require('./app');

let userLanguages = {};

module.exports = async ({ message, say, client, approvedUsers }) => {
  
  // Guard clause for messages without text (e.g., images or files)
  if (!message.text) {
    return;
  }

  const userId = message.user;

  async function isApprovedUser(userId) {
    // Check if the user is in the approved users set.
    return approvedUsers.has(userId);
    }
  
  if (!await isApprovedUser(userId)) {
    return;
  }

  // Function to update message after a delay
  let messageUpdateTimeout;

  const updateMessageLater = (originalTs, channelId) => {
    messageUpdateTimeout = setTimeout(async () => {
      try {
        await client.chat.update({
          token: process.env.SLACK_BOT_TOKEN,
          ts: originalTs,
          channel: channelId,
          text: ":zap: Almost there! Just a little bit longer!",
        });
      } catch (error) {
        console.error('Failed to update the message:', error);
      }
    }, 4000);
  };

  let tempMessageTs = null;

  try {
    const userProfile = await client.users.profile.get({ user: userId });
    const userName = userProfile.profile.real_name; // Or `display_name`

    if (isEnglish(message.text)) {
      if (userLanguages[userId]) {
        const tempMessage = await say(":globe_with_meridians: Hang tight! We're translating the message...");
        tempMessageTs = tempMessage.ts;
        updateMessageLater(tempMessageTs, message.channel);
        
        //const translation = await translateText(`Translate the following English text to ${userLanguages[userId].language}: ${message.text}`);
        const translation = await translateText(`Translate the following English text to the language in the original message: ${userLanguages[userId].originalMessage}. Do not include the original message in your response, simply translate this text: "${message.text}"`);

        clearTimeout(messageUpdateTimeout);
        
        await client.chat.update({
          token: process.env.SLACK_BOT_TOKEN,
          ts: tempMessageTs,
          channel: message.channel,
          text: `*${userName} says:* ${translation}`,
        });
      } else {
        await say(message.text);
      }
    } else {
      const tempMessage = await say(":uk: Hang tight! We're translating the message...");
      tempMessageTs = tempMessage.ts;
      updateMessageLater(tempMessageTs, message.channel);
      
      const originalSnippet = message.text.slice(0, 30);
      userLanguages[userId] = { originalMessage: originalSnippet };
      
      const translation = await translateText(`Translate the following text to English: ${message.text}`);
      clearTimeout(messageUpdateTimeout);
      
      await client.chat.update({
        token: process.env.SLACK_BOT_TOKEN,
        ts: tempMessageTs,
        channel: message.channel,
        text: `*${userName} says:* ${translation}`,
      });
    }
  } catch (error) {
    console.error('Error:', error);
    clearTimeout(messageUpdateTimeout);
    await client.chat.update({
      token: process.env.SLACK_BOT_TOKEN,
      ts: tempMessageTs,
      channel: message.channel,
      text: `Sorry, we couldn't translate the message.`,
    });
  }
};
const { WebClient } = require('@slack/web-api');

// Initialize a Slack client with your bot token.
const web = new WebClient(process.env.SLACK_BOT_TOKEN);

/**
 * Makes the bot leave a channel.
 *
 * @param {string} channelId The ID of the channel you want the bot to leave.
 */
const leaveChannel = async (channelId) => {
  try {
    // Call the conversations.leave method using the WebClient
    const result = await web.conversations.leave({ channel: channelId });

    // The result will be true if the call was successful
    console.log('Leave channel result:', result);
  } catch (error) {
    // Log the error if the API call failed
    console.error('Error in leaveChannel function:', error);
  }
};

module.exports = { leaveChannel };

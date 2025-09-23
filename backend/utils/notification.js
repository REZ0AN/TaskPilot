import axios from 'axios';
import {DISCORD_WEBHOOK as DISCORD_WEBHOOK_URL} from '../configs/systemVariables.js';



const sendDiscordNotification = async (message) => {
  if (!DISCORD_WEBHOOK_URL) {
    console.warn('Discord webhook URL is not set. Skipping notification.');
    return false;
  }
  try {
    await axios.post(DISCORD_WEBHOOK_URL, { content: message });
    console.log('Notification sent to Discord');
    return true;
  } catch (error) {
    console.error('Failed to send notification to Discord:', error);
    return false;
  }
};

export { sendDiscordNotification };
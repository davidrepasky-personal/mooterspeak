// Powers all the translation that happens on the site.

const axios = require('axios');
const apiKey = process.env.OPENAI_API_KEY;

const translateText = (prompt) => {
  return new Promise((resolve, reject) => {
    axios({
      method: 'post',
      url: 'https://api.openai.com/v1/chat/completions',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        model: "gpt-3.5-turbo",
        messages: [{
          role: "system",
          content: "You are a multilingual translation bot. Translate messages between English and other languages. Only include the translated message. Do not include any other text in your response, including the text of previous messages."
        },{
          role: "user",
          content: prompt
        }],
        max_tokens: 2040,
        temperature: 0.7
      }
    })
    .then(response => {
      resolve(response.data.choices[0].message.content.trim());
    })
    .catch(error => {
      console.error('Error:', error);
      reject(new Error(`Sorry, we couldn't translate the message.`));
    });
  });
}

module.exports = { translateText };
// Utility functions that help the app run better.


const isEnglish = (text) => {
  const englishKeywords = ['hello', 'the', 'this', 'test', 'are', 'am', 'you', 'hey', 'what', 'where', 'who', 'why', 'how', 'going', 'were', 'have', 'has', 'it', 'if', 'can', "you're", 'your', 'all', 'well', "we'll", "we're", "I'm", "I've", "Let's", "go", "great", "do", "does", "in", "I'll", "what's", "I'd", "like", "about", "only"];
  const words = text.toLowerCase().split(/\s+/);
  return words.some(word => englishKeywords.includes(word));
}

module.exports = { isEnglish };


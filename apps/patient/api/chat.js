import { generateAyuLekhaSolution } from '../../../chatboat/triageEngine.js';
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, language = 'en' } = req.body;
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required.' });
    }

    // 1. Generate Direct Solution from AyuLekha Engine (reusing friend's logic)
    const result = generateAyuLekhaSolution(message);

    // 2. Perform TinyFish Web Search for evidence-based real-time insights
    let webInsights = null;
    const apiKey = process.env.TINYFISH_API_KEY;
    const isTinyFishActive = !!(apiKey && apiKey.trim().length > 5);

    if (isTinyFishActive) {
      try {
        // Request building logic reused from friend's tinyfishService.js
        // We append the language hint to the prompt as requested by the user
        const langHint = language !== 'en' ? ` (Please return results in language code: ${language})` : '';
        const formattedQuery = `medical clinical health advice for ${message}${langHint}`;
        
        const response = await axios.post(
          `https://agent.tinyfish.ai/api/v1/search`,
          {
            query: formattedQuery,
            num_results: 3
          },
          {
            headers: {
              'X-API-Key': apiKey,
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 6000
          }
        );

        if (response.data && (response.data.results || response.data.data)) {
          webInsights = {
            success: true,
            source: 'TinyFish Web Agent (REST)',
            results: response.data.results || response.data.data
          };
        }
      } catch (error) {
        console.warn('TinyFish API error:', error.message);
      }
    }

    // Return the unified response
    return res.status(200).json({
      success: true,
      isEmergency: result.isEmergency,
      categoryName: result.categoryName,
      reply: result.reply,
      otcGuidance: result.otcGuidance,
      specialist: result.specialist,
      webInsights: webInsights,
      tinyFishActive: isTinyFishActive
    });
  } catch (error) {
    console.error('Chat endpoint error:', error);
    return res.status(500).json({ error: 'Internal health assistant error. Please try again.' });
  }
}

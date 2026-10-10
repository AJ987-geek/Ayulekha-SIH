export const sendChatMessage = async (message, language = 'en', signal) => {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message, language }),
      signal
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Chat request aborted');
      throw error;
    }
    console.error('Chat API Error:', error);
    throw new Error('Our assistant is currently unavailable. Please try again or check your connection.');
  }
};

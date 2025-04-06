require('dotenv').config();
const axios = require('axios');
const ChatbotHistory = require('../models/chatbotModel');
const ChatMessage = require('../models/ChatMessage');

// Get API key from environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Direct API key for testing
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

console.log("Chatbot controller loaded with API key:", GEMINI_API_KEY ? "Yes" : "No");
console.log("Gemini API URL:", GEMINI_URL);

exports.getChatbotResponse = async (req, res) => {
    try {
        // Check if API key is configured
        if (!GEMINI_API_KEY) {
            console.error("Gemini API key is not configured");
            return res.status(500).json({ 
                error: "Chatbot service is not properly configured",
                message: "Please contact the administrator"
            });
        }

        const { message, userId, roomId } = req.body;
        
        console.log("Chatbot request received:", { 
            messageLength: message ? message.length : 0,
            userId,
            roomId
        });

        if (!message) {
            return res.status(400).json({ 
                error: "Message is required",
                message: "Please enter a message"
            });
        }

        // Create a room ID if not provided
        const chatRoomId = roomId || (userId ? `user_${userId}` : `guest_${Date.now()}`);

        // If Gemini API is not working, use a fallback response
        let reply;
        try {
            reply = await getGeminiResponse(message);
        } catch (error) {
            console.error("Gemini API Error:", error);
            // Use a fallback response
            reply = getFallbackResponse(message);
        }

        try {
            // Try to save user message to ChatMessage model
            if (typeof ChatMessage === 'function') {
                const userMessage = new ChatMessage({
                    userId: userId || null,
                    room: chatRoomId,
                    text: message,
                    sender: 'user'
                });
                await userMessage.save();

                // Save bot response to ChatMessage model
                const botResponse = new ChatMessage({
                    userId: userId || null,
                    room: chatRoomId,
                    text: reply,
                    sender: 'system'
                });
                await botResponse.save();
            }
        } catch (error) {
            console.error("Error saving chat messages:", error);
            // Continue even if saving to database fails
        }

        try {
            // Also save to old ChatbotHistory model for backward compatibility
            const chatEntry = new ChatbotHistory({ userMessage: message, botResponse: reply });
            await chatEntry.save();
        } catch (error) {
            console.error("Error saving to ChatbotHistory:", error);
            // Continue even if saving to database fails
        }

        res.json({ 
            success: true,
            reply,
            roomId: chatRoomId,
            messageId: Date.now().toString()
        });
    } catch (error) {
        console.error("Chatbot Error:", error);
        return res.status(500).json({ 
            error: "Internal server error",
            message: "An unexpected error occurred. Please try again later."
        });
    }
};

// Function to get response from Gemini API
async function getGeminiResponse(message) {
    const prompt = `You are an India-specific voter assistance chatbot. Your role is to help users with information about Indian elections and voting procedures. 
    Please provide accurate, helpful, and concise information in a clear, structured format.

    When explaining eligibility criteria or requirements, use bullet points or numbered lists.
    When providing step-by-step instructions, use numbered lists.
    When comparing options or listing features, use bullet points.
    
    Always format your responses with:
    - Clear headings using markdown (## for main headings, ### for subheadings)
    - Proper spacing between sections
    - Bullet points (•) for lists
    - Bold text (**text**) for important terms or requirements
    - Numbered lists (1., 2., etc.) for steps
    
    Focus on providing information about:
    - Voter registration process
    - Voter ID card
    - Election procedures
    - Polling booth locations
    - Voting rights and responsibilities
    - Election dates and schedules
    
    If the query is not related to Indian voting or elections, politely inform that you can only answer questions about Indian voter and voting processes.
    
    User's question: "${message}"`;

    const response = await axios.post(
        GEMINI_URL,
        {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.3,
                topP: 0.8,
                topK: 40,
                maxOutputTokens: 500
            }
        },
        {
            headers: {
                "Content-Type": "application/json"
            },
            timeout: 15000 // Increase timeout to 15 seconds
        }
    );

    console.log("Gemini API Response Status:", response.status);
    console.log("Gemini API Response Structure:", JSON.stringify(Object.keys(response.data || {})));

    if (!response.data || !response.data.candidates || response.data.candidates.length === 0) {
        console.error("Gemini API Error - Empty response:", JSON.stringify(response.data || {}));
        throw new Error("Failed to generate response from AI");
    }

    // Check for content in the response
    if (!response.data.candidates[0].content || !response.data.candidates[0].content.parts || response.data.candidates[0].content.parts.length === 0) {
        console.error("Gemini API Error - Missing content:", JSON.stringify(response.data || {}));
        throw new Error("AI returned an invalid response structure");
    }

    const reply = response.data.candidates[0].content.parts[0].text;
    console.log("Gemini API Reply Length:", reply ? reply.length : 0);

    if(!reply){
        console.error("Gemini API Error - Empty text in response");
        throw new Error("AI returned an empty response");
    }
    
    return reply;
}

// Function to provide a fallback response if Gemini API fails
function getFallbackResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    // Basic pattern matching for common voter questions
    if (lowerMessage.includes('register') || lowerMessage.includes('registration')) {
        return `## Voter Registration Process

**To register as a voter in India, follow these steps:**

1. Visit the National Voter Service Portal (NVSP) at https://www.nvsp.in/
2. Fill out Form 6 for new voter registration
3. Upload required documents (proof of age, identity, and residence)
4. Submit the application
5. Track your application status using the reference number

**Required documents:**
• Proof of age (Birth certificate, 10th certificate, etc.)
• Proof of identity (Aadhaar, PAN, Driving License, etc.)
• Proof of residence (Utility bills, Aadhaar, etc.)
• Passport size photograph

For assistance, you can also visit your nearest Electoral Registration Office.`;
    } else if (lowerMessage.includes('id card') || lowerMessage.includes('voter id')) {
        return `## Voter ID Card Information

**Your Voter ID (EPIC - Elector's Photo Identity Card) is an important document that:**
• Serves as identity proof for voting
• Contains your unique EPIC number
• Includes your photo and basic details

**If you've lost your Voter ID card:**
1. Visit https://www.nvsp.in/
2. Select "Search in Electoral Roll" or "Download EPIC"
3. Enter your details to download a digital copy
4. Apply for a duplicate card if needed

**To update details on your Voter ID:**
1. Fill Form 8 on the NVSP portal
2. Submit required supporting documents
3. Track your application status online`;
    } else if (lowerMessage.includes('booth') || lowerMessage.includes('polling')) {
        return `## Polling Booth Information

**To find your polling booth:**
1. Visit https://electoralsearch.eci.gov.in/
2. Enter your EPIC number or personal details
3. View your polling booth details

**On voting day:**
• Polling booths typically open from 7 AM to 6 PM
• Bring your Voter ID card or approved alternative ID
• No electronic devices are allowed inside the voting compartment
• Follow the instructions of polling officials

**Facilities available at polling booths:**
• Wheelchair accessibility
• Drinking water
• Toilets
• Volunteer assistance`;
    } else {
        return `## Indian Voting Information

I'm your voting assistance chatbot. I can help with information about:

• Voter registration process
• Voter ID card details
• Election procedures
• Polling booth locations
• Voting rights and responsibilities

Please ask a specific question about Indian elections or voting procedures, and I'll be happy to assist you.`;
    }
}

// Get chat history for a specific room
exports.getChatHistory = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { limit = 50 } = req.query;
        
        if (!roomId) {
            return res.status(400).json({ error: "Room ID is required" });
        }
        
        const messages = await ChatMessage.find({ room: roomId })
            .sort({ createdAt: 1 })
            .limit(parseInt(limit));
            
        res.json(messages);
    } catch (error) {
        console.error("Error fetching chat history:", error);
        res.status(500).json({ error: "Failed to fetch chat history" });
    }
};
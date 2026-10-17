import {GeminiGenAi} from "@google/genai"
import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js";


const ai = new GeminiGenAi({apiKey: process.env.GEMINI_API_KEY})
/**
 * Sends a prompt to Gemini and returns parsed JSON array/object response
 * @param {string} prompt 
 * @returns {Promise<any>}
 */

export const generateGeminiJsonResponse = async (prompt) => {
   try{
     const response = await ai.models.generateContent({
        model: "gemini-1.5",
        content: prompt
    })

    const aiResponseText = response?.text() || "Recieved empty response from jarves"
    const cleanedJson = aiResponseText.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanedJson);
   } catch (error){
        console.error("Error generating Gemini response:", error);
        throw new ApiError(500,error.message || "Failed to generate response from Gemini AI");
   }
    
}
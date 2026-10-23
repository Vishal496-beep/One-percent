import { GoogleGenerativeAI } from "@google/generative-ai";
import { ApiError } from "../../utils/ApiError.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
/**
 * Sends a prompt to Gemini and returns parsed JSON array/object response
 * @param {string} prompt 
 * @returns {Promise<any>}
 */

export const generateGeminiJsonResponse = async (prompt) => {
   try{
     const response = await model.generateContent({
        model: "gemini-1.5-flash",
        content: prompt,
        generationConfig: { responseMimeType: "application/json" } // Guarantees valid JSON output
    })

    const aiResponseText = response?.text() || "Recieved empty response from jarves"
    const cleanedJson = aiResponseText.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanedJson);
   } catch (error){
        console.error("Error generating Gemini response:", error);
        throw new ApiError(500,error.message || "Failed to generate response from Gemini AI");
   }
    
}
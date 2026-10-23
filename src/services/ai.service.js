import { GoogleGenerativeAI } from "@google/generative-ai";
import { ApiError } from "../../utils/ApiError.js";

let model;
let getModel = async () => {
   if(!model) {
      const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      model = genAi.getGenerativeModel({
         model: "gemini-2.5-flash",
         temperature: 0.7,
         topP: 0.8,
         generationConfig: {
            maxOutputTokens: 8271,
            responseMimeType: "application/json"
         }
      })
   }
   return model
}

export const generateGeminiJsonResponse = async (prompt) => {
  try{
 const result = await getModel().generateContent(prompt)
   const text = result.response.text()
   if(!text || text.trim() === "") throw new ApiError(500, "Empty response from Gemini API. Please try again later.") 
   
   const cleaned = text.replace(/```json|```/g, "").trim();
   return JSON.parse(cleaned);
  } catch (error){
      console.error("Error generating Gemini JSON response:", error);
      throw new ApiError(500, "Failed to generate test questions. Please try again later.");
  }
}
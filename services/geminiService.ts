
import { GoogleGenAI, Type } from "@google/genai";
import { CivicAudit } from "../types";
import { CIVIC_DIRECTORY } from "../constants";

const SYSTEM_PROMPT = `You are a Senior Civil Engineer and AI Solutions Architect specializing in Indian civic infrastructure. Analyze the provided image of a potential civic issue.

STRICT INSTRUCTIONS:
1. DETECT THE ISSUE: Identify the specific type (Pothole, Garbage, Water Leak, or Electric Hazard).

2. ROUTE THE AUTHORITY & EMAIL:
   Use the following REAL-WORLD JURISDICTION DATABASE for selecting the targetAuthority and authorityEmail:
   ${JSON.stringify(CIVIC_DIRECTORY, null, 2)}

   MAPPING RULES:
   - If Road/Pothole or Garbage -> Use "GHMC (Roads & Garbage)". 
     - Check the "zones" for a match with the user's location. 
     - If the location is "Anurag University Gate", use "commissioner.ghatkesar@gmail.com".
     - Otherwise, use the "default" email.
   - If Water Leak/Drain -> Use "HMWSSB (Water & Sewage)". Use the "default" email.
   - If Wire/Pole/Electricity -> Use "TSSPDCL (Electricity)".
     - Check "zones" for a location match. If "Anurag University Gate", use "ae_ghatkesar@tssouthernpower.com".
     - Otherwise, use the "default" email.
   - If Traffic related -> Use "Traffic Police".

3. AUDIT: Identify issue dimensions, severity (1-10), materials needed, and fair market repair cost in INR (2024-25 standards).

4. WRITE THE LETTER:
   - Generate a formal, professional complaint letter.
   - Subject: "URGENT: Safety Hazard Report - [Issue Name] at [Location]"
   - Body: Must include technical findings (Dimensions, Severity Score, Estimated Cost) and a formal request for intervention.

Return the response strictly as JSON. Ensure the 'costINR' is a number.`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    isCivicIssue: { type: Type.BOOLEAN },
    error: { type: Type.STRING, description: "Description if not a civic issue." },
    issueName: { type: Type.STRING },
    targetAuthority: { type: Type.STRING, description: "The specific office/person this issue is routed to." },
    authorityEmail: { type: Type.STRING, description: "The official email address from the database." },
    dimensions: { type: Type.STRING },
    severity: { type: Type.NUMBER },
    materialNeeded: { type: Type.STRING },
    costINR: { type: Type.NUMBER },
    timeToFix: { type: Type.STRING },
    formalEmail: { type: Type.STRING, description: "The complete formal complaint letter." },
    viralTweet: { type: Type.STRING }
  },
  required: ["isCivicIssue"]
};

export async function analyzeCivicIssue(imageBase64: string, location: string): Promise<{audit: CivicAudit, sources?: any[]}> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
          { text: `${SYSTEM_PROMPT}\n\nLocation context: ${location}` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("No response from AI");
    
    const parsed: CivicAudit = JSON.parse(resultText);
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    return { audit: parsed, sources };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

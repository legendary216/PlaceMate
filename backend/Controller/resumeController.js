import multer from 'multer';
// Use the .mjs build for better ES Module compatibility
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { extractRawText } from 'mammoth';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// --- Multer Configuration (Store file in memory) ---
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        // Accept PDF and DOCX
        if (file.mimetype === 'application/pdf' || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF and DOCX allowed.'), false);
        }
    }
}).single('resumeFile'); // Expecting a single file named 'resumeFile'

// --- Google Generative AI Configuration ---
// Ensure GEMINI_API_KEY is in your .env file
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("\n\n*** ERROR: GEMINI_API_KEY is not defined in the .env file! ***\n\n");
  // Optional: throw new Error("Missing Gemini API Key");
}
const genAI = new GoogleGenerativeAI(apiKey || "MISSING_API_KEY"); // Use key or placeholder

const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, },
      ],
});

// controllers/resumeController.js
// ... (imports remain the same) ...

// --- UPDATED Helper to Extract Text ---
const extractText = async (fileBuffer, mimetype) => {
    if (mimetype === 'application/pdf') {
        console.log("Attempting PDF text extraction with pdfjs-dist...");
        try {
            // --- CONVERT BUFFER TO Uint8Array ---
            const uint8Array = new Uint8Array(fileBuffer);
            // --- END CONVERSION ---

            // Load the PDF document using the Uint8Array
            const loadingTask = pdfjsLib.getDocument({ data: uint8Array }); // Pass the Uint8Array here
            const pdfDocument = await loadingTask.promise;
            console.log(`PDF loaded with ${pdfDocument.numPages} pages.`);

            let fullText = '';
            for (let i = 1; i <= pdfDocument.numPages; i++) {
                const page = await pdfDocument.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + '\n';
            }
            console.log("pdfjs-dist extraction successful.");
            console.log("Extracted text :",fullText);
            return fullText;
        } catch (pdfError) {
            console.error("Error extracting text with pdfjs-dist:", pdfError);
            throw new Error('Failed to parse PDF content.');
        }
    } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const { value } = await extractRawText({ buffer: fileBuffer });
        return value;
    }
    throw new Error('Unsupported file type for text extraction');
};

// --- Controller Function (analyzeResume) --- (remains the same)
// ...
// --- Controller Function ---
// @desc    Analyze an uploaded resume
// @route   POST /api/resume/analyze
// @access  Private (User or Admin)
export const analyzeResume = (req, res) => {
    upload(req, res, async (err) => {
        // Handle Multer errors (file size, type)
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: `File upload error: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ message: err.message || 'Invalid file type.' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No resume file uploaded.' });
        }

        try {
            // 1. Extract Text
            console.log(`Extracting text from ${req.file.originalname} (${req.file.mimetype})...`);
            const resumeText = await extractText(req.file.buffer, req.file.mimetype);
            console.log(`Text extracted (${resumeText.length} characters).`);

            if (!resumeText || resumeText.trim().length < 50) { // Basic check
                 return res.status(400).json({ message: 'Could not extract sufficient text from the resume.' });
            }

            // 2. Prepare Prompt for Gemini
            const prompt = `
                Analyze the following resume text extracted from a document. Evaluate it based on clarity, conciseness, use of action verbs, quantifiable achievements, skills relevance (general professional context), formatting/readability (inferred from structure), and overall impact/professionalism.

                Provide the analysis in JSON format with the following structure:
                {
                  "score": <integer between 0 and 100>,
                  "overallFeedback": "<string: A brief 1-2 sentence summary of the resume's effectiveness>",
                  "positiveAspects": [
                    "<string: Positive point 1>",
                    "<string: Positive point 2>",
                    ...
                  ],
                  "areasForImprovement": [
                    "<string: Suggestion 1>",
                    "<string: Suggestion 2>",
                    ...
                  ]
                }

                Assign the score based on how well the resume meets the criteria for a general job application. Be constructive in the feedback. Ensure the output is valid JSON.

                Resume Text:
                ---
                ${resumeText.substring(0, 15000)}
                ---
                `;

            // 3. Call Gemini API
            console.log('Sending request to Gemini API...');
             const generationConfig = {
               temperature: 0.3,
               topP: 0.95,
               topK: 64,
               maxOutputTokens: 8192,
               responseMimeType: "application/json", // Request JSON output
             };
            const chatSession = model.startChat({ generationConfig, safetySettings: model.safetySettings });
            const result = await chatSession.sendMessage(prompt);

            // 4. Process Response
            console.log('Received response from Gemini.');
             const responseJson = result.response.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!responseJson) {
                console.error("Gemini response was empty or malformed.", result.response);
                if (result.response.promptFeedback?.blockReason) {
                   console.error("Gemini prompt blocked:", result.response.promptFeedback.blockReason);
                   return res.status(400).json({ message: `Analysis failed due to content safety restrictions: ${result.response.promptFeedback.blockReason}`});
                }
                throw new Error('Gemini returned an empty or unexpected response.');
            }

            try {
                // Parse the JSON string from Gemini
                const analysisResult = JSON.parse(responseJson);

                 // Basic validation of the parsed structure
                if (typeof analysisResult.score !== 'number' || !analysisResult.overallFeedback || !Array.isArray(analysisResult.positiveAspects) || !Array.isArray(analysisResult.areasForImprovement)) {
                    console.error("Gemini response JSON structure mismatch:", analysisResult); // Log unexpected structure
                    throw new Error('Gemini response did not match the expected JSON structure.');
                }

                console.log('Analysis successful.');
                res.status(200).json(analysisResult);

            } catch (parseError) {
                console.error("Error parsing Gemini JSON response:", parseError);
                console.error("Raw Gemini response text:", responseJson);
                throw new Error('Failed to parse analysis result from AI.');
            }

        } catch (error) {
            console.error('Error during resume analysis:', error);
            res.status(500).json({ message: error.message || 'Server error during analysis.' });
        }
    });
};
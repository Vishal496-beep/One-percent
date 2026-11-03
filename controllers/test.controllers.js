import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Test } from "../models/test.model.js";
import { Resume } from "../models/resume.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { generateGeminiJsonResponse } from "../src/services/ai.service.js";

const QUESTION_COUNT = 20;

const generateTest = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { resumeId } = req.params;

  if (!userId) throw new ApiError(401, "Unauthorized");

  const resume = await Resume.findOne({ _id: resumeId, owner: userId });
  if (!resume) throw new ApiError(404, "Resume not found");

  const previousTestCounts = await Test.countDocuments({
    resume: resumeId,
    owner: userId,
  });
  if (previousTestCounts >= 3) {
    throw new ApiError(
      400,
      "You have exceeded the test generation limit. Please buy a premium plan to generate more tests."
    );
  }

  // handles both string and array skills
  const skillsText = Array.isArray(resume.skills)
    ? resume.skills.join(", ")
    : resume.skills || "";
  if (skillsText.trim() === "") {
    throw new ApiError(
      400,
      "Resume skills are missing. Please update your resume first."
    );
  }

  const prompt = `You are an expert technical interviewer. Generate a rigorous test of exactly ${QUESTION_COUNT} multiple-choice questions based on this candidate's resume.
Focus on their declared skills, projects, and tech stack. Mix core-subject questions with project-based questions.

Resume Data:
- Summary: ${resume.summary}
- Skills: ${skillsText}
- Projects: ${JSON.stringify(resume.projects)}

Return ONLY a valid JSON array. Each element must have exactly these fields:
- "question": string
- "options": array of exactly 4 strings
- "correctAnswerIndex": integer from 0 to 3
- "type": either "Project-Based" or "core-Subject"

Example element:
{"question": "What does useEffect do?", "options": ["A", "B", "C", "D"], "correctAnswerIndex": 1, "type": "core-Subject"}`;

  const questionList = await generateGeminiJsonResponse(prompt);

  if (!Array.isArray(questionList)) {
    throw new ApiError(
      500,
      "Failed to generate test questions. Please try again later."
    );
  }

  const validQuestions = questionList.filter(
    (q) =>
      typeof q.question === "string" &&
      q.question.trim() &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      Number.isInteger(q.correctAnswerIndex) &&
      q.correctAnswerIndex >= 0 &&
      q.correctAnswerIndex < 4 &&
      ["core-Subject", "Project-Based"].includes(q.type)
  );

  if (validQuestions.length < 10) {
    throw new ApiError(500, "Generated test was incomplete. Please try again.");
  }

  const newTest = await Test.create({
    owner: userId,
    resume: resumeId,
    subject: skillsText.split(",")[0].trim() || "General",
    questions: validQuestions,
  });

  const safeTest = newTest.toObject();
  safeTest.questions = safeTest.questions.map(
    ({ correctAnswerIndex, ...q }) => q
  );

  return res
    .status(201)
    .json(new ApiResponse(200, safeTest, "Test generated successfully"));
});

const submitTest = asyncHandler(async (req, res) => {
  //1. get userId, testId (params), answers (body)
  // 2. validate: user exists, answers is an array
  // 3. find the test (must belong to this user)
  // 4. if not found, throw 404
  // 5. if already submitted, throw error
  // 6. if answers count != questions count, throw error
  // 7. loop through questions, count correct answers
  // 8. calculate score as a percentage
  // 9. set isPassed, isSubmitted
  // 10. save the test
  // 11. send response

  const userId = req.user?._id;
  const { testId } = req.params;
  const { answers } = req.body;

  if (!userId) throw new ApiError(401, "Unauthorized user");
  if (!Array.isArray(answers))
    throw new ApiError(400, "Answers must be an array");
  if (answers.length === 0)
    throw new ApiError(400, "Answers array cannot be empty");
  const test = await Test.findOne({ _id: testId, owner: userId });
  if (!test)
    throw new ApiError(400, "Test not found or does not belong to the user");
  if (test.isSubmitted)
    throw new ApiError(400, "Test has already been submitted");
  if (answers.length !== test.questions.length)
    throw new ApiError(
      400,
      "Number of answers does not match number of questions"
    );

  let count = 0;
  let wrongAnswers = [];

  test.questions.forEach((q, i) => {
    q.selectedAnswerIndex = answers[i];
    if (answers[i] === q.correctAnswerIndex) count++;
    else wrongAnswers.push({ question: q.question, type: q.type });
  });

  test.score = Math.round((count / test.questions.length) * 100);
  test.isPassed = test.score >= test.passingScore;
  test.isSubmitted = true;

  try{
    if (wrongAnswers.length > 0) {
    const analysisPrompt = `You are an expert technical interviewer and educator. Analyze the technical questions that a candidate answered incorrectly during an assessment.
     ### Incorrect Questions & Candidate Context:
      ${JSON.stringify(wrongAnswers)}
    ### Instructions:
   Provide structured, constructive, and actionable feedback to help the candidate improve their weak areas.
   - Identify core concepts where the candidate showed weakness.
   - Offer concrete, step-by-step guidance on how to master those concepts.
   - Provide targeted learning resources with direct URLs where possible (e.g., official docs, well-known YouTube channels/playlists, or reputable tutorial sites).

   ### Output Requirements:
  Return ONLY a valid JSON object matching the exact structure below. Do not include markdown code fence formatting (\`\`\`json), commentary, or extra text.

   {
  "weakAreas": [
    "High-level concept or domain (e.g., JavaScript Event Loop & Asynchronous Control Flow)"
  ],
  "actionableAreas": [
    "Specific step or exercise to practice (e.g., Practice writing custom Promises and tracing microtask queue execution order in Node.js/Browser dev tools)"
  ],
  "recommendedResources": [
    {
      "title": "Clear, descriptive title of the resource (e.g., MDN Web Docs: Event Loop)",
      "type": "Documentation | YouTube | Article | Course | Community",
      "platform": "Platform or site name (e.g., MDN, Fireship, freeCodeCamp, YouTube)",
      "url": "https://direct-or-search-link-to-resource.com"
       }
     ]
   }`;

   test.improvementAreas = await generateGeminiJsonResponse(analysisPrompt);
  }
  } catch (error) {
    console.error("Error generating improvement areas:", error);
    throw new ApiError(500, "Failed to generate improvement areas. Please try again later.");
  }

  test.save();

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      test,
      "Test submitted successfully"
    )
  )


});
export { 
  generateTest, 
  submitTest 
};

const fs = require('fs');
const crypto = require('crypto');
const OpenAI = require('openai');

let openaiClient = null;

function getRequestTimeoutMs(override, fallbackMs = 45000) {
  const timeout = Number(override || fallbackMs);
  return Number.isFinite(timeout) && timeout > 0 ? timeout : fallbackMs;
}

async function withOpenAITimeout(task, label, timeoutOverride, fallbackMs) {
  const timeoutMs = getRequestTimeoutMs(timeoutOverride, fallbackMs);

  return Promise.race([
    task(),
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`OpenAI ${label} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    })
  ]);
}

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  return openaiClient;
}

function getJsonFromCompletion(completion) {
  const content = completion?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI returned an empty response');
  }

  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to parse OpenAI JSON response: ${error.message}`);
  }
}

function buildLectureSettingsInstructions(settings) {
  if (!settings || typeof settings !== 'object') return '';

  const lines = [];

  const styleMap = {
    step_by_step:    'Prefer step-by-step breakdowns in spoken explanations. Lead learners through processes one step at a time.',
    example_first:   'Lead every chunk\'s spoken explanation with a concrete real-world example before introducing theory.',
    analogy_driven:  'Use analogies heavily. Every chunk must have a strong memorable analogy connecting new concepts to familiar ideas.',
    concise:         'Keep spoken explanations concise and direct — maximum 3 sentences per chunk. Prioritize clarity over depth.',
  };
  if (settings.explanationStyle && styleMap[settings.explanationStyle]) {
    lines.push(`EXPLANATION STYLE: ${styleMap[settings.explanationStyle]}`);
  }

  const codeMap = {
    none:    'Do NOT use visual_mode "code" for any chunk. Skip code examples entirely even if the topic involves programming.',
    minimal: 'Use visual_mode "code" only when code is truly essential to understanding the concept — avoid it otherwise.',
    heavy:   'Prioritize visual_mode "code" whenever a chunk could reasonably benefit from a code example. Show more snippets and terminal commands.',
  };
  if (settings.codeDepth && codeMap[settings.codeDepth]) {
    lines.push(`CODE DEPTH: ${codeMap[settings.codeDepth]}`);
  }

  const visualMap = {
    diagrams:    'Prefer visual_mode "diagram" when in doubt. Use diagrams to show concept relationships even for non-technical topics.',
    flowcharts:  'Prefer visual_mode "flowchart" when in doubt. Use flowcharts to visualize processes and decisions.',
    slides:      'Prefer visual_mode "slide" when in doubt. Summarize content in structured bullet-point slides.',
    whiteboards: 'Prefer visual_mode "whiteboard" when in doubt. Use whiteboard notes to highlight key terms and definitions.',
    code:        'Prefer visual_mode "code" whenever possible. Include practical code examples, terminal commands, and runnable snippets even for conceptual chunks.',
    mixed:       'Use a rich variety of visual modes — spread evenly across diagrams, flowcharts, comparisons, slides, and whiteboards.',
  };
  if (settings.visualPreference && visualMap[settings.visualPreference]) {
    lines.push(`VISUAL PREFERENCE: ${visualMap[settings.visualPreference]}`);
  }

  const audienceMap = {
    professional: 'AUDIENCE: Working professionals. Use business/industry language, reference real-world work scenarios, and assume existing domain familiarity.',
    academic:     'AUDIENCE: Academic learners. Use formal language, reference theoretical context, and include academic framing where helpful.',
    kids:         'AUDIENCE: Children ages 10–15. Use very simple language, short sentences, fun analogies, and avoid all jargon.',
  };
  if (settings.audienceType && audienceMap[settings.audienceType]) {
    lines.push(audienceMap[settings.audienceType]);
  }

  return lines.length > 0 ? `\nCOURSE-SPECIFIC INSTRUCTOR PREFERENCES (override defaults where they conflict):\n${lines.map(l => `- ${l}`).join('\n')}` : '';
}

async function generateLecturePackage({
  course,
  topic,
  materials,
  priorTopics,
  nextTopicTitle,
  outlineText,
  compactMode = false,
  minimalMode = false,
  lectureSettings = null
}) {
  const client = getClient();
  const model = process.env.OPENAI_MODEL_LECTURE;

  if (!model) {
    throw new Error('OPENAI_MODEL_LECTURE is not configured');
  }

  const schemaDescription = {
    title: 'string',
    summary: 'string',
    estimatedDurationMinutes: 'integer',
    teachingScript: 'string',
    slideOutline: [
      {
        title: 'string',
        bullets: ['string'],
        notes: 'string'
      }
    ],
    sections: [
      {
        title: 'string',
        summary: 'string',
        learningObjective: 'string',
        explanation: 'string',
        examples: ['string'],
        visualSuggestion: 'string',
        whiteboardSuggestion: 'string',
        slideBullets: ['string'],
        chunks: [
          {
            title: 'string',
            learning_objective: 'string',
            spoken_explanation: 'string',
            whiteboard_explanation: 'string',
            slide_bullets: ['string'],
            key_terms: ['string'],
            examples: ['string'],
            analogy_if_helpful: 'string',
            visual_mode: 'none | slide | whiteboard | diagram | flowchart | comparison_table | code | mixed',
            visual_query: 'string',
            visual_caption: 'string',
            teaching_sequence: ['speak', 'slide', 'diagram', 'whiteboard', 'visual', 'code'],
            difficulty_level: 'introductory | intermediate | advanced',
            estimated_duration_seconds: 'integer',
            checkpoint_question_if_any: 'string',
            code_example: {
              snippet: 'string — the actual code or command, raw, no explanation',
              language: 'python | javascript | bash | sql | json | yaml | html | css | text',
              explanation: 'string — one sentence explaining what the code does'
            },
            diagram: {
              nodes: [{ id: 'string', label: 'string', shape: 'rect | oval | diamond', color: '#hexcolor' }],
              edges: [{ from: 'string', to: 'string', label: 'string' }],
              steps: [{ revealNodeIds: ['string'], revealEdgeFromIds: ['string'], cue: 'string' }]
            }
          }
        ]
      }
    ],
    flashcards: [
      {
        front: 'string',
        back: 'string'
      }
    ],
    quiz: {
      instructions: 'string',
      passingThreshold: 'integer',
      questions: [
        {
          prompt: 'string',
          options: ['string', 'string', 'string', 'string'],
          correctAnswer: 'integer 0-3',
          explanation: 'string'
        }
      ]
    }
  };

  const generationProfile = minimalMode
    ? {
        sectionRange: '2',
        chunkRange: '1',
        chunkDetail: 'compact, teacher-like, and immediately usable in the UI',
        flashcardRange: '3 to 4',
        quizRange: '3 to 4',
        modelSuffix: '-minimal'
      }
    : compactMode
      ? {
          sectionRange: '2 to 3',
          chunkRange: '1 to 2',
          chunkDetail: 'concise but still teacher-like and useful',
          flashcardRange: '4 to 5',
          quizRange: '4',
          modelSuffix: '-compact'
        }
      : {
          sectionRange: '3 to 6',
          chunkRange: '2 to 4',
          chunkDetail: 'rich enough for a tutor to explain conceptually, not just read headings',
          flashcardRange: '4 to 8',
          quizRange: '4 to 6',
          modelSuffix: ''
        };

  const trimmedOutlineText = `${outlineText || ''}`.trim().slice(0, minimalMode ? 1400 : compactMode ? 2200 : 3200);
  const summarizedMaterials = (materials || []).slice(0, minimalMode ? 4 : 6).map((material) => {
    const entry = {
      title: `${material?.title || ''}`.trim().slice(0, 120),
      type: material?.type || null,
      description: `${material?.description || ''}`.trim().slice(0, minimalMode ? 140 : 240)
    };
    const rawText = `${material?.extractedText || ''}`.trim();
    if (rawText && !minimalMode) {
      entry.pdfContent = rawText.slice(0, compactMode ? 1500 : 3000);
    }
    return entry;
  });
  const summarizedPriorTopics = (priorTopics || []).slice(minimalMode ? -3 : -5);
  const compactCourseContext = {
    name: course.name,
    description: `${course.description || ''}`.trim().slice(0, minimalMode ? 220 : 420),
    level: course.level,
    language: course.language,
    duration: course.duration
  };
  const compactTopicContext = {
    title: topic.title,
    outlineText: trimmedOutlineText,
    priorTopics: summarizedPriorTopics,
    nextTopicTitle,
    materials: summarizedMaterials
  };

  const languageInstruction = course.language === 'Urdu'
    ? `\n\nCRITICAL LANGUAGE REQUIREMENT — URDU COURSE:

=== URDU SCRIPT REQUIRED (these fields must be 100% Urdu اردو — zero English, zero Roman Urdu) ===
- title, summary, teachingScript
- slideOutline[].title, slideOutline[].bullets[], slideOutline[].notes
- sections[].title, sections[].summary, sections[].learningObjective, sections[].explanation
- sections[].examples[], sections[].visualSuggestion, sections[].whiteboardSuggestion, sections[].slideBullets[]
- chunks[].title, chunks[].learning_objective, chunks[].spoken_explanation
- chunks[].whiteboard_explanation, chunks[].slide_bullets[], chunks[].key_terms[]
- chunks[].examples[], chunks[].analogy_if_helpful, chunks[].checkpoint_question_if_any
- chunks[].visual_caption, chunks[].code_example.explanation
- chunks[].diagram.steps[].cue
- flashcards[].front, flashcards[].back
- quiz.instructions, quiz.questions[].prompt, quiz.questions[].options[], quiz.questions[].explanation

=== ENGLISH ONLY — DO NOT TRANSLATE THESE (keep exactly as English) ===
- chunks[].code_example.snippet  ← ALWAYS English code/commands
- chunks[].code_example.language  ← always e.g. "python", "javascript"
- chunks[].diagram.nodes[].id  ← ALWAYS English identifier
- chunks[].diagram.nodes[].label  ← ALWAYS English (e.g. "CPU", "Memory", "Process A")
- chunks[].diagram.edges[].label  ← ALWAYS English
- chunks[].visual_query  ← ALWAYS English (used as image search query, e.g. "cpu memory diagram")
- chunks[].visual_mode value  ← always one of: none|slide|whiteboard|diagram|flowchart|comparison_table|code|mixed
- chunks[].teaching_sequence values  ← always: speak|slide|diagram|whiteboard|visual|code
- chunks[].difficulty_level value  ← always: introductory|intermediate|advanced

=== BANNED ENGLISH PHRASES — NEVER write these in Urdu text fields ===
"Next, let's" → آئیے اب | "For example" → مثال کے طور پر | "A simple way to picture it" → اسے سمجھنے کا آسان طریقہ | "Before we move on" → آگے بڑھنے سے پہلے | "Think about this" → اس پر غور کریں | "Let's explore" → آئیے دیکھتے ہیں | "First," → پہلے، | "Finally," → آخر میں، | "In summary" → خلاصہ یہ ہے کہ | "This means" → اس کا مطلب ہے

FAILURE MODE TO AVOID: Do NOT mix languages. "Next, let's make [Urdu title] clear" is wrong. Write the full sentence in Urdu only.`
    : '';

  const settingsInstructions = buildLectureSettingsInstructions(lectureSettings);

  const prompt = `
You are preparing a production-ready stored lecture package for a tutoring system.
Return valid JSON only. Do not wrap in markdown. Follow this schema exactly:
${JSON.stringify(schemaDescription, null, 2)}
${languageInstruction}${settingsInstructions}
Constraints:
- Produce a complete lecture package for one topic.
- Make explanations clear, accurate, teacher-like, and directly tied to the topic.
- Generate ${generationProfile.sectionRange} sections.
- Generate ${generationProfile.chunkRange} chunks per section for incremental delivery.
- Each chunk should be ${generationProfile.chunkDetail}.
- Every chunk must contain a real spoken explanation in full sentences.
- VISUAL MODE INTELLIGENCE — for EACH chunk, choose the ONE visual that teaches THAT specific concept best, the way a great teacher decides between live-coding, the whiteboard, a diagram, or slides. Match the medium to the idea, and VARY modes across the lecture so it feels like a real, dynamic class — never the same mode chunk after chunk. Decide using this tree, in order:
  1. CODE → visual_mode: "code" — the chunk explains syntax, a command, a script, a config file, an API call, SQL, or anything a student would type into a terminal/editor. You MUST include code_example (real snippet, language, one-line explanation).
  2. DIAGRAM → visual_mode: "diagram" — the chunk explains relationships, architecture, components, or how parts connect ("how X relates to Y"). You MUST include the diagram field with 3–6 nodes and 2–5 edges. Node/edge labels MUST always be short English concept names regardless of course language (e.g. "CPU", "Memory", "Trade Routes"). Colors: #3b82f6 primary, #8b5cf6 secondary, #10b981 outcome, #f59e0b decision.
  3. FLOWCHART → visual_mode: "flowchart" — the chunk explains a process, ordered steps, a workflow, lifecycle, algorithm, or procedure. Steps go in diagram.steps.
  4. COMPARISON TABLE → visual_mode: "comparison_table" — the chunk directly compares 2+ concepts, tools, protocols, or approaches side by side.
  5. WHITEBOARD → visual_mode: "whiteboard" — the chunk builds a foundational concept: a definition, key terms, an analogy, or step-by-step reasoning a teacher would WRITE on the board while explaining. Use this OFTEN for "what is X / why does it matter / how to think about it" moments — it is the default for conceptual teaching when no code/diagram/comparison is clearly better. whiteboard_explanation = real key phrases, short definitions, note-style bullets ONLY (never drawing instructions).
  6. SLIDE → visual_mode: "slide" — a clean summary of 3–5 takeaways when no richer visual fits.
  7. NONE → visual_mode: "none" — only pure narrative with zero visual benefit (use rarely).
- REAL-WORLD / HOW-TO chunks (installing software, downloading a tool, signing up, configuring, using a website or app — e.g. "Downloading Python", "Setting up VS Code"): write clear NUMBERED real-world steps in spoken_explanation/whiteboard_explanation. The system AUTOMATICALLY attaches real website screenshots to these chunks, so the learner sees the actual UI — write them as a precise click-by-click walkthrough.
- A strong lecture deliberately MIXES modes — e.g. whiteboard to define a concept, then a diagram to show how it connects, then code to make it concrete, then a checkpoint. Choose each mode on purpose, not by habit.
- Use teaching_sequence to reflect your visual_mode choice (e.g. ["speak","code"] for code, ["speak","diagram"] for diagram).
- Include examples, key terms, and analogy_if_helpful when they make the explanation stronger.
- Include checkpoint_question_if_any whenever the learner should pause and self-check.
- For diagram chunks, keep diagrams small (3–6 nodes, 2–5 edges). Each step.cue must be a short exact phrase from spoken_explanation.
- visual_query MUST be a short 3–7 word image search query (e.g., "cybersecurity shield protection diagram"). Never a drawing instruction or a full sentence.
- Generate ${generationProfile.flashcardRange} flashcards.
- Generate ${generationProfile.quizRange} multiple choice questions with exactly 4 options each.
- Ensure correctAnswer is a zero-based option index.
- Use the next topic only as unlock context, not as lecture content.
- Keep the JSON compact and efficient. Avoid unnecessary verbosity in long string fields.
- Prefer practical, screen-friendly content over very long paragraphs.

Course:
${JSON.stringify(compactCourseContext, null, 2)}

Topic:
${JSON.stringify(compactTopicContext, null, 2)}
`;

  const completion = await withOpenAITimeout(
    () => client.chat.completions.create({
      model,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You generate strict JSON lecture packages for an educational tutoring platform.${course.language === 'Urdu' ? ' STRICT RULE: Course language is Urdu (اردو). All text/explanation fields must be 100% Urdu script. EXCEPTIONS that must stay in English: code_example.snippet, code_example.language, diagram nodes[].id, diagram nodes[].label, diagram edges[].label, visual_query. NEVER mix English transition words into Urdu sentences.' : ''}`
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    }),
    'lecture package generation',
    process.env.OPENAI_LECTURE_REQUEST_TIMEOUT_MS,
    180000
  );

  return {
    model: `${model}${generationProfile.modelSuffix}`,
    package: getJsonFromCompletion(completion)
  };
}

async function repairLecturePackage(rawJsonText, validationErrors) {
  const client = getClient();
  const model = process.env.OPENAI_MODEL_LECTURE;

  const completion = await withOpenAITimeout(
    () => client.chat.completions.create({
      model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'Repair invalid JSON lecture packages. Return JSON only.'
        },
        {
          role: 'user',
          content: `Fix this lecture package so it matches the required shape. Validation errors: ${validationErrors.join('; ')}. Raw JSON: ${rawJsonText}`
        }
      ]
    }),
    'lecture package repair',
    process.env.OPENAI_LECTURE_REPAIR_TIMEOUT_MS,
    90000
  );

  return getJsonFromCompletion(completion);
}

async function answerLectureQuestion({
  lectureTitle,
  lectureSummary,
  currentChunk,
  currentSection,
  recentMessages,
  question,
  language,
  studentMemoryContext,
}) {
  const client = getClient();
  const model = process.env.OPENAI_MODEL_QA;

  if (!model) {
    throw new Error('OPENAI_MODEL_QA is not configured');
  }

  const isUrdu = language === 'Urdu';
  const languageRule = isUrdu
    ? 'CRITICAL: This lecture is in Urdu. You MUST respond entirely in Urdu script (اردو). Do not use English or Roman Urdu in your answer.'
    : '';

  const memoryRule = studentMemoryContext
    ? `STUDENT LEARNING PROFILE:\n${studentMemoryContext}\nUse this profile to tailor your explanation. If the student has struggled with a concept before, explain it differently with a fresh analogy or example.`
    : '';

  const completion = await withOpenAITimeout(
    () => client.chat.completions.create({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: [
            'You are an AI tutor answering a quick question a student raised mid-lecture, like a teacher pausing class to clear one doubt at the board.',
            'Stay focused on the active lecture and explain clearly.',
            'Return ONLY a valid JSON object with this exact shape:',
            '{"answer": string, "diagram": null | {"caption": string, "nodes": [{"id": string, "label": string}], "edges": [{"from": string, "to": string, "label": string}]}}',
            'answer: BE CONCISE — at most 2-3 short sentences, or a tight 3-4 bullet list, or one small fenced code block. This is a quick clarification, not a new lecture. Lead with the direct answer. Use GitHub-flavored markdown inside the answer string (fenced code block ONLY for code questions, short bullet list for steps).',
            'answer is ALWAYS required and must never be empty — even when you include a diagram, still give a 1-2 sentence spoken explanation in answer (the diagram supports it, it does not replace it).',
            'diagram: Provide a diagram ONLY when the question is about a process, flow, structure, relationship, or how parts connect — and a small visual genuinely helps. Otherwise set diagram to null.',
            'When you provide a diagram: keep it to 3-6 nodes with short labels (1-3 words). edges connect node ids and may carry a very short label (e.g. "sends", "connects to"). The "id" values must match between nodes and edges. Do NOT repeat the whole diagram in the answer text.',
            'You must only answer questions directly related to the current lecture/section/chunk context you were given. If unrelated, set diagram to null and put a one-sentence polite refusal in answer.',
            ...(languageRule ? [languageRule] : []),
            ...(memoryRule ? [memoryRule] : []),
          ].join(' ')
        },
        {
          role: 'user',
          content: JSON.stringify({
            lectureTitle,
            lectureSummary,
            currentSection,
            currentChunk,
            recentMessages,
            question
          })
        }
      ]
    }),
    'lecture question answering',
    process.env.OPENAI_QA_REQUEST_TIMEOUT_MS,
    45000
  );

  const raw = completion?.choices?.[0]?.message?.content?.trim();
  if (!raw) {
    throw new Error('OpenAI returned an empty lecture Q&A response');
  }

  let answer = raw;
  let diagram = null;
  try {
    const parsed = JSON.parse(raw);
    answer = `${parsed.answer || ''}`.trim() || raw;
    diagram = normalizeQaDiagram(parsed.diagram);
  } catch (_) {
    // Model didn't return JSON — fall back to treating the whole thing as the answer.
    answer = raw;
  }

  return {
    model,
    answer,
    visual: diagram,
  };
}

// Validate + clean an optional Q&A diagram into the shape DiagramCanvas expects.
function normalizeQaDiagram(diagram) {
  if (!diagram || typeof diagram !== 'object') return null;
  const rawNodes = Array.isArray(diagram.nodes) ? diagram.nodes : [];
  const nodes = rawNodes
    .map((n, i) => ({
      id: `${n?.id ?? n?.label ?? `n${i}`}`.trim(),
      label: `${n?.label ?? n?.id ?? ''}`.trim(),
    }))
    .filter((n) => n.id && n.label)
    .slice(0, 6);
  if (nodes.length < 2) return null;
  const ids = new Set(nodes.map((n) => n.id));
  const rawEdges = Array.isArray(diagram.edges) ? diagram.edges : [];
  const edges = rawEdges
    .map((e) => ({
      from: `${e?.from ?? ''}`.trim(),
      to: `${e?.to ?? ''}`.trim(),
      label: `${e?.label ?? ''}`.trim(),
    }))
    .filter((e) => ids.has(e.from) && ids.has(e.to) && e.from !== e.to)
    .slice(0, 10);
  return {
    type: 'diagram',
    caption: `${diagram.caption || ''}`.trim(),
    nodes,
    edges,
  };
}

async function planChunkTeaching({
  lectureTitle,
  lectureSummary,
  currentChunk,
  previousChunk,
  nextChunk,
  teachingPlanSeed,
  resumeContext,
  language
}) {
  const client = getClient();
  const model = process.env.OPENAI_MODEL_TUTOR_PLANNER || process.env.OPENAI_MODEL_QA;

  if (!model) {
    throw new Error('OPENAI_MODEL_TUTOR_PLANNER or OPENAI_MODEL_QA is not configured');
  }

  const isUrdu = language === 'Urdu';

  const completion = await withOpenAITimeout(
    () => client.chat.completions.create({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: [
            'You are a lightweight micro-teaching planner for a stored lecture system.',
            'Return valid JSON only.',
            'Do not regenerate the lesson.',
            'Only decide how the current chunk should be taught like a real teacher.',
            ...(isUrdu ? ['CRITICAL: The lecture language is Urdu. All string fields in your JSON (transition_text, checkpoint_text, likely_confusion_points, reinforcement_points, teacher_tone) MUST be 100% Urdu script (اردو). No English words, no Roman Urdu. BANNED phrases — never use: "Next, let\'s", "For example", "Before we move on", "Think about this", "Let\'s explore", "In summary", "First,", "Finally,". Use Urdu equivalents: آئیے اب، مثال کے طور پر، آگے بڑھنے سے پہلے، اس پر غور کریں، خلاصہ، پہلے، آخر میں'] : [])
          ].join(' ')
        },
        {
          role: 'user',
          content: JSON.stringify({
            lectureTitle,
            lectureSummary,
            previousChunk,
            currentChunk,
            nextChunk,
            teachingPlanSeed,
            resumeContext,
            requiredShape: {
              teaching_mode: 'brief_explanation | deep_explanation | analogy_driven | example_first | process_flow | compare_contrast',
              transition_text: 'string',
              use_visual: 'boolean',
              visual_type: 'none | slide | whiteboard | diagram | flowchart | comparison_table | mixed',
              use_slide: 'boolean',
              use_whiteboard: 'boolean',
              use_example: 'boolean',
              use_checkpoint: 'boolean',
              checkpoint_text: 'string',
              likely_confusion_points: ['string'],
              reinforcement_points: ['string'],
              teacher_tone: ['string'],
              recommended_duration_seconds: 'integer'
            }
          })
        }
      ]
    }),
    'teaching plan generation',
    process.env.OPENAI_PLANNER_REQUEST_TIMEOUT_MS,
    45000
  );

  return {
    model,
    plan: getJsonFromCompletion(completion)
  };
}

async function answerGeneralChat({
  message,
  chatHistory = [],
  userContext = {}
}) {
  const client = getClient();
  const model = process.env.OPENAI_MODEL_QA;

  if (!model) {
    throw new Error('OPENAI_MODEL_QA is not configured');
  }

  const recentHistory = chatHistory.slice(-12).map((entry) => ({
    role: entry.sender === 'user' ? 'user' : 'assistant',
    content: entry.content
  }));

  const completion = await withOpenAITimeout(
    () => client.chat.completions.create({
      model,
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content: [
            'You are SkillSphere AI, a calm, professional, general academic assistant for students.',
            'Answer clearly, be practical, and admit uncertainty when needed.',
            'Format responses in clean GitHub-flavored markdown.',
            'Use headings sparingly, bullets for steps, and fenced code blocks for code.',
            'When comparing tools, settings, plans, or options, use a markdown table so the UI can display it cleanly.'
          ].join(' ')
        },
        {
          role: 'system',
          content: JSON.stringify({
            userContext: {
              id: userContext.id,
              name: userContext.name,
              role: userContext.role
            }
          })
        },
        ...recentHistory,
        {
          role: 'user',
          content: message
        }
      ]
    }),
    'general chat response',
    process.env.OPENAI_CHAT_REQUEST_TIMEOUT_MS,
    45000
  );

  const answer = completion?.choices?.[0]?.message?.content?.trim();
  if (!answer) {
    throw new Error('OpenAI returned an empty general chat response');
  }

  return {
    model,
    answer
  };
}

async function synthesizeSpeech(text, outputPath) {
  const client = getClient();
  const model = process.env.OPENAI_TTS_MODEL;

  if (!model) {
    throw new Error('OPENAI_TTS_MODEL is not configured');
  }

  const response = await withOpenAITimeout(
    () => client.audio.speech.create({
      model,
      voice: 'alloy',
      format: 'mp3',
      input: text
    }),
    'speech synthesis',
    process.env.OPENAI_TTS_REQUEST_TIMEOUT_MS,
    60000
  );

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.mkdirSync(require('path').dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, buffer);

  return {
    model,
    buffer
  };
}

async function transcribeAudio(tempFilePath, options = {}) {
  const client = getClient();
  const model = process.env.OPENAI_STT_MODEL;

  if (!model) {
    throw new Error('OPENAI_STT_MODEL is not configured');
  }

  const params = {
    model,
    file: fs.createReadStream(tempFilePath),
  };

  if (options.prompt) {
    params.prompt = options.prompt;
  }

  const response = await withOpenAITimeout(
    () => client.audio.transcriptions.create(params),
    'audio transcription',
    process.env.OPENAI_STT_REQUEST_TIMEOUT_MS,
    60000
  );

  return {
    model,
    text: response?.text?.trim() || ''
  };
}

async function smokeTest() {
  const client = getClient();
  const model = process.env.OPENAI_MODEL_QA || process.env.OPENAI_MODEL_LECTURE;

  if (!model) {
    throw new Error('OPENAI_MODEL_QA or OPENAI_MODEL_LECTURE must be configured');
  }

  const completion = await withOpenAITimeout(
    () => client.chat.completions.create({
      model,
      temperature: 0,
      max_tokens: 16,
      messages: [
        { role: 'system', content: 'Reply with exactly: OK' },
        { role: 'user', content: 'Ping' }
      ]
    }),
    'smoke test',
    process.env.OPENAI_SMOKE_TEST_TIMEOUT_MS,
    20000
  );

  return completion?.choices?.[0]?.message?.content?.trim();
}

function createAudioCacheKey(parts) {
  return crypto.createHash('sha1').update(parts.join('|')).digest('hex');
}

// ── Content Moderation (free — no token cost) ─────────────────────────────────
async function moderateContent(text) {
  const client = getClient();
  const response = await client.moderations.create({ input: text });
  const result = response.results[0];

  if (!result.flagged) return { flagged: false };

  // Find the highest-scoring flagged category to use as the reason
  const flaggedCategories = Object.entries(result.categories)
    .filter(([, flagged]) => flagged)
    .map(([name]) => name.replace(/\//g, ' / '));

  return {
    flagged: true,
    categories: flaggedCategories,
    reason: flaggedCategories.join(', '),
  };
}

async function evaluateCheckpointAnswer({ question, studentAnswer, chunkText, language }) {
  const client = getClient();
  const model = process.env.OPENAI_MODEL_QA;
  if (!model) throw new Error('OPENAI_MODEL_QA is not configured');

  const isUrdu = language === 'Urdu';
  const languageRule = isUrdu
    ? 'CRITICAL: Respond in Urdu script only.'
    : '';

  const completion = await withOpenAITimeout(
    () => client.chat.completions.create({
      model,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: [
            'You are an AI tutor evaluating a student\'s answer to a quick checkpoint question during a lecture.',
            'Mark correct ONLY if the answer demonstrates actual understanding — not just a single keyword or guess.',
            'A one-word answer with no explanation should be marked wrong unless the question itself only requires one word.',
            'Accept answers that are conceptually correct even if worded differently, but require at least a minimal explanation.',
            'Return ONLY valid JSON: {"correct": boolean, "feedback": string}',
            'feedback: 1-2 sentences max. If correct, briefly affirm and reinforce. If wrong, gently correct with the right answer.',
            ...(languageRule ? [languageRule] : []),
          ].join(' ')
        },
        {
          role: 'user',
          content: JSON.stringify({ question, studentAnswer, context: chunkText?.slice(0, 600) })
        }
      ]
    }),
    'evaluateCheckpointAnswer',
    15000
  );

  const raw = completion.choices[0]?.message?.content || '{}';
  return JSON.parse(raw);
}

module.exports = {
  generateLecturePackage,
  repairLecturePackage,
  planChunkTeaching,
  answerLectureQuestion,
  answerGeneralChat,
  synthesizeSpeech,
  transcribeAudio,
  smokeTest,
  createAudioCacheKey,
  moderateContent,
  evaluateCheckpointAnswer,
};

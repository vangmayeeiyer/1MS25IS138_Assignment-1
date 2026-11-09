import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

const PORT = Number(process.env.PORT) || 3000;

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function generateContentWithRetry(ai: GoogleGenAI, params: any): Promise<any> {
  const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`[Gemini] Requesting ${modelName}...`);
      const timeoutMs = modelName.includes('3.8') ? 15000 : 60000;
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timed out waiting for ${modelName}`)), timeoutMs)
      );

      const generatePromise = ai.models.generateContent({
        ...params,
        model: modelName,
      });

      const res: any = await Promise.race([generatePromise, timeoutPromise]);
      console.log(`[Gemini] Success from ${modelName}`);
      return res;
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini] Model ${modelName} issue: ${err?.message || 'unknown'}`);
      // Continue to next model
    }
  }
  throw lastError;
}

function handleGeminiError(error: any, res: Response, featureName: string) {
  console.error(`Error in ${featureName}:`, error);
  const errMsg = error?.message || 'An unexpected error occurred while communicating with the AI service.';

  if (errMsg.includes('503') || errMsg.includes('UNAVAILABLE') || errMsg.includes('high demand')) {
    return res.status(503).json({
      error: 'The AI model is experiencing a temporary spike in traffic. Please wait a few seconds and try again.',
      details: errMsg,
      code: 'MODEL_UNAVAILABLE',
    });
  }

  if (errMsg.includes('API key') || errMsg.includes('PERMISSION_DENIED') || errMsg.includes('API_KEY_INVALID') || errMsg.includes('403')) {
    return res.status(403).json({
      error: 'Invalid or missing Gemini API key. Please ensure your GEMINI_API_KEY is configured in the Settings > Secrets panel.',
      details: errMsg,
      code: 'API_KEY_ERROR',
    });
  }

  if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
    return res.status(429).json({
      error: 'Rate limit or resource quota exceeded. Please wait a moment before trying again or verify quota settings.',
      details: errMsg,
      code: 'QUOTA_EXHAUSTED',
    });
  }

  return res.status(500).json({
    error: `Failed to process research request: ${errMsg}`,
    details: errMsg,
    code: 'GENERATION_ERROR',
  });
}

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY || process.env.API_KEY);
  res.json({ status: 'ok', hasKey });
});

// --- Europe PMC REST API Integration ---

// Search genuine academic publications via Europe PMC
app.get('/api/scholarpulse/papers/search', async (req: Request, res: Response) => {
  try {
    const rawQuery = String(req.query.query || '').trim();
    if (!rawQuery) {
      return res.status(400).json({ error: 'Please provide a search query.' });
    }

    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 12, 1), 50);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const openAccessOnly = req.query.openAccessOnly === 'true';
    const sort = String(req.query.sort || 'relevance');

    let queryStr = rawQuery;
    if (openAccessOnly) {
      queryStr = `(${queryStr}) AND (OPEN_ACCESS:Y OR IN_EPMC:Y)`;
    }

    let sortParam = '';
    if (sort === 'cited') {
      sortParam = '&sort=CITED%20desc';
    } else if (sort === 'date') {
      sortParam = '&sort=P_PD_DATE_D%20desc';
    }

    const europePmcUrl = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(
      queryStr
    )}&resultType=core&pageSize=${pageSize}&page=${page}&format=json${sortParam}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(europePmcUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'ScholarPulse-Academic-Assistant/1.0',
        Accept: 'application/json',
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Europe PMC API returned HTTP ${response.status}`,
        details: await response.text(),
      });
    }

    const data = await response.json();
    const hitCount = Number(data?.hitCount) || 0;
    const rawList = data?.resultList?.result || [];

    const papers = rawList.map((p: any) => {
      const source = p.source || 'MED';
      const id = String(p.id || '');
      const pmid = p.pmid ? String(p.pmid) : undefined;
      const pmcid = p.pmcid ? String(p.pmcid) : undefined;
      const doi = p.doi ? String(p.doi).trim() : undefined;

      const title = String(p.title || 'Untitled Publication')
        .replace(/<[^>]*>/g, '')
        .replace(/\.$/, '')
        .trim();

      const authorString = String(p.authorString || 'Authors not indexed').trim();
      const journalTitle = String(
        p.journalTitle ||
          p.journalInfo?.journal?.title ||
          p.journalInfo?.journal?.medlineAbbreviation ||
          'Scholarly Journal'
      ).trim();
      const pubYear = String(p.pubYear || p.journalInfo?.yearOfPublication || '').trim();

      const rawAbstract = p.abstractText ? String(p.abstractText) : '';
      const abstractText = rawAbstract
        ? rawAbstract.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
        : undefined;

      const isOpenAccess = p.isOpenAccess === 'Y';
      const hasFullText = isOpenAccess || Boolean(pmcid) || p.inEpmc === 'Y' || p.inPmc === 'Y';

      let pdfUrl: string | undefined = undefined;
      const fullTextUrls = p.fullTextUrlList?.fullTextUrl || [];
      if (Array.isArray(fullTextUrls)) {
        const pdfEntry = fullTextUrls.find(
          (u: any) => u.documentStyle === 'pdf' || (typeof u.url === 'string' && u.url.endsWith('.pdf'))
        );
        if (pdfEntry?.url) {
          pdfUrl = pdfEntry.url;
        }
      }
      if (!pdfUrl && pmcid) {
        pdfUrl = `https://europepmc.org/articles/${pmcid}?pdf=render`;
      }

      const europePmcUrl = `https://europepmc.org/article/${source}/${id}`;
      const doiUrl = doi ? `https://doi.org/${doi}` : undefined;
      const pmcUrl = pmcid ? `https://europepmc.org/articles/${pmcid}` : undefined;

      const fullTextSourceType = pmcid
        ? 'full-text'
        : abstractText
        ? 'abstract-only'
        : 'metadata-only';

      return {
        id,
        source,
        pmid,
        pmcid,
        doi,
        title,
        authorString,
        journalTitle,
        pubYear,
        abstractText,
        isOpenAccess,
        hasFullText,
        citedByCount: typeof p.citedByCount === 'number' ? p.citedByCount : 0,
        europePmcUrl,
        doiUrl,
        pmcUrl,
        pdfUrl,
        fullTextSourceType,
      };
    });

    res.json({
      hitCount,
      papers,
      query: rawQuery,
      page,
      pageSize,
    });
  } catch (err: any) {
    console.error('Europe PMC Search Error:', err);
    res.status(500).json({
      error: 'Failed to retrieve publications from Europe PMC. Please check your network or search terms.',
      details: err?.message,
    });
  }
});

// Fetch full text XML and convert to readable text
app.get('/api/scholarpulse/papers/fulltext', async (req: Request, res: Response) => {
  try {
    const rawPmcid = String(req.query.pmcid || '').trim();
    if (!rawPmcid) {
      return res.status(400).json({ error: 'Please provide a valid PMCID.' });
    }

    const cleanPmcid = rawPmcid.toUpperCase().startsWith('PMC')
      ? rawPmcid.toUpperCase()
      : `PMC${rawPmcid}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const xmlUrl = `https://www.ebi.ac.uk/europepmc/webservices/rest/${cleanPmcid}/fullTextXML`;
    const response = await fetch(xmlUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'ScholarPulse-Academic-Assistant/1.0',
        Accept: 'application/xml, text/xml',
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Could not retrieve full text XML from Europe PMC for ${cleanPmcid} (Status: ${response.status}).`,
      });
    }

    const xml = await response.text();
    const readableText = xml
      .replace(/<title[^>]*>(.*?)<\/title>/gi, '\n\n### $1\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '\n$1\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();

    const wordCount = readableText.split(/\s+/).filter(Boolean).length;

    res.json({
      pmcid: cleanPmcid,
      text: readableText,
      wordCount,
    });
  } catch (err: any) {
    console.error('Europe PMC FullText Error:', err);
    res.status(500).json({
      error: 'Failed to retrieve full text XML from Europe PMC.',
      details: err?.message,
    });
  }
});

// 1. Topic Hub Endpoint
app.post('/api/scholarpulse/topic-hub', async (req: Request, res: Response) => {
  try {
    const { topic, academicLevel, fieldOfStudy } = req.body;
    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return res.status(400).json({ error: 'Please provide a valid research topic.' });
    }

    const ai = getAiClient();

    const systemInstruction = `You are ScholarPulse, an elite academic research strategist and domain ontologist.
Your task is to produce a structured, high-yield conceptual map and foundational overview of a research topic for scholars.

CRITICAL ACADEMIC INTEGRITY INSTRUCTIONS:
- NEVER invent or hallucinate research papers, authors, citations, DOIs, publication years, or specific experimental data.
- Refer strictly to conceptual paradigms, established theories, common methodologies, and thematic literature streams.
- Clearly distinguish standard academic consensus from emerging/debated frontiers.

FEW-SHOT EXAMPLE:
Input Topic: "Transformer interpretability in medical NLP"
Output Schema:
{
  "overview": "Transformer interpretability in clinical NLP sits at the intersection of deep learning representations and high-stakes medical decision support...",
  "foundationalThemes": [
    {
      "theme": "Attention Weights as Explanation vs Saliency",
      "description": "Explores the debate on whether raw self-attention heads faithfully reflect clinical importance or merely serve as correlation artifacts.",
      "keyQuestionsAddressed": ["Does attention align with physician gaze?", "Are gradient-weighted saliency maps more faithful than raw attention?"]
    }
  ],
  "coreTheoriesAndFrameworks": [
    {
      "name": "Post-Hoc Attribution Frameworks (Integrated Gradients & SHAP)",
      "description": "Techniques for attributing prediction values back to input token representations.",
      "relevance": "Provides baseline explanations for tabular and clinical free-text note models."
    }
  ],
  "majorSubfields": [
    {
      "subfield": "Concept Bottleneck Models in Healthcare",
      "focus": "Constraining intermediate latent representations to human-understandable clinical concepts.",
      "status": "Rapidly Growing"
    }
  ],
  "commonMethodologies": [
    {
      "approach": "Counterfactual Token Perturbation & Probing Classifiers",
      "standardToolsOrDesigns": "Clinical synthetic note editing, perturbing medical entity spans to observe prediction shifts.",
      "typicalDataTypes": "EHR de-identified clinical notes (e.g., MIMIC-IV), clinical guideline corpora."
    }
  ],
  "currentDebatesAndTrends": [
    "Faithfulness vs Plausibility in patient-facing AI summaries",
    "Mechanistic interpretability of large reasoning models on clinical diagnostic benchmarks"
  ]
}`;

    const prompt = `Analyze this research topic thoroughly:
Topic: "${topic.trim()}"
Academic Level: ${academicLevel || 'Master / Doctoral'}
Field of Study: ${fieldOfStudy || 'Interdisciplinary'}

Return a structured JSON object according to the requested schema.`;

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overview: { type: Type.STRING, description: 'Comprehensive scholarly overview of this research domain.' },
            foundationalThemes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  theme: { type: Type.STRING },
                  description: { type: Type.STRING },
                  keyQuestionsAddressed: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['theme', 'description', 'keyQuestionsAddressed'],
              },
            },
            coreTheoriesAndFrameworks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  relevance: { type: Type.STRING },
                },
                required: ['name', 'description', 'relevance'],
              },
            },
            majorSubfields: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  subfield: { type: Type.STRING },
                  focus: { type: Type.STRING },
                  status: { type: Type.STRING },
                },
                required: ['subfield', 'focus', 'status'],
              },
            },
            commonMethodologies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  approach: { type: Type.STRING },
                  standardToolsOrDesigns: { type: Type.STRING },
                  typicalDataTypes: { type: Type.STRING },
                },
                required: ['approach', 'standardToolsOrDesigns', 'typicalDataTypes'],
              },
            },
            currentDebatesAndTrends: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: [
            'overview',
            'foundationalThemes',
            'coreTheoriesAndFrameworks',
            'majorSubfields',
            'commonMethodologies',
            'currentDebatesAndTrends',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error) {
    handleGeminiError(error, res, 'Topic Hub');
  }
});

// 2. Research Question Generator Endpoint
app.post('/api/scholarpulse/research-questions', async (req: Request, res: Response) => {
  try {
    const { topic, focusArea, targetMethodology } = req.body;
    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return res.status(400).json({ error: 'Please provide a valid research topic.' });
    }

    const ai = getAiClient();

    const systemInstruction = `You are ScholarPulse, a senior academic advisor specializing in research problem formulation and dissertation methodology.
Your task is to generate precise, empirically answerable academic research questions across multiple scholarly categories.

CRITICAL ACADEMIC INTEGRITY INSTRUCTIONS:
- NEVER invent fictitious citations, authors, or DOIs.
- Formulate questions adhering strictly to recognized epistemological standards (FINER framework: Feasible, Interesting, Novel, Ethical, Relevant).
- Label each question with its research paradigm and methodological feasibility.

FEW-SHOT EXAMPLE:
Topic: "Impact of remote work on junior software engineer mentorship"
Category: "Causal & Explanatory"
Question: "To what extent does asynchronous code review communication mediate the relationship between fully remote onboarding and time-to-first-independent-PR for entry-level developers?"
Target Variables: "Independent: Onboarding modality (remote vs hybrid); Mediator: Asynchronous review frequency; Dependent: Time-to-first-independent-PR"
Feasibility: "High (requires access to git repositories or team metrics)"
Rationale: "Addresses a critical transition in software engineering practices where casual knowledge-transfer mechanisms are replaced by structured tooling."
Suggested Methodology: "Prospective cohort study or survival analysis of pull-request datasets combined with weekly pulse surveys."`;

    const prompt = `Formulate rigorous academic research questions for:
Topic: "${topic.trim()}"
Focus Area / Specific Angle: ${focusArea ? `"${focusArea.trim()}"` : 'General scholarly advancement'}
Target Methodology Preferred: ${targetMethodology || 'Balanced across qualitative, quantitative, and mixed approaches'}

Generate 6-8 distinct, high-caliber research questions categorized into:
- Exploratory / Phenomenological
- Descriptive & Observational
- Comparative & Differential
- Causal & Explanatory
- Applied & Evaluative`;

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topicSummary: { type: Type.STRING, description: 'Brief reflection on the research angle explored.' },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  question: { type: Type.STRING },
                  targetVariables: { type: Type.STRING },
                  feasibility: { type: Type.STRING },
                  rationale: { type: Type.STRING },
                  suggestedMethodology: { type: Type.STRING },
                },
                required: ['category', 'question', 'targetVariables', 'feasibility', 'rationale', 'suggestedMethodology'],
              },
            },
            methodologyAdvice: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'General methodological recommendations for investigating these questions.',
            },
          },
          required: ['topicSummary', 'questions', 'methodologyAdvice'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error) {
    handleGeminiError(error, res, 'Research Questions');
  }
});

// 3. Keyword Generator & Boolean Search Builder Endpoint
app.post('/api/scholarpulse/keywords', async (req: Request, res: Response) => {
  try {
    const { topic, inclusionCriteria, exclusionCriteria } = req.body;
    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return res.status(400).json({ error: 'Please provide a valid topic for keyword generation.' });
    }

    const ai = getAiClient();

    const systemInstruction = `You are ScholarPulse, an expert academic librarian and systematic review search strategist.
Your task is to build a thorough keyword ontology and tailored Boolean search strings for major academic bibliographic databases.

CRITICAL RULES:
- Never fabricate fake papers or citations.
- Follow database-specific Boolean syntax rules:
  * PubMed: supports [Title/Abstract], MeSH terms, nested parentheses.
  * IEEE Xplore: supports quotes for exact phrases, AND / OR, max nesting limits.
  * Scopus: TITLE-ABS-KEY syntax, double quotes.
  * Google Scholar: strict 256-character limits, simple AND / OR with quotes, lacks nested parenthesis support.
  * Web of Science: TS=(...) topic search format.
- Include synonyms, British/American spelling variations, truncated wildcards (*), and controlled vocabulary terms.`;

    const prompt = `Build comprehensive search keywords and database-specific Boolean search queries for:
Topic: "${topic.trim()}"
Inclusion Criteria: ${inclusionCriteria ? `"${inclusionCriteria.trim()}"` : 'None specified'}
Exclusion Criteria: ${exclusionCriteria ? `"${exclusionCriteria.trim()}"` : 'None specified'}`;

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            primaryKeywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            thesaurusSynonyms: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  synonyms: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  meshOrDescriptorTerm: { type: Type.STRING },
                },
                required: ['term', 'synonyms'],
              },
            },
            conceptualCategories: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  keywords: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['category', 'keywords'],
              },
            },
            booleanStrings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  database: { type: Type.STRING },
                  query: { type: Type.STRING },
                  syntaxNotes: { type: Type.STRING },
                },
                required: ['database', 'query', 'syntaxNotes'],
              },
            },
            searchStrategyAdvice: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: [
            'primaryKeywords',
            'thesaurusSynonyms',
            'conceptualCategories',
            'booleanStrings',
            'searchStrategyAdvice',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error) {
    handleGeminiError(error, res, 'Keyword Generator');
  }
});

// 4. Research Paper Summarizer Endpoint
app.post('/api/scholarpulse/summarizer', async (req: Request, res: Response) => {
  try {
    const { paperText, paperTitle, sourceReference } = req.body;
    if (!paperText || typeof paperText !== 'string' || paperText.trim().length < 50) {
      return res.status(400).json({
        error: 'Please paste at least 50 characters of research paper text (abstract, excerpt, or full text) to summarize.',
      });
    }

    const ai = getAiClient();

    const systemInstruction = `You are ScholarPulse, an objective academic peer-reviewer and synthesis specialist.
Your task is to generate a faithful, high-precision summary of the user's supplied research paper text.

STRICT EVIDENCE GROUNDING RULES:
- ONLY summarize what is explicitly stated in the supplied text.
- If the supplied text does NOT mention sample size, datasets, or specific limitations, write "Not specified in supplied text" rather than inventing them.
- NEVER fabricate citations, DOIs, authors, or external experimental results.
- Distinguish between verified empirical claims made by the authors and speculative discussion points.`;

    const sourceContext = sourceReference
      ? `VERIFIED SOURCE REFERENCE:
Title: "${sourceReference.title}"
Authors: ${sourceReference.authors}
Journal & Year: ${sourceReference.journal || 'Academic Journal'} (${sourceReference.year || 'n.d.'})
DOI: ${sourceReference.doi || 'N/A'} | Source Level: ${sourceReference.sourceType === 'full-text' ? 'Full-Text Article (Open Access)' : 'Abstract Only'}
Europe PMC / Source URL: ${sourceReference.sourceUrl}\n`
      : '';

    const prompt = `${sourceContext}Analyze and summarize this research publication text:
${paperTitle ? `Title or Working Identifier: "${paperTitle.trim()}"\n` : ''}
--- SUPPLIED RESEARCH TEXT ---
${paperText.trim()}
--- END SUPPLIED TEXT ---

Provide a structured breakdown including executive summary, research objectives, methodology & data, key findings, contributions, acknowledged limitations, and practical implications.`;

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executiveSummary: {
              type: Type.STRING,
              description: 'Executive TL;DR synthesizing the core problem, intervention, and primary outcome.',
            },
            researchObjectives: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Clear bullet points of primary research questions, hypotheses, or objectives.',
            },
            methodology: {
              type: Type.OBJECT,
              properties: {
                studyDesign: { type: Type.STRING },
                sampleOrDataset: { type: Type.STRING },
                dataCollection: { type: Type.STRING },
                analyticalMethods: { type: Type.STRING },
              },
              required: ['studyDesign', 'sampleOrDataset', 'dataCollection', 'analyticalMethods'],
            },
            keyFindings: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Core results explicitly demonstrated in the text.',
            },
            contributions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Conceptual, theoretical, or practical contributions claimed by the authors.',
            },
            limitations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Methodological caveats, sample limitations, or stated boundaries.',
            },
            practicalImplications: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Actionable applications for researchers or industry practitioners.',
            },
            evidenceGroundedNotice: {
              type: Type.STRING,
              description: 'Verification statement confirming adherence strictly to user text.',
            },
          },
          required: [
            'executiveSummary',
            'researchObjectives',
            'methodology',
            'keyFindings',
            'contributions',
            'limitations',
            'practicalImplications',
            'evidenceGroundedNotice',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    if (sourceReference) {
      parsed.sourceReference = sourceReference;
    }
    res.json(parsed);
  } catch (error) {
    handleGeminiError(error, res, 'Paper Summarizer');
  }
});

// 5. Research Gap Analyzer Endpoint
app.post('/api/scholarpulse/gap-analyzer', async (req: Request, res: Response) => {
  try {
    const { researchText, contextTopic, sourceReference } = req.body;
    if (!researchText || typeof researchText !== 'string' || researchText.trim().length < 50) {
      return res.status(400).json({
        error: 'Please provide at least 50 characters of research text (literature review, discussion, abstract) to analyze gaps.',
      });
    }

    const ai = getAiClient();

    const systemInstruction = `You are ScholarPulse, a rigorous research methodology critic and research frontier analyst.
Your task is to critically analyze supplied research text and surface plausible research gaps, unaddressed questions, and under-explored dimensions.

MANDATORY DISCLAIMER & ACADEMIC INTEGRITY:
- ALL identified gaps are HYPOTHESES and MUST be explicitly flagged as: "UNVERIFIED SUGGESTION – Subject to empirical validation and literature review".
- NEVER invent fictitious authors, papers, or citations to justify a gap.
- Focus on logical, methodological, demographic, temporal, or conceptual absences in the provided text.
- Provide concrete steps for how the researcher can verify via databases whether the gap has already been addressed by existing literature.`;

    const sourceContext = sourceReference
      ? `VERIFIED SOURCE REFERENCE:
Title: "${sourceReference.title}"
Authors: ${sourceReference.authors}
Journal & Year: ${sourceReference.journal || 'Academic Journal'} (${sourceReference.year || 'n.d.'})
DOI: ${sourceReference.doi || 'N/A'} | Source Level: ${sourceReference.sourceType === 'full-text' ? 'Full-Text Article (Open Access)' : 'Abstract Only'}
Europe PMC / Source URL: ${sourceReference.sourceUrl}\n`
      : '';

    const prompt = `${sourceContext}Analyze this research literature text to identify potential research gaps:
${contextTopic ? `Context Topic: "${contextTopic.trim()}"\n` : ''}
--- SUPPLIED RESEARCH TEXT ---
${researchText.trim()}
--- END SUPPLIED TEXT ---

Identify 4-6 distinct, actionable research gaps across:
- Methodological Gaps
- Population / Demographic Gaps
- Temporal / Longitudinal Gaps
- Theoretical / Conceptual Blindspots
- Empirical / Setting Gaps
- Evaluation / Metric Gaps`;

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            warningDisclaimer: {
              type: Type.STRING,
              description: 'Must state: UNVERIFIED SUGGESTION – Subject to empirical validation and literature review.',
            },
            criticalObservations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'What the supplied text establishes versus where it stops short.',
            },
            gaps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  opportunity: { type: Type.STRING },
                  validationSteps: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  riskAssessment: { type: Type.STRING },
                },
                required: ['type', 'title', 'description', 'opportunity', 'validationSteps', 'riskAssessment'],
              },
            },
            recommendedNextSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Next steps to formulate a novel thesis or grant proposal based on these suggestions.',
            },
          },
          required: ['warningDisclaimer', 'criticalObservations', 'gaps', 'recommendedNextSteps'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    if (sourceReference) {
      parsed.sourceReference = sourceReference;
    }
    res.json(parsed);
  } catch (error) {
    handleGeminiError(error, res, 'Gap Analyzer');
  }
});

// 6. Manuscript Outline Generator Endpoint
app.post('/api/scholarpulse/outline-generator', async (req: Request, res: Response) => {
  try {
    const { topic, paperType, targetAudience, keyInputs } = req.body;
    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return res.status(400).json({ error: 'Please provide a valid topic for manuscript outline generation.' });
    }

    const ai = getAiClient();

    const systemInstruction = `You are ScholarPulse, an experienced scientific journal editor and writing consultant.
Your task is to generate a comprehensive, structured academic manuscript outline tailored to specific journal and publication standards.

CRITICAL INSTRUCTIONS:
- NEVER invent fictitious citations, authors, or DOIs.
- Provide concrete section-by-section architecture with actionable guiding questions, required content checkpoints, and realistic word count allocations.
- Include a structural abstract template with slot placeholders [e.g., [Background], [Methods], [Results], [Conclusion]].`;

    const prompt = `Construct an in-depth academic manuscript outline for:
Topic: "${topic.trim()}"
Manuscript Type: "${paperType || 'Standard IMRaD Empirical Article'}"
Target Publication Venue / Audience: "${targetAudience || 'Peer-reviewed scholarly journal'}"
Key Inputs / Notes: ${keyInputs ? `"${keyInputs.trim()}"` : 'None provided'}

Provide a rigorous section-by-section breakdown (including Introduction, Methods, Results, Discussion, etc.) with specific guiding questions, content checklist, and recommended word counts.`;

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            titleSuggestion: { type: Type.STRING },
            targetWordCount: { type: Type.STRING },
            paperTypeConfirmed: { type: Type.STRING },
            abstractTemplate: { type: Type.STRING },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sectionNumber: { type: Type.STRING },
                  title: { type: Type.STRING },
                  estimatedWords: { type: Type.STRING },
                  purpose: { type: Type.STRING },
                  guidingQuestions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  contentChecklist: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  writingTips: { type: Type.STRING },
                },
                required: [
                  'sectionNumber',
                  'title',
                  'estimatedWords',
                  'purpose',
                  'guidingQuestions',
                  'contentChecklist',
                  'writingTips',
                ],
              },
            },
            journalSubmissionChecklist: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: [
            'titleSuggestion',
            'targetWordCount',
            'paperTypeConfirmed',
            'abstractTemplate',
            'sections',
            'journalSubmissionChecklist',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error) {
    handleGeminiError(error, res, 'Outline Generator');
  }
});

// Setup Vite or Static File Serving
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ScholarPulse server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

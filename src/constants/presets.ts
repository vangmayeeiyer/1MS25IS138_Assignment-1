/**
 * Sample presets and academic disciplines for ScholarPulse
 */

export const ACADEMIC_FIELDS = [
  'Interdisciplinary',
  'Computer Science & AI',
  'Biomedical & Clinical Health',
  'Environmental & Earth Sciences',
  'Psychology & Cognitive Sciences',
  'Economics & Management',
  'Public Health & Epidemiology',
  'Social Sciences & Public Policy',
  'Educational Sciences & EdTech',
  'Materials & Engineering',
];

export const ACADEMIC_LEVELS = [
  "Master's Degree / Pre-Doctoral",
  'Doctoral Candidate / PhD',
  'Postdoctoral / Faculty Researcher',
  'Undergraduate Honors Thesis',
  'Industry R&D Specialist',
];

export const MANUSCRIPT_TYPES = [
  'Standard IMRaD Empirical Article',
  'Systematic Literature Review / PRISMA',
  'Qualitative Case Study & Ethnography',
  'Methodological & Algorithmic Proposal',
  'Short Communication / Letters',
  'Doctoral Dissertation Proposal',
];

export const TARGET_AUDIENCES = [
  'Peer-Reviewed Scholarly Journal (Q1/Q2)',
  'International Academic Conference Proceedings',
  'Doctoral Dissertation / Thesis Defense',
  'Grant Funding Agency (NIH/NSF/Horizon)',
  'Policy Brief / White Paper',
];

export const SAMPLE_TOPICS = [
  {
    topic: 'Explainable AI in Clinical Decision Support for Oncology',
    field: 'Computer Science & AI',
    level: 'Doctoral Candidate / PhD',
  },
  {
    topic: 'Microplastics Bioaccumulation in Freshwater Trophic Cascades',
    field: 'Environmental & Earth Sciences',
    level: "Master's Degree / Pre-Doctoral",
  },
  {
    topic: 'Longitudinal Impact of Smartphone Micro-Breaks on Cognitive Load in Higher Education',
    field: 'Psychology & Cognitive Sciences',
    level: 'Postdoctoral / Faculty Researcher',
  },
  {
    topic: 'Algorithmic Fairness and Disparate Impact in Automated Credit Scoring',
    field: 'Economics & Management',
    level: 'Doctoral Candidate / PhD',
  },
];

export const SAMPLE_RESEARCH_PAPERS = [
  {
    title: 'Evaluating Neural Retrieval in Low-Resource Clinical QA',
    text: `Abstract:
Clinical question answering (QA) systems powered by large language models frequently suffer from hallucinations when reasoning over specialized biomedical subfields. In this study, we propose MedRetrieve-Lite, a dense dual-encoder retrieval architecture pre-trained on contrastive paired clinical case notes and PubMed abstracts (N = 120,000 paired passages). We evaluated our approach on a newly curated benchmark of 2,400 multi-step rare disease diagnosis queries.

Methodology:
The model utilizes a shared BioLink-BERT backbone with late-interaction scoring across token embeddings. We conducted 5-fold cross-validation comparing MedRetrieve-Lite against standard BM25 lexical search and dense Contriever baselines. Performance was evaluated using Mean Reciprocal Rank (MRR@10) and Precision@5, alongside human qualitative audits conducted by three board-certified clinicians evaluating 300 sampled retrieval chains for factual fidelity and clinical relevance.

Findings:
MedRetrieve-Lite achieved an MRR@10 of 0.742, significantly outperforming BM25 (0.518, p < 0.001) and generic dense retrieval (0.612, p < 0.01). Clinical audits indicated a 41% reduction in irrelevant document grounding. Retrieval latency averaged 28 milliseconds per query on a single NVIDIA A10G GPU.

Limitations:
The benchmark was restricted to English-language electronic health records and peer-reviewed abstracts, potentially limiting cross-linguistic generalization. Furthermore, queries involving multi-modal imaging notes were excluded from the dataset. While factual grounding improved, downstream generative reasoning errors still occurred in 12% of zero-shot synthesis attempts.`,
  },
  {
    title: 'Microplastic Ingestion Rates in Benthic vs Pelagic Freshwater Invertebrates',
    text: `Abstract:
Anthropogenic microplastic pollution poses escalating risks to freshwater trophic chains. However, differential bioaccumulation kinetics between benthic detritivores and pelagic filter-feeders remain poorly quantified under controlled mesocosm conditions. Over a 90-day exposure experiment, we examined the uptake, gut retention, and cellular oxidative stress markers across Chironomus riparius (benthic larvae) and Daphnia magna (pelagic cladoceran) subjected to environmentally relevant concentrations (50 to 500 particles/L) of fluorescent polyethylene fragments (10-50 μm).

Methods:
Water quality parameters (temperature 20±1°C, dissolved oxygen >85%, pH 7.8) were monitored continuously. Invertebrates were sampled at days 7, 14, 30, 60, and 90. Microplastic burdens were quantified via fluorescence stereomicroscopy and micro-FTIR spectroscopy following chemical digestion with 10% KOH. Superoxide dismutase (SOD) activity and malondialdehyde (MDA) lipid peroxidation levels were assessed spectrophotometrically.

Results:
Benthic C. riparius exhibited 3.8-fold higher steady-state particle accumulation (mean: 42.6 ± 6.1 particles/individual) compared to pelagic D. magna (mean: 11.2 ± 2.3 particles/individual, p < 0.0001). Oxidative stress was markedly elevated in benthic organisms, with MDA concentrations increasing by 68% relative to unexposed controls by day 60. Egestion rates in D. magna were significantly higher, indicating lower internal residency time.

Limitations:
Experiments utilized spherical virgin polyethylene microspheres rather than weathered, irregularly shaped secondary microplastics bearing environmental biofilms. Toxicological interactions with co-contaminants (e.g., heavy metals and persistent organic pollutants) were not modeled in this single-stressor framework.`,
  },
];

export const SAMPLE_GAP_TEXTS = [
  {
    topic: 'Telemedicine Adoption in Rural Chronic Care',
    text: `Extensive research over the past five years has documented that video-based telehealth interventions can achieve clinical outcomes comparable to in-person consultations for hypertension and Type 2 diabetes management. Prior studies have heavily focused on short-term glycemic control (HbA1c levels measured at 3 to 6 months post-intervention) and patient satisfaction scores among insured suburban cohorts. Most randomized controlled trials have utilized dedicated mobile apps with remote cellular monitoring hardware provided directly by research grants. Quantitative meta-analyses consistently report modest improvements in patient compliance and self-monitoring frequency.`,
  },
  {
    topic: 'Transformer Model Pruning and Edge Deployment',
    text: `Recent advances in neural network compression have established weight pruning and 4-bit post-training quantization as effective strategies for reducing memory footprint in large language models. Existing empirical benchmarks (such as GLUE and MMLU) demonstrate that models pruned by up to 50% sparsity retain more than 95% of their baseline zero-shot accuracy when evaluated on standard English academic corpora. Experimental evaluations are routinely conducted on high-throughput server-grade GPUs (e.g., NVIDIA H100 and A100 clusters) running synthetic batched inference pipelines.`,
  },
];

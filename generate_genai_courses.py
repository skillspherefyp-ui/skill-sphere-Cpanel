from fpdf import FPDF, XPos, YPos
import os, shutil, re

ORANGE      = (246, 139, 60)
CODE_BG     = (40, 42, 54)
CODE_FG     = (248, 248, 242)
BODY        = (33, 33, 33)
SECTION_CLR = (30, 90, 160)

def sanitize(text):
    replacements = {
        '\u2014': '--', '\u2013': '-', '\u2018': "'", '\u2019': "'",
        '\u201c': '"',  '\u201d': '"', '\u2022': '*', '\u2026': '...',
        '\u00a0': ' ',  '\u2192': '->', '\u2190': '<-', '\u2194': '<->',
        '\u2260': '!=', '\u2264': '<=', '\u2265': '>=', '\u00d7': 'x',
    }
    for ch, rep in replacements.items():
        text = text.replace(ch, rep)
    return text.encode('latin-1', errors='replace').decode('latin-1')

class CoursePDF(FPDF):
    def __init__(self, topic_title):
        super().__init__()
        self.topic_title = topic_title
        self.set_margins(20, 20, 20)
        self.set_auto_page_break(auto=True, margin=22)
        self.add_page()

    def topic_banner(self):
        self.set_font('Helvetica', 'B', 17)
        title_text = sanitize(self.topic_title)
        self.set_xy(26, 17)
        self.set_text_color(*BODY)
        self.multi_cell(164, 10, title_text)
        bar_h = max(14, self.get_y() - 15 + 2)
        self.set_fill_color(*ORANGE)
        self.rect(18, 15, 4, bar_h, style='F')
        self.set_xy(26, 17)
        self.set_font('Helvetica', 'B', 17)
        self.set_text_color(*BODY)
        self.multi_cell(164, 10, title_text)
        self.ln(6)

    def section(self, title):
        self.ln(5)
        if self.get_y() > self.page_break_trigger - 20:
            self.add_page()
        self.set_font('Helvetica', 'B', 11.5)
        self.set_text_color(*SECTION_CLR)
        self.multi_cell(0, 7, sanitize(title))
        self.set_text_color(*BODY)
        self.ln(2)

    def bullet(self, text):
        self.set_font('Helvetica', '', 10.5)
        self.set_text_color(*BODY)
        text = sanitize(text)
        needed_h = max(1, (len(text) + 89) // 90) * 6 + 3
        if self.get_y() + needed_h > self.page_break_trigger:
            self.add_page()
        y = self.get_y()
        self.set_xy(20, y)
        self.set_font('Helvetica', 'B', 14)
        self.cell(6, 6, chr(149), new_x=XPos.RIGHT, new_y=YPos.TOP)
        self.set_font('Helvetica', '', 10.5)
        self.set_xy(26, y)
        self.multi_cell(164, 6, text)
        self.ln(1)

    def code(self, lines):
        self.ln(3)
        pad, line_h, box_w, max_ch = 5, 5.2, 170, 96
        txt_w = box_w - pad * 2
        wrapped = []
        for raw in lines:
            raw = sanitize(raw)
            if len(raw) <= max_ch:
                wrapped.append(raw)
            else:
                indent_str = ' ' * min(len(raw) - len(raw.lstrip()), 8)
                while len(raw) > max_ch:
                    wrapped.append(raw[:max_ch])
                    raw = indent_str + raw[max_ch:].lstrip()
                if raw:
                    wrapped.append(raw)
        total_h = len(wrapped) * line_h + pad * 2
        if self.get_y() + total_h > self.page_break_trigger:
            self.add_page()
        block_y = self.get_y()
        self.set_fill_color(*CODE_BG)
        self.rect(20, block_y, box_w, total_h, style='F')
        self.set_font('Courier', '', 9)
        self.set_text_color(*CODE_FG)
        self.set_xy(20 + pad, block_y + pad)
        for line in wrapped:
            self.set_x(20 + pad)
            self.cell(txt_w, line_h, line, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_text_color(*BODY)
        self.ln(5)

    def divider(self):
        self.ln(2)
        self.set_draw_color(210, 210, 210)
        self.line(20, self.get_y(), 190, self.get_y())
        self.ln(4)


# =============================================================================
# COURSE 1 -- Introduction to Generative AI  (12 topics)
# =============================================================================
INTRO_GENAI = [

("Topic 1: What is Generative AI?", [
    ("1.1 Definition and Core Idea", [
        "Generative AI refers to artificial intelligence systems that can create new content -- text, images, audio, video, and code -- rather than just analysing or classifying existing content",
        "Traditional (discriminative) AI: takes input, produces a label or decision (spam/not spam, cat/dog)",
        "Generative AI: takes input (a prompt, an image, a melody) and produces entirely new content",
        "The content it generates did not exist before -- it is synthesised from learned statistical patterns",
        "Examples: ChatGPT writes essays, DALL-E 3 creates images, Suno composes music, GitHub Copilot writes code",
    ], None),
    ("1.2 How is it Different from Traditional AI?", [
        "Discriminative models learn the boundary between categories: 'Is this email spam?'",
        "Generative models learn the underlying data distribution: 'What does a legitimate email look like?'",
        "Traditional AI output: a class label, a probability, a numeric prediction",
        "Generative AI output: text, images, audio, video, code, 3D models, synthetic data",
        "Both are machine learning -- generative AI is simply applied to the task of creation",
    ], None),
    ("1.3 Why Did Generative AI Emerge Now?", [
        "Transformers (2017): a new neural network architecture that processes entire sequences in parallel, enabling massive scale",
        "Scale: models trained on hundreds of billions of parameters and trillions of text tokens unlocked emergent abilities",
        "Data: the internet provided unprecedented volumes of human-generated text, images, and code for training",
        "Hardware: GPU and TPU improvements made training and inference economically viable at large scale",
        "The result: models that can hold conversations, write software, pass professional exams, and generate photorealistic images",
    ], None),
    ("1.4 Key Terms to Know", [
        "Prompt: the input you give the model -- a question, instruction, or example",
        "Token: the unit of text a model processes (roughly one word or sub-word); pricing and context limits are measured in tokens",
        "Context window: the maximum amount of text (in tokens) the model can consider at once",
        "Inference: running the model to generate output (as opposed to training)",
        "Hallucination: when a model generates confident but factually incorrect information",
    ], None),
]),

("Topic 2: A Brief History of AI", [
    ("2.1 Early AI (1950s--1980s)", [
        "1950: Alan Turing proposes the Turing Test -- can a machine exhibit intelligent behaviour indistinguishable from a human?",
        "1956: the term 'Artificial Intelligence' is coined at the Dartmouth Conference by John McCarthy and colleagues",
        "1960s--70s: rule-based expert systems -- AI encoded as hand-written IF-THEN rules",
        "First AI Winter (1974--1980): overhyped promises went unmet; research funding dried up",
        "1980s: expert systems revival -- useful in narrow domains but too brittle and expensive to scale",
        "Second AI Winter (1987--1993): expert systems failed to generalise; investment collapsed again",
    ], None),
    ("2.2 Machine Learning Era (1990s--2012)", [
        "Shift from hand-coded rules to learning patterns from data automatically",
        "1997: IBM Deep Blue defeats world chess champion Garry Kasparov",
        "2006: Geoffrey Hinton revives deep neural networks with deep belief networks",
        "2009: ImageNet dataset published -- 1.2 million labelled images enabling computer vision benchmarks",
        "2012: AlexNet wins the ImageNet competition by a large margin using deep learning, launching the deep learning era",
        "2014: Generative Adversarial Networks (GANs) introduced by Ian Goodfellow -- generators and discriminators compete to produce realistic images",
    ], None),
    ("2.3 The Road to Modern Generative AI (2017--2022)", [
        "2017: 'Attention is All You Need' paper by Vaswani et al. introduces the Transformer architecture (arxiv.org/abs/1706.03762)",
        "2018: BERT (Google) and GPT-1 (OpenAI) -- large language models pre-trained on text and fine-tuned for tasks",
        "2019: GPT-2 (1.5 billion parameters) -- so capable OpenAI initially staged its release over safety concerns",
        "2020: GPT-3 (175 billion parameters) -- demonstrated in-context learning and remarkably general capabilities",
        "2021: DALL-E and Codex released; AlphaFold 2 (DeepMind) predicts protein structures with high accuracy",
        "2022: Stable Diffusion (open source), ChatGPT, and Midjourney bring generative AI to a mainstream audience",
    ], None),
    ("2.4 The Current Era (2023--Present)", [
        "2023: GPT-4 (multimodal), Claude 2 (Anthropic), Gemini (Google) -- near-human performance on many professional benchmarks",
        "2023: Llama 2 (Meta) released as open weights -- enabling the open-source AI ecosystem to grow rapidly",
        "2024: smaller but highly capable models (Llama 3, Mistral, Phi-3) that run on consumer hardware",
        "2024--2025: AI agents -- models that plan, use external tools, browse the web, and complete multi-step tasks",
        "The pace of capability improvement is accelerating; abilities that seemed years away have arrived in months",
    ], None),
]),

("Topic 3: How Neural Networks Work", [
    ("3.1 The Neuron -- Basic Building Block", [
        "A neural network is loosely inspired by the brain -- it consists of layers of artificial neurons",
        "Each neuron: takes multiple numerical inputs, multiplies each by a learned weight, sums them, applies an activation function",
        "Weights determine how important each input is -- learning means finding the right set of weights",
        "Activation functions (ReLU, sigmoid, softmax) add non-linearity, allowing the network to learn complex patterns",
        "Without activation functions, stacking layers is mathematically equivalent to a single linear transformation",
        "Interactive demo: https://playground.tensorflow.org",
    ], [
        "Single neuron computation:",
        "",
        "output = activation( w1*x1 + w2*x2 + w3*x3 + bias )",
        "",
        "Where:",
        "  x1, x2, x3 = input values",
        "  w1, w2, w3 = learned weights (updated during training)",
        "  bias        = a learned offset value",
        "  activation  = ReLU: max(0, x)   (zero for negatives, x for positives)",
    ]),
    ("3.2 Layers and the Forward Pass", [
        "Input layer: receives raw data (pixel values, token embeddings, numbers)",
        "Hidden layers: transform data through learned weights; depth enables increasingly abstract feature extraction",
        "Output layer: produces the final prediction (class probabilities, a generated token, a number)",
        "Forward pass: data flows from input -> hidden layers -> output, producing a prediction",
        "'Deep' in deep learning refers to having many hidden layers (often dozens to hundreds in modern models)",
    ], None),
    ("3.3 Training -- How Networks Learn", [
        "Loss function: measures how wrong the network's prediction is (e.g., cross-entropy for classification)",
        "Backpropagation: computes the gradient (direction of steepest error increase) for every weight using the chain rule",
        "Gradient descent: nudge every weight slightly in the direction that reduces the loss",
        "Learning rate: controls the size of each nudge -- too large causes instability; too small is very slow",
        "Epoch: one complete pass through the training dataset; training typically runs for many epochs",
        "The network improves incrementally with each update, gradually fitting the patterns in the data",
    ], None),
    ("3.4 Overfitting and Generalisation", [
        "Overfitting: the model memorises training examples but performs poorly on new, unseen data",
        "Underfitting: the model is too simple to capture the patterns; high error on both training and test data",
        "Goal: generalisation -- good performance on data the model has never seen",
        "Common solutions: more training data, dropout (randomly disable neurons during training), weight regularisation, early stopping",
        "Train / validation / test split: keep separate data to detect overfitting and measure final performance honestly",
    ], None),
]),

("Topic 4: The Transformer Architecture", [
    ("4.1 Why Transformers Changed Everything", [
        "Before 2017, sequence models (RNNs, LSTMs) processed text one token at a time -- slow and hard to parallelise",
        "The Transformer (Vaswani et al., 2017) processes all tokens in a sequence simultaneously using self-attention",
        "This allowed training on vastly larger datasets using modern GPU hardware at scale",
        "Transformers became the foundation for GPT, BERT, T5, Claude, Gemini, and almost every modern LLM",
        "Original paper: https://arxiv.org/abs/1706.03762",
    ], None),
    ("4.2 Self-Attention -- The Core Mechanism", [
        "Self-attention allows each token to 'look at' all other tokens in the sequence when computing its representation",
        "For each token, the model computes Query, Key, and Value vectors from the token's embedding",
        "Attention scores: dot product of Query with all Keys, scaled and softmaxed to produce weights that sum to 1",
        "Output: weighted sum of Values, where higher-scoring tokens contribute more",
        "This lets the model capture long-range dependencies -- the word 'it' can attend to 'the bank' 20 tokens earlier",
    ], [
        "Simplified attention for one token:",
        "",
        "scores = softmax( Query . Key^T / sqrt(d_k) )",
        "output = scores . Values",
        "",
        "The result: each token's output is a mix of all other tokens,",
        "weighted by how relevant they are to each other.",
    ]),
    ("4.3 Key Components of a Transformer", [
        "Token embeddings: convert each token (word/sub-word) into a dense numeric vector",
        "Positional encodings: inject information about each token's position (since attention is order-agnostic)",
        "Multi-head attention: run self-attention in parallel with different learned projections to capture different relationships",
        "Feed-forward layers: applied after attention in each block; add capacity for learning complex transformations",
        "Layer normalisation: stabilises training by normalising activations at each layer",
        "Residual connections: skip connections that help gradients flow during training of deep stacks",
    ], None),
    ("4.4 Encoder, Decoder, and Encoder-Decoder", [
        "Encoder-only (e.g., BERT): processes input bidirectionally; used for classification, search, embeddings",
        "Decoder-only (e.g., GPT, Claude, Llama): generates text autoregressively -- predicts the next token given all previous tokens",
        "Encoder-decoder (e.g., T5, BART): encoder reads input, decoder generates output -- used for translation and summarisation",
        "Modern LLMs are almost all decoder-only: they are trained to predict the next token on massive text corpora",
        "Context window (e.g., 128k tokens in GPT-4, 200k in Claude) limits how much text can be processed at once",
    ], None),
]),

("Topic 5: Large Language Models", [
    ("5.1 What Makes a Language Model 'Large'?", [
        "Scale: LLMs have billions to hundreds of billions of parameters (learned weights)",
        "GPT-3 (2020): 175 billion parameters, trained on ~570 GB of text",
        "Scale unlocks emergent abilities that smaller models do not exhibit: multi-step reasoning, in-context learning, code generation",
        "Pre-training: the model learns to predict the next token on a massive, diverse corpus of internet text, books, and code",
        "Fine-tuning + RLHF: a pre-trained model is then shaped into a helpful assistant via supervised examples and human feedback",
    ], None),
    ("5.2 Major LLM Families", [
        "OpenAI -- GPT-4o, GPT-4 Turbo: strongest general reasoning; powers ChatGPT and the OpenAI API (openai.com/api)",
        "Anthropic -- Claude 3.5 Sonnet, Claude 3 Opus: strong writing and instruction-following; 200k token context (claude.ai)",
        "Google -- Gemini 1.5 Pro / Flash: natively multimodal; integrated into Google Workspace and Search (gemini.google.com)",
        "Meta -- Llama 3 (8B, 70B, 405B): open weights, free to download and self-host (llama.meta.com)",
        "Mistral AI -- Mistral 7B, Mixtral 8x7B: efficient open-source European models (mistral.ai)",
        "Explore open models: https://huggingface.co/models",
    ], None),
    ("5.3 Tokenisation", [
        "A tokeniser splits text into tokens before the model processes it (not always full words)",
        "Example: 'unbelievable' might become ['un', 'believ', 'able'] -- 3 tokens",
        "Token counts matter: pricing and context limits are measured in tokens, not words",
        "Rough rule: 1 token ~= 0.75 English words; 1,000 tokens ~= 750 words",
        "Different models use different tokenisers -- the same text produces different token counts across models",
    ], [
        "# Count tokens with OpenAI's tiktoken library:",
        "import tiktoken",
        "enc = tiktoken.encoding_for_model('gpt-4o')",
        "tokens = enc.encode('The quick brown fox jumps over the lazy dog.')",
        "print(len(tokens))  # -> 10 tokens",
    ]),
    ("5.4 In-Context Learning", [
        "In-context learning: the model adapts its behaviour based on examples provided in the prompt -- no retraining needed",
        "Zero-shot: give the task description only -- the model attempts it with no examples",
        "Few-shot: provide 2--5 examples of input/output pairs before the actual task",
        "Chain-of-thought: instruct the model to show reasoning steps: 'Think step by step'",
        "The model does not update its weights during inference -- it reads the context and responds accordingly",
    ], None),
]),

("Topic 6: Image Generation Models", [
    ("6.1 How Diffusion Models Work", [
        "Diffusion models are the dominant approach for image generation (Stable Diffusion, DALL-E 3, Midjourney)",
        "Forward process (training): gradually add Gaussian noise to a real image over many steps until it becomes pure noise",
        "Reverse process (inference): train a neural network to predict and remove noise step by step, starting from random noise",
        "Text conditioning: a text encoder (often CLIP or T5) converts the prompt into an embedding that guides the denoising",
        "Result: starting from random noise, the model iteratively denoises towards an image that matches the text prompt",
    ], None),
    ("6.2 Key Image Generation Tools", [
        "DALL-E 3 (OpenAI): integrated into ChatGPT Plus; excellent prompt adherence and ability to render text in images (openai.com)",
        "Midjourney: highest aesthetic quality for artistic and creative images; accessed via Discord or web (midjourney.com)",
        "Stable Diffusion: open-source model, free to download and run locally; huge ecosystem of community models (stability.ai)",
        "Adobe Firefly: trained on licensed Adobe Stock images -- safest for commercial use (firefly.adobe.com)",
        "Ideogram: strong at generating legible text within images; free tier available (ideogram.ai)",
        "Flux (Black Forest Labs): high-quality open-weight model, competitive with closed models",
    ], None),
    ("6.3 Writing Effective Image Prompts", [
        "Describe what you want to see, not how to make it -- be specific about subject, style, lighting, mood",
        "Style keywords: 'photorealistic', 'oil painting', 'watercolour', 'isometric 3D', 'Studio Ghibli aesthetic'",
        "Lighting: 'golden hour', 'dramatic studio lighting', 'soft diffused window light', 'neon backlight'",
        "Camera/lens: '85mm portrait lens', 'wide-angle', 'aerial drone shot', 'macro photography'",
        "Negative prompts (Stable Diffusion): specify what to exclude -- 'no text, no watermark, no blur'",
    ], [
        "WEAK:  a cat outside",
        "",
        "STRONG:",
        "A fluffy orange tabby cat resting on ancient stone steps,",
        "purple wisteria in full bloom overhead,",
        "soft golden-hour light, shallow depth of field,",
        "85mm lens, photorealistic, award-winning photography",
    ]),
    ("6.4 Stable Diffusion and Local Image Generation", [
        "Stable Diffusion can be run entirely on your own hardware -- no usage fees, no content filters by default",
        "Interfaces: Automatic1111 (feature-rich), ComfyUI (node-based workflow), Fooocus (simplified)",
        "Hardware: NVIDIA GPU with 6GB+ VRAM recommended; runs on CPU but slowly",
        "LoRA adapters: small fine-tuned files you add to the base model to change style or add a consistent character",
        "ControlNet: control composition precisely using pose skeletons, depth maps, or edge maps as guides",
        "Community models and guides: https://civitai.com",
    ], None),
]),

("Topic 7: Audio, Video, and Multimodal AI", [
    ("7.1 AI Audio Generation", [
        "Text-to-speech (TTS): AI generates natural-sounding speech from text -- far more natural than older synthesisers",
        "ElevenLabs: high-quality TTS and voice cloning; clone a voice from a short audio sample (elevenlabs.io)",
        "OpenAI TTS: available via API; voices include Alloy, Echo, Fable, Onyx, Nova, Shimmer",
        "Whisper (OpenAI): state-of-the-art speech-to-text; open source and free to use (github.com/openai/whisper)",
        "AI music generation: Suno (suno.com) and Udio (udio.com) generate full songs with lyrics from a text prompt",
        "Audio tools are rapidly improving -- voice cloning in particular raises serious concerns about deepfake audio",
    ], None),
    ("7.2 AI Video Generation", [
        "AI video generation produces short clips from text prompts or images -- quality improves rapidly",
        "Sora (OpenAI): generates realistic, temporally consistent videos up to one minute; available to ChatGPT Pro users",
        "Runway Gen-3 Alpha: professional-grade AI video generation and editing tools (runwayml.com)",
        "Kling AI (Kuaishou): high-quality video generation; free tier available (klingai.com)",
        "Pika: generates and edits short video clips from text or image prompts (pika.art)",
        "Limitation: AI video still struggles with physics, consistent hands/faces, and long coherent narratives",
    ], None),
    ("7.3 Multimodal AI Systems", [
        "Multimodal AI: models that accept and generate multiple types of data (text, image, audio, video) in one system",
        "GPT-4o (OpenAI): accepts text, image, and audio input; generates text and audio; powers ChatGPT voice mode",
        "Claude 3.5 (Anthropic): accepts text and images; particularly strong at analysing documents and charts",
        "Gemini 1.5 Pro (Google): natively multimodal; can process text, images, audio, video, and documents",
        "Use cases: describe a chart image and get analysis, take a photo of code and ask for a review, speak and receive spoken reply",
        "Multimodal models are converging text, vision, and audio into single unified systems",
    ], None),
    ("7.4 Deepfakes and Synthetic Media Risks", [
        "Deepfakes: AI-generated or AI-manipulated video/audio of real people -- voice cloning and face-swapping are now accessible",
        "Risks: non-consensual content, political disinformation, financial fraud via fake CEO audio/video",
        "Detection tools exist but are not fully reliable: Microsoft's Video Authenticator, Hive Moderation",
        "Legal landscape: several countries and US states now have laws specifically targeting non-consensual deepfakes",
        "Best practice: verify surprising audio or video of public figures against multiple reliable sources before sharing",
        "Content credentials (C2PA standard): a technical framework for signing media with proof of human or AI origin",
    ], None),
]),

("Topic 8: How AI Models are Trained", [
    ("8.1 Pre-Training on Large Corpora", [
        "Pre-training: the model learns by predicting the next token on an enormous dataset of text from the internet, books, and code",
        "Data sources: Common Crawl (web pages), The Pile, Wikipedia, GitHub code, books, scientific papers",
        "Self-supervised: no human labelling needed -- the 'label' is the next token, which already exists in the text",
        "Scale: GPT-3 was trained on ~300 billion tokens; modern frontier models use trillions",
        "Pre-training gives the model broad world knowledge and language understanding -- it becomes a 'base model'",
    ], None),
    ("8.2 Fine-Tuning and RLHF", [
        "Fine-tuning: continue training the base model on a smaller, curated dataset to specialise its behaviour",
        "Supervised fine-tuning (SFT): show the model high-quality example conversations written by human contractors",
        "RLHF (Reinforcement Learning from Human Feedback): human raters compare model outputs, training a reward model that scores responses",
        "The language model is then optimised using PPO (Proximal Policy Optimisation) to maximise the reward model's scores",
        "RLHF is responsible for making base models into useful, aligned assistants that follow instructions safely",
        "InstructGPT paper introducing RLHF: https://arxiv.org/abs/2203.02155",
    ], None),
    ("8.3 Compute and Infrastructure", [
        "Training frontier models requires specialised hardware: NVIDIA A100 or H100 GPUs, or Google TPUs",
        "Training GPT-3 was estimated to require thousands of A100 GPUs running for weeks",
        "Data centres for AI training require enormous amounts of electricity and specialised cooling",
        "Inference (serving the model to users) is much cheaper than training -- can use smaller, optimised hardware",
        "Quantisation: reducing model weight precision (e.g., 16-bit to 4-bit) reduces memory and speeds up inference",
        "Energy and water consumption of AI training is a growing environmental concern; major labs publish sustainability reports",
    ], None),
    ("8.4 Parameter-Efficient Adaptation", [
        "Full fine-tuning: update all model parameters on a new dataset -- very expensive for large models",
        "LoRA (Low-Rank Adaptation): add small trainable weight matrices to frozen model layers -- 10--100x fewer trainable parameters",
        "QLoRA: quantise the base model to 4-bit precision, then apply LoRA -- enables fine-tuning on consumer GPUs",
        "RAG (Retrieval-Augmented Generation): don't train at all -- retrieve relevant documents at query time and include them in the prompt",
        "For most applications, RAG or prompt engineering is more practical than fine-tuning",
    ], [
        "# LoRA fine-tuning with Hugging Face PEFT library:",
        "from peft import LoraConfig, get_peft_model",
        "from transformers import AutoModelForCausalLM",
        "",
        "base_model = AutoModelForCausalLM.from_pretrained('meta-llama/Llama-3-8b')",
        "lora_config = LoraConfig(r=16, lora_alpha=32, target_modules=['q_proj','v_proj'])",
        "model = get_peft_model(base_model, lora_config)",
        "model.print_trainable_parameters()  # ~0.1% of total parameters",
    ]),
]),

("Topic 9: AI Capabilities and Limitations", [
    ("9.1 What Generative AI Does Well", [
        "Language tasks: summarising, translating, classifying, drafting, rewriting, explaining -- often at or above human level",
        "Code generation: writing boilerplate, explaining code, finding bugs, suggesting tests, converting between languages",
        "Pattern recognition across modalities: classifying images, transcribing speech, describing visual content",
        "Knowledge retrieval: answering questions about well-documented topics present in training data",
        "Creativity support: brainstorming, ideation, generating variations, producing first drafts",
        "Speed: processes and generates thousands of words in seconds",
    ], None),
    ("9.2 Hallucinations", [
        "Hallucination: the model generates confident, fluent, but factually wrong information",
        "Root cause: LLMs predict the most statistically plausible next token, not verified truth -- plausible != accurate",
        "Common hallucinations: invented citations, wrong dates, fictional people presented as real, incorrect statistics",
        "Hallucination rates vary widely by model, topic, and prompt -- less common on well-documented topics, more on obscure ones",
        "Mitigation strategies: RAG (ground the model in verified documents), ask the model to cite sources, always verify critical facts independently",
        "Rule: never trust AI output on specific factual claims without independent verification",
    ], None),
    ("9.3 Bias, Fairness, and Safety", [
        "AI models learn the biases present in their training data -- human societal biases become model biases",
        "Gender bias: models may default to male pronouns for roles historically dominated by men",
        "Racial bias: some image generation models produce stereotyped representations of ethnic groups",
        "Cultural bias: models trained predominantly on English-language content perform worse for other languages and cultures",
        "Safety fine-tuning reduces but does not eliminate harmful outputs -- models can still be misused",
        "Ongoing research areas: bias auditing, red-teaming, constitutional AI, and diverse training data curation",
    ], None),
    ("9.4 Fundamental Limitations", [
        "Knowledge cutoff: models have a training data cutoff date and do not know about events after it (without tool use or retrieval)",
        "No persistent memory: each conversation starts fresh unless memory is explicitly implemented at the application level",
        "Arithmetic and precise reasoning: LLMs can make arithmetic errors; use code execution for reliable calculations",
        "Long-context degradation: performance can degrade on tasks that require using information from very early in a long context",
        "Consistency: the same prompt can produce different outputs across runs due to temperature (sampling randomness)",
        "No real-world agency: a base LLM cannot browse the internet, run code, or take actions without external tools",
    ], None),
]),

("Topic 10: Ethics and Responsible AI Use", [
    ("10.1 Misinformation and Content Authenticity", [
        "Generative AI dramatically lowers the cost of creating convincing but false text, images, audio, and video",
        "Synthetic media can be used for fraud, political manipulation, defamation, and non-consensual content",
        "Content credentials (C2PA): a technical standard for attaching verifiable provenance metadata to media (contentauthenticity.org)",
        "AI detection tools (GPTZero, Turnitin AI) detect AI-written text -- useful but not infallible",
        "Best practice: disclose AI use in published content; verify surprising media before sharing",
    ], None),
    ("10.2 Copyright and Intellectual Property", [
        "Training data: ongoing lawsuits question whether training AI on copyrighted content without permission constitutes infringement",
        "AI-generated output: US Copyright Office (2024) guidance: purely AI-generated content is generally not copyrightable",
        "Human-edited AI content may be copyrightable to the extent it reflects genuine human creative choices",
        "Safe commercial use: Adobe Firefly and Getty AI are trained exclusively on licensed content",
        "Legal landscape: rapidly evolving -- monitor guidance from copyright offices and courts in your jurisdiction",
        "EU AI Act (effective 2025): requires labelling of AI-generated content and transparency about training data",
    ], None),
    ("10.3 Privacy and Data Security", [
        "Public AI tools (ChatGPT free, Claude free): check privacy settings -- inputs may be used to improve models by default",
        "Never paste personally identifiable information (PII), passwords, API keys, or confidential business data into public AI tools",
        "Enterprise tiers (ChatGPT Team, Claude for Work, Google Workspace AI): typically include contractual data privacy guarantees",
        "Local models (Ollama + Llama 3): run entirely on your hardware -- zero data leaves your device (ollama.com)",
        "GDPR and sector-specific regulations: using AI tools to process personal data triggers compliance obligations",
    ], None),
    ("10.4 Environmental and Societal Impact", [
        "Energy: training large AI models and running inference at scale consumes significant electricity",
        "Water: data centre cooling uses millions of litres of water; major labs are beginning to report water usage",
        "Job market: AI is automating many routine cognitive tasks while creating new roles (AI trainers, prompt engineers, AI auditors)",
        "Access inequality: frontier AI tools require reliable internet and often a paid subscription -- not universally accessible",
        "AI safety research: organisations like Anthropic, DeepMind, and the AI Safety Institute study long-term risks (anthropic.com/research)",
        "Responsible use: as a practitioner, consider the downstream impact of what you build and deploy with AI",
    ], None),
]),

("Topic 11: Real-World Applications of Generative AI", [
    ("11.1 Workplace Productivity", [
        "Writing assistance: drafting emails, reports, proposals, and meeting summaries",
        "Research and synthesis: summarising long documents, comparing multiple sources, answering questions about uploaded files",
        "Code assistance: GitHub Copilot, Cursor, and Codeium accelerate software development for developers of all skill levels",
        "Customer service: AI chatbots handle routine support queries around the clock and route complex issues to human agents",
        "Data analysis: natural language queries to databases and spreadsheets ('Show me revenue by region for Q3')",
        "Meeting tools: Otter.ai, Fireflies.ai, and Fathom automatically transcribe, summarise, and extract action items",
    ], None),
    ("11.2 Creative and Media Industries", [
        "Graphic design: AI-generated concepts, logo variations, image editing, and social media visuals",
        "Music: AI composes background tracks (Suno, Udio), generates sound effects, and assists with mixing",
        "Film and TV: AI generates storyboards, concept art, visual effects, and dubbing in new languages",
        "Game development: AI generates textures, dialogue trees, NPC behaviours, and level design elements",
        "Publishing: AI assists with research, structural editing, cover design concepts, and marketing copy",
    ], None),
    ("11.3 Science and Research", [
        "AlphaFold 2 (DeepMind, 2021): predicted the 3D structures of nearly all known proteins -- a 50-year problem solved; database publicly available at alphafold.ebi.ac.uk",
        "Drug discovery: AI identifies candidate molecules, predicts binding affinity, and flags potential toxicity -- reducing early-stage development time",
        "Materials science: AI models propose new materials with target properties such as improved battery performance or superconductivity",
        "Climate and weather: AI models (GraphCast, Pangu-Weather) produce weather forecasts faster and more accurately than traditional numerical methods",
        "Mathematics: AI assists in theorem proving; Google DeepMind's AlphaProof won silver-medal performance at the 2024 International Mathematical Olympiad",
    ], None),
    ("11.4 Healthcare", [
        "Medical imaging: AI systems detect cancers, diabetic retinopathy, and fractures from X-rays and MRIs with performance comparable to specialist radiologists in specific benchmarks",
        "Clinical notes: AI transcribes doctor-patient conversations and generates structured clinical notes automatically (e.g., Nuance DAX, Suki)",
        "Drug discovery: Insilico Medicine used AI to identify a novel drug candidate for pulmonary fibrosis; it entered Phase 2 clinical trials -- a significantly compressed timeline",
        "Genomics: AI analyses genetic variants to support personalised treatment decisions",
        "Caution: all clinical AI tools require regulatory approval and human oversight; AI does not replace clinical judgement",
    ], None),
]),

("Topic 12: Getting Started with Generative AI", [
    ("12.1 Tools to Sign Up for Today", [
        "ChatGPT (chat.openai.com): free tier uses GPT-4o mini; Plus ($20/month) gives GPT-4o with image input and generation",
        "Claude (claude.ai): free tier available; excellent for long documents, nuanced writing, and complex instruction-following",
        "Google Gemini (gemini.google.com): free with a Google account; integrates with Gmail, Docs, and Drive",
        "Microsoft Copilot (copilot.microsoft.com): free, powered by GPT-4; integrated into Windows and Edge",
        "Perplexity AI (perplexity.ai): AI-powered search with cited sources; free tier available -- great for research",
        "GitHub Copilot (github.com/features/copilot): AI coding assistant; free for students and open-source contributors",
    ], None),
    ("12.2 Your First Steps", [
        "Use ChatGPT or Claude every day for tasks you currently do manually: emails, summaries, research questions, code help",
        "Learn prompt engineering: be specific about your goal, audience, format, and tone -- vague prompts produce vague output",
        "Get API access (openai.com/api or console.anthropic.com) and make your first API call in Python",
        "Build a small project: a document summariser, a chatbot for a FAQ, a code reviewer -- learning by building is fastest",
        "Explore Ollama (ollama.com) to run open-source models like Llama 3 locally, free, with full privacy",
    ], [
        "# Your first OpenAI API call (Python):",
        "pip install openai",
        "",
        "from openai import OpenAI",
        "client = OpenAI(api_key='your-key-here')",
        "",
        "response = client.chat.completions.create(",
        "    model='gpt-4o-mini',",
        "    messages=[{'role': 'user', 'content': 'Explain neural networks in 3 sentences.'}]",
        ")",
        "print(response.choices[0].message.content)",
    ]),
    ("12.3 Recommended Learning Path", [
        "Beginner (this course): understand what generative AI is, how it works, and the key tools",
        "Next -- Prompt Engineering: learn to write effective prompts that consistently produce high-quality output",
        "Next -- AI Tools for Everyday Use: master ChatGPT, Claude, Copilot, Midjourney, Notion AI in depth",
        "Intermediate -- Working with LLM APIs: build applications in Python using the OpenAI, Anthropic, or Gemini API",
        "Intermediate -- RAG (Retrieval-Augmented Generation): connect AI to your own documents and databases",
        "Intermediate -- AI Agents: build AI systems that use tools, browse the web, and complete multi-step tasks",
        "Advanced: Fine-Tuning, Evaluation, Production AI, MLOps",
    ], None),
    ("12.4 Staying Current", [
        "AI capabilities change faster than almost any other technology -- stay curious and experiment regularly",
        "Newsletters: The Batch (Andrew Ng, deeplearning.ai), TLDR AI, The Neuron, Lenny's Newsletter",
        "Research papers: arxiv.org/cs.AI -- read abstracts of key papers; skim full papers for landmark work",
        "Community: Hugging Face forums, Reddit r/MachineLearning, r/LocalLLaMA, AI Twitter/X",
        "Courses: fast.ai (free), deeplearning.ai short courses (free/paid), Hugging Face NLP course (free)",
        "deeplearning.ai: https://www.deeplearning.ai  |  Hugging Face: https://huggingface.co/learn",
    ], None),
]),

]  # end INTRO_GENAI


# =============================================================================
# COURSE 3 -- AI Tools for Everyday Use  (13 topics)
# =============================================================================
AI_TOOLS = [

("Topic 1: The AI Tools Landscape", [
    ("1.1 Categories of AI Productivity Tools", [
        "Text / writing assistants: ChatGPT, Claude, Gemini -- general-purpose AI chat and writing",
        "Coding assistants: GitHub Copilot, Cursor, Codeium -- AI inside your code editor",
        "Image generation: DALL-E 3, Midjourney, Stable Diffusion, Adobe Firefly -- text-to-image",
        "Research and search: Perplexity AI, NotebookLM, Elicit -- AI-enhanced information retrieval",
        "Productivity suites: Microsoft 365 Copilot, Google Workspace AI -- AI embedded in Office tools",
        "Meeting and audio: Otter.ai, Fathom, Fireflies.ai -- transcription and meeting summaries",
    ], None),
    ("1.2 Choosing the Right Tool for Your Task", [
        "Text tasks: try ChatGPT, Claude, and Gemini -- each has strengths; the best choice depends on your specific task",
        "Image tasks: Midjourney (artistic quality), DALL-E 3 (precise/literal), Stable Diffusion (customisable and free)",
        "Coding: GitHub Copilot in your editor for completions; Claude or ChatGPT for explanations and debugging",
        "Research with citations: Perplexity AI; research within your own uploaded documents: NotebookLM",
        "Office productivity: Microsoft Copilot if you use Microsoft 365; Google Gemini if you use Google Workspace",
        "Rule: use the AI that is already inside your existing workflow -- adoption beats perfection",
    ], None),
    ("1.3 Privacy and Security Basics", [
        "Free public AI tools: your inputs may be used to improve models by default -- check and update privacy settings",
        "Never paste confidential data, PII, passwords, or API keys into public AI chat interfaces",
        "Enterprise / Team tiers: ChatGPT Team, Claude for Work, Google Workspace AI include contractual data privacy",
        "Local models: Ollama (ollama.com) runs Llama 3, Mistral, and others entirely on your machine -- no data leaves",
        "Treat AI tools like any other third-party SaaS: review the terms of service before using with sensitive data",
    ], None),
    ("1.4 Building an AI Habit", [
        "Start with one tool, use it daily for 2 weeks before adding others -- depth before breadth",
        "Identify your 3 most time-consuming recurring tasks and experiment with AI for each one",
        "Track your experience: what worked, what did not, what prompts produced the best results",
        "Share workflows with colleagues -- AI productivity compounds when teams adopt consistent practices together",
        "Expect imperfect output: AI tools produce errors regularly; always review output before using it",
    ], None),
]),

("Topic 2: ChatGPT", [
    ("2.1 What is ChatGPT?", [
        "ChatGPT is a conversational AI assistant built on OpenAI's GPT models -- the most widely used AI tool in the world",
        "Free tier: GPT-4o mini -- fast, capable, handles most everyday writing, research, and coding tasks",
        "ChatGPT Plus ($20/month): GPT-4o -- more powerful reasoning, image input, image generation (DALL-E 3), web browsing",
        "ChatGPT Team / Enterprise: data privacy guarantees, higher usage limits, admin controls for organisations",
        "Try it: https://chat.openai.com",
    ], None),
    ("2.2 Core Features", [
        "Custom instructions: set persistent context once ('I am a software engineer; always respond in Python 3') -- applies to all chats",
        "Memory: ChatGPT can remember facts across conversations (opt-in); manage or clear in settings",
        "Custom GPTs: create or use pre-configured AI assistants with specific instructions and tools (ChatGPT Plus)",
        "File and image upload: analyse PDFs, spreadsheets, images, and code files directly",
        "Web browsing (Plus): searches Bing in real time for current events and up-to-date information",
        "DALL-E 3 integration (Plus): generate images directly in chat from a text description",
    ], None),
    ("2.3 Getting the Most from ChatGPT", [
        "Be specific: provide role, task, format, tone, length, and audience in your prompts",
        "Iterate: most great outputs come after 2--3 refinements, not a single prompt",
        "Verify facts: ChatGPT confidently states incorrect information -- always check statistics, dates, and citations",
        "Don't paste sensitive data: use ChatGPT Team or local models for confidential work",
        "Use for what it does best: writing, brainstorming, code explanation, summarisation, and drafting",
    ], [
        "Effective prompt example:",
        "",
        "'You are a senior project manager.",
        "Write a professional email to my team of 5 software engineers",
        "summarising today's sprint planning meeting.",
        "Key points: 3 sprint goals agreed, deadline is Friday,",
        "Alice leads the API work.",
        "Tone: friendly but focused. Length: under 150 words.'",
    ]),
    ("2.4 Common Mistakes to Avoid", [
        "Trusting factual claims without verification -- always check specific numbers, citations, and recent events",
        "Pasting sensitive or confidential data into the public free/Plus tier",
        "Accepting the first output without iterating -- refine with follow-up instructions",
        "Using it only for writing -- explore it for data analysis, code review, research, and planning",
        "Ignoring Custom Instructions -- setting context once saves significant time across many conversations",
    ], None),
]),

("Topic 3: Claude by Anthropic", [
    ("3.1 What Makes Claude Different?", [
        "Claude is built by Anthropic, an AI safety company, with a strong focus on honesty and avoiding harmful outputs",
        "Industry-leading context window: Claude 3.5 supports up to 200,000 tokens (~150,000 words) in one conversation",
        "Free tier: Claude 3.5 Haiku (fast, capable); Claude.ai Pro ($20/month): Claude 3.5 Sonnet and Opus",
        "Excellent at: processing long documents, nuanced writing, following complex multi-part instructions, and code review",
        "Try it: https://claude.ai  |  Developer docs: https://www.anthropic.com/claude",
    ], None),
    ("3.2 Claude's Key Strengths", [
        "Long documents: upload entire books, legal contracts, codebases, or research papers and ask questions about them",
        "Writing quality: tends to produce more natural, less formulaic prose than many AI tools",
        "Instruction following: very reliable at adhering to detailed, multi-part instructions across a long response",
        "Code review: provides thorough, thoughtful feedback on code architecture and logic, not just syntax",
        "Analytical reasoning: handles nuanced, ambiguous problems where there is no single clear answer",
    ], None),
    ("3.3 Best Use Cases for Claude", [
        "Contract and legal review: upload a long document and ask for a plain-English summary and risk flags",
        "Research synthesis: upload multiple papers and ask Claude to compare methodologies and synthesise findings",
        "Long-form writing: chapters, detailed reports, complex proposals -- Claude maintains coherence across long outputs",
        "Complex coding questions: paste an entire codebase context and ask architectural or debugging questions",
        "Sensitive topics: Claude handles nuanced or difficult discussions with care",
    ], [
        "Example -- contract review prompt:",
        "",
        "'I am uploading a 30-page supplier agreement.",
        "Please:",
        "1. Summarise the key terms in plain English",
        "   (payment terms, IP ownership, termination clauses, liability caps)",
        "2. Flag any clauses that are unusual or unfavourable to the buyer",
        "3. List 3 questions I should ask before signing",
        "Assume I am a non-lawyer small business owner.'",
    ]),
    ("3.4 Claude vs ChatGPT -- Practical Guide", [
        "Use Claude when: the input is very long, writing quality is critical, or you need precise instruction-following",
        "Use ChatGPT when: you need image generation (DALL-E 3), spreadsheet analysis, web browsing, or Custom GPTs",
        "Use both in parallel for important tasks: paste the same prompt into both and compare; they complement each other",
        "Switching cost is zero: both run in the browser with no installation required",
    ], None),
]),

("Topic 4: GitHub Copilot", [
    ("4.1 What is GitHub Copilot?", [
        "GitHub Copilot is an AI coding assistant that integrates directly into your code editor",
        "Built by GitHub (Microsoft) in partnership with OpenAI, trained on billions of lines of public code",
        "Integrates with: VS Code, JetBrains IDEs (IntelliJ, PyCharm, etc.), Neovim, Visual Studio, Azure Data Studio",
        "Pricing: free for students and open-source maintainers; individual $10/month; Business $19/user/month",
        "Documentation: https://github.com/features/copilot",
    ], None),
    ("4.2 Core Features", [
        "Inline completions: as you type, Copilot suggests the next line or block of code -- press Tab to accept",
        "Copilot Chat: ask questions in natural language directly in your editor ('Explain this function', 'Fix this bug')",
        "Generate from comments: write a plain-English comment describing the function, Copilot writes the implementation",
        "Terminal integration: Copilot explains shell commands and suggests fixes for command errors",
        "Pull request descriptions: automatically generates PR summaries from your code diff",
    ], [
        "# Write a comment, Copilot generates the implementation:",
        "",
        "# Read a CSV file and return only rows where",
        "# the 'status' column equals 'active'",
        "def get_active_users(filepath: str) -> list[dict]:",
        "    import csv",
        "    with open(filepath, newline='') as f:",
        "        reader = csv.DictReader(f)",
        "        return [row for row in reader if row['status'] == 'active']",
    ]),
    ("4.3 Getting the Most from Copilot", [
        "Write descriptive comments before functions -- Copilot uses them as instructions for the implementation",
        "Name functions and variables clearly -- good names guide better and more relevant completions",
        "Use Copilot Chat for explanation: select a confusing block of code, right-click, and ask 'Explain this'",
        "Generate tests: open a function file and ask Copilot Chat to 'Write unit tests for this module'",
        "Always review every suggestion -- Copilot can introduce subtle bugs, especially around edge cases and security",
    ], None),
    ("4.4 Alternatives to Copilot", [
        "Cursor (cursor.com): AI-first code editor (fork of VS Code) with deeper AI integration; free and paid tiers",
        "Codeium (codeium.com): free alternative to Copilot; good for personal and student projects",
        "Amazon CodeWhisperer: free for individuals; well-suited to AWS-related code",
        "Tabnine (tabnine.com): privacy-focused; enterprise option allows models to run locally",
        "Continue.dev: open-source, connects to any LLM including locally-run Ollama models",
    ], None),
]),

("Topic 5: Microsoft Copilot in Office 365", [
    ("5.1 What is Microsoft 365 Copilot?", [
        "Microsoft 365 Copilot integrates AI directly into Word, Excel, PowerPoint, Outlook, Teams, and OneNote",
        "Powered by GPT-4 with access to your organisation's own data via Microsoft Graph",
        "Pricing: Microsoft 365 Copilot costs $30/user/month (requires an existing Microsoft 365 subscription)",
        "Key promise: AI that knows your organisation's documents, emails, meetings, and calendar",
        "Data security: your data stays within your Microsoft 365 tenant and is not used to train public models",
        "Microsoft Copilot (free): available at copilot.microsoft.com without a Microsoft 365 subscription",
    ], None),
    ("5.2 Copilot in Word and PowerPoint", [
        "Word -- Draft: 'Write a project proposal for a new employee onboarding portal based on [document reference]'",
        "Word -- Rewrite: select any text and ask Copilot to change tone, shorten, expand, or simplify it",
        "Word -- Summarise: 'What are the 5 key decisions in this 40-page strategy document?'",
        "PowerPoint -- Create: 'Create a 10-slide presentation about sustainable packaging for a retail audience'",
        "PowerPoint -- Add slide: 'Add a slide comparing our Q3 and Q4 revenue based on this data'",
    ], None),
    ("5.3 Copilot in Excel and Outlook", [
        "Excel -- Analysis: 'Show me the top 5 products by margin this quarter, and highlight any with declining trend'",
        "Excel -- Formulas: describe what you want to calculate; Copilot writes the formula and explains it",
        "Excel -- Data cleaning: 'Identify and flag duplicate customer entries in column A'",
        "Outlook -- Draft: Copilot drafts email replies in your writing style from bullet points",
        "Outlook -- Summarise: 'Summarise this 20-message email thread and list the open questions'",
    ], None),
    ("5.4 Copilot in Teams and Business Chat", [
        "Teams: join a meeting late and ask Copilot 'Catch me up on the last 10 minutes'; get meeting summaries with action items",
        "Teams: 'What decisions were made in the #product channel this week?'",
        "Business Chat (BizChat): query across all M365 data -- 'What did we agree on the marketing budget in last month's meetings?'",
        "Copilot Pages: a collaborative canvas where you and AI build on generated content together",
        "ROI consideration: the value depends heavily on how well your team documents work in M365 tools",
    ], None),
]),

("Topic 6: Google Gemini and Google Workspace AI", [
    ("6.1 Google Gemini Overview", [
        "Gemini is Google's family of multimodal AI models: Ultra, Pro, Flash, and Nano (for on-device use)",
        "Gemini.google.com: consumer chatbot, free with a Google account; Google One AI Premium ($20/month) for Gemini Advanced",
        "Gemini is natively multimodal -- designed from the ground up to process text, images, audio, and video together",
        "Deep Google integration: performs real-time Google Search, accesses Google Drive, Docs, and Gmail with permission",
        "Try it: https://gemini.google.com  |  Developer playground: https://aistudio.google.com",
    ], None),
    ("6.2 Gemini in Google Workspace", [
        "Gmail: 'Help me write' drafts an email from bullet points; 'Summarise this thread' condenses long chains",
        "Google Docs: draft full documents from prompts, rewrite or extend selected sections, summarise documents",
        "Google Slides: 'Create a presentation about renewable energy trends for a non-technical audience' generates slides with images",
        "Google Sheets: natural language formulas and data analysis ('What are the top 3 trends in this dataset?')",
        "Google Meet: real-time captions, translated captions in 70+ languages, automatic post-meeting summaries",
    ], None),
    ("6.3 NotebookLM -- AI Research Assistant", [
        "NotebookLM is a free Google tool that lets you upload your own documents and ask questions about them",
        "Supported sources: PDFs, Google Docs, YouTube video URLs, web URLs, and audio files",
        "Responses are grounded in your uploaded sources -- citations link back to exact passages",
        "Audio Overview: generates a realistic podcast-style conversation between two AI hosts discussing your documents",
        "Use cases: studying from textbooks, synthesising research papers, preparing for meetings, understanding contracts",
        "Try it: https://notebooklm.google.com  (free, no subscription required)",
    ], None),
    ("6.4 Google AI Studio and the Gemini API", [
        "Google AI Studio (aistudio.google.com): free browser-based tool to experiment with Gemini models",
        "Test prompts, adjust parameters (temperature, top-p), and automatically get Python or JavaScript API code",
        "Generous free tier: Gemini 1.5 Flash offers 15 requests per minute at no cost -- good for learning and prototyping",
        "Multimodal testing: upload images, audio clips, or video alongside text prompts to test combined inputs",
        "One-click code export: any prompt you build in AI Studio generates ready-to-run API code",
    ], None),
]),

("Topic 7: AI Image Generation Tools", [
    ("7.1 Midjourney", [
        "Midjourney produces the highest aesthetic quality among current AI image tools -- popular with designers and artists",
        "Access: via the Midjourney website (midjourney.com) or its Discord server",
        "Pricing: Basic $10/month (~200 images); Standard $30/month (unlimited relaxed generation); Pro $60/month",
        "No free tier currently; best for professional creative work where quality matters",
        "Prompt structure: [subject] [style] [lighting] [colour palette] [mood] [aspect ratio parameter]",
    ], [
        "WEAK:  a cat outside",
        "",
        "STRONG:",
        "A fluffy orange tabby cat on ancient stone steps,",
        "purple wisteria overhead, soft golden-hour light,",
        "shallow depth of field, 85mm lens, photorealistic --ar 4:5 --v 6",
        "",
        "Key parameters:",
        "--ar 16:9  (landscape)  --ar 9:16  (portrait)  --ar 1:1 (square)",
        "--v 6      (latest model)  --style raw  (less opinionated output)",
        "--no text  (exclude text from the image)",
    ]),
    ("7.2 DALL-E 3 (OpenAI)", [
        "DALL-E 3 is integrated into ChatGPT Plus and available via the OpenAI API",
        "Strengths: excellent prompt adherence, reliably renders legible text within images, strong commercial licensing terms",
        "How to use: in ChatGPT Plus, simply describe the image you want in natural language",
        "ChatGPT optionally improves your prompt before sending to DALL-E -- you can view and edit the revised prompt",
        "Best for: illustrations, diagrams, marketing materials, mockups, and any image that needs specific text",
        "API access: platform.openai.com/docs/guides/images",
    ], None),
    ("7.3 Stable Diffusion (Open Source)", [
        "Stable Diffusion is an open-source model you can download and run locally at no cost",
        "Interfaces: Automatic1111, ComfyUI (node-based workflow), or Fooocus (simplified UI for beginners)",
        "Hardware: NVIDIA GPU with 6GB+ VRAM for good speed; also runs on CPU and Apple Silicon (slower)",
        "LoRA adapters: fine-tuned add-ons that change the model's style, add a character, or adjust quality",
        "ControlNet: use pose skeletons, depth maps, or edge maps to control image composition precisely",
        "Community resources: https://civitai.com for models, LoRAs, and prompt guides",
    ], None),
    ("7.4 Other Notable Image Tools", [
        "Adobe Firefly (firefly.adobe.com): trained exclusively on licensed Adobe Stock -- safest for commercial use",
        "Ideogram (ideogram.ai): especially strong at rendering legible text inside images; free tier available",
        "Flux (Black Forest Labs): high-quality open-weight model available via Hugging Face and Replicate",
        "Leonardo.ai: good free tier; offers fine-tuning and a model library; popular for game asset creation",
        "Canva AI: image generation and editing built into Canva's design tool -- best for non-designers already using Canva",
        "Choosing: use DALL-E 3 for speed and text-in-image; Midjourney for artistic quality; Stable Diffusion for customisation and cost",
    ], None),
]),

("Topic 8: AI for Knowledge Management and Notes", [
    ("8.1 Notion AI", [
        "Notion AI adds AI capabilities inside your Notion workspace (add-on: $10/user/month)",
        "AI Writing: draft, improve, change tone, or translate content directly on any Notion page",
        "AI Summaries: instantly summarise any page, meeting note, or project document",
        "AI Q&A: ask questions about your entire Notion workspace -- searches across all pages automatically",
        "AI in databases: auto-fill properties, summarise linked pages, extract action items from notes",
        "Best for: teams already using Notion for documentation and project management (notion.so)",
    ], None),
    ("8.2 Other AI Note-Taking Tools", [
        "Obsidian + AI plugins: local-first markdown notes with AI via community plugins (Smart Connections, Copilot for Obsidian)",
        "NotebookLM (Google): best specifically for querying and synthesising uploaded research documents (notebooklm.google.com)",
        "Mem.ai: AI-powered note-taking that automatically surfaces relevant past notes as you work",
        "Logseq: open-source outliner with AI plugins; local-first and privacy-respecting",
        "Apple Intelligence (iOS 18+): AI writing tools, summarisation, and Smart Reply built into iOS Notes, Mail, and Messages",
    ], None),
    ("8.3 AI for Meeting Notes", [
        "Otter.ai (otter.ai): real-time transcription, speaker identification, and action item extraction from meetings",
        "Fireflies.ai (fireflies.ai): records, transcribes, and analyses meetings; integrates with Zoom, Google Meet, and Teams",
        "Fathom (fathom.video): free AI meeting recorder for Zoom and Google Meet -- generates summary and action items instantly",
        "Microsoft Teams Copilot: built-in transcription and meeting summary (requires Microsoft 365 Copilot licence)",
        "Workflow: let AI capture everything -> review the summary -> share action items -> avoid manual note-taking",
    ], None),
    ("8.4 Building a Personal Knowledge System with AI", [
        "Capture everything consistently: voice notes, meeting transcripts, article summaries -- AI can only work with what is saved",
        "Use AI for retrieval: semantic search finds relevant notes even when you don't remember exact wording",
        "Combine tools: Notion AI for workspace knowledge, NotebookLM for research documents, Otter.ai for meetings",
        "Weekly review: paste the week's notes and ask AI to identify key themes, decisions, and pending actions",
        "Avoid information overload: AI-assisted capture is only useful if you also regularly review and act on what is saved",
    ], None),
]),

("Topic 9: AI for Research and Information", [
    ("9.1 Perplexity AI -- AI-Powered Search", [
        "Perplexity AI is a search engine that combines real-time web search with AI-synthesised answers and cited sources",
        "Unlike standard AI chatbots, Perplexity always searches the web and shows exactly which sources it used",
        "Free tier: limited daily Pro searches; Perplexity Pro ($20/month): unlimited searches, GPT-4o and Claude backends",
        "Pro Search: performs deeper multi-step research, analysing papers and pages in more detail",
        "Spaces: create a focused research environment with specific curated sources and a custom AI assistant",
        "Try it: https://www.perplexity.ai",
    ], None),
    ("9.2 AI for Academic Research", [
        "Consensus (consensus.app): AI search engine for peer-reviewed research -- ask yes/no research questions and see the evidence",
        "Elicit (elicit.com): finds relevant papers, extracts key data, and synthesises research findings across sources",
        "Semantic Scholar (semanticscholar.org): free AI-enhanced academic search with paper summarisation and citation graphs",
        "SciSpace (scispace.com): upload any paper and chat with it; searches and explains millions of academic papers",
        "Suggested workflow: Perplexity for broad overview -> Consensus for academic evidence -> NotebookLM to synthesise papers",
    ], None),
    ("9.3 Fact-Checking AI Output", [
        "Assume any specific factual claim from an AI tool could be wrong -- always verify before using",
        "For statistics: find and cite the original source, not the AI's claim",
        "For academic citations: search for the paper directly -- AI frequently invents plausible-sounding but non-existent citations",
        "For recent events: AI models have a training cutoff; use Perplexity AI or ChatGPT with browsing for current events",
        "Useful habit: ask the AI 'How confident are you in this? What is the primary source?' -- this surfaces uncertainty",
    ], None),
    ("9.4 AI Browsing and Web Analysis", [
        "ChatGPT with browsing (Plus): performs real-time Bing searches; most useful for current events and recent data",
        "Claude with URLs: can fetch and analyse specific web pages you provide in your prompt",
        "Gemini: strong real-time Google Search integration across most interfaces",
        "Browser extensions: Sider, MaxAI -- add an AI chat sidebar to any webpage; ask questions about the page you are reading",
        "Use case: paste a competitor's product page URL and ask for a structured analysis of their positioning and messaging",
    ], None),
]),

("Topic 10: AI for Email and Communication", [
    ("10.1 AI Email Drafting", [
        "AI can draft professional emails in seconds from brief bullet-point instructions",
        "Provide: recipient context, your relationship, the purpose, key points to include, tone, and desired length",
        "Tools available: ChatGPT / Claude (paste and refine), Gmail 'Help me write' (Gemini), Outlook Copilot",
        "Best practice: draft with AI, then personalise -- add specific details, the recipient's name, and any inside references",
        "Strong use cases: difficult conversations, cold outreach, follow-ups, proposals, and complaint responses",
    ], [
        "Email drafting prompt:",
        "'Draft a polite but firm follow-up to a supplier who missed a delivery deadline.",
        "We have been waiting 2 weeks. We need delivery by Friday or will cancel.",
        "Tone: professional, not angry.",
        "Include a clear call to action with a specific deadline.",
        "Length: under 100 words.'",
    ]),
    ("10.2 AI for Email Management", [
        "Gmail Gemini: summarises long email threads into key points; drafts replies in your style",
        "Outlook Copilot: summarises threads, drafts replies, and identifies action items from emails",
        "Superhuman (superhuman.com): AI email client with instant AI summaries and one-click reply suggestions",
        "SaneBox (sanebox.com): uses ML to filter and prioritise your inbox automatically (not generative AI but very effective)",
        "Goal: reduce reactive email processing to focused batches rather than constant interruption",
    ], None),
    ("10.3 AI for Slack and Teams", [
        "Slack AI (paid add-on): summarises long channel threads; answers questions about past conversations",
        "Microsoft Teams Copilot: summarises chat threads, catches you up on missed messages, drafts replies",
        "ChatGPT in Slack: add as a bot app; ask questions and get AI assistance directly within Slack channels",
        "Limitation: AI summaries can miss tone, politics, and nuance -- always read critical messages yourself",
        "Use case: 'Summarise what was decided in #product-decisions this week and list any open questions'",
    ], None),
    ("10.4 Tone and Sensitivity in AI Communications", [
        "Ask AI to adjust tone: 'Make this more assertive', 'Make this warmer and less formal', 'Cut this by 40%'",
        "Sensitive messages: AI helps structure difficult communications (performance feedback, rejections, complaints)",
        "Always review AI-drafted messages for personal details only you can know -- AI cannot read the relationship dynamics",
        "Cultural sensitivity: phrasing appropriate in one culture can be inappropriate in another -- localise and review",
        "Legal communications: never send AI-drafted legal notices, contracts, or compliance documents without expert review",
    ], None),
]),

("Topic 11: AI for Project Management and Productivity", [
    ("11.1 AI in Project Planning", [
        "Generate a starting project plan: 'Create a project plan for launching a mobile app in 3 months with a team of 4'",
        "AI output typically includes: phases, tasks, dependencies, risk factors, and a rough timeline",
        "Always refine AI plans with domain knowledge -- AI does not know your team's skill gaps, budget, or constraints",
        "Tools workflow: ChatGPT / Claude for the plan -> export to Asana, Jira, Monday, or Notion",
        "Risk identification: 'What are the top 5 risks for this type of project and how should I mitigate each?'",
    ], None),
    ("11.2 AI-Enhanced PM Tools", [
        "Asana AI: generate tasks from meeting notes, summarise project updates, and surface timeline risks",
        "Monday.com AI: automate repetitive workflows, summarise project status, generate task descriptions",
        "Linear: AI-generated issue descriptions, sprint summaries, and duplicate detection",
        "ClickUp AI: write task descriptions, generate meeting agendas, and summarise project activity",
        "Notion AI: generate project briefs, retrospective summaries, and status updates from raw notes",
    ], None),
    ("11.3 AI for Documentation", [
        "After a meeting: paste the transcript (from Otter.ai or Fathom) and ask AI for decisions, action items, and open questions",
        "Documentation debt: paste messy, out-of-date notes and ask AI to restructure and clean them up",
        "Knowledge base articles: paste support tickets or Slack threads and ask AI to turn them into reusable help articles",
        "Runbooks and SOPs: 'Write an SOP for [process] including purpose, who does it, step-by-step procedure, and exceptions'",
    ], None),
    ("11.4 Personal Productivity", [
        "Daily planning: 'I have these 8 tasks and 5 hours available. Help me prioritise and sequence them.'",
        "Eisenhower Matrix: paste your task list and ask AI to categorise by urgency and importance",
        "Weekly review: paste your notes and calendar summary, ask 'What did I achieve? What should I focus on next week?'",
        "Decision support: describe a decision you are facing; ask AI to list pros, cons, and alternative options you may not have considered",
    ], None),
]),

("Topic 12: Integrating AI Tools into Your Workflow", [
    ("12.1 Mapping AI to Your Work", [
        "Step 1: list your 10 most time-consuming recurring tasks",
        "Step 2: for each, identify which AI tool could help and what the prompt would look like",
        "Step 3: pilot one task with AI for one week and note: time saved, quality of output, what needed editing",
        "Step 4: expand to additional tasks once the habit is established and the workflow is proven",
        "Step 5: share your workflow template with colleagues -- AI productivity scales across teams",
    ], [
        "Example AI workflow map:",
        "",
        "Task                     -> AI Tool",
        "Draft weekly status      -> Claude / ChatGPT",
        "Summarise meeting notes  -> Otter.ai + Notion AI",
        "Debug code               -> GitHub Copilot + Claude",
        "Research a topic         -> Perplexity AI",
        "Create presentation      -> ChatGPT + Canva AI",
        "Reply to emails          -> Outlook Copilot / Gmail Gemini",
        "Generate social posts    -> ChatGPT with saved template prompt",
    ]),
    ("12.2 Building a Prompt Library", [
        "Save prompts that produce consistently good results -- in Notion, Obsidian, or a simple text file",
        "Organise by task type: writing, coding, analysis, research, summarisation, email",
        "Include: the model used, any special instructions, sample output, and date last tested",
        "Share with your team: a shared prompt library multiplies individual productivity across the organisation",
        "Iterate: when you find a better version of a prompt, update the library and note what changed",
    ], None),
    ("12.3 AI Automation with No-Code Tools", [
        "Zapier (zapier.com): trigger AI actions when events happen -- 'new support ticket -> AI draft reply -> email to agent'",
        "Make.com: visual workflow builder with native ChatGPT and Claude integration for more complex pipelines",
        "n8n (n8n.io): open-source workflow automation with AI nodes -- self-host for data privacy",
        "Use case example: every new customer review -> AI classifies sentiment and topic -> adds row to tracking spreadsheet",
        "No-code automation allows powerful AI workflows without writing a single line of code",
    ], None),
    ("12.4 Measuring Impact", [
        "Track time before and after AI adoption on specific tasks -- even informal tracking reveals real savings",
        "Quality indicators: fewer revisions needed, higher stakeholder satisfaction, reduced error rates",
        "Volume: how much more can you produce in the same time? Compare output per day/week",
        "Note: productivity gains are real but variable -- they depend heavily on the task type and your AI skill level",
        "Share concrete results with leadership to justify AI tool subscriptions and team training",
    ], None),
]),

("Topic 13: Choosing the Right AI Tool", [
    ("13.1 A Decision Framework", [
        "What is the input type? (text, image, audio, document, code, data)",
        "What is the desired output? (text, image, structured data, code, summary, action)",
        "How important is accuracy? (high: use larger models and verify all facts; low: any capable tool works)",
        "Is data sensitivity a concern? (yes: use enterprise tier or run a local model)",
        "What is the budget? (free: ChatGPT / Claude free tiers; paid: match the cost to the value created)",
        "Is this a one-off or a repeated task? (repeated: build a prompt template or automation)",
    ], None),
    ("13.2 Quick Reference Comparison", [
        "Best overall AI assistant: ChatGPT (GPT-4o) or Claude 3.5 Sonnet -- try both for your use case",
        "Best for very long documents: Claude (200k token context window)",
        "Best for real-time information with sources: Perplexity AI",
        "Best for coding (in editor): GitHub Copilot; for code explanation: Claude or ChatGPT",
        "Best for artistic images: Midjourney; precise/literal images: DALL-E 3; free/custom: Stable Diffusion",
        "Best for meeting summaries: Otter.ai or Fathom (free for Zoom)",
        "Best for Microsoft 365 users: Microsoft Copilot; for Google Workspace users: Gemini",
    ], None),
    ("13.3 Staying Up to Date", [
        "The best AI tool today may be outperformed in 3 months -- build flexible habits, not rigid tool dependencies",
        "Newsletters: The Rundown AI, TLDR AI, Ben's Bites, The Batch -- weekly summaries of what is new and worth trying",
        "Test new tools when they launch: 10--15 minutes of hands-on use reveals more than any review article",
        "Focus on transferable skills: prompt engineering, critical evaluation, and workflow design remain relevant as tools evolve",
        "Tool directories: there.is (there.is/t/ai-tools) and Futurepedia (futurepedia.io) catalogue new AI tools weekly",
    ], None),
    ("13.4 The Near Future of AI Tools", [
        "AI agents: tools will increasingly complete multi-step tasks autonomously -- browse, book, file, and email on your behalf",
        "Persistent memory and personalisation: tools will learn your preferences, writing style, and recurring tasks over time",
        "Invisible integration: AI will be embedded as a feature in every app -- a search bar, an inbox, a spreadsheet",
        "Voice-first interfaces: interacting with AI through natural conversation rather than typing prompts",
        "Prepare: the practitioners who thrive will be those who know what to delegate to AI and what to keep for human judgement",
    ], None),
]),

]  # end AI_TOOLS


# =============================================================================
# COURSE 4 -- AI for Writing and Content  (14 topics)
# =============================================================================
AI_WRITING = [

("Topic 1: Introduction to AI Writing Tools", [
    ("1.1 What AI Writing Tools Do", [
        "AI writing tools generate, rewrite, summarise, and edit text based on your instructions",
        "They are most effective at: eliminating the blank page, producing first drafts, creating variations, and handling formulaic writing",
        "They are not effective at: original research, verified facts, unique personal experience, or strategic judgement",
        "Best mental model: AI as a very fast first-draft writer and editor -- you are still the strategist, fact-checker, and final author",
        "Human writer + AI = faster output with broader reach, not AI replacing the human entirely",
    ], None),
    ("1.2 Main AI Writing Tools", [
        "ChatGPT (chat.openai.com): best general-purpose writing assistant; handles almost any writing task",
        "Claude (claude.ai): strong for long-form writing, nuanced tone, and following complex style instructions",
        "Jasper (jasper.ai): dedicated marketing copy platform with brand voice training features (paid)",
        "Copy.ai (copy.ai): focused on short-form marketing copy -- ads, product descriptions, social posts (free tier)",
        "Grammarly (grammarly.com): AI grammar, tone, clarity, and style suggestions integrated into your browser and apps",
        "Hemingway Editor (hemingwayapp.com): readability analysis -- highlights complex sentences, passive voice, and adverbs",
    ], None),
    ("1.3 What to Expect from AI Output", [
        "Treat every AI output as a rough first draft -- it requires human review and editing before use",
        "AI does not know your brand voice, audience, or internal context unless you provide it explicitly in the prompt",
        "Factual claims need independent verification -- AI generates plausible-sounding but sometimes incorrect information",
        "Generic-sounding output means the prompt lacked specificity -- add more context, examples, and constraints",
        "Over-reliance produces content that sounds like everyone else's AI content -- add unique insight and examples",
    ], None),
    ("1.4 Disclosure and Academic Integrity", [
        "Many publications, platforms, and academic institutions now require disclosure of AI assistance",
        "Best practice: be transparent -- 'This article was drafted with AI assistance and reviewed/edited by [name]'",
        "Most universities have explicit AI policies for coursework -- check your institution's current policy",
        "Major journalism outlets (AP, Reuters, NYT) have published editorial AI policies; check if your field has guidance",
        "The responsible use of AI in writing requires human oversight, editing, and accountability for the final output",
    ], None),
]),

("Topic 2: Writing Effective Prompts for Content", [
    ("2.1 The Content Prompt Formula", [
        "Audience: who will read this? Their knowledge level, role, and what they care about",
        "Goal: what should the reader think, feel, or do after reading?",
        "Format: blog article, email, tweet thread, ad copy, script, bullet list, or structured outline",
        "Tone: formal, casual, authoritative, empathetic, humorous, urgent, or persuasive",
        "Length: word count or number of paragraphs / bullets / sections",
        "Constraints: must-include topics, must-avoid topics, keywords to use, things to not mention",
    ], [
        "General content prompt template:",
        "",
        "Write a [FORMAT] for [AUDIENCE].",
        "Goal: [WHAT THE READER SHOULD DO / THINK / FEEL].",
        "Tone: [TONE].",
        "Length: [WORD COUNT OR STRUCTURE].",
        "Must include: [KEY POINTS OR SECTIONS].",
        "Do not include: [EXCLUSIONS].",
        "Brand voice: [DESCRIBE OR PASTE WRITING SAMPLE].",
    ]),
    ("2.2 Providing Your Brand Voice", [
        "Paste writing samples: 'Here are 3 examples of our published writing. Match this style and voice exactly.'",
        "Describe adjectives: 'Our brand voice is: bold, approachable, jargon-free, slightly witty'",
        "Define what to avoid: 'Never use corporate buzzwords, passive voice, or cliches like synergy or leverage'",
        "Create a reusable brand voice prompt you paste at the start of every content session",
        "The more specific examples you provide, the more accurately AI can match your actual voice",
    ], None),
    ("2.3 Iterative Refinement", [
        "Generate -> evaluate -> refine across multiple turns rather than expecting perfection on the first prompt",
        "Common follow-up refinements: 'Make the opening hook stronger', 'Cut this by 30%', 'Add a clear CTA at the end'",
        "Ask for multiple options: 'Give me 5 different headline options for this piece'",
        "Style adjustments: 'Rewrite the second paragraph in a more conversational tone'",
        "Structure changes: 'Convert this prose into a numbered step-by-step list'",
    ], None),
    ("2.4 Adding the Human Element", [
        "Insert personal anecdotes, specific data, and original opinions that AI cannot generate on your behalf",
        "Replace generic AI examples with real company-specific or industry-specific examples",
        "Add a unique angle or fresh perspective that goes beyond what a general summary would provide",
        "Final test: read the piece aloud -- any section that sounds robotic or generic needs a human rewrite",
        "Strong AI-assisted content is indistinguishable from great human writing because a human shaped it throughout",
    ], None),
]),

("Topic 3: AI for Blog Writing and Articles", [
    ("3.1 Blog Writing Workflow with AI", [
        "Step 1 -- Research: use Perplexity AI (with citations) or ChatGPT with browsing to gather key points and data",
        "Step 2 -- Outline: ask AI for a detailed structure with sections and 3 key points per section",
        "Step 3 -- Draft: expand each section with AI, one section at a time for better quality and control",
        "Step 4 -- Edit: review every paragraph for accuracy, add personal insight, fix generic phrasing",
        "Step 5 -- Optimise: ask AI to suggest a meta description, title tag variations, and internal link opportunities",
        "The research and drafting phase can be significantly compressed compared to writing from scratch",
    ], [
        "Step 2 -- outline prompt:",
        "",
        "'Create a detailed outline for a 1,500-word blog post titled:",
        "\"5 Ways AI is Changing Project Management\".",
        "Target audience: mid-level project managers with no AI background.",
        "Include: an opening hook, 5 main sections with 3 sub-points each,",
        "a real-world example for each section, and a conclusion with CTA.",
        "Avoid: jargon, hype, and vague claims.'",
    ]),
    ("3.2 Types of Articles AI Handles Well", [
        "How-to articles: prompt with numbered steps; ask AI to expand each step with detail and an example",
        "Listicles: 'Write a listicle with 7 items, each with a 2-sentence explanation and a concrete example'",
        "Opinion pieces: provide your thesis and 3 supporting arguments, ask AI to develop them into paragraphs",
        "Case studies: provide the facts and outcome; ask AI to structure them as a narrative with problem/solution/result",
        "Interview Q&A: generate questions with AI; use AI to clean up rough transcript notes into polished Q&A format",
    ], None),
    ("3.3 Quality Checks for AI-Generated Articles", [
        "Fact-check every specific statistic, date, name, and citation -- AI confidently fabricates details",
        "Originality: if the piece reads like a generic overview that anyone could write, add unique angles only you can provide",
        "Readability: target an 8th-grade reading level for general audiences (Hemingway Editor helps assess this)",
        "AI detection awareness: tools like Turnitin and GPTZero can flag AI-generated text -- thorough editing reduces detectability",
        "Plagiarism check: AI output is usually original, but run through Copyscape for important published pieces",
    ], None),
    ("3.4 Consistency Across a Blog", [
        "Style guide prompt: create a persistent system message defining your writing rules and reuse it each session",
        "Terminology consistency: 'We always say CX, not UX; we use Oxford commas; we spell out numbers under 10'",
        "Series cohesion: include summaries of related previous articles when generating new ones in a series",
        "Brand glossary: maintain an approved/banned terms list; include it in your writing prompt template",
    ], None),
]),

("Topic 4: AI for Email and Professional Communication", [
    ("4.1 Types of Email AI Excels At", [
        "Cold outreach: personalised first-contact emails at scale",
        "Follow-ups: polite, persistent follow-up after no reply",
        "Proposals and pitches: structured, benefit-focused value propositions",
        "Difficult messages: sensitive feedback, apologies, or declining requests with care",
        "Internal updates: status reports, team announcements, change communications",
        "Customer lifecycle: onboarding emails, check-ins, and renewal conversations",
    ], None),
    ("4.2 Writing the Email Prompt", [
        "Include: who you are, who the recipient is, your relationship, the purpose, the key message, and the desired action",
        "Specify tone: professional, warm, urgent, apologetic, confident, low-pressure",
        "Specify length: 'under 80 words' for a quick follow-up; 'around 200 words' for a detailed proposal",
        "Add constraints: 'do not mention our pricing yet', 'do not sound desperate', 'avoid the phrase circle back'",
    ], [
        "Email prompt example:",
        "",
        "'Write a follow-up email to a potential B2B client.",
        "We met at a conference last week; they showed interest in our",
        "project management tool but have not replied to my first email",
        "sent 5 days ago.",
        "Goal: schedule a 20-minute demo call.",
        "Tone: warm, confident, low-pressure.",
        "Length: under 80 words.",
        "Include two specific time options for the call.'",
    ]),
    ("4.3 Responding to Difficult Emails", [
        "Angry customer: 'Draft a response that acknowledges their frustration, apologises, and offers a resolution: [paste complaint]'",
        "Declining a request: 'Write a polite refusal to this request without damaging the relationship: [paste request]'",
        "Negotiation counter-offer: 'Draft a counter-proposal that holds our position but shows flexibility on the timeline'",
        "Ambiguous request: 'Draft a reply asking for clarification without sounding obstructive or passive-aggressive'",
        "Tip: always read the AI draft before sending -- it cannot know relationship history or unspoken context",
    ], None),
    ("4.4 Email Sequences", [
        "Onboarding sequence: 'Write a 5-email sequence for new software users, spaced over 2 weeks'",
        "Cold outreach sequence: 'Write a 4-email sequence: intro, value prop, social proof, and a final gentle close'",
        "Re-engagement: 'Write an email to subscribers who have not opened in 90 days'",
        "Generate the full sequence in one prompt to maintain consistent voice and logical progression across all emails",
    ], None),
]),

("Topic 5: AI for Social Media Content", [
    ("5.1 Platform-Specific Content", [
        "Each platform has distinct norms -- always specify the platform in your prompt",
        "LinkedIn: professional, thoughtful, 150--300 words; a hook in the first line; a question at the end drives comments",
        "Twitter / X: punchy, opinionated; educational threads of 5--10 tweets often outperform single posts",
        "Instagram: strong opening line (visible before 'more'); use line breaks; end with CTA and relevant hashtags",
        "TikTok captions: casual, trend-aware, short; the video is primary -- the caption supports it",
    ], None),
    ("5.2 Content Repurposing", [
        "The most efficient content strategy: create one substantial piece, use AI to repurpose it for every channel",
        "From one blog post: AI can generate a LinkedIn post, a tweet thread, an Instagram caption, and an email newsletter blurb",
        "Prompt: 'Repurpose this blog post into: 1 LinkedIn post (200 words), a 6-tweet thread, 1 Instagram caption with 5 hashtags'",
        "This multiplies your content output without proportionally increasing the time invested in content creation",
    ], [
        "Repurposing prompt:",
        "",
        "'I have written a blog post about time management for remote workers.",
        "Repurpose it into:",
        "1. A LinkedIn post (200 words, professional, end with a question)",
        "2. A Twitter thread (7 tweets, each under 280 characters, punchy)",
        "3. An Instagram caption (casual, relatable, 5 relevant hashtags)",
        "",
        "Blog post: [paste your content here]'",
    ]),
    ("5.3 Content Calendar with AI", [
        "Ask AI to plan a month of content: 'Create a 4-week content calendar for a [industry] company targeting [audience]'",
        "Provide: industry, target audience, content pillars (3--4 themes), and desired posting frequency per platform",
        "AI generates a structured calendar with varied formats (carousel, video, poll, text post, story)",
        "Refine: layer in company events, product launches, industry dates, and seasonal hooks that AI cannot know",
        "Scheduling tools: Buffer (buffer.com), Hootsuite (hootsuite.com), or Later (later.com) for automated posting",
    ], None),
    ("5.4 Hooks, CTAs, and Hashtags", [
        "Scroll-stopping hooks: 'Rewrite the opening line of this post to be more provocative or counterintuitive'",
        "Generate CTA options: 'Write 5 call-to-action questions to end this post that will generate comments'",
        "A/B test hooks: 'Write 5 different opening lines for this post so I can test which performs best'",
        "Hashtag research: 'Suggest 15 hashtags for a LinkedIn post about [topic], mixing broad and niche tags'",
        "Note: hashtag best practices vary by platform and change over time -- check current platform guidance",
    ], None),
]),

("Topic 6: AI for Marketing Copy", [
    ("6.1 Ad Copy with AI", [
        "Google Ads headlines: max 30 characters; descriptions: max 90 characters -- constraints force clarity",
        "Meta / Facebook Ads: primary text (~125 chars shown before 'more'), headline (27 chars), description",
        "Always provide: product, target audience, key benefit, unique selling proposition (USP), and CTA",
        "Generate 10 variations quickly with AI and run A/B tests -- AI dramatically accelerates creative testing",
        "Check: ad copy must comply with platform policies -- AI may generate claims that violate ad guidelines",
    ], [
        "Google Ads prompt:",
        "",
        "'Write Google Ads copy for a project management app.",
        "Target: startup founders and team leads.",
        "Key benefit: reduces time spent on status updates.",
        "USP: AI-powered -- no manual updates needed.",
        "Pain point: too many meetings and lost context.",
        "",
        "Generate:",
        "- 5 headlines (max 30 characters each, include the keyword 'project management')",
        "- 3 descriptions (max 90 characters each, end with a CTA)'",
    ]),
    ("6.2 Landing Page Copy", [
        "Proven structure: headline (pain or gain), subheadline (how you solve it), social proof, features as benefits, CTA",
        "Prompt with: product description, target persona, main pain point, top 3 differentiators, CTA goal",
        "Hero section: 'Write 5 headline / subheadline pairs for a SaaS landing page focused on reducing admin time'",
        "Features to benefits: 'Convert these product features into customer benefits: [list your features]'",
        "CTA variations: 'Write 10 CTA button labels for a free trial signup -- avoid generic phrases like Sign Up'",
    ], None),
    ("6.3 Product Descriptions", [
        "Include sensory details, use cases, materials, key specs, and benefits -- not just a list of features",
        "Tone adapts to product: luxury (exclusive, aspirational); tools (direct, benefit-focused); apparel (tactile, lifestyle)",
        "Generate at multiple lengths: 'Write 3 versions of this product description: 50 words, 100 words, 200 words'",
        "SEO-optimised descriptions: include the target keyword naturally; avoid keyword stuffing",
        "Batch generation: 'Write descriptions for all 20 products in this list: [paste product names and specs]'",
    ], None),
    ("6.4 Brand Storytelling", [
        "Origin story: 'Write our brand origin story in 200 words: we started because [reason], our mission is [mission]'",
        "About page: 'Write a compelling About Us page for a company that [what you do] for [who you serve]'",
        "Mission statement: 'Write a concise mission statement and 3 core values for a company that [description]'",
        "Customer success narratives: provide the raw facts and outcome; ask AI to structure as a problem/solution/result story",
    ], None),
]),

("Topic 7: AI for Technical Writing and Documentation", [
    ("7.1 Code and API Documentation", [
        "AI dramatically reduces the time spent on documentation -- one of the most resisted tasks in software development",
        "Generate from code: paste a function or class and ask 'Write complete documentation for this'",
        "README generation: 'Write a clear README for this project based on the code: [paste code and structure]'",
        "API reference: 'Document this endpoint: method, URL, path parameters, request body schema, example request, example response, error codes'",
        "Changelog entries: 'Write a changelog entry for these changes in the format: Added / Changed / Fixed / Removed'",
    ], [
        "Documentation prompt:",
        "'Generate documentation for this Python function. Include:",
        "- One-sentence summary",
        "- Detailed description of what it does",
        "- Parameters table: name, type, description, required/optional",
        "- Return value: type and description",
        "- Example with realistic input and expected output",
        "- Common errors and how to handle them",
        "",
        "Function: [paste your code here]'",
    ]),
    ("7.2 User Guides and Manuals", [
        "Audience-first: specify exactly who will read this -- new user or expert, technical or non-technical",
        "Task-based structure: organise by what users want to accomplish, not by how the product is built",
        "Step-by-step instructions: 'Write step-by-step instructions for [task], assuming the user has never done this before'",
        "Troubleshooting sections: 'Generate a troubleshooting guide for the 5 most common problems users face with [product]'",
        "Plain English check: 'Rewrite this section so a non-technical user can follow it without any background knowledge'",
    ], None),
    ("7.3 Process Documentation (SOPs and Runbooks)", [
        "SOP format: 'Write an SOP for [process] including: purpose, scope, who is responsible, step-by-step procedure, exceptions'",
        "Runbooks: 'Write a runbook for deploying a new version of [system] including pre-checks, steps, rollback procedure'",
        "Process flowcharts: ask AI to write a text-based flowchart you can then recreate in Lucidchart, draw.io, or Miro",
        "Knowledge base from support tickets: 'Turn this support ticket thread into a reusable help centre article: [paste thread]'",
    ], None),
    ("7.4 Technical Report Writing", [
        "Executive summary: 'Write a 1-page executive summary of this technical report for a non-technical CEO audience: [paste]'",
        "Methodology sections: describe your approach in notes; ask AI to write it in formal, structured language",
        "Data interpretation: paste tables or numerical results; ask AI for a written analysis of key findings and implications",
        "Abstract generation: 'Write a 150-word abstract for this research paper that follows the Background / Methods / Results / Conclusion structure'",
    ], None),
]),

("Topic 8: AI for Creative Writing", [
    ("8.1 Fiction and Storytelling", [
        "AI is useful for overcoming writer's block, generating ideas, and producing first drafts of scenes to react to",
        "World-building: 'Describe the political system, social structure, and geography of a society where [unique premise]'",
        "Character development: 'Create a detailed character profile for [description] including backstory, core motivation, fatal flaw, and distinctive speech pattern'",
        "Dialogue: 'Write a tense exchange between [character A] and [character B] about [conflict], revealing character through subtext'",
        "Plot paths: 'I have this premise [X] and want it to end with [Y]. Suggest 5 different plot paths between them'",
    ], None),
    ("8.2 Poetry and Experimental Writing", [
        "Form-specific: 'Write a Petrarchan sonnet about [topic] following the ABBAABBA / CDECDE rhyme scheme'",
        "Style study: 'Write a short poem about [topic] using techniques characteristic of [poet] -- focus on their use of [specific technique]'",
        "Constraints generate creativity: 'Write a prose poem about memory using only monosyllabic words'",
        "Experimental forms: 'Tell this story entirely through a series of text messages between two characters'",
        "Use AI output as raw material and inspiration -- rarely use it as the final piece without significant personal revision",
    ], None),
    ("8.3 Screenwriting and Scripts", [
        "Scene generation: 'Write a [genre] scene where [setup]. Character A wants [goal]. Character B wants [conflicting goal].'",
        "Dialogue polish: paste rough dialogue and ask AI to make it more natural, punchy, or specific to character voice",
        "Format: AI understands screenplay format (FADE IN, INT./EXT. LOCATION - TIME, character names in caps) -- specify the format",
        "Loglines: 'Write 5 loglines for a story about [premise] in the genre of [genre] -- each under 30 words'",
        "Pitch document: 'Summarise this screenplay concept as a 1-page pitch for a production company'",
    ], None),
    ("8.4 Maintaining Your Creative Voice", [
        "AI output defaults to the statistically average style -- it needs your specific voice imposed on it",
        "Use AI for quantity: generate 10 variations, apply your taste to select and refine the best",
        "Avoid: accepting AI's first attempt, using AI for the emotional core or the ending, letting AI dictate the structure",
        "Best creative workflow: outline yourself, write the opening paragraphs yourself, use AI to accelerate the middle sections",
        "The more specific your prompt (specific character, specific moment, specific sensory detail), the less generic the output",
    ], None),
]),

("Topic 9: AI for Summarisation and Research", [
    ("9.1 Document Summarisation", [
        "Paste any document and specify the summary type: '3-bullet summary', 'key decisions only', 'executive summary'",
        "Audience-specific: 'Summarise this technical paper for a marketing manager with no technical background'",
        "Structured extraction: 'From this document, extract: main argument, key evidence, methodology, limitations, conclusions'",
        "Multi-document: 'Summarise these 3 articles and highlight where they agree and where they contradict each other'",
        "Claude (claude.ai) is particularly strong for very long documents due to its 200k token context window",
    ], None),
    ("9.2 Research Synthesis", [
        "Literature-style review: 'Summarise the key findings from these abstracts into a coherent narrative by theme'",
        "Comparison tables: 'Create a table comparing these 5 studies: authors, methodology, sample size, key finding, limitation'",
        "Gap identification: 'Based on these summaries, what research questions are NOT answered by current work?'",
        "Counter-argument generation: 'What are the strongest objections to the main argument of this paper?'",
        "Best tool for document-grounded research synthesis: NotebookLM (notebooklm.google.com) -- citations link to source",
    ], None),
    ("9.3 Competitive Research", [
        "Company analysis: 'Analyse the positioning, messaging, and apparent strengths of this company based on their website: [URL]'",
        "SWOT: 'Conduct a SWOT analysis of this competitor based on the following information I have gathered: [paste data]'",
        "Feature comparison: 'Build a feature comparison table for these 4 products based on their documentation: [paste links or content]'",
        "Market gaps: 'What needs of buyers in this market appear to be underserved by these 3 competitors?'",
        "Caveat: AI analysis is based on what you provide and public information -- always verify with primary sources",
    ], None),
    ("9.4 Research Workflow", [
        "Stage 1 -- Broad overview: Perplexity AI for a cited overview of the topic",
        "Stage 2 -- Deep dive: NotebookLM to chat with specific papers, reports, or documents you have collected",
        "Stage 3 -- Synthesis: Claude (large context) to combine findings from multiple summarised sources",
        "Stage 4 -- Validation: manually verify every statistic and factual claim against the original primary source",
        "Stage 5 -- Output: ask AI to format your validated research into a structured brief, report, or slide deck outline",
    ], None),
]),

("Topic 10: AI for Editing and Proofreading", [
    ("10.1 AI Editing Tools", [
        "Grammarly (grammarly.com): real-time grammar, spelling, clarity, tone, and engagement suggestions in any text field",
        "Hemingway Editor (hemingwayapp.com): highlights overly complex sentences, passive voice, adverbs, and readability issues",
        "ProWritingAid (prowritingaid.com): comprehensive analysis of style, consistency, cliches, and pacing for long documents",
        "ChatGPT / Claude: paste your draft and ask for specific feedback on structure, clarity, tone, or length",
        "Principle: use AI as a first-pass editor; apply your own judgement -- not every AI suggestion improves the piece",
    ], None),
    ("10.2 Targeted Editing Prompts", [
        "Clarity: 'Rewrite this paragraph to be clearer. The reader has no background in [topic].'",
        "Concision: 'Cut this by 30% without losing any essential information.'",
        "Passive voice: 'Identify and rewrite all passive voice constructions in this text.'",
        "Consistency: 'Check this document for inconsistent terminology and suggest standardised alternatives.'",
        "Flow and transitions: 'Improve the transitions between these paragraphs so the piece reads more smoothly.'",
    ], [
        "Comprehensive edit prompt:",
        "'Edit the following text for:",
        "1. Grammar and spelling errors",
        "2. Clarity -- flag any confusing sentences",
        "3. Concision -- suggest specific cuts for wordiness",
        "4. Tone consistency -- target: professional but approachable",
        "5. Flow -- suggest improved transitions where needed",
        "",
        "Return the edited version with brief notes on key changes made.",
        "",
        "Text: [paste your draft here]'",
    ]),
    ("10.3 Style and Voice Consistency", [
        "House style: 'Apply our style rules throughout: serial comma, British spelling, numbers written out under ten, no contractions'",
        "Terminology audit: 'List every instance in this document where product names or key terms are used inconsistently'",
        "Voice check: 'Does this article sound like our brand? Here are two examples of our typical writing: [paste examples]'",
        "Tense and POV: 'This document mixes past and present tense. Standardise to present tense throughout.'",
    ], None),
    ("10.4 Proofreading Checklist", [
        "Common checklist items: spelling, grammar, factual accuracy, formatting, consistent capitalisation, broken links",
        "Prompt: 'Review this text against the following checklist and flag any issues: [paste checklist]'",
        "Final human pass is always necessary -- AI misses context-dependent and relationship-based errors",
        "Read-aloud test: using text-to-speech on the final draft catches errors your eyes habitually skip",
        "For important content: two-pass review -- AI tool first, then a second human editor",
    ], None),
]),

("Topic 11: SEO Writing with AI", [
    ("11.1 AI and SEO Strategy", [
        "AI can generate SEO-optimised content but must be guided by your own keyword research and strategy",
        "AI does not know your current rankings, search volume data, or competitors' content -- you provide the strategy",
        "Use AI for: drafting articles, writing meta descriptions and title tags, generating FAQs, and creating content briefs",
        "Google's guidance (helpful content update): original, expert, people-first content ranks; thin AI content does not",
        "Best approach: AI-assisted content that includes genuine expert insight, original data, and a unique angle",
    ], None),
    ("11.2 Keyword Integration", [
        "Provide target keywords in your prompt: 'Write a 1,000-word article targeting the keyword [keyword]'",
        "Natural integration: 'Use [keyword] 3--5 times naturally, including in the first paragraph and one subheading'",
        "Semantic terms: 'Include these related terms naturally throughout: [list of LSI or supporting keywords]'",
        "Avoid keyword stuffing: review AI output to confirm keywords read naturally, not forced",
        "Keyword research tools to use before prompting AI: Google Keyword Planner (free), Ahrefs, Semrush, Ubersuggest",
    ], None),
    ("11.3 Meta Descriptions and Title Tags", [
        "Title tag: 'Write 5 SEO title tags for a page about [topic], include [keyword], keep each under 60 characters'",
        "Meta description: 'Write 3 meta descriptions, include [keyword], keep each under 155 characters, end with a clear CTA'",
        "Schema markup: 'Write FAQ schema JSON-LD for these 5 questions and answers: [list them]'",
        "Open Graph tags: 'Write og:title and og:description for this article: [paste title and summary]'",
        "Check rendered length: use Google's SERP snippet preview tools to confirm tags are not truncated",
    ], None),
    ("11.4 Content Briefs and Topic Clusters", [
        "Content brief: 'Create a brief for a pillar page on [keyword]: target audience, search intent, outline, suggested word count, internal link targets'",
        "Topic cluster: 'Suggest 10 supporting articles for a pillar page on [main topic], each targeting a different long-tail keyword'",
        "Gap analysis: 'The top 3 ranking articles on [keyword] cover [brief summary]. What angles or subtopics are they missing?'",
        "FAQ section: 'Generate 10 questions readers commonly ask about [topic] that I should answer within this article'",
        "People Also Ask: check Google's 'People also ask' box for [keyword] to supplement AI-generated question lists with real search data",
    ], None),
]),

("Topic 12: Multilingual Content with AI", [
    ("12.1 AI Translation Capabilities", [
        "Modern LLMs (Claude, ChatGPT, Gemini) translate accurately in 50+ languages with natural, idiomatic phrasing",
        "DeepL (deepl.com): specialised translation tool; widely regarded as producing the highest quality for European languages; free tier available",
        "Google Translate: broad language coverage, fast, good for informal use and getting the gist of a document",
        "For published or customer-facing content: always have a native speaker review AI translations",
        "Strength varies by language: AI performs best on widely-represented languages (Spanish, French, German, Mandarin, Japanese)",
    ], None),
    ("12.2 Localisation vs Translation", [
        "Translation: converting the words of a text from one language to another",
        "Localisation: adapting content for cultural context -- idioms, units of measurement, date formats, cultural references, humour",
        "Prompt for localisation: 'Translate and localise this for a [country] audience. Adapt idioms and cultural references to be locally relevant.'",
        "Formal vs informal register: many languages (French, German, Spanish, Japanese) distinguish formal and informal 'you' -- specify which to use",
        "Right-to-left languages (Arabic, Hebrew, Urdu): AI handles the text content well; ensure your web platform renders RTL correctly",
    ], None),
    ("12.3 Multilingual Content Strategy", [
        "Avoid simply translating your existing content -- each market may need different topics, examples, and tone",
        "AI can generate market-specific content from scratch with the right prompts and local knowledge input",
        "Prompt: 'Write a blog post about [topic] for a small business audience in [country]. Use locally relevant examples and regulations.'",
        "SEO: keyword research in the target language is separate from English keyword strategy -- provide local terms to the AI",
        "Consistency: AI can generate multilingual glossaries to maintain consistent terminology across all language versions",
    ], None),
    ("12.4 Quality Assurance for Translated Content", [
        "Back-translation check: translate the AI output back to English to identify any meaning drift or errors",
        "Native reviewer: essential for any customer-facing, published, or legally significant content",
        "Tone review: formal business content and casual consumer content require different registers in each language",
        "Legal and compliance content: AI may not know local regulatory requirements -- expert review is mandatory",
        "Practical workflow: AI for first-draft translation (fast and cheap) + native speaker for review and polish (targeted cost)",
    ], None),
]),

("Topic 13: AI Content Strategy and Planning", [
    ("13.1 Where AI Helps in Content Strategy", [
        "AI accelerates the research and ideation phases of content strategy -- not the strategic thinking itself",
        "AI input: audience persona drafts, competitor content analysis, topic ideation, content gap identification",
        "Human input: business goals, brand positioning, budget, distribution channels, editorial judgement",
        "Output: content calendar, defined content pillars, and a measurement framework",
        "Warning: AI-generated strategy reflects patterns in its training data, not knowledge of your specific business or audience",
    ], None),
    ("13.2 Audience Persona Development", [
        "Prompt: 'Create 3 audience personas for a B2B SaaS product for HR managers. Include: role, company size, pain points, goals, content preferences, and key objections.'",
        "Use your actual customer data as input: describe your best and worst customers to the AI",
        "Validate AI personas against real customer interviews and sales call notes -- AI creates plausible templates, not verified insights",
        "Apply personas in every content prompt: 'Write this for Persona 2: the time-pressed HR generalist at a 200-person company'",
    ], None),
    ("13.3 Content Calendar with AI", [
        "Prompt: 'Create a 4-week content calendar for a [industry] company targeting [audience]. Include 3 blog posts, 12 LinkedIn posts, 4 email newsletters. Themes: [your themes].'",
        "AI generates a calendar with titles, formats, and suggested dates",
        "Layer in what AI cannot know: company events, product launches, speaking engagements, and industry dates",
        "Batch creation session: block a half-day, use AI to generate first drafts of all planned content in one sitting",
        "Scheduling tools: Buffer (buffer.com), Later (later.com), or Hootsuite (hootsuite.com) for scheduling and analytics",
    ], None),
    ("13.4 Measuring Content Performance", [
        "Define KPIs before creating: traffic, time on page, social shares, email click-through rate, leads, conversions",
        "AI can suggest relevant KPIs: 'What metrics should I track for a B2B content programme focused on generating inbound leads?'",
        "Post-mortem prompts: 'This article had a high bounce rate. Based on the content, what might explain this?'",
        "Paste analytics data into AI for analysis: 'Here is last month's blog performance data. What patterns do you see?'",
        "Monthly review habit: paste top and bottom performers and ask AI to identify patterns and suggest improvements",
    ], None),
]),

("Topic 14: Ethics, Attribution, and Sustainable AI Writing Practice", [
    ("14.1 Disclosure and Transparency", [
        "A growing number of publications, academic institutions, and platforms now require disclosure of AI use",
        "Best practice: be transparent with your audience and editors about AI assistance in content creation",
        "Academic integrity: most universities now have explicit policies on AI use in assessed work -- check your institution's policy",
        "Journalism: major outlets (AP, Reuters, New York Times) have published AI editorial policies; the field is still evolving",
        "Template: 'This article was drafted with AI assistance and reviewed, edited, and fact-checked by [name]'",
    ], None),
    ("14.2 Copyright and Ownership", [
        "AI-generated content copyright is unsettled law in most jurisdictions -- the landscape is rapidly evolving",
        "US Copyright Office (2024 guidance): purely AI-generated content is generally not copyrightable; human-edited content may be",
        "Training data lawsuits: ongoing cases are testing whether training AI on copyrighted text constitutes infringement",
        "Safest commercial use: Adobe Firefly (images) and Getty AI are trained on licensed content",
        "EU AI Act: requires AI-generated content to be labelled and mandates transparency about training data for high-risk systems",
    ], None),
    ("14.3 Accuracy, Misinformation, and Responsibility", [
        "AI confidently produces incorrect information -- publishing without verification spreads misinformation",
        "Health, legal, and financial content: errors can cause direct harm; apply stricter verification standards",
        "The human who publishes AI-assisted content is responsible for its accuracy -- not the AI tool",
        "Apply your normal editorial fact-checking standards to AI-assisted content; do not lower the bar because AI produced a draft",
        "Bias amplification: AI can perpetuate stereotypes from training data -- review for fairness in sensitive topics",
    ], None),
    ("14.4 Building a Sustainable AI Writing Workflow", [
        "Map your content process: ideation -> research -> outline -> draft -> edit -> review -> publish -> distribute",
        "AI adds most value at: research synthesis, outline generation, first draft, and format variations",
        "Humans are essential at: strategy, original insight, fact verification, final editing, and approval",
        "Quality gate: publish nothing without human review -- make this a non-negotiable rule in your process",
    ], [
        "Sustainable AI content workflow:",
        "",
        "1. Strategy (Human): topic, audience, keyword, goal, angle",
        "2. Research (AI + Human): Perplexity for sources, Human validates facts",
        "3. Outline (AI draft -> Human approves)",
        "4. Draft (AI expands outline section by section)",
        "5. Edit (Human deep-edits for voice, accuracy, and insight)",
        "6. SEO (AI: meta description, title tags, FAQ schema)",
        "7. Review (Human: second pass; legal/compliance if needed)",
        "8. Publish and Distribute (AI scheduling tools)",
    ]),
]),

]  # end AI_WRITING


# =============================================================================
# Rendering
# =============================================================================
def render_topic(title, sections, out_path):
    pdf = CoursePDF(title)
    pdf.topic_banner()
    for sec_title, bullets, code_lines in sections:
        pdf.section(sec_title)
        for b in bullets:
            pdf.bullet(b)
        if code_lines:
            pdf.code(code_lines)
    pdf.divider()
    pdf.output(out_path)

def generate_course(topics, folder):
    os.makedirs(folder, exist_ok=True)
    for i, (title, sections) in enumerate(topics, start=1):
        short = title.replace(f"Topic {i}: ", "")
        short = re.sub(r'[<>:"/\\|?*]', '', short)
        fname = f"Topic {i:02d}_{short}.pdf"
        render_topic(title, sections, os.path.join(folder, fname))
        print(f"  Created: {fname}")

if __name__ == "__main__":
    base     = r"D:\skill-sphere-Cpanel-main"
    root     = os.path.join(base, "gen ai courses")

    folder1  = os.path.join(root, "01_Introduction to Generative AI")
    folder2  = os.path.join(root, "02_Prompt Engineering")
    folder3  = os.path.join(root, "03_AI Tools for Everyday Use")
    folder4  = os.path.join(root, "04_AI for Writing and Content")

    src_prompt_eng = os.path.join(base, "prompt engineering course")

    print("Course 1: Introduction to Generative AI")
    generate_course(INTRO_GENAI, folder1)

    print("\nCourse 2: Prompt Engineering (copying existing PDFs)")
    os.makedirs(folder2, exist_ok=True)
    copied = 0
    if os.path.isdir(src_prompt_eng):
        for fname in sorted(os.listdir(src_prompt_eng)):
            if fname.lower().endswith('.pdf'):
                shutil.copy2(os.path.join(src_prompt_eng, fname),
                             os.path.join(folder2, fname))
                print(f"  Copied: {fname}")
                copied += 1
    print(f"  {copied} files copied.")

    print("\nCourse 3: AI Tools for Everyday Use")
    generate_course(AI_TOOLS, folder3)

    print("\nCourse 4: AI for Writing and Content")
    generate_course(AI_WRITING, folder4)

    print("\nAll done.")

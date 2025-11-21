const Joi = require('joi');

/**
 * Validation schemas for API requests
 */

const completionSchema = Joi.object({
    messages: Joi.array().items(
        Joi.object({
            role: Joi.string().valid('user', 'assistant', 'system').required(),
            content: Joi.alternatives().try(
                Joi.string(),
                Joi.array().items(Joi.object())
            ).required()
        })
    ).required().min(1),
    temperature: Joi.number().min(0).max(2).default(0.7),
    max_tokens: Joi.number().min(1).max(16000).default(8000),
    stream: Joi.boolean().default(true)
});

const imageGenerationSchema = Joi.object({
    prompt: Joi.string().required().min(1).max(4000),
    n: Joi.number().integer().min(1).max(4).default(1),
    response_format: Joi.string().valid('url', 'b64_json').default('url')
});

const codeAnalysisSchema = Joi.object({
    code: Joi.string().required().min(1),
    language: Joi.string().required(),
    analysisType: Joi.string().valid('general', 'security', 'performance', 'style', 'refactor').default('general'),
    context: Joi.string().allow('').default('')
});

const projectAnalysisSchema = Joi.object({
    fileStructure: Joi.alternatives().try(
        Joi.object(),
        Joi.array()
    ).required(),
    projectType: Joi.string().allow('').default(''),
    fileContents: Joi.object().pattern(
        Joi.string(),
        Joi.string()
    ).default({})
});

const imageAnalysisSchema = Joi.object({
    imageData: Joi.string().required(),
    prompt: Joi.string().default('Analyze this image and describe what you see.')
});

const smartInsertSchema = Joi.object({
    currentContent: Joi.string().required(),
    codeToInsert: Joi.string().required(),
    fileName: Joi.string().required(),
    language: Joi.string().allow('')
});

const terminalCommandSchema = Joi.object({
    command: Joi.string().required().min(1),
    cwd: Joi.string().default('.')
});

const chatMessageSchema = Joi.object({
    sessionId: Joi.number().integer().allow(null),
    userMessage: Joi.string().required().min(1),
    aiResponse: Joi.string().required().min(1),
    hasImages: Joi.boolean().default(false)
});

const serverActionSchema = Joi.object({
    workingDir: Joi.string().required(),
    filePath: Joi.string().allow('')
});

module.exports = {
    completionSchema,
    imageGenerationSchema,
    codeAnalysisSchema,
    projectAnalysisSchema,
    imageAnalysisSchema,
    smartInsertSchema,
    terminalCommandSchema,
    chatMessageSchema,
    serverActionSchema
};

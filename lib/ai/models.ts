import { fireworks } from '@ai-sdk/fireworks'
import { google } from '@ai-sdk/google'
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai'

export const DEFAULT_CHAT_MODEL: string = 'chat-model-small'

export const myProvider = customProvider({
  languageModels: {
    'chat-model-small': google('gemini-1.5-flash-latest'),
    'chat-model-large': google('gemini-2.0-flash-exp'),
    'chat-model-reasoning': wrapLanguageModel({
      model: fireworks('accounts/fireworks/models/deepseek-r1'),
      middleware: extractReasoningMiddleware({ tagName: 'think' }),
    }),
  },
  // imageModels: {
  //   'small-model': openai.image('dall-e-2'),
  //   'large-model': openai.image('dall-e-3'),
  // },
})

interface ChatModel {
  id: string
  name: string
  description: string
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'chat-model-small',
    name: 'Small model',
    description: 'Small model for fast, lightweight tasks',
  },
  {
    id: 'chat-model-large',
    name: 'Large model',
    description: 'Large model for complex, multi-step tasks',
  },
  {
    id: 'chat-model-reasoning',
    name: 'Reasoning model',
    description: 'Uses advanced reasoning',
  },
]

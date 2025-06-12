import { AIProvider, AIRequest, AIResponse } from '@suite/types';

export interface AIConnector {
  initialize(provider: AIProvider): Promise<void>;
  sendRequest(request: AIRequest): Promise<AIResponse>;
  validateApiKey(apiKey: string): Promise<boolean>;
  getUsage(): Promise<AIUsage>;
}

export interface AIUsage {
  totalTokens: number;
  totalCost: number;
  requestCount: number;
  lastRequest?: Date;
}

export interface AIProviderAdapter {
  name: string;
  type: AIProvider['type'];
  sendRequest(request: AIRequest, config: AIProvider): Promise<AIResponse>;
  validateConfig(config: AIProvider): boolean;
}

// Base implementation
export class AIConnectorManager implements AIConnector {
  private provider: AIProvider | null = null;
  private adapters = new Map<string, AIProviderAdapter>();
  private usage: AIUsage = {
    totalTokens: 0,
    totalCost: 0,
    requestCount: 0
  };

  constructor() {
    // Register default adapters
    this.registerAdapter(new OpenAIAdapter());
    this.registerAdapter(new ClaudeAdapter());
    this.registerAdapter(new LocalAdapter());
  }

  registerAdapter(adapter: AIProviderAdapter): void {
    this.adapters.set(adapter.type, adapter);
  }

  async initialize(provider: AIProvider): Promise<void> {
    const adapter = this.adapters.get(provider.type);
    if (!adapter) {
      throw new Error(`No adapter found for provider type: ${provider.type}`);
    }

    if (!adapter.validateConfig(provider)) {
      throw new Error('Invalid provider configuration');
    }

    this.provider = provider;
  }

  async sendRequest(request: AIRequest): Promise<AIResponse> {
    if (!this.provider) {
      throw new Error('AI provider not initialized');
    }

    const adapter = this.adapters.get(this.provider.type);
    if (!adapter) {
      throw new Error('No adapter found for current provider');
    }

    try {
      const response = await adapter.sendRequest(request, this.provider);
      
      // Update usage stats
      if (response.usage) {
        this.usage.totalTokens += response.usage.totalTokens;
        this.usage.requestCount += 1;
        this.usage.lastRequest = new Date();
        
        // Calculate cost based on provider
        this.usage.totalCost += this.calculateCost(response.usage, this.provider);
      }

      return response;
    } catch (error) {
      return {
        content: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    if (!this.provider) {
      return false;
    }

    // Temporary provider with test API key
    const testProvider = { ...this.provider, apiKey };
    const adapter = this.adapters.get(this.provider.type);
    
    if (!adapter) {
      return false;
    }

    try {
      // Send a minimal test request
      await adapter.sendRequest(
        { prompt: 'test', maxTokens: 1 },
        testProvider
      );
      return true;
    } catch {
      return false;
    }
  }

  async getUsage(): Promise<AIUsage> {
    return { ...this.usage };
  }

  private calculateCost(usage: any, provider: AIProvider): number {
    // Cost calculation logic based on provider
    const costPerToken = {
      openai: 0.00002,  // Example rate
      claude: 0.00003,  // Example rate
      local: 0,         // Free for local models
      custom: 0.00001   // Default rate
    };

    const rate = costPerToken[provider.type] || 0;
    return usage.totalTokens * rate;
  }
}

// Provider Adapters
class OpenAIAdapter implements AIProviderAdapter {
  name = 'OpenAI';
  type: AIProvider['type'] = 'openai';

  async sendRequest(request: AIRequest, config: AIProvider): Promise<AIResponse> {
    // This would make actual API call in real implementation
    // For now, return mock response
    return {
      content: `OpenAI response to: ${request.prompt}`,
      usage: {
        promptTokens: request.prompt.length,
        completionTokens: 50,
        totalTokens: request.prompt.length + 50
      }
    };
  }

  validateConfig(config: AIProvider): boolean {
    return !!(config.apiKey && config.model);
  }
}

class ClaudeAdapter implements AIProviderAdapter {
  name = 'Claude';
  type: AIProvider['type'] = 'claude';

  async sendRequest(request: AIRequest, config: AIProvider): Promise<AIResponse> {
    // Mock implementation
    return {
      content: `Claude response to: ${request.prompt}`,
      usage: {
        promptTokens: request.prompt.length,
        completionTokens: 60,
        totalTokens: request.prompt.length + 60
      }
    };
  }

  validateConfig(config: AIProvider): boolean {
    return !!(config.apiKey && config.model);
  }
}

class LocalAdapter implements AIProviderAdapter {
  name = 'Local Model';
  type: AIProvider['type'] = 'local';

  async sendRequest(request: AIRequest, config: AIProvider): Promise<AIResponse> {
    // Mock implementation for local model
    return {
      content: `Local model response to: ${request.prompt}`,
      usage: {
        promptTokens: request.prompt.length,
        completionTokens: 40,
        totalTokens: request.prompt.length + 40
      }
    };
  }

  validateConfig(config: AIProvider): boolean {
    return !!(config.endpoint || config.model);
  }
}

// Export singleton instance
export const aiConnector = new AIConnectorManager();
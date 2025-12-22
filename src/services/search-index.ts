import Fuse from 'fuse.js';
import type { IFuseOptions, FuseResultMatch } from 'fuse.js';
import * as fs from 'fs';
import * as path from 'path';

export interface DocumentChunk {
  id: string;
  title: string;
  content: string;
  category: string;
  url?: string;
  tags: string[];
  lastUpdated?: string;
  relevanceScore?: number;
}

export interface SearchResult {
  document: DocumentChunk;
  score: number;
  matches: readonly FuseResultMatch[];
}

export class SearchIndexService {
  private documents: DocumentChunk[] = [];
  private fuseIndex: Fuse<DocumentChunk> | null = null;
  private isInitialized = false;

  constructor() {
    this.initializeIndex();
  }

  private async initializeIndex() {
    try {
      await this.loadDocuments();
      this.buildFuseIndex();
      this.isInitialized = true;
      console.log(`✅ Search index initialized with ${this.documents.length} documents`);
    } catch (error) {
      console.error('❌ Failed to initialize search index:', error);
    }
  }

  private async loadDocuments() {
    const resourcesDir = path.join(process.cwd(), 'src', 'resources');

    const categories = [
      'frontend',
      'tma',
      'smart-contracts',
      'how-to',
      'management',
      'deployment'
    ];

    for (const category of categories) {
      const categoryPath = path.join(resourcesDir, category);

      try {
        const files = fs.readdirSync(categoryPath);
        const mdFiles = files.filter(file => file.endsWith('.md'));

        for (const file of mdFiles) {
          const filePath = path.join(categoryPath, file);
          const content = fs.readFileSync(filePath, 'utf-8');

          // Split content into chunks for better search
          const chunks = this.chunkDocument(content, 1000);

          chunks.forEach((chunk, index) => {
            const docId = `${category}-${file.replace('.md', '')}-chunk-${index}`;
            const title = this.extractTitle(content, file);

            this.documents.push({
              id: docId,
              title,
              content: chunk,
              category,
              tags: this.extractTags(content, category),
              url: `https://docs.ton.org/${category}/${file.replace('.md', '')}`,
              lastUpdated: new Date().toISOString()
            });
          });
        }
      } catch (error) {
        // Category directory doesn't exist or can't be read
        continue;
      }
    }

    // Add some core TON documentation references
    this.addCoreTonDocs();
  }

  private chunkDocument(content: string, chunkSize: number = 1000): string[] {
    const chunks: string[] = [];
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks.length > 0 ? chunks : [content];
  }

  private extractTitle(content: string, filename: string): string {
    // Try to extract title from markdown headers
    const headerMatch = content.match(/^#\s+(.+)$/m);
    if (headerMatch) {
      return headerMatch[1].trim();
    }

    // Fallback to filename
    return filename.replace('.md', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private extractTags(content: string, category: string): string[] {
    const tags = [category];

    // Extract keywords from content
    const keywords = [
      'ton', 'blockchain', 'smart contract', 'wallet', 'transaction',
      'tact', 'func', 'tvm', 'jetton', 'nft', 'telegram', 'mini app',
      'frontend', 'react', 'typescript', 'deployment', 'testing'
    ];

    for (const keyword of keywords) {
      if (content.toLowerCase().includes(keyword.toLowerCase())) {
        tags.push(keyword);
      }
    }

    return [...new Set(tags)]; // Remove duplicates
  }

  private addCoreTonDocs() {
    // Add references to official TON documentation
    const coreDocs = [
      {
        id: 'ton-docs-overview',
        title: 'TON Blockchain Overview',
        content: 'Official TON blockchain documentation covering architecture, consensus, and core concepts.',
        category: 'documentation',
        tags: ['ton', 'blockchain', 'overview', 'documentation'],
        url: 'https://docs.ton.org/'
      },
      {
        id: 'ton-docs-smart-contracts',
        title: 'Smart Contract Development',
        content: 'Complete guide to developing smart contracts on TON using Tact and FunC languages.',
        category: 'smart-contracts',
        tags: ['smart contracts', 'tact', 'func', 'development'],
        url: 'https://docs.ton.org/develop/smart-contracts/'
      },
      {
        id: 'ton-docs-tact',
        title: 'Tact Programming Language',
        content: 'Official documentation for the Tact programming language - the recommended way to write TON smart contracts.',
        category: 'languages',
        tags: ['tact', 'language', 'smart contracts', 'development'],
        url: 'https://docs.ton.org/develop/smart-contracts/tact/'
      },
      {
        id: 'ton-docs-tvm',
        title: 'TON Virtual Machine (TVM)',
        content: 'Technical documentation for TVM - TON\'s custom virtual machine for executing smart contracts.',
        category: 'infrastructure',
        tags: ['tvm', 'virtual machine', 'execution', 'technical'],
        url: 'https://docs.ton.org/learn/tvm-instructions/tvm-overview'
      },
      {
        id: 'ton-docs-jettons',
        title: 'Jettons (TON Tokens)',
        content: 'Official standard and implementation guide for fungible tokens on TON blockchain.',
        category: 'tokens',
        tags: ['jettons', 'tokens', 'standards', 'fungible'],
        url: 'https://docs.ton.org/develop/dapps/asset-processing/jettons'
      },
      {
        id: 'ton-connect-docs',
        title: 'TON Connect Protocol',
        content: 'Official documentation for TON Connect - the standard protocol for TON wallet connections.',
        category: 'integration',
        tags: ['ton connect', 'wallets', 'integration', 'protocol'],
        url: 'https://docs.ton.org/develop/dapps/ton-connect'
      },
      {
        id: 'telegram-mini-apps',
        title: 'Telegram Mini Apps',
        content: 'Official guide for developing Telegram Mini Apps that integrate with TON blockchain.',
        category: 'tma',
        tags: ['telegram', 'mini apps', 'tma', 'web apps'],
        url: 'https://docs.ton.org/develop/dapps/telegram-apps/'
      }
    ];

    this.documents.push(...coreDocs);
  }

  private buildFuseIndex() {
    const options: IFuseOptions<DocumentChunk> = {
      keys: [
        { name: 'title', weight: 0.3 },
        { name: 'content', weight: 0.4 },
        { name: 'tags', weight: 0.2 },
        { name: 'category', weight: 0.1 }
      ],
      threshold: 0.3, // More lenient matching
      includeMatches: true,
      includeScore: true,
      useExtendedSearch: true
    };

    this.fuseIndex = new Fuse(this.documents, options);
  }

  /**
   * Search documents with advanced ranking
   */
  async search(query: string, options: {
    category?: string;
    tags?: string[];
    limit?: number;
    minScore?: number;
  } = {}): Promise<SearchResult[]> {
    if (!this.isInitialized) {
      await this.initializeIndex();
    }

    if (!this.fuseIndex) {
      return [];
    }

    let searchQuery = query;

    // Add category filter if specified
    if (options.category) {
      searchQuery += ` category:${options.category}`;
    }

    // Add tag filters if specified
    if (options.tags && options.tags.length > 0) {
      searchQuery += ` ${options.tags.map(tag => `tags:${tag}`).join(' ')}`;
    }

    const results = this.fuseIndex.search(searchQuery, {
      limit: options.limit || 20
    });

    return results
      .filter(result => !options.minScore || (result.score && result.score <= options.minScore))
      .map(result => ({
        document: result.item,
        score: result.score || 0,
        matches: result.matches || []
      }))
      .sort((a, b) => {
        // Boost results from official documentation
        const aBoost = a.document.url?.includes('docs.ton.org') ? 0.1 : 0;
        const bBoost = b.document.url?.includes('docs.ton.org') ? 0.1 : 0;
        return (a.score - aBoost) - (b.score - bBoost);
      });
  }

  /**
   * Get documents by category
   */
  async getDocumentsByCategory(category: string, limit: number = 10): Promise<DocumentChunk[]> {
    if (!this.isInitialized) {
      await this.initializeIndex();
    }

    return this.documents
      .filter(doc => doc.category === category)
      .slice(0, limit);
  }

  /**
   * Get related documents based on tags
   */
  async getRelatedDocuments(documentId: string, limit: number = 5): Promise<DocumentChunk[]> {
    if (!this.isInitialized) {
      await this.initializeIndex();
    }

    const sourceDoc = this.documents.find(doc => doc.id === documentId);
    if (!sourceDoc) return [];

    const related = this.documents
      .filter(doc =>
        doc.id !== documentId &&
        doc.tags.some(tag => sourceDoc.tags.includes(tag))
      )
      .slice(0, limit);

    return related;
  }

  /**
   * Get document statistics
   */
  getStats(): {
    totalDocuments: number;
    categories: Record<string, number>;
    totalTags: number;
  } {
    const categories: Record<string, number> = {};
    const allTags = new Set<string>();

    for (const doc of this.documents) {
      categories[doc.category] = (categories[doc.category] || 0) + 1;
      doc.tags.forEach(tag => allTags.add(tag));
    }

    return {
      totalDocuments: this.documents.length,
      categories,
      totalTags: allTags.size
    };
  }

  /**
   * Add new document to index
   */
  addDocument(document: Omit<DocumentChunk, 'id'>): string {
    const id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const docWithId: DocumentChunk = { ...document, id };

    this.documents.push(docWithId);

    // Rebuild index
    this.buildFuseIndex();

    return id;
  }

  /**
   * Remove document from index
   */
  removeDocument(documentId: string): boolean {
    const index = this.documents.findIndex(doc => doc.id === documentId);
    if (index === -1) return false;

    this.documents.splice(index, 1);
    this.buildFuseIndex();
    return true;
  }
}

// Singleton instance
export const searchIndexService = new SearchIndexService();

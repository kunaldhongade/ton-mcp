#!/usr/bin/env node

import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

// Script to index TON documentation from docs.ton.org
async function indexTonDocumentation() {
  const baseUrl = 'https://docs.ton.org';
  const docs: any[] = [];

  try {
    console.log('Indexing TON documentation...');

    // Get main documentation page
    const response = await axios.get(baseUrl);
    const $ = cheerio.load(response.data);

    // Extract navigation links
    const navLinks: string[] = [];
    $('nav a[href]').each((_, element) => {
      const href = $(element).attr('href');
      if (href && href.startsWith('/')) {
        navLinks.push(href);
      }
    });

    console.log(`Found ${navLinks.length} documentation pages to index`);

    // Process each documentation page
    for (const link of navLinks.slice(0, 10)) { // Limit for testing
      try {
        const pageUrl = `${baseUrl}${link}`;
        console.log(`Indexing: ${pageUrl}`);

        const pageResponse = await axios.get(pageUrl);
        const $page = cheerio.load(pageResponse.data);

        // Extract content
        const title = $page('h1').first().text().trim() ||
                     $page('title').text().trim() ||
                     'Untitled';

        // Get main content
        const content = $page('main, .content, article').text().trim();

        if (content.length > 100) { // Only save meaningful content
          docs.push({
            title,
            url: pageUrl,
            content: content.substring(0, 5000), // Limit content size
            category: categorizeContent(title, content),
            lastUpdated: new Date().toISOString()
          });
        }

        // Delay to be respectful to the server
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Failed to index ${link}:`, error);
      }
    }

    // Save indexed documentation
    const outputPath = path.join(process.cwd(), 'docs-index.json');
    fs.writeFileSync(outputPath, JSON.stringify(docs, null, 2));

    console.log(`Indexed ${docs.length} documentation pages and saved to ${outputPath}`);

  } catch (error) {
    console.error('Failed to index documentation:', error);
  }
}

function categorizeContent(title: string, content: string): string {
  const lowerTitle = title.toLowerCase();
  const lowerContent = content.toLowerCase();

  if (lowerTitle.includes('smart contract') || lowerContent.includes('contract')) {
    return 'development';
  }
  if (lowerTitle.includes('tact') || lowerTitle.includes('func')) {
    return 'languages';
  }
  if (lowerTitle.includes('jetton') || lowerTitle.includes('token')) {
    return 'tokens';
  }
  if (lowerTitle.includes('wallet')) {
    return 'wallets';
  }
  if (lowerTitle.includes('tvm') || lowerTitle.includes('virtual machine')) {
    return 'infrastructure';
  }

  return 'general';
}

// Run the indexer
indexTonDocumentation().catch(console.error);

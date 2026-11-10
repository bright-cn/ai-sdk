import {tool} from 'ai';
import {z} from 'zod';
import {bdclient} from '@brightdata/sdk';
import {get_brightdata_api_key} from './env';

interface ScrapeOptions {
    api_key?: string;
    data_format?: 'markdown' | 'html';
    country?: string;
}

export const scrape = (opt: ScrapeOptions = {})=>{
    const api_key = get_brightdata_api_key(opt.api_key);
    const client = new bdclient({
        apiKey: api_key,
        autoCreateZones: true,
    });
    const input_schema = z.object({
        url: z.string().url()
            .describe('The URL of the website to scrape'),
        country: z.string().length(2).optional()
            .describe('Two-letter country code for proxy location'),
    });
    return tool({
        description: 'Scrape website content and return it in clean'
            +' markdown format. Bypasses anti-bot protection and'
            +' CAPTCHAs.',
        inputSchema: input_schema,
        execute: async ({url, country}: z.infer<typeof input_schema>)=>{
            try {
                return await client.scrape(url, {
                    dataFormat: opt.data_format || 'markdown',
                    format: 'raw',
                    country: (country || opt.country)?.toLowerCase(),
                });
            } catch(e){
                return 'Error scraping '+url+': '+String(e);
            }
        },
    });
};

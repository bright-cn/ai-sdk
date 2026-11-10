import {tool} from 'ai';
import {z} from 'zod';
import {bdclient} from '@brightdata/sdk';
import {get_brightdata_api_key} from './env';

interface SearchOptions {
    api_key?: string;
    search_engine?: 'google' | 'bing' | 'yandex';
    data_format?: 'html' | 'markdown';
    country?: string;
}

export const search = (opt: SearchOptions = {})=>{
    const api_key = get_brightdata_api_key(opt.api_key);
    const client = new bdclient({
        apiKey: api_key,
        autoCreateZones: true,
    });
    const input_schema = z.object({
        query: z.string()
            .describe('The search query'),
        search_engine: z.enum(['google', 'bing', 'yandex']).optional()
            .describe('Search engine to use'),
        country: z.string().length(2).optional()
            .describe('Two-letter country code for localized results'),
        data_format: z.enum(['html', 'markdown']).optional()
            .describe('Format of returned search results'),
    });
    return tool({
        description: 'Search the web using Google, Bing, or Yandex.'
            +' Returns search results with anti-bot protection bypass.',
        inputSchema: input_schema,
        execute: async ({
            query,
            search_engine,
            country,
            data_format,
        }: z.infer<typeof input_schema>)=>{
            try {
                return await client.search(query, {
                    searchEngine: search_engine || opt.search_engine
                        || 'google',
                    dataFormat: data_format || opt.data_format || 'markdown',
                    format: 'raw',
                    country: (country || opt.country)?.toLowerCase(),
                });
            } catch(e){
                return 'Error searching for "'+query+'": '+String(e);
            }
        },
    });
};

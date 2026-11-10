import {tool} from 'ai';
import {z} from 'zod';
import {bdclient} from '@brightdata/sdk';
import {get_brightdata_api_key} from './env';
import {format_tool_result, resolve_snapshot_result}
    from './snapshot_resolver';

interface ChatgptOptions {
    api_key?: string;
    format?: 'json' | 'jsonl';
}

export const chatgpt = (opt: ChatgptOptions = {})=>{
    const api_key = get_brightdata_api_key(opt.api_key);
    const client = new bdclient({
        apiKey: api_key,
        autoCreateZones: true,
    });
    const input_schema = z.object({
        prompt: z.string()
            .describe('Prompt for ChatGPT dataset collection'),
        additional_prompt: z.string().optional()
            .describe('Optional follow-up prompt'),
        country: z.string().length(2).optional()
            .describe('Two-letter country code'),
        require_sources: z.boolean().optional()
            .describe('Fail when no sources are found'),
        web_search: z.boolean().optional()
            .describe('Trigger ChatGPT web search mode'),
    });
    return tool({
        description: 'Collect ChatGPT response data for a prompt, including'
            +' optional web search and source requirements.',
        inputSchema: input_schema,
        execute: async ({
            prompt,
            additional_prompt,
            country,
            require_sources,
            web_search,
        }: z.infer<typeof input_schema>)=>{
            try {
                const result = await client.datasets.chatGPT.search(
                    [{
                        prompt,
                        additional_prompt,
                        country: country?.toLowerCase(),
                        require_sources,
                        web_search,
                    }],
                    {
                        format: opt.format || 'json',
                        async: false,
                    },
                );
                const resolved_result = await resolve_snapshot_result(
                    client,
                    api_key || '',
                    result,
                    {
                        format: opt.format || 'json',
                    },
                );
                return format_tool_result(resolved_result);
            } catch(e){
                return 'Error fetching ChatGPT data: '+String(e);
            }
        },
    });
};

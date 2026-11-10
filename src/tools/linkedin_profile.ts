import {tool} from 'ai';
import {z} from 'zod';
import {bdclient} from '@brightdata/sdk';
import {get_brightdata_api_key} from './env';
import {format_tool_result, resolve_snapshot_result}
    from './snapshot_resolver';

interface LinkedinProfileOptions {
    api_key?: string;
    format?: 'json' | 'jsonl';
}

export const linkedin_profile = (opt: LinkedinProfileOptions = {})=>{
    const api_key = get_brightdata_api_key(opt.api_key);
    const client = new bdclient({
        apiKey: api_key,
        autoCreateZones: true,
    });
    const input_schema = z.object({
        urls: z.array(z.string().url()).min(1)
            .describe('Array of LinkedIn profile URLs to collect data'
                +' from (e.g., ["https://www.linkedin.com/in/example"])'),
    });
    return tool({
        description: 'Fetch LinkedIn profile data for one or more'
            +' LinkedIn profile URLs. Returns detailed information'
            +' including work experience, education, skills, and'
            +' contact information.',
        inputSchema: input_schema,
        execute: async ({urls}: z.infer<typeof input_schema>)=>{
            try {
                const result = await client.datasets.linkedin.collectProfiles(
                    urls,
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
                return 'Error fetching LinkedIn profiles: '+String(e);
            }
        },
    });
};

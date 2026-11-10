import {tool} from 'ai';
import {z} from 'zod';
import {bdclient} from '@brightdata/sdk';
import {get_brightdata_api_key} from './env';
import {format_tool_result, resolve_snapshot_result}
    from './snapshot_resolver';

interface FacebookProfileOptions {
    api_key?: string;
    format?: 'json' | 'jsonl';
}

export const facebook_profile = (opt: FacebookProfileOptions = {})=>{
    const api_key = get_brightdata_api_key(opt.api_key);
    const client = new bdclient({
        apiKey: api_key,
        autoCreateZones: true,
    });
    const input_schema = z.object({
        url: z.string().url()
            .describe('Facebook profile URL'),
    });
    return tool({
        description: 'Collect Facebook profile data from a profile URL.',
        inputSchema: input_schema,
        execute: async ({url}: z.infer<typeof input_schema>)=>{
            try {
                const result = await client.datasets.facebook.collectUserProfiles(
                    [url],
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
                return 'Error fetching Facebook profile: '+String(e);
            }
        },
    });
};

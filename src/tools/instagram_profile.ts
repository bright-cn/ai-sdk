import {tool} from 'ai';
import {z} from 'zod';
import {bdclient} from '@brightdata/sdk';
import {get_brightdata_api_key} from './env';
import {format_tool_result, resolve_snapshot_result}
    from './snapshot_resolver';

interface InstagramProfileOptions {
    api_key?: string;
}

export const instagram_profile = (opt: InstagramProfileOptions = {})=>{
    const api_key = get_brightdata_api_key(opt.api_key);
    const client = new bdclient({
        apiKey: api_key,
        autoCreateZones: true,
    });
    const input_schema = z.object({
        url: z.string().url()
            .describe('Instagram profile URL'),
    });
    return tool({
        description: 'Get Instagram profile information and recent posts.',
        inputSchema: input_schema,
        execute: async ({url}: z.infer<typeof input_schema>)=>{
            try {
                const result = await client.datasets.instagram.collectProfiles(
                    [url],
                    {
                        format: 'json',
                        async: false,
                    },
                );
                const resolved_result = await resolve_snapshot_result(
                    client,
                    api_key || '',
                    result,
                    {
                        format: 'json',
                    },
                );
                return format_tool_result(resolved_result);
            } catch(e){
                return 'Error fetching Instagram profile: '+String(e);
            }
        },
    });
};

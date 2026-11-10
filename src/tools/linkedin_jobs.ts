import {tool} from 'ai';
import {z} from 'zod';
import {bdclient} from '@brightdata/sdk';
import {get_brightdata_api_key} from './env';
import {format_tool_result, resolve_snapshot_result}
    from './snapshot_resolver';

interface LinkedinJobsOptions {
    api_key?: string;
}

export const linkedin_jobs = (opt: LinkedinJobsOptions = {})=>{
    const api_key = get_brightdata_api_key(opt.api_key);
    const client = new bdclient({
        apiKey: api_key,
        autoCreateZones: true,
    });
    const input_schema = z.object({
        location: z.string()
            .describe('Job location (e.g., "New York, NY")'),
        keyword: z.string().optional()
            .describe('Job title or keyword'),
        country: z.string().length(2).optional()
            .describe('Country code'),
    });
    return tool({
        description: 'Search for LinkedIn job postings by location and'
            +' keyword.',
        inputSchema: input_schema,
        execute: async ({
            location,
            keyword,
            country,
        }: z.infer<typeof input_schema>)=>{
            try {
                const result = await client.datasets.linkedin.discoverJobs(
                    [{
                        location,
                        keyword,
                        country: country?.toLowerCase(),
                    }],
                    {
                        format: 'json',
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
                return 'Error fetching LinkedIn jobs: '+String(e);
            }
        },
    });
};

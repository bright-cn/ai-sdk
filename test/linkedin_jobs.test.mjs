import assert from 'node:assert/strict';
import {afterEach, beforeEach, describe, it} from 'node:test';
import {bdclient} from '@brightdata/sdk';
import {linkedin_jobs} from '../dist/index.js';

const linkedin_proto = Object.getPrototypeOf(new bdclient({
    apiKey: 'a'.repeat(64),
    autoCreateZones: true,
}).datasets.linkedin);

describe('linkedin_jobs tool', ()=>{
    const original_api_key = process.env.BRIGHTDATA_API_KEY;
    const original_discover_jobs = linkedin_proto.discoverJobs;
    let last_call;

    beforeEach(()=>{
        process.env.BRIGHTDATA_API_KEY = 'a'.repeat(64);
        last_call = undefined;
    });

    afterEach(()=>{
        linkedin_proto.discoverJobs = original_discover_jobs;
        process.env.BRIGHTDATA_API_KEY = original_api_key;
    });

    it('maps search filters and lowercases country', async()=>{
        linkedin_proto.discoverJobs = async(input, options)=>{
            last_call = {input, options};
            return {rows: [{job_id: '123'}]};
        };
        const t = linkedin_jobs();
        const result = await t.execute({
            location: 'New York, NY',
            keyword: 'Software Engineer',
            country: 'US',
        });
        assert.deepEqual(last_call, {
            input: [{
                location: 'New York, NY',
                keyword: 'Software Engineer',
                country: 'us',
            }],
            options: {
                format: 'json',
            },
        });
        assert.deepEqual(
            JSON.parse(result),
            {rows: [{job_id: '123'}]}
        );
    });

    it('returns formatted error string when dataset call throws', async()=>{
        linkedin_proto.discoverJobs = async()=>{
            throw new Error('jobs dataset error');
        };
        const t = linkedin_jobs();
        const result = await t.execute({
            location: 'San Francisco, CA',
        });
        assert.equal(
            result,
            'Error fetching LinkedIn jobs: Error: jobs dataset error'
        );
    });
});

import assert from 'node:assert/strict';
import {afterEach, beforeEach, describe, it} from 'node:test';
import {bdclient} from '@brightdata/sdk';
import {linkedin_profile} from '../dist/index.js';

const linkedin_proto = Object.getPrototypeOf(new bdclient({
    apiKey: 'a'.repeat(64),
    autoCreateZones: true,
}).datasets.linkedin);

describe('linkedin_profile tool', ()=>{
    const original_api_key = process.env.BRIGHTDATA_API_KEY;
    const original_collect_profiles = linkedin_proto.collectProfiles;
    let last_call;

    beforeEach(()=>{
        process.env.BRIGHTDATA_API_KEY = 'a'.repeat(64);
        last_call = undefined;
    });

    afterEach(()=>{
        linkedin_proto.collectProfiles = original_collect_profiles;
        process.env.BRIGHTDATA_API_KEY = original_api_key;
    });

    it('passes urls and format to linkedin collectProfiles', async()=>{
        linkedin_proto.collectProfiles = async(input, options)=>{
            last_call = {input, options};
            return {rows: [{name: 'Jane Doe'}]};
        };
        const t = linkedin_profile({format: 'jsonl'});
        const result = await t.execute({
            urls: ['https://www.linkedin.com/in/jane-doe'],
        });
        assert.deepEqual(last_call, {
            input: ['https://www.linkedin.com/in/jane-doe'],
            options: {
                format: 'jsonl',
                async: false,
            },
        });
        assert.deepEqual(
            JSON.parse(result),
            {rows: [{name: 'Jane Doe'}]}
        );
    });

    it('returns formatted error string when dataset call throws', async()=>{
        linkedin_proto.collectProfiles = async()=>{
            throw new Error('linkedin unavailable');
        };
        const t = linkedin_profile();
        const result = await t.execute({
            urls: ['https://www.linkedin.com/in/jane-doe'],
        });
        assert.equal(
            result,
            'Error fetching LinkedIn profiles: Error: linkedin unavailable'
        );
    });
});

import assert from 'node:assert/strict';
import {afterEach, beforeEach, describe, it} from 'node:test';
import {bdclient} from '@brightdata/sdk';
import {facebook_profile} from '../dist/index.js';

const facebook_proto = Object.getPrototypeOf(new bdclient({
    apiKey: 'a'.repeat(64),
    autoCreateZones: true,
}).datasets.facebook);

describe('facebook_profile tool', ()=>{
    const original_api_key = process.env.BRIGHTDATA_API_KEY;
    const original_collect_user_profiles = facebook_proto.collectUserProfiles;
    let last_call;

    beforeEach(()=>{
        process.env.BRIGHTDATA_API_KEY = 'a'.repeat(64);
        last_call = undefined;
    });

    afterEach(()=>{
        facebook_proto.collectUserProfiles = original_collect_user_profiles;
        process.env.BRIGHTDATA_API_KEY = original_api_key;
    });

    it('passes profile url and configured format option', async()=>{
        facebook_proto.collectUserProfiles = async(input, options)=>{
            last_call = {input, options};
            return {rows: [{name: 'John Smith'}]};
        };
        const t = facebook_profile({format: 'jsonl'});
        const result = await t.execute({
            url: 'https://www.facebook.com/john.smith',
        });
        assert.deepEqual(last_call, {
            input: ['https://www.facebook.com/john.smith'],
            options: {
                format: 'jsonl',
                async: false,
            },
        });
        assert.deepEqual(
            JSON.parse(result),
            {rows: [{name: 'John Smith'}]}
        );
    });

    it('returns formatted error string when dataset call throws', async()=>{
        facebook_proto.collectUserProfiles = async()=>{
            throw new Error('facebook dataset error');
        };
        const t = facebook_profile();
        const result = await t.execute({
            url: 'https://www.facebook.com/john.smith',
        });
        assert.equal(
            result,
            'Error fetching Facebook profile: Error: facebook dataset error'
        );
    });
});

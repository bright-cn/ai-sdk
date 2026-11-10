import assert from 'node:assert/strict';
import {afterEach, beforeEach, describe, it} from 'node:test';
import {bdclient} from '@brightdata/sdk';
import {instagram_profile} from '../dist/index.js';

const instagram_proto = Object.getPrototypeOf(new bdclient({
    apiKey: 'a'.repeat(64),
    autoCreateZones: true,
}).datasets.instagram);

describe('instagram_profile tool', ()=>{
    const original_api_key = process.env.BRIGHTDATA_API_KEY;
    const original_collect_profiles = instagram_proto.collectProfiles;
    let last_call;

    beforeEach(()=>{
        process.env.BRIGHTDATA_API_KEY = 'a'.repeat(64);
        last_call = undefined;
    });

    afterEach(()=>{
        instagram_proto.collectProfiles = original_collect_profiles;
        process.env.BRIGHTDATA_API_KEY = original_api_key;
    });

    it('passes profile url in array with fixed options', async()=>{
        instagram_proto.collectProfiles = async(input, options)=>{
            last_call = {input, options};
            return {rows: [{username: 'example'}]};
        };
        const t = instagram_profile();
        const result = await t.execute({
            url: 'https://www.instagram.com/example/',
        });
        assert.deepEqual(last_call, {
            input: ['https://www.instagram.com/example/'],
            options: {
                format: 'json',
                async: false,
            },
        });
        assert.deepEqual(
            JSON.parse(result),
            {rows: [{username: 'example'}]}
        );
    });

    it('returns formatted error string when dataset call throws', async()=>{
        instagram_proto.collectProfiles = async()=>{
            throw new Error('instagram dataset error');
        };
        const t = instagram_profile();
        const result = await t.execute({
            url: 'https://www.instagram.com/example/',
        });
        assert.equal(
            result,
            'Error fetching Instagram profile: Error: instagram dataset error'
        );
    });
});

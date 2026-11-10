import assert from 'node:assert/strict';
import {afterEach, beforeEach, describe, it} from 'node:test';
import {bdclient} from '@brightdata/sdk';
import {chatgpt} from '../dist/index.js';

const chatgpt_proto = Object.getPrototypeOf(new bdclient({
    apiKey: 'a'.repeat(64),
    autoCreateZones: true,
}).datasets.chatGPT);

describe('chatgpt tool', ()=>{
    const original_api_key = process.env.BRIGHTDATA_API_KEY;
    const original_search = chatgpt_proto.search;
    let last_call;

    beforeEach(()=>{
        process.env.BRIGHTDATA_API_KEY = 'a'.repeat(64);
        last_call = undefined;
    });

    afterEach(()=>{
        chatgpt_proto.search = original_search;
        process.env.BRIGHTDATA_API_KEY = original_api_key;
    });

    it('maps input and forwards format options', async()=>{
        chatgpt_proto.search = async(input, options)=>{
            last_call = {input, options};
            return {rows: [{answer: 'ok'}]};
        };
        const t = chatgpt({format: 'jsonl'});
        const result = await t.execute({
            prompt: 'what is bright data',
            additional_prompt: 'include links',
            country: 'US',
            require_sources: true,
            web_search: true,
        });
        assert.deepEqual(last_call, {
            input: [{
                prompt: 'what is bright data',
                additional_prompt: 'include links',
                country: 'us',
                require_sources: true,
                web_search: true,
            }],
            options: {
                format: 'jsonl',
                async: false,
            },
        });
        assert.deepEqual(
            JSON.parse(result),
            {rows: [{answer: 'ok'}]}
        );
    });

    it('returns formatted error string when dataset call throws', async()=>{
        chatgpt_proto.search = async()=>{
            throw new Error('dataset timeout');
        };
        const t = chatgpt();
        const result = await t.execute({
            prompt: 'latest ai news',
        });
        assert.equal(
            result,
            'Error fetching ChatGPT data: Error: dataset timeout'
        );
    });
});

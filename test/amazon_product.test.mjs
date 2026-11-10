import assert from 'node:assert/strict';
import {afterEach, beforeEach, describe, it} from 'node:test';
import {bdclient} from '@brightdata/sdk';
import {amazon_product} from '../dist/index.js';

const amazon_proto = Object.getPrototypeOf(new bdclient({
    apiKey: 'a'.repeat(64),
    autoCreateZones: true,
}).datasets.amazon);

describe('amazon_product tool', ()=>{
    const original_api_key = process.env.BRIGHTDATA_API_KEY;
    const original_collect_products = amazon_proto.collectProducts;
    let last_call;

    beforeEach(()=>{
        process.env.BRIGHTDATA_API_KEY = 'a'.repeat(64);
        last_call = undefined;
    });

    afterEach(()=>{
        amazon_proto.collectProducts = original_collect_products;
        process.env.BRIGHTDATA_API_KEY = original_api_key;
    });

    it('maps request payload and fixed options', async()=>{
        amazon_proto.collectProducts = async(input, options)=>{
            last_call = {input, options};
            return {rows: [{asin: 'B0001'}]};
        };
        const t = amazon_product();
        const result = await t.execute({
            url: 'https://www.amazon.com/dp/B0001',
            zipcode: '10001',
        });
        assert.deepEqual(last_call, {
            input: [{
                url: 'https://www.amazon.com/dp/B0001',
                zipcode: '10001',
            }],
            options: {
                format: 'json',
                async: false,
            },
        });
        assert.deepEqual(
            JSON.parse(result),
            {rows: [{asin: 'B0001'}]}
        );
    });

    it('returns formatted error string when dataset call throws', async()=>{
        amazon_proto.collectProducts = async()=>{
            throw new Error('rate limited');
        };
        const t = amazon_product();
        const result = await t.execute({
            url: 'https://www.amazon.com/dp/B0001',
        });
        assert.equal(
            result,
            'Error fetching Amazon product data: Error: rate limited'
        );
    });
});

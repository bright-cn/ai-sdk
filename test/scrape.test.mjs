import assert from 'node:assert/strict';
import {afterEach, beforeEach, describe, it} from 'node:test';
import {bdclient} from '@brightdata/sdk';
import {scrape} from '../dist/index.js';

describe('scrape tool', ()=>{
    const original_api_key = process.env.BRIGHTDATA_API_KEY;
    const original_scrape = bdclient.prototype.scrape;
    let last_call;

    beforeEach(()=>{
        process.env.BRIGHTDATA_API_KEY = 'a'.repeat(64);
        last_call = undefined;
    });

    afterEach(()=>{
        bdclient.prototype.scrape = original_scrape;
        process.env.BRIGHTDATA_API_KEY = original_api_key;
    });

    it('uses markdown by default and lowercases country', async()=>{
        bdclient.prototype.scrape = async(url, options)=>{
            last_call = {url, options};
            return {ok: true};
        };
        const t = scrape();
        const result = await t.execute({
            url: 'https://example.com',
            country: 'US',
        });
        assert.deepEqual(last_call, {
            url: 'https://example.com',
            options: {
                dataFormat: 'markdown',
                format: 'raw',
                country: 'us',
            },
        });
        assert.deepEqual(result, {ok: true});
    });

    it('uses tool defaults when execute values are omitted', async()=>{
        bdclient.prototype.scrape = async(url, options)=>{
            last_call = {url, options};
            return {ok: true};
        };
        const t = scrape({
            api_key: 'b'.repeat(64),
            data_format: 'html',
            country: 'GB',
        });
        await t.execute({url: 'https://example.com/docs'});
        assert.deepEqual(last_call, {
            url: 'https://example.com/docs',
            options: {
                dataFormat: 'html',
                format: 'raw',
                country: 'gb',
            },
        });
    });

    it('returns formatted error string when client scrape throws', async()=>{
        bdclient.prototype.scrape = async()=>{
            throw new Error('proxy unavailable');
        };
        const t = scrape();
        const result = await t.execute({url: 'https://example.com'});
        assert.equal(
            result,
            'Error scraping https://example.com: Error: proxy unavailable'
        );
    });
});

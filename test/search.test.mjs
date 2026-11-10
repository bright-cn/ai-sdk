import assert from 'node:assert/strict';
import {afterEach, beforeEach, describe, it} from 'node:test';
import {bdclient} from '@brightdata/sdk';
import {search} from '../dist/index.js';

describe('search tool', ()=>{
    const original_api_key = process.env.BRIGHTDATA_API_KEY;
    const original_search = bdclient.prototype.search;
    let last_call;

    beforeEach(()=>{
        process.env.BRIGHTDATA_API_KEY = 'test-api-key';
        last_call = undefined;
    });

    afterEach(()=>{
        bdclient.prototype.search = original_search;
        process.env.BRIGHTDATA_API_KEY = original_api_key;
    });

    it('uses default search options and lowercases country', async()=>{
        bdclient.prototype.search = async(query, options)=>{
            last_call = {query, options};
            return {ok: true};
        };
        const t = search();
        const result = await t.execute({
            query: 'best coffee grinder',
            country: 'US',
        });
        assert.deepEqual(last_call, {
            query: 'best coffee grinder',
            options: {
                searchEngine: 'google',
                dataFormat: 'markdown',
                format: 'raw',
                country: 'us',
            },
        });
        assert.deepEqual(result, {ok: true});
    });

    it('uses tool options when execute input does not override them',
        async()=>{
        bdclient.prototype.search = async(query, options)=>{
            last_call = {query, options};
            return {ok: true};
        };
        const t = search({
            api_key: 'tool-api-key',
            search_engine: 'bing',
            data_format: 'html',
            country: 'GB',
        });
        await t.execute({query: 'bright data docs'});
        assert.deepEqual(last_call, {
            query: 'bright data docs',
            options: {
                searchEngine: 'bing',
                dataFormat: 'html',
                format: 'raw',
                country: 'gb',
            },
        });
    });

    it('prefers execute input over tool defaults', async()=>{
        bdclient.prototype.search = async(query, options)=>{
            last_call = {query, options};
            return {ok: true};
        };
        const t = search({
            search_engine: 'bing',
            data_format: 'html',
            country: 'GB',
        });
        await t.execute({
            query: 'web scraping',
            search_engine: 'yandex',
            data_format: 'markdown',
            country: 'CA',
        });
        assert.deepEqual(last_call, {
            query: 'web scraping',
            options: {
                searchEngine: 'yandex',
                dataFormat: 'markdown',
                format: 'raw',
                country: 'ca',
            },
        });
    });

    it('returns formatted error string when client search throws', async()=>{
        bdclient.prototype.search = async()=>{
            throw new Error('network down');
        };
        const t = search();
        const result = await t.execute({query: 'latest ai news'});
        assert.equal(
            result,
            'Error searching for "latest ai news": Error: network down'
        );
    });
});

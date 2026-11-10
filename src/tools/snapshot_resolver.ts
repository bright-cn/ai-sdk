import {bdclient} from '@brightdata/sdk';

interface SnapshotResolveOptions {
    timeout_ms?: number;
    poll_interval_ms?: number;
    format?: 'json' | 'jsonl' | 'ndjson' | 'csv';
}

const API_BASE_URL = 'https://api.brightdata.com';

const sleep = async (ms: number)=>new Promise(resolve=>
    setTimeout(resolve, ms));

const get_timeout_ms = (opt: SnapshotResolveOptions)=>opt.timeout_ms
    || 10*60*1000;

const get_poll_interval_ms = (opt: SnapshotResolveOptions)=>
    opt.poll_interval_ms|| 3*1000;

const get_snapshot_id = (result: unknown)=>{
    if (typeof result!='object' || !result || Array.isArray(result))
        return;
    if (!('snapshot_id' in result))
        return;
    if (typeof result.snapshot_id!='string')
        return;
    return result.snapshot_id;
};

const get_snapshot_status = (result: unknown)=>{
    if (typeof result!='object' || !result || Array.isArray(result))
        return;
    if (!('status' in result))
        return;
    if (typeof result.status!='string')
        return;
    return result.status.toLowerCase();
};

const is_snapshot_pending = (result: unknown)=>{
    const status = get_snapshot_status(result);
    return status=='starting' || status=='running' || status=='building';
};

const get_retry_delay_ms = (result: unknown, fallback_ms: number)=>{
    if (typeof result!='object' || !result || Array.isArray(result))
        return fallback_ms;
    if (!('message' in result))
        return fallback_ms;
    if (typeof result.message!='string')
        return fallback_ms;
    const sec_match = result.message.match(/(\d+)\s*s/i);
    if (!sec_match)
        return fallback_ms;
    return +sec_match[1]*1000;
};

const await_snapshot_ready = async (client: bdclient, snapshot_id: string,
    opt: SnapshotResolveOptions, start_time: number)=>{
    for (;;) {
        const snapshot_status = await client.datasets.snapshot.getStatus(
            snapshot_id,
        );
        if (snapshot_status.status=='ready')
            return;
        if (snapshot_status.status=='failed')
            throw new Error('snapshot generation failed');
        if (Date.now()-start_time>get_timeout_ms(opt)) {
            throw new Error('snapshot generation timed out after '
                +get_timeout_ms(opt)+'ms');
        }
        await sleep(get_poll_interval_ms(opt));
    }
};

const fetch_snapshot_data = async (api_key: string, snapshot_id: string,
    format: string)=>{
    const response = await fetch(
        API_BASE_URL+'/datasets/v3/snapshot/'+snapshot_id+'?format='+format,
        {
            headers: {
                Authorization: 'Bearer '+api_key,
            },
        },
    );
    if (!response.ok)
        throw new Error('snapshot fetch failed [HTTP'+response.status+']');
    if (format=='json')
        return await response.json();
    return await response.text();
};

export const resolve_snapshot_result = async (client: bdclient, 
    api_key: string, result: unknown, opt: SnapshotResolveOptions = {})=>{
    const snapshot_id = get_snapshot_id(result);
    if (!snapshot_id)
        return result;
    if (!api_key)
        throw new Error('missing api key for snapshot fetch');
    const format = opt.format || 'json';
    const start_time = Date.now();
    for (;;) {
        await await_snapshot_ready(client, snapshot_id, opt, start_time);
        const snapshot_data = await fetch_snapshot_data(
            api_key,
            snapshot_id,
            format,
        );
        if (!is_snapshot_pending(snapshot_data))
            return snapshot_data;
        if (Date.now()-start_time>get_timeout_ms(opt)) {
            throw new Error('snapshot generation timed out after '
                +get_timeout_ms(opt)+'ms');
        }
        await sleep(get_retry_delay_ms(snapshot_data, 
            get_poll_interval_ms(opt)));
    }
};

export const format_tool_result = (result: unknown)=>{
    if (typeof result=='string')
        return result;
    return JSON.stringify(result, null, 2);
};

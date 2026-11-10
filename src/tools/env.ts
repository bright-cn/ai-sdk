let env_loaded = false;

const load_dot_env = ()=>{
    if (env_loaded)
        return;
    env_loaded = true;
    if (process.env.BRIGHTDATA_API_KEY)
        return;
    try {
        process.loadEnvFile?.('.env');
    } catch(e){
    }
};

export const get_brightdata_api_key = (api_key?: string)=>{
    if (api_key)
        return api_key;
    load_dot_env();
    return process.env.BRIGHTDATA_API_KEY;
};

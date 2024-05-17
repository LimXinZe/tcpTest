import rParser from 'rss-parser';
import CryptoJS from 'crypto-js';
import axios from 'axios';
import ioRedis from 'ioredis';

const _redisOptions = {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: process.env.REDIS_PORT || 6379,
    options: {
        // tls: {
        //     // rejectUnauthorized: false
        // },
        /* 
        keepAlive: 60000,
        retryStrategy: (times) => {
            return Math.min(times * 50, 2000);
        } */
    }
}
export const _RdClient = new ioRedis(_redisOptions.port, _redisOptions.host, _redisOptions.options);

const parser = new rParser();

let getNews = async () => {
    console.info("[ NEWS ] Fetching news...");
    try {
        const response = await axios.get('https://dobetplus.com/feed/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
                'Accept': 'application/rss+xml, application/xml, text/xml',
                'Referer': 'https://dobetplus.com/',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'DNT': '1', // Do Not Track request header
                'Upgrade-Insecure-Requests': '1', // Upgrades requests to HTTPS if possible
                'Cache-Control': 'no-cache', // No cache control
                'Pragma': 'no-cache' // No cache control
            },
            timeout: 30000 // 30-second timeout
        });

        if (response.status === 200) {
            const feed = await parser.parseString(response.data);

            let items = feed.items;

            for (const item of items) {
                let keyDate = (new Date(item.isoDate)).getTime();
                let newKey = `${keyDate}_${CryptoJS.MD5(item.title).toString()}`;
                let data = await _RdClient.hget('NEWS', newKey);
                if (data) continue;

                console.info(`[ NEWS ] New News Insert : ${newKey}`);
                await _RdClient.hset('NEWS', newKey, JSON.stringify(item));
            }
        } else {
            console.error(`[ NEWS ERROR ] HTTP status code: ${response.status}`);
        }
    } catch (e) {
        if (e.response) {
            console.error("[ NEWS ERROR ] HTTP status code:", e.response.status);
            console.error("[ NEWS ERROR ] Response data:", e.response.data);
        } else {
            console.error("[ NEWS ERROR ] ", e.message);
        }
    }
    console.info("[ NEWS ] Fetching completed.");
}

let refreshTimer = 1000 * 60 * 5; // 5 minutes
let News = async () => {
    console.info("[ NEWS ] Initial fetch.");
    await getNews();
    console.info(`[ NEWS ] Next fetch in ${refreshTimer / 1000 / 60} minutes`);
    setInterval(async () => {
        console.info("[ NEWS ] Interval fetch.");
        await getNews();
    }, refreshTimer);
}
News()

// export default News;

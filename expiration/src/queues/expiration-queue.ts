import Queue from "bull";

interface Payload{
    orderId: string;
}

const expirationQueue = new Queue<Payload>('order:expiration',{
    redis:{
        host: process.env.REDIS_HOST // in infro expiration-depl.yaml
    }
});

expirationQueue.process(async (job) => {
    console.log("to publish an expiration: complete event for orderId", job.data.orderId);
    
});

export {expirationQueue};
import {MongoMemoryServer} from "mongodb-memory-server";
import mongoose from "mongoose";
import jwt from 'jsonwebtoken';

jest.mock('../nats-wrapper'); // all test file will use mock nats

// so beforeAll and afterAll can share the mongo variable
let mongo: any;

// tell TS that there will be a function inside global scope
declare global {
    namespace NodeJS{
        interface Global{
            signin(): string[];
        }
    }
}

beforeAll( async () => {
    process.env.JWT_KEY = 'randomValue';
    process.env.ORDER_EXPIRATION_WINDOW_SECONDS = '900';
    mongo = await MongoMemoryServer.create();
    const mongoUri = await mongo.getUri();

    await mongoose.connect(mongoUri,{})
});

beforeEach( async()=>{
    // cleanup when closd
    jest.clearAllMocks();
    const collections = await mongoose.connection.db.collections();

    for (let collection of collections){
        await collection.deleteMany({});
    }

});

afterAll(async ()=>{
    await new Promise<void>(resolve=>{
        // give more time for test then close the mongoose connection
        setTimeout(async ()=>{
            if(mongo){
                await mongo.stop();
            }
            await mongoose.connection.close();
            resolve()
        },10000)
    })

},15000);

global.signin =  () => {
    // bc we don't have signin route in ticket service
    // we need to manually build a JWT payload
    // {id, email}
    const payload ={
        id: new mongoose.Types.ObjectId().toHexString(),
        // so we can have mimic mutiple users
        email:"test@.test.com"
    }
    //Create the JWT
    const token = jwt.sign(payload, process.env.JWT_KEY!)
    // Build session Object: {jwt: my_jwt}
    const session = {jwt: token}
    // Trun the sesion object into JSON
    const sessionJSON = JSON.stringify(session);
    // Take JSON and encode it as base64
    const base64session = Buffer.from(sessionJSON).toString('base64');

    // return a string thats the cookie with encoded data
    return [`session=${base64session}`];
};

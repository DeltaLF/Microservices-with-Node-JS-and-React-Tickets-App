import { Listener, TicketUpdatedEvent } from "@tickets_dl/common";
import mongoose from "mongoose";
import { Ticket } from "../../../models/ticket";
import { natsWrapper } from "../../../nats-wrapper";
import { TicketUpdatedListener } from "../ticket-updated-listener";
import {Message} from 'node-nats-streaming';

const setup = async () => {
    // craete a listener
    const updateListener = new TicketUpdatedListener(natsWrapper.client);
    // create and save a ticket
    const ticket = Ticket.build({
        id: new mongoose.Types.ObjectId().toHexString(),
        title: 'test title',
        price: 100,        
    });
    await ticket.save();
    // create a fake data object
    const data: TicketUpdatedEvent['data'] = {
        id: ticket.id,
        version: ticket.version + 1,
        title: 'updated title',
        price: 999,
        userId: new mongoose.Types.ObjectId().toHexString(),
    }

    // create a fake msg object
    // @ts-ignore
    const msg: Message = {
        ack: jest.fn()
    }
    // return all of the objects
    return {updateListener, data, msg,ticket}
};

it('find, updates, and saves a ticket', async () => {
    const {msg, data, ticket, updateListener} = await setup();
    await updateListener.onMessage(data, msg);
    const updatedTicket = await Ticket.findById(ticket.id);
    expect(updatedTicket!.title).toEqual(data.title);
    expect(updatedTicket!.price).toEqual(data.price);
    expect(updatedTicket!.version).toEqual(data.version);
 });

it('acks the message', async() => {
    const {msg, data, ticket, updateListener} = await setup();
    await updateListener.onMessage(data, msg);
    expect(msg.ack).toHaveBeenCalled();
});

it('does not call ack if the event has a skipped version number', async() => {
    const {msg, data, ticket, updateListener} = await setup();
    data.version = 10;
    
    try{
        await updateListener.onMessage(data, msg);        
    }catch(err){
    }
    expect(msg.ack).not.toHaveBeenCalled();

});
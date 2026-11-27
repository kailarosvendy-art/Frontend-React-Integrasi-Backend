import type { RequestHandler } from 'express';
import { getAuthUser } from '../middlewares/auth.ts';
import { OrderService } from '../services/orderService.ts';

export class OrderController {
  constructor(private readonly orderService = new OrderService()) {}

  getOrders: RequestHandler = async (_req, res) => {
    res.json({ status: 'success', data: await this.orderService.getAllOrders(getAuthUser(res)) });
  };
  getOrder: RequestHandler = async (req, res) => {
    res.json({ status: 'success', data: await this.orderService.getOrderById(Number(req.params.id), getAuthUser(res)) });
  };
  createOrder: RequestHandler = async (req, res) => {
    const order = await this.orderService.createOrder(req.body, getAuthUser(res));
    res.status(201).json({ status: 'success', data: order });
  };
  updateStatus: RequestHandler = async (req, res) => {
    const order = await this.orderService.updateOrderStatus(Number(req.params.id), req.body.status, getAuthUser(res));
    res.json({ status: 'success', data: order });
  };
}
